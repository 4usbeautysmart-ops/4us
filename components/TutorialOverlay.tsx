

import React, { useEffect, useState, useMemo, useRef } from 'react';

interface TutorialOverlayProps {
  step: number;
  onNext: () => void;
  onSkip: () => void;
  tutorialType: 'analyze' | 'color-expert' | 'visagism' | null;
}

interface TutorialStep {
  title: string;
  content: string;
  targetId?: string;
  position?: 'center' | 'top' | 'bottom' | 'left' | 'right';
}

const analyzeTutorialSteps: TutorialStep[] = [
  {
    title: 'Bem-vindo(a) à Engenharia de Cortes 5D!',
    content: 'Este é um tour rápido para mostrar como você pode transformar uma simples foto em um plano de corte completo. Vamos começar?',
    position: 'center',
  },
  {
    title: '1. O Ponto de Partida',
    content: 'Tudo começa aqui. Envie a foto da sua cliente e uma foto de referência do corte desejado para a IA analisar.',
    targetId: 'image-uploader-container',
    position: 'right',
  },
  {
    title: '2. Mágica da IA',
    content: 'Perfeito! Agora nossa IA está analisando as fotos para criar um plano detalhado, diagramas e uma visualização realista. Isso leva apenas um instante.',
    position: 'center',
  },
  {
    title: '3. Seu Plano de Corte',
    content: 'Aqui está seu plano completo! Navegue pelas abas para ver os passos detalhados, os diagramas técnicos e a imagem de resultado realista gerada pela IA.',
    targetId: 'hairstylist-report-display',
    position: 'left',
  },
  {
    title: '4. Análise de Visagismo',
    content: 'A IA também detecta e analisa o rosto na foto de referência. Clique nesta aba para ver uma análise detalhada sobre o formato do rosto e por que este corte é uma boa combinação.',
    targetId: 'tab-visagism',
    position: 'bottom',
  },
  {
    title: '5. Ferramentas de Criação',
    content: 'Este painel contém ações poderosas. Você pode editar a imagem com texto, aplicar filtros, gerar uma animação, e muito mais.',
    targetId: 'action-buttons',
    position: 'top',
  },
  {
    title: '6. Salve Seu Trabalho',
    content: 'Gostou do resultado? Clique aqui para salvar o plano no seu navegador e acessá-lo a qualquer momento.',
    targetId: 'action-button-save',
    position: 'top',
  },
  {
    title: '7. Acesse Seus Planos',
    content: 'Todos os seus planos salvos ficam aqui, organizados e prontos para serem carregados novamente.',
    targetId: 'header-saved-plans-button',
    position: 'left',
  },
  {
    title: '8. Assistente Virtual',
    content: 'Tem alguma dúvida sobre técnicas, produtos ou tendências? Nosso chatbot especialista está aqui para ajudar.',
    targetId: 'chat-panel-container',
    position: 'left',
  },
  {
    title: 'Tour Concluído!',
    content: 'Você está pronto para criar! Explore, experimente e eleve sua arte de cortar cabelos para a próxima dimensão.',
    position: 'center',
  },
];

const coloristTutorialSteps: TutorialStep[] = [
  {
    title: 'Bem-vindo(a) ao Colorista Expert!',
    content: 'Vamos criar um plano de coloração completo e personalizado, desde o diagnóstico até a simulação do resultado.',
    position: 'center',
  },
  {
    title: '1. Foto da Cliente',
    content: 'Comece enviando uma foto nítida e atual do cabelo da sua cliente. Isso é crucial para o diagnóstico da IA.',
    targetId: 'colorist-client-photo-container',
    position: 'right',
  },
  {
    title: '2. Inspiração de Cor',
    content: 'Agora, forneça a inspiração. Você pode enviar uma foto de referência ou descrever a cor desejada em detalhes.',
    targetId: 'colorist-inspiration-container',
    position: 'left',
  },
  {
    title: '3. Marca de Cosméticos',
    content: 'Selecione a marca que você usa. A IA criará a fórmula e as recomendações usando produtos específicos desta marca.',
    targetId: 'brand-select-colorist',
    position: 'top',
  },
  {
    title: '4. Gerar Análise',
    content: 'Tudo pronto! Clique aqui para a IA criar o diagnóstico, a fórmula, a técnica e uma simulação do resultado.',
    targetId: 'colorist-generate-button',
    position: 'top',
  },
  {
    title: '5. Mágica da IA',
    content: 'Aguarde um momento... Nossa IA está processando as imagens, analisando a colorimetria e montando seu relatório exclusivo.',
    position: 'center',
  },
  {
    title: '6. Relatório Completo',
    content: 'Aqui está! Veja a simulação do resultado, a análise de visagismo, os produtos e o passo a passo da aplicação.',
    targetId: 'colorist-report-display',
    position: 'bottom',
  },
  {
    title: '7. Plano Técnico',
    content: 'Navegue entre o passo a passo detalhado da aplicação e os diagramas técnicos que ilustram a técnica de mechas.',
    targetId: 'colorist-report-tabs',
    position: 'top',
  },
  {
    title: '8. Compartilhe e Finalize',
    content: 'Gostou? Compartilhe este relatório profissional com sua cliente ou baixe o PDF para seus arquivos com um clique.',
    targetId: 'action-button-share',
    position: 'top',
  },
  {
    title: 'Tour Concluído!',
    content: 'Agora você pode criar cores incríveis com a precisão e a criatividade da IA. Explore e inspire-se!',
    position: 'center',
  },
];

const visagismTutorialSteps: TutorialStep[] = [
  {
    title: 'Bem-vindo(a) ao Visagismo 360°!',
    content: 'Este tour irá guiá-lo(a) na criação de uma consultoria de imagem completa e personalizada para sua cliente.',
    position: 'center',
  },
  {
    title: '1. Foto da Cliente',
    content: 'Tudo começa com uma foto de rosto nítida da sua cliente. Envie ou capture uma imagem para a IA analisar.',
    targetId: 'visagism-uploader-container',
    position: 'right',
  },
  {
    title: '2. Gerar Consultoria',
    content: 'Com a foto pronta, clique aqui. A IA fará uma análise facial e capilar completa para gerar as recomendações.',
    targetId: 'visagism-generate-button',
    position: 'top',
  },
  {
    title: 'Analisando...',
    content: 'Aguarde um momento... A IA está identificando o formato do rosto, analisando traços e preparando um relatório personalizado.',
    position: 'center',
  },
  {
    title: '3. Relatório Completo',
    content: 'Sua consultoria de visagismo está pronta! Explore a análise detalhada e as recomendações de estilo personalizadas.',
    targetId: 'visagism-report-display',
    position: 'bottom',
  },
  {
    title: 'Análise Técnica',
    content: 'Nesta seção, você encontra a identificação do formato do rosto e as principais características faciais e capilares da cliente.',
    targetId: 'visagism-analysis-cards',
    position: 'right',
  },
  {
    title: 'Recomendações de Estilo',
    content: 'Aqui estão as sugestões de cortes, cores, maquiagem e acessórios para valorizar a imagem da cliente, além dos estilos a evitar.',
    targetId: 'visagism-recommendations-section',
    position: 'left',
  },
  {
    title: 'Tour Concluído!',
    content: 'Você está pronto para oferecer uma consultoria de imagem completa que vai além do cabelo. Explore e encante suas clientes!',
    position: 'center',
  },
];


export const TutorialOverlay: React.FC<TutorialOverlayProps> = ({ step, onNext, onSkip, tutorialType }) => {
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({ opacity: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);
  
  const tutorialSteps = useMemo(() => {
    if (tutorialType === 'color-expert') return coloristTutorialSteps;
    if (tutorialType === 'visagism') return visagismTutorialSteps;
    return analyzeTutorialSteps; // Default to analyze
  }, [tutorialType]);
  
  const currentStep = tutorialSteps[step];

  useEffect(() => {
    if (currentStep && currentStep.targetId) {
      const element = document.getElementById(currentStep.targetId);
      if (element) {
        const rect = element.getBoundingClientRect();
        setTargetRect(rect);
        // Avoid scrolling if the element is already fully in view
        if (rect.top < 0 || rect.bottom > window.innerHeight) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else {
        setTargetRect(null); // Target not found, reset
      }
    } else {
      setTargetRect(null);
    }
  }, [step, currentStep]);

  useEffect(() => {
    if (!currentStep || !tooltipRef.current) return;
    
    // For centered tooltips, no calculation is needed.
    if (currentStep.position === 'center' || !targetRect) {
      setTooltipStyle({
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        opacity: 1,
      });
      return;
    }

    const tooltipEl = tooltipRef.current;
    const { offsetWidth: tooltipWidth, offsetHeight: tooltipHeight } = tooltipEl;
    const offset = 16;
    let preferredPosition = currentStep.position;

    // --- Auto-Flip Logic ---
    // Vertical flip
    const spaceBelow = window.innerHeight - targetRect.bottom;
    const spaceAbove = targetRect.top;
    if (preferredPosition === 'bottom' && spaceBelow < tooltipHeight + offset && spaceAbove > spaceBelow) {
      preferredPosition = 'top';
    }
    if (preferredPosition === 'top' && spaceAbove < tooltipHeight + offset && spaceBelow > spaceAbove) {
      preferredPosition = 'bottom';
    }
    // Horizontal flip
    const spaceRight = window.innerWidth - targetRect.right;
    const spaceLeft = targetRect.left;
    if (preferredPosition === 'right' && spaceRight < tooltipWidth + offset && spaceLeft > spaceRight) {
      preferredPosition = 'left';
    }
    if (preferredPosition === 'left' && spaceLeft < tooltipWidth + offset && spaceRight > spaceLeft) {
      preferredPosition = 'right';
    }

    // --- Position Calculation ---
    let top = 0, left = 0;
    switch (preferredPosition) {
      case 'top':
        top = targetRect.top - tooltipHeight - offset;
        left = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2);
        break;
      case 'bottom':
        top = targetRect.bottom + offset;
        left = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2);
        break;
      case 'left':
        top = targetRect.top + (targetRect.height / 2) - (tooltipHeight / 2);
        left = targetRect.left - tooltipWidth - offset;
        break;
      case 'right':
        top = targetRect.top + (targetRect.height / 2) - (tooltipHeight / 2);
        left = targetRect.right + offset;
        break;
    }
    
    // --- Viewport Clamping (Final Guarantee) ---
    if (left < offset) {
      left = offset;
    }
    if (left + tooltipWidth > window.innerWidth - offset) {
      left = window.innerWidth - tooltipWidth - offset;
    }
    if (top < offset) {
      top = offset;
    }
    if (top + tooltipHeight > window.innerHeight - offset) {
      top = window.innerHeight - tooltipHeight - offset;
    }

    setTooltipStyle({
      top: `${top}px`,
      left: `${left}px`,
      opacity: 1,
      transform: 'none', // Position is now absolute
    });

  }, [currentStep, targetRect]);
  
  const isLastStep = step === tutorialSteps.length - 1;

  if (!currentStep) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div 
        className="absolute inset-0 bg-gray-900/80 backdrop-blur-sm transition-all duration-300"
        style={{
            clipPath: targetRect
            ? `path('M0 0 H${window.innerWidth} V${window.innerHeight} H0 Z M${targetRect.left - 4} ${targetRect.top - 4} H${targetRect.right + 4} V${targetRect.bottom + 4} H${targetRect.left - 4} Z')`
            : 'none',
        }}
        onClick={isLastStep ? onSkip : undefined}
      />
       {/* Highlight Box */}
       {targetRect && (
        <div
          className="absolute border-2 border-dashed border-emerald-400 rounded-lg pointer-events-none transition-all duration-300"
          style={{
            left: `${targetRect.left - 4}px`,
            top: `${targetRect.top - 4}px`,
            width: `${targetRect.width + 8}px`,
            height: `${targetRect.height + 8}px`,
          }}
        />
      )}
      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="absolute bg-gray-800 p-6 rounded-lg shadow-2xl shadow-emerald-500/20 w-80 border border-gray-700 transition-all duration-300"
        style={tooltipStyle}
      >
        <h3 className="text-xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-green-400">{currentStep.title}</h3>
        <p className="text-gray-300 mb-6">{currentStep.content}</p>
        <div className="flex justify-center items-center gap-6">
          {!isLastStep && (
            <button onClick={onSkip} className="text-sm text-gray-400 hover:text-white">
              Pular Tour
            </button>
          )}
          <button onClick={isLastStep ? onSkip : onNext} className="px-5 py-2 bg-emerald-600 text-white rounded-md font-medium hover:bg-emerald-500 transition-colors">
            {isLastStep ? 'Concluir' : (step === 0 ? 'Começar' : 'Próximo')}
          </button>
        </div>
      </div>
    </div>
  );
};