

import React, { useState } from 'react';
import { Icon } from './Icon';
import { ZoomableImage } from './ZoomableImage';
import { dataURLtoFile } from '../utils/fileUtils';

interface ThreeDViewerProps {
  frontImage: string | null;
  sideImage: string | null;
  backImage: string | null;
  isGenerating: boolean;
}

type View = 'front' | 'side' | 'back';

const ViewButton: React.FC<{ label: string; view: View; activeView: View; onClick: (view: View) => void; }> = ({ label, view, activeView, onClick }) => (
    <button
        onClick={() => onClick(view)}
        className={`flex-1 py-2 px-4 rounded-md text-sm text-center font-semibold transition-colors ${
            activeView === view ? 'bg-emerald-600 text-white' : 'bg-gray-700 hover:bg-gray-600'
        }`}
    >
        {label}
    </button>
);

const ImagePlaceholder: React.FC<{ viewName: string }> = ({ viewName }) => (
    <div className="w-full h-80 bg-gray-700 rounded-lg flex flex-col items-center justify-center text-gray-500">
        <div className="w-10 h-10 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-3">Gerando vista de {viewName}...</p>
    </div>
);

export const ThreeDViewer: React.FC<ThreeDViewerProps> = ({ frontImage, sideImage, backImage, isGenerating }) => {
    const [activeView, setActiveView] = useState<View>('front');
    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

    const views: View[] = ['front', 'side', 'back'];

    const handlePrev = () => {
        const currentIndex = views.indexOf(activeView);
        const prevIndex = (currentIndex - 1 + views.length) % views.length;
        setActiveView(views[prevIndex]);
    };

    const handleNext = () => {
        const currentIndex = views.indexOf(activeView);
        const nextIndex = (currentIndex + 1) % views.length;
        setActiveView(views[nextIndex]);
    };

    const images: Record<View, string | null> = {
        front: frontImage,
        side: sideImage,
        back: backImage,
    };

    const labels: Record<View, string> = {
        front: 'Frente',
        side: 'Perfil',
        back: 'Costas',
    }

    const currentImage = images[activeView];
    const stillGeneratingAny = isGenerating || !frontImage || !sideImage || !backImage;

    const showFeedback = (message: string) => {
        setFeedbackMessage(message);
        setTimeout(() => setFeedbackMessage(null), 3000);
    };

    const handleDownload = () => {
        if (!currentImage) return;
        const link = document.createElement('a');
        link.href = currentImage;
        link.download = `vista-3d-${activeView}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleShare = async () => {
        if (!currentImage) return;
        try {
            const imageFile = dataURLtoFile(currentImage, `vista-3d-${activeView}.png`);
            if (!imageFile) throw new Error("Não foi possível converter a imagem para arquivo.");

            if (navigator.share && navigator.canShare({ files: [imageFile] })) {
                await navigator.share({
                    title: `Vista 3D - ${labels[activeView]}`,
                    text: 'Confira esta vista 3D gerada pela Engenharia de Cortes 5D!',
                    files: [imageFile],
                });
            } else {
                const blob = await (await fetch(currentImage)).blob();
                await navigator.clipboard.write([
                    new ClipboardItem({ [blob.type]: blob })
                ]);
                showFeedback("Imagem copiada!");
            }
        } catch (err) {
            console.error("Sharing failed:", err);
            if ((err as Error).name !== 'AbortError') {
                 showFeedback('Erro ao compartilhar.');
            }
        }
    };


    return (
        <div className="flex flex-col items-center justify-center h-full p-4">
            <h3 className="text-xl font-semibold text-emerald-300 mb-4">Visualização 3D Interativa</h3>
            
            {stillGeneratingAny && !currentImage && (
                 <p className="text-sm text-amber-300 mb-4 animate-pulse">
                    Gerando as vistas 3D em segundo plano...
                 </p>
            )}

            <div className="w-full max-w-lg mb-4 relative group">
                <button
                    onClick={handlePrev}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-gray-900/50 rounded-full text-white hover:bg-emerald-600 transition-all opacity-0 group-hover:opacity-100"
                    aria-label="Vista anterior"
                >
                    <Icon name="arrow-left" className="w-6 h-6" />
                </button>
                
                {currentImage ? (
                    <ZoomableImage src={currentImage} alt={`Vista de ${labels[activeView]}`} />
                ) : (
                    <ImagePlaceholder viewName={labels[activeView].toLowerCase()} />
                )}

                <button
                    onClick={handleNext}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-10 p-2 bg-gray-900/50 rounded-full text-white hover:bg-emerald-600 transition-all opacity-0 group-hover:opacity-100"
                    aria-label="Próxima vista"
                >
                    <Icon name="arrow-right" className="w-6 h-6" />
                </button>
                 {currentImage && (
                    <div className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-gray-900/50 p-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={handleShare} className="p-1.5 text-white hover:bg-emerald-600 rounded-md" title="Compartilhar Vista">
                            <Icon name="share" className="w-5 h-5"/>
                        </button>
                        <button onClick={handleDownload} className="p-1.5 text-white hover:bg-emerald-600 rounded-md" title="Baixar Vista">
                            <Icon name="download" className="w-5 h-5"/>
                        </button>
                    </div>
                )}
                 {feedbackMessage && (
                    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-20 bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm shadow-lg animate-fadeInOut">
                        {feedbackMessage}
                    </div>
                )}
            </div>


            <div className="flex p-1 bg-gray-900 rounded-lg w-full max-w-lg">
                <ViewButton label="Frente" view="front" activeView={activeView} onClick={setActiveView} />
                <ViewButton label="Perfil" view="side" activeView={activeView} onClick={setActiveView} />
                <ViewButton label="Costas" view="back" activeView={activeView} onClick={setActiveView} />
            </div>
        </div>
    );
};
