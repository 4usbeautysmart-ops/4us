
import React, { useState, useRef } from 'react';
import { Icon } from './Icon';
import { Logo } from './Logo';
import { TrialStatusPopover } from './TrialStatusPopover';

interface HeaderProps {
    onShowSavedPlans: () => void;
    onOpenPaymentModal: () => void;
    onStartTutorial: () => void;
    onToggleFullscreen: () => void;
    isFullscreen: boolean;
    onRestartProject: () => void;
    onUndo: () => void;
    onRedo: () => void;
    canUndo: boolean;
    canRedo: boolean;
    onLogout: () => void;
    isTrialActive: boolean;
    trialTimeLeft: string;
}

export const Header: React.FC<HeaderProps> = ({ 
    onShowSavedPlans, 
    onOpenPaymentModal,
    onStartTutorial, 
    onToggleFullscreen, 
    isFullscreen,
    onRestartProject,
    onUndo,
    onRedo,
    canUndo,
    canRedo,
    onLogout,
    isTrialActive,
    trialTimeLeft
}) => {
  const [isTrialPopoverOpen, setIsTrialPopoverOpen] = useState(false);
  const trialTimerRef = useRef<HTMLDivElement>(null);

  const handleToggleTrialPopover = () => {
    setIsTrialPopoverOpen(prev => !prev);
  };

  const handleUpgradeClick = () => {
    setIsTrialPopoverOpen(false);
    onOpenPaymentModal();
  };

  return (
    <>
      <header className="p-4 bg-gray-900/80 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-10">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-2 md:gap-4">
          <div className="flex items-center gap-4">
            <Logo className="w-12 h-12" />
            <h1 className="text-2xl font-light tracking-wider text-center md:text-left">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-500">Engenharia de Cortes 5D</span>
            </h1>
          </div>
          <div className="flex items-center gap-2 md:gap-4 flex-wrap justify-center">
              <div className="flex items-center gap-2">
                   <button
                      onClick={onRestartProject}
                      className="p-2 bg-gray-700/80 rounded-lg text-gray-200 hover:bg-red-600 transition-colors"
                      title="Recomeçar Projeto"
                  >
                      <Icon name="refresh" className="w-5 h-5" />
                  </button>
                  <button
                  onClick={onUndo}
                  disabled={!canUndo}
                  className="p-2 bg-gray-700/80 rounded-lg text-gray-200 hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-700/80"
                  title="Desfazer (Ctrl+Z)"
                  >
                  <Icon name="undo" className="w-5 h-5" />
                  </button>
                  <button
                  onClick={onRedo}
                  disabled={!canRedo}
                  className="p-2 bg-gray-700/80 rounded-lg text-gray-200 hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-700/80"
                  title="Refazer (Ctrl+Y)"
                  >
                  <Icon name="redo" className="w-5 h-5" />
                  </button>
              </div>
              <div className="w-px h-8 bg-gray-700 hidden md:block"></div>
              <button 
                onClick={onToggleFullscreen}
                className="flex items-center gap-2 px-3 py-2 bg-gray-700/80 rounded-lg text-sm font-medium text-gray-200 hover:bg-emerald-600 transition-colors"
                title={isFullscreen ? 'Sair da Tela Cheia' : 'Expandir Tela'}
              >
                <Icon name={isFullscreen ? 'compress' : 'expand'} className="w-5 h-5" />
                <span className="hidden md:inline">{isFullscreen ? 'Restaurar' : 'Expandir'}</span>
              </button>
              <button 
                id="header-help-button"
                onClick={onStartTutorial}
                className="flex items-center gap-2 px-3 py-2 bg-gray-700/80 rounded-lg text-sm font-medium text-gray-200 hover:bg-emerald-600 transition-colors"
                title="Ajuda"
              >
                <Icon name="help" className="w-5 h-5" />
                <span className="hidden md:inline">Ajuda</span>
              </button>
              <button 
                id="header-saved-plans-button"
                onClick={onShowSavedPlans}
                className="flex items-center gap-2 px-3 py-2 bg-gray-700/80 rounded-lg text-sm font-medium text-gray-200 hover:bg-emerald-600 transition-colors"
                title="Planos Salvos"
              >
                <Icon name="save" className="w-5 h-5" />
                <span className="hidden md:inline">Planos Salvos</span>
              </button>
              {isTrialActive && (
                <div 
                  ref={trialTimerRef}
                  onClick={handleToggleTrialPopover}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-700/80 rounded-lg text-sm cursor-pointer hover:bg-gray-700 transition-colors" 
                  title="Clique para ver detalhes do seu teste gratuito"
                >
                  <Icon name="timer" className="w-5 h-5 text-amber-300 animate-pulse"/> 
                  <span className="text-amber-300 font-mono font-semibold">{trialTimeLeft}</span>
                </div>
              )}
              <button 
                onClick={onOpenPaymentModal}
                className="flex items-center gap-2 px-3 py-2 bg-amber-500/80 rounded-lg text-sm font-bold text-white hover:bg-amber-500 transition-colors shadow-md shadow-amber-500/20"
                title="Seja Premium"
              >
                <Icon name="credit-card" className="w-5 h-5" />
                <span className="hidden md:inline">Seja Premium</span>
              </button>
              <button 
                onClick={onLogout}
                className="flex items-center gap-2 px-3 py-2 bg-gray-700/80 rounded-lg text-sm font-medium text-gray-200 hover:bg-red-600 transition-colors"
                title="Sair"
              >
                <Icon name="logout" className="w-5 h-5" />
                <span className="hidden md:inline">Sair</span>
              </button>
          </div>
        </div>
      </header>

      <TrialStatusPopover 
        isOpen={isTrialPopoverOpen}
        onClose={() => setIsTrialPopoverOpen(false)}
        timeLeft={trialTimeLeft}
        onUpgradeClick={handleUpgradeClick}
        anchorEl={trialTimerRef.current}
      />
    </>
  );
};