import { GoogleGenAI } from "@google/genai";
// import { buffer } from "node:buffer";

export const config = {
  api: {
    bodyParser: false, // precisamos parsear a imagem manualmente
  },
};

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

function parseMultipart(
  req
): Promise<{ client: Buffer; reference: Buffer; brand: string }> {
  return new Promise((resolve, reject) => {
    const busboy = require("busboy");
    const bb = busboy({ headers: req.headers });

    let clientImage: Buffer | null = null;
    let referenceImage: Buffer | null = null;
    let brand = "";

    bb.on("file", (name, file) => {
      const chunks: Buffer[] = [];
      file.on("data", (chunk) => chunks.push(chunk));
      file.on("end", () => {
        const fileBuffer = Buffer.concat(chunks);
        if (name === "clientImage") clientImage = fileBuffer;
        if (name === "referenceImage") referenceImage = fileBuffer;
      });
    });

    bb.on("field", (name, value) => {
      if (name === "brand") brand = value;
    });

    bb.on("finish", () => {
      resolve({
        client: clientImage!,
        reference: referenceImage!,
        brand,
      });
    });

    req.pipe(bb);
  });
}

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Método não permitido" });
    }

    const { client, reference, brand } = await parseMultipart(req);

    const ai = new GoogleGenAI({
      apiKey: process.env.API_KEY,
    });

    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: client.toString("base64"),
            },
          },
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: reference.toString("base64"),
            },
          },
          {
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
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: hairstylistReportSchema,
        thinkingConfig: { thinkingBudget: 32768 },
      },
    });

    const json = JSON.parse(response.text.trim());

    return res.status(200).json(json);
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: err.message });
  }
}
