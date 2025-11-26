import React, { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';

interface TrialStatusPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  timeLeft: string;
  onUpgradeClick: () => void;
  anchorEl: HTMLElement | null;
}

export const TrialStatusPopover: React.FC<TrialStatusPopoverProps> = ({
  isOpen,
  onClose,
  timeLeft,
  onUpgradeClick,
  anchorEl,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  useEffect(() => {
    const calculatePosition = () => {
      if (!anchorEl || !popoverRef.current) return;

      const anchorRect = anchorEl.getBoundingClientRect();
      const popoverRect = popoverRef.current.getBoundingClientRect();

      let top = anchorRect.bottom + 12; // 12px gap below anchor
      let left = anchorRect.left + anchorRect.width / 2 - popoverRect.width / 2;

      // Ensure it doesn't go off-screen
      if (left < 10) left = 10;
      if (left + popoverRect.width > window.innerWidth - 10) {
        left = window.innerWidth - popoverRect.width - 10;
      }

      setPosition({ top, left });
    };

    if (isOpen) {
      // Calculate position on the next frame to ensure the popover is rendered and has dimensions
      requestAnimationFrame(calculatePosition);
      window.addEventListener('resize', calculatePosition);
    }

    return () => {
      window.removeEventListener('resize', calculatePosition);
    };
  }, [isOpen, anchorEl]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        anchorEl &&
        !anchorEl.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, anchorEl]);
  
  const premiumFeatures = [
    "Análises de corte e cor ilimitadas",
    "Salvar até 100 planos de corte",
    "Visualização 3D interativa avançada",
    "Exportação de PDF em alta resolução",
  ];

  if (!isOpen) return null;

  return (
    <div
      ref={popoverRef}
      className="fixed z-20 w-80 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl shadow-emerald-500/10 text-white animate-fadeIn"
      style={{ top: `${position.top}px`, left: `${position.left}px`, opacity: position.top === 0 ? 0 : 1 }}
    >
        {/* Arrow */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-2 w-4 h-4 bg-gray-800 border-l border-t border-gray-700 rotate-45"></div>
        
        <div className="p-6">
            <div className="text-center mb-4">
                <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-300 to-green-400">
                    Seu Período de Teste
                </h3>
                <p className="text-gray-400 text-sm">Aproveite o acesso completo por 48 horas!</p>
            </div>
            
            <div className="text-center bg-gray-900/50 p-4 rounded-lg mb-6">
                <p className="text-sm text-amber-300">Tempo Restante:</p>
                <p className="text-4xl font-mono font-bold text-amber-300">{timeLeft}</p>
            </div>

            <div className="space-y-3 mb-6">
                 {premiumFeatures.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3">
                        <div className="bg-emerald-600/20 p-1 rounded-full flex-shrink-0">
                            <Icon name="check" className="w-4 h-4 text-emerald-300" />
                        </div>
                        <span className="text-gray-200 text-sm">{feature}</span>
                    </div>
                ))}
            </div>

            <button
                onClick={onUpgradeClick}
                className="w-full bg-amber-500 text-white rounded-lg font-bold text-center py-3 hover:bg-amber-400 transition-colors flex items-center justify-center gap-2"
            >
                <Icon name="credit-card" className="w-5 h-5" />
                Seja Premium Agora
            </button>
        </div>
    </div>
  );
};
