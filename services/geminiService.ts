// src/services/genaiService.ts
import { GoogleGenerativeAI } from "@google/generative-ai";
import type {
  HairstylistReport,
  ColoristReport,
  VisagismReport,
} from "../types";
import { fileToBase64 } from "../utils/fileUtils";
import { addWatermark } from "../utils/imageWatermark";

/**
 * Helpers to create/get client.
 * We keep the original function names getAiClient and ensureProModelApiKey
 * but implement them using @google/generative-ai public SDK usage patterns.
 */

const ensureProModelApiKey = async (): Promise<GoogleGenerativeAI> => {
  try {
    // If running inside ai.studio / aistudio, try to prompt key selection (keeps original behavior)
    // @ts-ignore
    if (typeof window !== "undefined" && (window as any).aistudio) {
      // @ts-ignore
      const studio = (window as any).aistudio;
      if (typeof studio.hasSelectedApiKey === "function") {
        const hasKey = await studio.hasSelectedApiKey();
        if (!hasKey && typeof studio.openSelectKey === "function") {
          await studio.openSelectKey();
        }
      }
    }
  } catch (e) {
    console.warn("Could not check for aistudio API key", e);
  }

  const key = process.env.API_KEY;

  if (!key) {
    throw new Error(
      "API_KEY environment variable not set. Please select a key from a paid GCP project. See ai.google.dev/gemini-api/docs/billing"
    );
  }
  // new client instance each time to respect key rotation
  return new GoogleGenerativeAI(key);
};

const getAiClient = (): GoogleGenerativeAI => {
  const key = process.env.API_KEY;
  if (!key) {
    throw new Error("API_KEY environment variable not set.");
  }
  return new GoogleGenerativeAI(key);
};

/* -------------------------
   Schemas (kept exactly as you provided)
   ------------------------- */

const hairstylistReportSchema = {
  type: "OBJECT",
  properties: {
    referenceVisagism: {
      type: "OBJECT",
      properties: {
        faceShape: {
          type: "STRING",
          description:
            "O formato de rosto da pessoa na imagem de referência (ex: Oval, Redondo, Quadrado).",
        },
        keyFacialFeatures: {
          type: "OBJECT",
          properties: {
            forehead: {
              type: "STRING",
              description: "Descrição da testa (ex: Larga, Estreita).",
            },
            jawline: {
              type: "STRING",
              description: "Descrição do maxilar (ex: Definido, Suave).",
            },
            nose: {
              type: "STRING",
              description: "Descrição do nariz (ex: Fino, Largo).",
            },
          },
          required: ["forehead", "jawline", "nose"],
        },
        hairAnalysis: {
          type: "OBJECT",
          properties: {
            hairType: {
              type: "STRING",
              description:
                "O tipo de cabelo aparente (ex: Liso, Ondulado, Cacheado).",
            },
            hairDensity: {
              type: "STRING",
              description:
                "A densidade capilar aparente (ex: Fino, Médio, Grosso).",
            },
          },
          required: ["hairType", "hairDensity"],
        },
        styleHarmony: {
          type: "STRING",
          description:
            "Justificativa de por que o corte de cabelo harmoniza bem com as características faciais e capilares da pessoa na imagem de referência.",
        },
      },
      required: [
        "faceShape",
        "keyFacialFeatures",
        "hairAnalysis",
        "styleHarmony",
      ],
    },
    viabilityAnalysis: {
      type: "OBJECT",
      properties: {
        verdict: {
          type: "STRING",
          enum: [
            "Altamente Recomendado",
            "Recomendado com Adaptações",
            "Não Recomendado",
          ],
          description:
            "O veredito claro e direto sobre a viabilidade do corte para a cliente, comparando a cliente com a referência.",
        },
        justification: {
          type: "STRING",
          description:
            "A justificativa detalhada para o veredito, comparando o corte de referência com o perfil facial e capilar da cliente.",
        },
        adaptationRecommendations: {
          type: "STRING",
          description:
            "Se o veredito for 'Recomendado com Adaptações', liste as modificações específicas necessárias. Se não, deixe em branco.",
        },
      },
      required: ["verdict", "justification", "adaptationRecommendations"],
    },
    cuttingPlan: {
      type: "OBJECT",
      properties: {
        styleName: {
          type: "STRING",
          description:
            "O nome popular do estilo de corte de cabelo da imagem de referência.",
        },
        description: {
          type: "STRING",
          description: "Uma breve descrição do estilo do corte de cabelo.",
        },
        tools: {
          type: "ARRAY",
          items: { type: "STRING" },
          description:
            "Uma lista de ferramentas de corte necessárias. Ex: 'Tesoura de fio navalha', 'Máquina de corte'.",
        },
        accessories: {
          type: "ARRAY",
          items: { type: "STRING" },
          description:
            "Uma lista de acessórios necessários. Ex: 'Clipes de seção', 'Borrifador de água'.",
        },
        preparationSteps: {
          type: "ARRAY",
          items: { type: "STRING" },
          description:
            "Passos para preparar o cabelo antes do corte, recomendando produtos da marca especificada.",
        },
        steps: {
          type: "ARRAY",
          items: { type: "STRING" },
          description:
            "Os passos técnicos e numerados para executar o corte, especificando a DIVISÃO e o ÂNGULO da filosofia 'Engenharia de Cortes' para cada passo.",
        },
        finishingSteps: {
          type: "ARRAY",
          items: { type: "STRING" },
          description:
            "Passos para finalizar e estilizar o cabelo após o corte, recomendando produtos de finalização da marca especificada.",
        },
        diagrams: {
          type: "ARRAY",
          items: {
            type: "OBJECT",
            properties: {
              title: {
                type: "STRING",
                description:
                  "Título do diagrama. Ex: 'Divisão Diagonal Anterior'.",
              },
              svg: {
                type: "STRING",
                description:
                  "Código SVG high-tech e interativo que ilustra o passo, seguindo as diretrizes de design anteriores (fundo transparente, cores distintas, etc.).",
              },
            },
            required: ["title", "svg"],
          },
          description:
            "Uma lista de 2 a 4 diagramas SVG que ilustram as partes mais importantes do corte.",
        },
        detailedPrompt: {
          type: "STRING",
          description:
            "Um prompt em inglês, muito detalhado e técnico, para um modelo de edição de imagem (como o gemini-2.5-flash-image). O objetivo é ALTÍSSIMA FIDELIDADE. O prompt deve instruir a IA a aplicar o corte de cabelo da foto de referência na foto da cliente. A instrução deve ser tão precisa que o resultado seja fotorrealista. Descreva detalhadamente o comprimento, as camadas, a textura, a franja (se houver), e o estilo de finalização do corte de referência. O prompt DEVE explicitamente ordenar a PRESERVAÇÃO TOTAL do rosto, identidade da pessoa, roupas e o fundo da imagem original da cliente, alterando APENAS o cabelo.",
        },
        threeDViews: {
          type: "OBJECT",
          description:
            "Um conjunto de prompts em inglês com o objetivo de ALTÍSSIMA FIDELIDADE para simular uma visualização 3D. Cada prompt deve editar a foto original da cliente para mostrar o corte de cabelo planejado de um ângulo diferente. Todos os prompts devem ser consistentes com o 'detailedPrompt' principal e ordenar a PRESERVAÇÃO TOTAL do rosto, identidade da pessoa, roupas e o fundo da imagem original da cliente.",
          properties: {
            frontPrompt: {
              type: "STRING",
              description:
                "Um prompt em inglês, técnico e detalhado, para editar a foto da cliente e mostrar o resultado do corte planejado visto de FRENTE. O resultado deve ser fotorrealista e consistente com o 'detailedPrompt' principal.",
            },
            sidePrompt: {
              type: "STRING",
              description:
                "Um prompt em inglês, técnico e detalhado, para editar a foto da cliente e mostrar o resultado do corte planejado visto de PERFIL (lado). Especifique qual lado (direito ou esquerdo), se relevante, para maior realismo.",
            },
            backPrompt: {
              type: "STRING",
              description:
                "Um prompt em inglês, técnico e detalhado, para editar a foto da cliente e mostrar o resultado do corte planejado visto de COSTAS. O resultado deve ser fotorrealista e consistente com os outros ângulos.",
            },
          },
          required: ["frontPrompt", "sidePrompt", "backPrompt"],
        },
      },
      required: [
        "styleName",
        "description",
        "tools",
        "accessories",
        "preparationSteps",
        "steps",
        "finishingSteps",
        "diagrams",
        "detailedPrompt",
        "threeDViews",
      ],
    },
  },
  required: ["referenceVisagism", "viabilityAnalysis", "cuttingPlan"],
};

const coloristReportSchema = {
  type: "OBJECT",
  properties: {
    visagismAndColorimetryAnalysis: {
      type: "OBJECT",
      properties: {
        skinTone: {
          type: "STRING",
          description:
            "Análise do subtom de pele da cliente (Ex: 'Frio', 'Quente', 'Neutro').",
        },
        contrast: {
          type: "STRING",
          description:
            "Análise do contraste pessoal da cliente (Ex: 'Alto Contraste', 'Baixo Contraste').",
        },
        recommendation: {
          type: "STRING",
          description:
            "Justificativa de por que a cor desejada harmoniza com a cliente, com base na análise de visagismo e colorimetria.",
        },
      },
      required: ["skinTone", "contrast", "recommendation"],
    },
    initialDiagnosis: {
      type: "STRING",
      description:
        "Diagnóstico preciso do cabelo atual da cliente. Inclua a cor base natural (altura de tom), percentual de brancos, e condição dos fios (ex: 'Base 5.0 com 30% de brancos e pontas sensibilizadas').",
    },
    products: {
      type: "ARRAY",
      items: { type: "STRING" },
      description:
        "Lista detalhada de produtos necessários para o procedimento em salão. Seja específico, usando nomes de linhas de produtos se possible. Ex: 'Pó descolorante BlondorPlex', 'Oxidante Welloxon Perfect 20 vol (6%)', 'Tonalizante Color Touch 8/71'.",
    },
    mechasTechnique: {
      type: "OBJECT",
      properties: {
        name: {
          type: "STRING",
          description:
            "Nome da técnica de mechas a ser usada (Ex: 'Ombré Hair', 'Babylights', 'Hair Contouring', 'Eriçado com papel').",
        },
        description: {
          type: "STRING",
          description:
            "Descrição detalhada de como executar a técnica de mechas.",
        },
      },
      required: ["name", "description"],
    },
    applicationSteps: {
      type: "OBJECT",
      properties: {
        preparation: {
          type: "ARRAY",
          items: { type: "STRING" },
          description: "Passos para preparar o cabelo antes do procedimento.",
        },
        mechas: {
          type: "ARRAY",
          items: { type: "STRING" },
          description: "Passo a passo da aplicação da técnica de mechas.",
        },
        baseColor: {
          type: "ARRAY",
          items: { type: "STRING" },
          description:
            "Passo a passo da aplicação da cor de base, se necessário.",
        },
        toning: {
          type: "ARRAY",
          items: { type: "STRING" },
          description:
            "Passo a passo para tonalizar as mechas e/ou o cabelo global.",
        },
        treatment: {
          type: "ARRAY",
          items: { type: "STRING" },
          description:
            "Passos do tratamento pós-química imediato, realizado no salão.",
        },
      },
      required: ["preparation", "mechas", "baseColor", "toning", "treatment"],
    },
    diagrams: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          title: {
            type: "STRING",
            description:
              "Título do diagrama. Ex: 'Divisão para Hair Contouring', 'Sequência de aplicação do eriçado'.",
          },
          svg: {
            type: "STRING",
            description:
              "Código SVG ilustrando a técnica de mechas. Use o mesmo estilo high-tech dos diagramas de corte, com cores para indicar seções, produto, etc.",
          },
        },
        required: ["title", "svg"],
      },
      description:
        "Uma lista de 1 a 2 diagramas SVG que ilustram a técnica de mechas.",
    },
    tryOnImagePrompt: {
      type: "STRING",
      description:
        "Um prompt em inglês, muito detalhado e específico, para um modelo de edição de imagem (como o gemini-2.5-flash-image). O prompt deve instruir a IA a modificar o cabelo da pessoa na foto original para corresponder EXATAMENTE ao resultado da coloração planejada. Descreva a cor, a técnica de mechas (ex: 'subtle babylights', 'bold balayage highlights'), a raiz (ex: 'smoky root melt'), e o acabamento (ex: 'shiny and healthy'). PRESERVE o rosto, as roupas e o fundo da imagem original.",
    },
    postChemicalCare: {
      type: "OBJECT",
      properties: {
        recommendation: {
          type: "STRING",
          description:
            "Recomendação geral para os cuidados em casa, como a frequência de tratamentos e dicas para manter a cor.",
        },
        products: {
          type: "ARRAY",
          items: { type: "STRING" },
          description:
            "Lista de produtos específicos para home care. Ex: 'Shampoo Wella Fusion', 'Máscara Wella Fusion', 'Leave-in Oil Reflections'.",
        },
        steps: {
          type: "ARRAY",
          items: { type: "STRING" },
          description:
            "Passo a passo de como a cliente deve usar os produtos em casa.",
        },
      },
      required: ["recommendation", "products", "steps"],
      description:
        "Plano de tratamento pós-química para a cliente seguir em casa.",
    },
  },
  required: [
    "visagismAndColorimetryAnalysis",
    "initialDiagnosis",
    "products",
    "mechasTechnique",
    "applicationSteps",
    "diagrams",
    "tryOnImagePrompt",
    "postChemicalCare",
  ],
};

const visagismReportSchema = {
  type: "OBJECT",
  properties: {
    faceShape: {
      type: "STRING",
      description: "Formato do rosto da cliente (ex: Oval, Redondo, Coração).",
    },
    keyFacialFeatures: {
      type: "OBJECT",
      properties: {
        forehead: {
          type: "STRING",
          description: "Descrição da testa (ex: Larga, Estreita).",
        },
        jawline: {
          type: "STRING",
          description: "Descrição do maxilar (ex: Definido, Suave).",
        },
        nose: {
          type: "STRING",
          description: "Descrição do nariz (ex: Fino, Largo).",
        },
        eyes: {
          type: "STRING",
          description:
            "Descrição dos olhos (ex: Amendoados, Próximos, Afastados).",
        },
      },
      required: ["forehead", "jawline", "nose", "eyes"],
    },
    hairAnalysis: {
      type: "OBJECT",
      properties: {
        hairType: {
          type: "STRING",
          description:
            "O tipo de cabelo aparente (ex: Liso, Ondulado, Cacheado).",
        },
        hairDensity: {
          type: "STRING",
          description:
            "A densidade capilar aparente (ex: Fino, Médio, Grosso).",
        },
        currentCondition: {
          type: "STRING",
          description:
            "A condição atual dos fios (ex: Saudável, Ressecado, Com coloração).",
        },
      },
      required: ["hairType", "hairDensity", "currentCondition"],
    },
    styleRecommendations: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          styleName: {
            type: "STRING",
            description: "Nome do estilo recomendado.",
          },
          description: {
            type: "STRING",
            description:
              "Justificativa de por que este estilo valoriza a cliente.",
          },
          category: {
            type: "STRING",
            enum: ["Corte", "Coloração", "Penteado"],
            description: "Categoria do estilo.",
          },
        },
        required: ["styleName", "description", "category"],
      },
    },
    stylesToAvoid: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          styleName: {
            type: "STRING",
            description: "Nome do estilo a ser evitado.",
          },
          description: {
            type: "STRING",
            description:
              "Justificativa de por que este estilo não valoriza a cliente.",
          },
        },
        required: ["styleName", "description"],
      },
    },
    makeupTips: {
      type: "ARRAY",
      items: { type: "STRING" },
      description:
        "Lista de dicas de maquiagem para harmonizar com os traços da cliente.",
    },
    accessoriesTips: {
      type: "ARRAY",
      items: { type: "STRING" },
      description:
        "Lista de dicas de acessórios (óculos, brincos, colares) que valorizam a cliente.",
    },
    summary: {
      type: "STRING",
      description: "Um resumo conciso da consultoria de visagismo.",
    },
  },
  required: [
    "faceShape",
    "keyFacialFeatures",
    "hairAnalysis",
    "styleRecommendations",
    "stylesToAvoid",
    "makeupTips",
    "accessoriesTips",
    "summary",
  ],
};

/* -------------------------
   Functions (preserve names + behavior)
   ------------------------- */

export async function generateHairstylistReport(
  clientImageFile: File,
  referenceImageFile: File,
  brand: string
): Promise<HairstylistReport> {
  const ai = getAiClient();
  // get model wrapper
  const model = ai.getGenerativeModel
    ? ai.getGenerativeModel({ model: "gemini-3-pro-preview" })
    : (ai as any).models?.get?.("gemini-3-pro-preview") ?? ai;

  const clientBase64 = await fileToBase64(clientImageFile);
  const referenceBase64 = await fileToBase64(referenceImageFile);

  const clientImagePart = {
    inlineData: {
      mimeType: clientImageFile.type,
      data: clientBase64,
    },
  };

  const referenceImagePart = {
    inlineData: {
      mimeType: referenceImageFile.type,
      data: referenceBase64,
    },
  };

  const textPart = {
    text: `Você é um hairstylist visagista de elite e instrutor da filosofia 'Engenharia de Cortes'. Sua tarefa é realizar uma análise completa com base em duas imagens: uma da cliente e uma do corte de referência.

**PROCESSO OBRIGATÓRIO:**

**Parte 1: Análise Visagista da Referência**
- **Foco na Referência:** Analise APENAS a imagem de referência. Descreva o formato do rosto da pessoa, seus traços faciais chave e as características do seu cabelo.
- **Harmonia do Estilo:** Explique por que o corte de cabelo da referência funciona bem para aquela pessoa, conectando o estilo com suas características faciais e capilares. Preencha o objeto \`referenceVisagism\`.

**Parte 2: Análise de Viabilidade (Comparativa)**
- **Compare Cliente e Referência:** Agora, compare as características da sua cliente (foto 1) com as da pessoa de referência (foto 2).
- **Dê o Veredito:** Com base na sua análise comparativa, determine a viabilidade do corte para a cliente, escolhendo um dos três vereditos: 'Altamente Recomendado', 'Recomendado com Adaptações', ou 'Não Recomendado'. Preencha o objeto \`viabilityAnalysis\`.
- **Justifique:** Explique detalhadamente o porquê do seu veredito.
- **Sugira Adaptações:** Se necessário, descreva as modificações específicas para que o corte harmonize perfeitamente com a cliente.

**Parte 3: Plano de Corte Técnico (Engenharia de Cortes)**
- **Baseado na Referência:** Crie um plano técnico completo para executar o corte de cabelo da imagem de referência.
- **Preparação e Finalização:** Nos passos de preparação e finalização, você DEVE recomendar produtos específicos da marca **${brand}**.
- **Engenharia de Cortes:** Para cada passo do corte, especifique claramente a DIVISÃO e o ÂNGULO da filosofia 'Engenharia de Cortes' para cada passo.
- **Diagramas:** Crie diagramas SVG claros e com estilo high-tech para ilustrar os passos mais importantes. Preencha o objeto \`cuttingPlan\`.

Sua resposta final deve ser um único objeto JSON estruturado, seguindo o schema fornecido.`,
  };

  // call model.generateContent using the SDK pattern
  const payload = {
    contents: [
      { role: "user", parts: [clientImagePart, referenceImagePart, textPart] },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: hairstylistReportSchema,
      temperature: 0.0,
      thinkingConfig: { thinkingBudget: 32768 },
    },
  };

  const response: any = await (model.generateContent
    ? model.generateContent(payload)
    : (ai as any).models.generateContent
    ? (ai as any).models.generateContent(payload)
    : Promise.reject(
        new Error("SDK does not support generateContent on this object")
      ));

  // robust extraction of JSON text
  let jsonStr: string | undefined;
  if (typeof response.text === "function") {
    jsonStr = await response.text();
  } else if (typeof response.text === "string") {
    jsonStr = response.text;
  } else if (response?.candidates?.[0]?.content?.parts) {
    // search for a text part
    for (const p of response.candidates[0].content.parts) {
      if (p.text) {
        jsonStr = p.text;
        break;
      }
    }
  } else if (response?.output?.[0]?.content) {
    const c = response.output[0].content.find(
      (x: any) => x.type === "output_text" || x.text
    );
    if (c) jsonStr = c.text || (typeof c === "string" ? c : undefined);
  }

  if (!jsonStr) throw new Error("No JSON text returned from model.");

  const trimmed = typeof jsonStr === "string" ? jsonStr.trim() : jsonStr;
  return JSON.parse(trimmed) as HairstylistReport;
}

export async function editImageWithText(
  base64Image: string,
  prompt: string
): Promise<string> {
  const ai = getAiClient();
  const model = ai.getGenerativeModel
    ? ai.getGenerativeModel({ model: "gemini-2.5-flash-image" })
    : (ai as any);

  const imageData = base64Image.includes(",")
    ? base64Image.split(",")[1]
    : base64Image;
  const mimeType = base64Image.match(/data:(.*);base64,/)?.[1] || "image/jpeg";

  const payload = {
    contents: [
      {
        role: "user",
        parts: [
          { inlineData: { data: imageData, mimeType }, text: undefined },
          { text: prompt },
        ],
      },
    ],
  };

  const response: any = await (model.generateContent
    ? model.generateContent(payload)
    : (ai as any).models.generateContent(payload));

  // try to find inlineData inside candidates
  const candidatesParts = response?.candidates?.[0]?.content?.parts ?? [];
  for (const part of candidatesParts) {
    if (part.inlineData && part.inlineData.data) {
      const base64ImageBytes: string = part.inlineData.data;
      const generatedImageUrl = `data:image/png;base64,${base64ImageBytes}`;
      try {
        const watermarkedImage = await addWatermark(generatedImageUrl);
        return watermarkedImage;
      } catch (e) {
        console.error("Watermarking failed, returning original image.", e);
        return generatedImageUrl;
      }
    }
  }

  // fallback: maybe response.text() contains a data URL
  let textResp: string | undefined;
  if (typeof response.text === "function") textResp = await response.text();
  else if (typeof response.text === "string") textResp = response.text;

  if (textResp) {
    const found = textResp.match(/data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/);
    if (found) {
      try {
        const wm = await addWatermark(found[0]);
        return wm;
      } catch (e) {
        return found[0];
      }
    }
  }

  throw new Error("Não foi possível editar a imagem.");
}

export async function generateColoristReport(
  clientImageFile: File,
  inspiration: { type: "image"; value: File } | { type: "text"; value: string },
  cosmeticsBrand: string
): Promise<{ report: ColoristReport; tryOnImage: string }> {
  const ai = getAiClient();
  const model = ai.getGenerativeModel
    ? ai.getGenerativeModel({ model: "gemini-3-pro-preview" })
    : (ai as any);
  const clientImageBase64 = await fileToBase64(clientImageFile);

  const clientImagePart = {
    inlineData: {
      mimeType: clientImageFile.type,
      data: clientImageBase64,
    },
  };

  const inspirationParts: any[] = [];
  let inspirationText = "";

  if (inspiration.type === "image") {
    const referenceImageBase64 = await fileToBase64(inspiration.value);
    inspirationParts.push({
      inlineData: {
        mimeType: inspiration.value.type,
        data: referenceImageBase64,
      },
    });
    inspirationText = "A inspiração de cor é a imagem de referência fornecida.";
  } else {
    inspirationText = `A inspiração de cor é a seguinte descrição textual: "${inspiration.value}"`;
  }

  inspirationParts.push({ text: inspirationText });

  const textPart = {
    text: `Você é um colorista expert e visagista de renome mundial. Sua missão é criar um plano de coloração 100% preciso e personalizado, utilizando exclusivamente produtos da marca **${cosmeticsBrand}**.

**PROCESSO OBRIGATÓRIO:**

1.  **Análise da Cliente (Foto 1):**
    *   **Colorimetria e Visagismo:** Analise a foto da cliente para determinar seu subtom de pele (quente, frio ou neutro) e seu contraste pessoal.
    *   **Diagnóstico Capilar:** Faça um diagnóstico técnico do cabelo da cliente: altura de tom da base natural, porcentagem de brancos, e condição dos fios.

2.  **Análise da Inspiração (Foto 2 ou Texto):**
    *   Interprete a referência para entender o resultado desejado (cor, técnica, etc.).

3.  **Criação do Plano Técnico (JSON):**
    *   **Harmonização:** Justifique por que a cor desejada harmoniza com a cliente.
    *   **Plano de Ação:** Detalhe o plano completo. **REQUISITO CRÍTICO:** Todos os produtos listados (descolorante, oxidante, coloração, tonalizante, tratamento de salão) DEVEM ser da marca **${cosmeticsBrand}**. Seja específico com os nomes das linhas (ex: 'Color Perfect', 'Igora Royal').
    *   **Diagramas:** Crie diagramas SVG claros da técnica de mechas.
    *   **Plano de Cuidados Pós-Química (Home Care):** Crie uma seção de cuidados para a cliente seguir em casa. Inclua uma recomendação, uma lista de produtos home care específicos da marca **${cosmeticsBrand}** (shampoo, máscara, etc.), e um passo a passo de uso.
    *   **Prompt para IA de Imagem:** Crie um prompt em INGLÊS, detalhado, para que uma IA aplique o resultado final na foto original da cliente.

Siga rigorosamente o schema JSON para estruturar sua resposta.`,
  };

  const payload = {
    contents: [
      { role: "user", parts: [clientImagePart, ...inspirationParts, textPart] },
    ],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: coloristReportSchema,
      temperature: 0.0,
      thinkingConfig: { thinkingBudget: 32768 },
    },
  };

  const reportResponse: any = await (model.generateContent
    ? model.generateContent(payload)
    : (ai as any).models.generateContent(payload));
  let jsonStr: string | undefined;
  if (typeof reportResponse.text === "function")
    jsonStr = await reportResponse.text();
  else if (typeof reportResponse.text === "string")
    jsonStr = reportResponse.text;
  else if (reportResponse?.candidates?.[0]?.content?.parts) {
    for (const p of reportResponse.candidates[0].content.parts) {
      if (p.text) {
        jsonStr = p.text;
        break;
      }
    }
  }

  if (!jsonStr) throw new Error("No JSON returned for colorist report.");
  const report = JSON.parse(jsonStr) as ColoristReport;

  const tryOnImage = await editImageWithText(
    `data:${clientImageFile.type};base64,${clientImageBase64}`,
    report.tryOnImagePrompt
  );
  return { report, tryOnImage };
}

export async function generateVisagismReport(
  clientImageFile: File
): Promise<VisagismReport> {
  const ai = getAiClient();
  const model = ai.getGenerativeModel
    ? ai.getGenerativeModel({ model: "gemini-3-pro-preview" })
    : (ai as any);
  const clientBase64 = await fileToBase64(clientImageFile);

  const clientImagePart = {
    inlineData: {
      mimeType: clientImageFile.type,
      data: clientBase64,
    },
  };

  const textPart = {
    text: `Você é um consultor de imagem e visagista de renome mundial, especialista em análise facial e harmonia de estilo. Sua tarefa é realizar uma consultoria de visagismo 360° completa e detalhada com base na foto da cliente fornecida.

**PROCESSO OBRIGATÓRIO:**

1.  **Análise Facial e Capilar:** Analise a imagem para identificar o formato do rosto, características faciais chave (testa, maxilar, nariz, olhos) e as características do cabelo (tipo, densidade, condição).
2.  **Recomendações de Estilo:** Com base na sua análise, sugira estilos de corte, coloração e penteados que irão valorizar e harmonizar com os traços da cliente. Justifique cada recomendação.
3.  **Estilos a Evitar:** Aponte estilos que não seriam favoráveis e explique o porquê.
4.  **Dicas Adicionais:** Forneça dicas práticas e personalizadas de maquiagem e acessórios (brincos, colares, óculos) que complementem a imagem da cliente.
5.  **Resumo:** Conclua com um resumo poderoso e encorajador da consultoria.

Sua resposta final deve ser um único objeto JSON estruturado, seguindo rigorosamente o schema fornecido.`,
  };

  const payload = {
    contents: [{ role: "user", parts: [clientImagePart, textPart] }],
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: visagismReportSchema,
      temperature: 0.0,
      thinkingConfig: { thinkingBudget: 32768 },
    },
  };

  const response: any = await (model.generateContent
    ? model.generateContent(payload)
    : (ai as any).models.generateContent(payload));
  let jsonStr: string | undefined;
  if (typeof response.text === "function") jsonStr = await response.text();
  else if (typeof response.text === "string") jsonStr = response.text;
  else if (response?.candidates?.[0]?.content?.parts) {
    for (const p of response.candidates[0].content.parts) {
      if (p.text) {
        jsonStr = p.text;
        break;
      }
    }
  }

  if (!jsonStr) throw new Error("No JSON returned for visagism report.");
  return JSON.parse(jsonStr) as VisagismReport;
}

export async function generateVideoFromImage(
  imageFile: File,
  prompt: string
): Promise<string> {
  const ai = await ensureProModelApiKey();
  // try to use the SDK video helper if present
  const base64Image = await fileToBase64(imageFile);

  if (
    (ai as any).models &&
    typeof (ai as any).models.generateVideos === "function"
  ) {
    try {
      // @ts-ignore
      let operation: any = await (ai as any).models.generateVideos({
        model: "veo-3.1-fast-generate-preview",
        prompt,
        image: {
          imageBytes: base64Image,
          mimeType: imageFile.type,
        },
        config: {
          numberOfVideos: 1,
          resolution: "720p",
          aspectRatio: "16:9",
        },
      });

      // poll until done (SDK may return operation-like object)
      while (!operation.done) {
        await new Promise((resolve) => setTimeout(resolve, 10000));
        if (
          (ai as any).operations &&
          typeof (ai as any).operations.getVideosOperation === "function"
        ) {
          operation = await (ai as any).operations.getVideosOperation({
            operation,
          });
        } else {
          break;
        }
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      if (!downloadLink)
        throw new Error(
          "Video generation succeeded but no download link was found."
        );

      const resp = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
      if (!resp.ok) {
        const errorText = await resp.text();
        if (errorText.includes("Requested entity was not found.")) {
          throw new Error(
            "API Key not found or invalid. Please try selecting your key again. See ai.google.dev/gemini-api/docs/billing"
          );
        }
        throw new Error(`Failed to download video: ${resp.statusText}`);
      }
      const videoBlob = await resp.blob();
      return URL.createObjectURL(videoBlob);
    } catch (err) {
      console.error("Video generation error:", err);
      throw err;
    }
  }

  // fallback: try to call generateContent on a video-capable model (less common)
  try {
    const model = (ai as any).getGenerativeModel
      ? (ai as any).getGenerativeModel({
          model: "veo-3.1-fast-generate-preview",
        })
      : (ai as any);
    const response = await (model.generateContent
      ? model.generateContent({
          contents: [
            {
              role: "user",
              parts: [
                { text: prompt },
                { inlineData: { data: base64Image, mimeType: imageFile.type } },
              ],
            },
          ],
        })
      : Promise.reject(new Error("No video generate APIs available")));
    const text =
      typeof response.text === "function"
        ? await response.text()
        : response.text;
    const match = String(text).match(/https?:\/\/\S+\.mp4\S*/);
    if (match) return match[0];
    throw new Error("No video link returned by model fallback.");
  } catch (err) {
    console.error("Video fallback failed:", err);
    throw err;
  }
}

let chatInstance: any | null = null;
export const startChat = (): any => {
  if (!chatInstance) {
    const ai = getAiClient();
    // create a light-weight chat wrapper that emulates previous behavior
    const model = ai.getGenerativeModel
      ? ai.getGenerativeModel({ model: "gemini-2.5-flash" })
      : (ai as any);

    chatInstance = {
      send: async (text: string) => {
        const payload = { contents: [{ role: "user", parts: [{ text }] }] };
        const response: any = await (model.generateContent
          ? model.generateContent(payload)
          : (ai as any).models.generateContent(payload));
        const out =
          typeof response.text === "function"
            ? await response.text()
            : response.text ??
              response?.candidates?.[0]?.content?.parts
                ?.map((p: any) => p.text)
                .join("\n");
        return String(out);
      },
    };
  }
  return chatInstance;
};

export async function textToSpeech(text: string) {
  const ai = getAiClient();
  const model = ai.getGenerativeModel
    ? ai.getGenerativeModel({ model: "gemini-2.5-flash-preview-tts" })
    : (ai as any);
  const payload = {
    contents: [{ role: "user", parts: [{ text }] }],
    generationConfig: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName: "Kore" },
        },
      },
    },
  };

  const response: any = await (model.generateContent
    ? model.generateContent(payload)
    : (ai as any).models.generateContent(payload));

  // try common inlineData path
  const audioBase64 = response?.candidates?.[0]?.content?.parts?.find(
    (p: any) => p.inlineData?.data
  )?.inlineData?.data;
  if (!audioBase64) {
    const textResp =
      typeof response.text === "function"
        ? await response.text()
        : response.text;
    const match =
      typeof textResp === "string"
        ? textResp.match(/data:audio\/[^;]+;base64,([A-Za-z0-9+/=]+)/)
        : null;
    if (match) {
      await playBase64Audio(match[1]);
      return;
    }
    throw new Error("Audio data not found in response.");
  }
  await playBase64Audio(audioBase64);
}

async function playBase64Audio(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) bytes[i] = binaryString.charCodeAt(i);

  const audioCtx = new (window.AudioContext ||
    (window as any).webkitAudioContext)({ sampleRate: 24000 });
  const dataInt16 = new Int16Array(bytes.buffer);
  const frameCount = dataInt16.length;
  const buffer = audioCtx.createBuffer(1, frameCount, 24000);
  const channelData = buffer.getChannelData(0);
  for (let i = 0; i < frameCount; i++) channelData[i] = dataInt16[i] / 32768;
  const source = audioCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(audioCtx.destination);
  source.start();
}

export async function findNearbyStores(query: string): Promise<any> {
  const ai = getAiClient();
  const model = ai.getGenerativeModel
    ? ai.getGenerativeModel({ model: "gemini-2.5-flash" })
    : (ai as any);
  const payload = { contents: [{ role: "user", parts: [{ text: query }] }] };

  const response: any = await (model.generateContent
    ? model.generateContent(payload)
    : (ai as any).models.generateContent(payload));
  const groundingChunks =
    response?.candidates?.[0]?.groundingMetadata?.groundingChunks;
  const text =
    typeof response.text === "function"
      ? await response.text()
      : response.text ??
        response?.candidates?.[0]?.content?.parts
          ?.map((p: any) => p.text)
          .join("\n");
  return {
    textResponse: String(text ?? ""),
    mapsData: groundingChunks,
  };
}
