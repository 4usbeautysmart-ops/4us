import React from 'react';
import { Icon } from './Icon';

interface SuppliesModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    textResponse: string;
    mapsData: any[];
  } | null;
}

export const SuppliesModal: React.FC<SuppliesModalProps> = ({ isOpen, onClose, data }) => {
  if (!isOpen || !data) return null;

  return (
    <div className="fixed inset-0 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl shadow-emerald-500/10" onClick={(e) => e.stopPropagation()}>
        <div className="flex-shrink-0 flex justify-between items-center pb-4 mb-4 border-b border-gray-700">
          <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-green-400">
            Fornecedores Próximos
          </h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-700">
            <Icon name="close" className="w-6 h-6 text-gray-400" />
          </button>
        </div>
        
        <div className="flex-grow overflow-y-auto pr-2 space-y-4">
            <div className="p-4 bg-gray-900/50 rounded-lg">
                <p className="text-gray-300 whitespace-pre-wrap">{data.textResponse}</p>
            </div>
            
            <h3 className="text-lg font-semibold text-emerald-300 pt-2">Lojas encontradas no Google Maps:</h3>
            
            <div className="space-y-3">
            {data.mapsData && data.mapsData.length > 0 && data.mapsData.some(chunk => chunk.maps) ? (
                data.mapsData.map((chunk, index) => (
                    chunk.maps ? (
                         <a 
                            href={chunk.maps.uri} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            key={index}
                            className="block p-4 bg-gray-700/50 rounded-lg hover:bg-gray-700 transition-colors"
                        >
                            <div className="font-semibold text-white flex items-center gap-2">
                                <Icon name="store" className="w-5 h-5 text-emerald-400"/>
                                {chunk.maps.title}
                            </div>
                            {chunk.maps.placeAnswerSources?.[0]?.reviewSnippets?.[0] && (
                                <p className="text-sm text-gray-400 mt-1 italic">"{chunk.maps.placeAnswerSources[0].reviewSnippets[0]}"</p>
                            )}
                        </a>
                    ) : null
                ))
            ) : (
                <p className="text-gray-500">Nenhum local específico foi retornado pelo mapa.</p>
            )}
            </div>
        </div>
      </div>
    </div>
  );
};
