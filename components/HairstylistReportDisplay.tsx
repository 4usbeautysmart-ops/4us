

import React, { useState, useRef, useEffect } from 'react';
import type { HairstylistReport, ReferenceVisagismAnalysis } from '../types';
import { Icon } from './Icon';
import { ZoomableImage } from './ZoomableImage';
import { ThreeDViewer } from './ThreeDViewer';
import { CuttingPlanDisplay } from './CuttingPlanDisplay';

interface HairstylistReportDisplayProps {
  report: HairstylistReport;
  clientImage: string | null;
  referenceImage: string | null;
  realisticImage: string | null;
  videoUrl: string | null;
  imageFilterClass: string;
  frontViewImage: string | null;
  sideViewImage: string | null;
  backViewImage: string | null;
  isGenerating3DViews: boolean;
  onClose: () => void;
}

type Tab = 'plan' | 'tools' | 'diagrams' | 'visagism' | '3d' | 'video';

const InfoCard: React.FC<{ icon: string; title: string; value: string }> = ({ icon, title, value }) => (
  <div className="bg-gray-700/50 p-4 rounded-lg flex items-center gap-4">
    <div className="bg-emerald-600/20 p-2 rounded-full">
      <Icon name={icon} className="w-6 h-6 text-emerald-300" />
    </div>
    <div>
      <p className="text-sm text-gray-400">{title}</p>
      <p className="font-semibold text-white">{value}</p>
    </div>
  </div>
);

const VisagismAnalysisDisplay: React.FC<{ analysis: ReferenceVisagismAnalysis }> = ({ analysis }) => (
    <div className="space-y-6">
        <div className="bg-gray-900/50 p-4 rounded-xl space-y-4">
            <h3 className="text-xl font-semibold text-emerald-300 border-b border-gray-700 pb-2 mb-3">Análise Facial (Referência)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoCard icon="face" title="Formato do Rosto" value={analysis.faceShape} />
                <InfoCard icon="ruler" title="Testa" value={analysis.keyFacialFeatures.forehead} />
                <InfoCard icon="ruler" title="Maxilar" value={analysis.keyFacialFeatures.jawline} />
                <InfoCard icon="ruler" title="Nariz" value={analysis.keyFacialFeatures.nose} />
            </div>
        </div>
        <div className="bg-gray-900/50 p-4 rounded-xl space-y-4">
            <h3 className="text-xl font-semibold text-emerald-300 border-b border-gray-700 pb-2 mb-3">Análise Capilar (Referência)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <InfoCard icon="hair" title="Tipo de Fio" value={analysis.hairAnalysis.hairType} />
                <InfoCard icon="grid" title="Densidade Aparente" value={analysis.hairAnalysis.hairDensity} />
            </div>
        </div>
         <div className="bg-gray-900/50 p-4 rounded-xl">
             <h3 className="text-xl font-semibold text-emerald-300 mb-2">Harmonia do Estilo</h3>
             <p className="text-gray-300 italic leading-relaxed">{analysis.styleHarmony}</p>
         </div>
    </div>
);


export const HairstylistReportDisplay: React.FC<HairstylistReportDisplayProps> = ({ 
    report, 
    clientImage, 
    referenceImage, 
    realisticImage, 
    videoUrl, 
    imageFilterClass,
    frontViewImage,
    sideViewImage,
    backViewImage,
    isGenerating3DViews,
    onClose
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('plan');
  const prevVideoUrl = useRef(videoUrl);
  
  const { viabilityAnalysis, cuttingPlan, referenceVisagism } = report;

  useEffect(() => {
    // Automatically switch to video tab when a new video is generated
    if (videoUrl && !prevVideoUrl.current) {
      setActiveTab('video');
    }
    prevVideoUrl.current = videoUrl;
  }, [videoUrl]);

  const getVerdictChipColor = () => {
    switch (viabilityAnalysis.verdict) {
      case 'Altamente Recomendado':
        return 'bg-emerald-600 text-white';
      case 'Recomendado com Adaptações':
        return 'bg-amber-500 text-white';
      case 'Não Recomendado':
        return 'bg-red-600 text-white';
      default:
        return 'bg-gray-600 text-gray-200';
    }
  };

  const TabButton = ({ tabId, iconName, label, id }: { tabId: Tab, iconName: string, label: string, id?: string }) => (
    <button
      id={id}
      onClick={() => setActiveTab(tabId)}
      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
        activeTab === tabId ? 'bg-emerald-600 text-white' : 'text-gray-300 hover:bg-gray-700'
      }`}
    >
      <Icon name={iconName} className="w-5 h-5" />
      {label}
    </button>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'plan':
        return <CuttingPlanDisplay plan={cuttingPlan} />;
      case 'tools':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-xl font-semibold text-emerald-300 mb-2 flex items-center gap-2"><Icon name="scissors" className="w-6 h-6"/> Ferramentas</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-300">
                {cuttingPlan.tools.map((tool, index) => <li key={index}>{tool}</li>)}
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-emerald-300 mb-2 flex items-center gap-2"><Icon name="grid" className="w-6 h-6"/> Acessórios</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-300">
                {cuttingPlan.accessories.map((acc, index) => <li key={index}>{acc}</li>)}
              </ul>
            </div>
          </div>
        );
      case 'diagrams':
         return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {cuttingPlan.diagrams.map((diagram, index) => (
              <div key={index} className="group relative bg-gray-700/50 p-4 rounded-lg flex flex-col items-center">
                <h4 className="font-semibold mb-2 text-gray-200">{diagram.title}</h4>
                <div className="bg-white rounded p-2 w-full aspect-square" dangerouslySetInnerHTML={{ __html: diagram.svg }} />
              </div>
            ))}
          </div>
        );
      case 'visagism':
        return <VisagismAnalysisDisplay analysis={referenceVisagism} />;
      case 'video':
        return (
          <div className="flex flex-col items-center justify-center h-full">
            <h3 className="text-xl font-semibold text-emerald-300 mb-4">Animação Gerada com Veo</h3>
            {videoUrl ? (
              <video src={videoUrl} controls autoPlay loop className="w-full max-w-lg rounded-lg shadow-lg"></video>
            ) : (
              <p className="text-gray-500">Nenhum vídeo gerado ainda.</p>
            )}
          </div>
        );
      case '3d':
        return <ThreeDViewer 
            frontImage={frontViewImage}
            sideImage={sideViewImage}
            backImage={backViewImage}
            isGenerating={isGenerating3DViews}
        />;
      default:
        return <p>Conteúdo para {activeTab} em desenvolvimento.</p>;
    }
  };

  return (
    <div id="hairstylist-report-display" className="p-2 sm:p-6 h-full flex flex-col">
       <div className="flex-shrink-0 flex justify-between items-center pb-4 mb-4 border-b border-gray-700 gap-4">
        <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-green-400">
          Plano de Corte 5D
        </h2>
        <button onClick={onClose} className="px-4 py-2 bg-gray-700 text-white rounded-lg font-semibold hover:bg-red-600/80 transition-colors text-sm flex items-center gap-2">
            <Icon name="close" className="w-5 h-5" /> Fechar Relatório
        </button>
      </div>

      <div className="flex-grow flex flex-col lg:flex-row gap-6 overflow-hidden">
        {/* Left Column: Visuals & Viability */}
        <div className="w-full lg:w-1/3 flex-shrink-0 flex flex-col gap-4 lg:overflow-y-auto lg:pr-2">
            <div className="grid grid-cols-2 gap-2">
                 <div className="text-center">
                    <h4 className="font-semibold text-sm mb-1 text-gray-400">Cliente</h4>
                    {clientImage && <img src={clientImage} alt="Cliente" className="w-full aspect-square object-cover rounded-lg" />}
                 </div>
                 <div className="text-center">
                    <h4 className="font-semibold text-sm mb-1 text-gray-400">Referência</h4>
                    {referenceImage && <img src={referenceImage} alt="Referência" className="w-full aspect-square object-cover rounded-lg" />}
                 </div>
            </div>
            <div className="text-center">
                <h4 className="font-semibold text-sm mb-1 text-gray-400">Resultado Realista (IA)</h4>
                {realisticImage ? (
                    <ZoomableImage src={realisticImage} alt="Realistic Result" filterClassName={imageFilterClass} />
                ) : (
                    <div className="w-full h-80 bg-gray-700 rounded-lg flex items-center justify-center text-gray-500">Gerando imagem...</div>
                )}
            </div>
            <div className="bg-gray-900/50 p-4 rounded-xl space-y-3">
                <h3 className="text-xl font-semibold text-emerald-300 border-b border-gray-700 pb-2 mb-3">Análise de Viabilidade (Comparativa)</h3>
                <div className="flex justify-center">
                    <span className={`px-4 py-1 rounded-full font-bold text-sm ${getVerdictChipColor()}`}>
                        {viabilityAnalysis.verdict}
                    </span>
                </div>
                <p className="text-gray-300 leading-relaxed text-sm">{viabilityAnalysis.justification}</p>
                {viabilityAnalysis.adaptationRecommendations && (
                    <div>
                        <h4 className="font-semibold text-amber-300 mt-2">Adaptações Recomendadas:</h4>
                        <p className="text-gray-300 leading-relaxed text-sm">{viabilityAnalysis.adaptationRecommendations}</p>
                    </div>
                )}
            </div>
        </div>

        {/* Right Column: Cutting Plan Details */}
        <div className="w-full lg:w-2/3 bg-gray-900/50 rounded-2xl p-4 sm:p-6 flex flex-col">
             <div className="flex-shrink-0">
                <h2 className="text-2xl font-bold mb-1 text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-green-400">{cuttingPlan.styleName}</h2>
                <p className="text-gray-400 mb-4">{cuttingPlan.description}</p>
                <div className="flex space-x-2 border-b border-gray-700 pb-4 mb-4 overflow-x-auto">
                    <TabButton tabId="plan" iconName="list" label="Plano de Corte" />
                    <TabButton tabId="tools" iconName="scissors" label="Ferramentas" />
                    <TabButton tabId="diagrams" iconName="diagram" label="Diagramas" />
                    <TabButton tabId="visagism" iconName="face" label="Análise Visagista" id="tab-visagism"/>
                    <TabButton tabId="3d" iconName="cube" label="3D" />
                    {videoUrl && <TabButton tabId="video" iconName="video" label="Animação" />}
                </div>
            </div>
            <div className="flex-grow lg:overflow-y-auto lg:pr-2">
                {renderContent()}
            </div>
        </div>
      </div>
    </div>
  );
};
