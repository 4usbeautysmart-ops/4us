

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { ImageUploader } from './components/ImageUploader';
import { HairstylistReportDisplay } from './components/HairstylistReportDisplay';
import { ChatPanel } from './components/ChatPanel';
import { ActionButtons } from './components/ActionButtons';
import { LoadingOverlay } from './components/LoadingOverlay';
import { Icon } from './components/Icon';
import { ColoristReportDisplay } from './components/ColoristReportDisplay';
import { TutorialOverlay } from './components/TutorialOverlay';
import { SavedPlansModal } from './components/SavedPlansModal';
import { PaymentModal } from './components/PaymentModal';
import { CatalogModal } from './components/CatalogModal';
import { CameraCapture } from './components/CameraCapture';
import { SuppliesModal } from './components/SuppliesModal';
import { VisagismReportDisplay } from './components/VisagismReportDisplay';


import {
  generateHairstylistReport,
  editImageWithText,
  generateColoristReport,
  generateVideoFromImage,
  textToSpeech,
  findNearbyStores,
  generateVisagismReport,
} from './services/geminiService';
import { fileToBase64, dataURLtoFile, fileToBase64WithDataURL } from './utils/fileUtils';
import { generateHairstylistPdf, generateColoristPdf, generateVisagismPdf } from './utils/pdfGenerator';
import type { HairstylistReport, ColoristReport, SavedPlan, VisagismReport } from './types';

interface AppProps {
  onLogout: () => void;
  userProfile: any | null;
}

export default function App({ onLogout, userProfile }: AppProps) {
  const [activeTab, setActiveTab] = useState<'hairstylist' | 'colorist' | 'visagism'>('hairstylist');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  
  // Trial State
  const [trialTimeLeft, setTrialTimeLeft] = useState<string>('');
  const [isTrialExpired, setIsTrialExpired] = useState(false);

  // Hairstylist Visagista Mode State
  const [clientImageForHairstylist, setClientImageForHairstylist] = useState<File | null>(null);
  const [clientImageInputMode, setClientImageInputMode] = useState<'upload' | 'camera'>('upload');
  const [referenceImageForHairstylist, setReferenceImageForHairstylist] = useState<File | null>(null);
  const [brandForHairstylist, setBrandForHairstylist] = useState('Wella Professionals');
  const [hairstylistReport, setHairstylistReport] = useState<HairstylistReport | null>(null);
  const [realisticImage, setRealisticImage] = useState<string | null>(null); // Specific for hairstylist flow
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [clientImagePreview, setClientImagePreview] = useState<string | null>(null);
  const [referenceImagePreview, setReferenceImagePreview] = useState<string | null>(null);
  
  const [frontViewImage, setFrontViewImage] = useState<string | null>(null);
  const [sideViewImage, setSideViewImage] = useState<string | null>(null);
  const [backViewImage, setBackViewImage] = useState<string | null>(null);
  const [isGenerating3DViews, setIsGenerating3DViews] = useState(false);


  // Colorist Mode State
  const [clientImageForColor, setClientImageForColor] = useState<File | null>(null);
  const [coloristClientImageInputMode, setColoristClientImageInputMode] = useState<'upload' | 'camera'>('upload');
  const [inspirationForColor, setInspirationForColor] = useState<{ type: 'image', value: File } | { type: 'text', value: string } | null>(null);
  const [cosmeticsBrand, setCosmeticsBrand] = useState('Wella Professionals');
  const [coloristReport, setColoristReport] = useState<{ report: ColoristReport, tryOnImage: string } | null>(null);
  const [clientImageForColorPreview, setClientImageForColorPreview] = useState<string | null>(null);
  const [inspirationImagePreview, setInspirationImagePreview] = useState<string | null>(null);

  // Visagismo 360° State
  const [clientImageForVisagism, setClientImageForVisagism] = useState<File | null>(null);
  const [visagismClientImageInputMode, setVisagismClientImageInputMode] = useState<'upload' | 'camera'>('upload');
  const [visagismReport, setVisagismReport] = useState<VisagismReport | null>(null);
  const [clientImageForVisagismPreview, setClientImageForVisagismPreview] = useState<string | null>(null);

  // Generic state for actions
  const [resultImage, setResultImage] = useState<string | null>(null); // Holds the main result image for any tab
  const [imageFilterClass, setImageFilterClass] = useState('filter-original');


  // Modals & Overlays
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [tutorialType, setTutorialType] = useState<'analyze' | 'color-expert' | 'visagism' | null>(null);
  const [isSavedPlansOpen, setIsSavedPlansOpen] = useState(false);
  const [savedPlans, setSavedPlans] = useState<SavedPlan[]>([]);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isCatalogOpen, setIsCatalogOpen] = useState(false);
  const [suppliesData, setSuppliesData] = useState<any | null>(null);
  const [isSuppliesModalOpen, setIsSuppliesModalOpen] = useState(false);

  // Generic App State
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // History for Undo/Redo
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const updateHistory = (newImage: string) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newImage);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const resetHistory = (initialImage?: string) => {
      if (initialImage) {
          setHistory([initialImage]);
          setHistoryIndex(0);
      } else {
          setHistory([]);
          setHistoryIndex(-1);
      }
  };
  
  useEffect(() => {
    if (userProfile && !userProfile.isPremium && userProfile.trialStartedAt) {
      const trialDuration = 48 * 60 * 60 * 1000; // 48 hours

      const intervalId = setInterval(() => {
        const trialStartDate = userProfile.trialStartedAt.toDate();
        const trialEndDate = new Date(trialStartDate.getTime() + trialDuration);
        const now = new Date();
        const timeLeftMs = trialEndDate.getTime() - now.getTime();

        if (timeLeftMs <= 0) {
          setTrialTimeLeft('00:00:00');
          setIsTrialExpired(true);
          clearInterval(intervalId); // Stop the timer when it's done
        } else {
          const hours = Math.floor(timeLeftMs / (1000 * 60 * 60));
          const minutes = Math.floor((timeLeftMs % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((timeLeftMs % (1000 * 60)) / 1000);
          
          setTrialTimeLeft(
            `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
          );
          setIsTrialExpired(false);
        }
      }, 1000);

      // Perform an initial calculation immediately to set state correctly on load
      const trialStartDate = userProfile.trialStartedAt.toDate();
      const trialEndDate = new Date(trialStartDate.getTime() + trialDuration);
      const now = new Date();
      if (trialEndDate.getTime() - now.getTime() <= 0) {
        setTrialTimeLeft('00:00:00');
        setIsTrialExpired(true);
        clearInterval(intervalId);
      }

      return () => clearInterval(intervalId);
    }
  }, [userProfile]);
  
  // Show payment modal when trial expires
  useEffect(() => {
    if (isTrialExpired) {
      setIsPaymentModalOpen(true);
    }
  }, [isTrialExpired]);

  // --- Handlers for Image Uploads ---
  const handleClientImageChange = useCallback(async (file: File) => {
    setClientImageForHairstylist(file);
    setClientImagePreview(await fileToBase64WithDataURL(file));
  }, []);

  const handleReferenceImageChange = useCallback(async (file: File) => {
    setReferenceImageForHairstylist(file);
    setReferenceImagePreview(await fileToBase64WithDataURL(file));
  }, []);

  const handleClientImageForColorChange = useCallback(async (file: File) => {
    setClientImageForColor(file);
    setClientImageForColorPreview(await fileToBase64WithDataURL(file));
  }, []);

  const handleInspirationImageChange = useCallback(async (file: File) => {
    setInspirationForColor({ type: 'image', value: file });
    setInspirationImagePreview(await fileToBase64WithDataURL(file));
  }, []);
  
  const handleClientImageForVisagismChange = useCallback(async (file: File) => {
    setClientImageForVisagism(file);
    setClientImageForVisagismPreview(await fileToBase64WithDataURL(file));
  }, []);
  
  const handleInspirationTextSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const text = formData.get('inspirationText') as string;
    if (text.trim()) {
      setInspirationForColor({ type: 'text', value: text.trim() });
    }
  };


  // --- Report Generation Handlers ---
  const handleGenerateHairstylistReport = async () => {
    if (!clientImageForHairstylist || !referenceImageForHairstylist) {
      alert("Por favor, envie a foto da cliente e a foto de referência.");
      return;
    }
    setIsLoading(true);
    setLoadingMessage("Analisando visagismo e criando plano de corte...");
    setRealisticImage(null);
    setHairstylistReport(null);
    setFrontViewImage(null);
    setSideViewImage(null);
    setBackViewImage(null);
    setVideoUrl(null);
    resetHistory();

    try {
      const report = await generateHairstylistReport(clientImageForHairstylist, referenceImageForHairstylist, brandForHairstylist);
      setHairstylistReport(report);
      setLoadingMessage("Criando simulação de imagem realista...");
      
      const clientImageBase64 = await fileToBase64WithDataURL(clientImageForHairstylist);
      const realisticResult = await editImageWithText(clientImageBase64, report.cuttingPlan.detailedPrompt);
      setRealisticImage(realisticResult);
      setResultImage(realisticResult); // Set generic result image for actions
      resetHistory(realisticResult); // Initialize history
      
      // Start generating 3D views in the background
      setIsGenerating3DViews(true);
      editImageWithText(clientImageBase64, report.cuttingPlan.threeDViews.frontPrompt).then(setFrontViewImage);
      editImageWithText(clientImageBase64, report.cuttingPlan.threeDViews.sidePrompt).then(setSideViewImage);
      editImageWithText(clientImageBase64, report.cuttingPlan.threeDViews.backPrompt).then(setBackViewImage).finally(() => setIsGenerating3DViews(false));

    } catch (error) {
      console.error(error);
      alert(`Ocorreu um erro ao gerar o relatório: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
      setLoadingMessage('');
    }
  };

  const handleGenerateColoristReport = async () => {
    if (!clientImageForColor || !inspirationForColor) {
        alert("Por favor, envie a foto da cliente e forneça uma inspiração (imagem ou texto).");
        return;
    }
    setIsLoading(true);
    setLoadingMessage("Analisando colorimetria e montando o plano...");
    setColoristReport(null);
    resetHistory();
    try {
        const result = await generateColoristReport(clientImageForColor, inspirationForColor, cosmeticsBrand);
        setColoristReport(result);
        setResultImage(result.tryOnImage); // Set generic result image for actions
        resetHistory(result.tryOnImage); // Initialize history
    } catch (error) {
        console.error("Error generating colorist report:", error);
        alert(`Ocorreu um erro ao gerar o relatório de colorimetria: ${(error as Error).message}`);
    } finally {
        setIsLoading(false);
        setLoadingMessage('');
    }
  };

  const handleGenerateVisagismReport = async () => {
    if (!clientImageForVisagism) {
        alert("Por favor, envie a foto da cliente para a análise.");
        return;
    }
    setIsLoading(true);
    setLoadingMessage("Realizando consultoria de visagismo 360°...");
    setVisagismReport(null);
    resetHistory();
    try {
        const report = await generateVisagismReport(clientImageForVisagism);
        setVisagismReport(report);
        const clientImageBase64 = await fileToBase64WithDataURL(clientImageForVisagism);
        setResultImage(clientImageBase64); // The result image is the client's own image
    } catch (error) {
        console.error("Error generating visagism report:", error);
        alert(`Ocorreu um erro ao gerar o relatório de visagismo: ${(error as Error).message}`);
    } finally {
        setIsLoading(false);
        setLoadingMessage('');
    }
  };

  // --- Action Button Handlers ---
  const handleEditResultImage = async (prompt: string) => {
    const baseImage = resultImage || (activeTab === 'hairstylist' ? realisticImage : null);
    if (!baseImage) {
        alert("Nenhuma imagem de resultado para editar.");
        return;
    }
    setIsLoading(true);
    setLoadingMessage("Editando imagem com sua instrução...");
    try {