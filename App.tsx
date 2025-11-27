import React, { useState, useEffect, useCallback } from "react";
import { Header } from "./components/Header";
import { ImageUploader } from "./components/ImageUploader";
import { HairstylistReportDisplay } from "./components/HairstylistReportDisplay";
import { ChatPanel } from "./components/ChatPanel";
import { ActionButtons } from "./components/ActionButtons";
import { LoadingOverlay } from "./components/LoadingOverlay";
import { Icon } from "./components/Icon";
import { ColoristReportDisplay } from "./components/ColoristReportDisplay";
import { TutorialOverlay } from "./components/TutorialOverlay";
import { SavedPlansModal } from "./components/SavedPlansModal";
import { PaymentModal } from "./components/PaymentModal";
import { CatalogModal } from "./components/CatalogModal";
import { CameraCapture } from "./components/CameraCapture";
import { SuppliesModal } from "./components/SuppliesModal";
import { VisagismReportDisplay } from "./components/VisagismReportDisplay";

import {
  generateHairstylistReport,
  editImageWithText,
  generateColoristReport,
  generateVideoFromImage,
  textToSpeech,
  findNearbyStores,
  generateVisagismReport,
} from "./services/geminiService";
import {
  fileToBase64,
  dataURLtoFile,
  fileToBase64WithDataURL,
} from "./utils/fileUtils";
import {
  generateHairstylistPdf,
  generateColoristPdf,
  generateVisagismPdf,
} from "./utils/pdfGenerator";
import type {
  HairstylistReport,
  ColoristReport,
  SavedPlan,
  VisagismReport,
} from "./types";

interface AppProps {
  onLogout: () => void;
  userProfile: any | null;
}

export default function App({ onLogout, userProfile }: AppProps) {
  const [activeTab, setActiveTab] = useState<
    "hairstylist" | "colorist" | "visagism"
  >("hairstylist");
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");

  // Trial State
  const [trialTimeLeft, setTrialTimeLeft] = useState<string>("");
  const [isTrialExpired, setIsTrialExpired] = useState(false);

  // Hairstylist Visagista Mode State
  const [clientImageForHairstylist, setClientImageForHairstylist] =
    useState<File | null>(null);
  const [clientImageInputMode, setClientImageInputMode] = useState<
    "upload" | "camera"
  >("upload");
  const [referenceImageForHairstylist, setReferenceImageForHairstylist] =
    useState<File | null>(null);
  const [brandForHairstylist, setBrandForHairstylist] = useState(
    "Wella Professionals"
  );
  const [hairstylistReport, setHairstylistReport] =
    useState<HairstylistReport | null>(null);
  const [realisticImage, setRealisticImage] = useState<string | null>(null); // Specific for hairstylist flow
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [clientImagePreview, setClientImagePreview] = useState<string | null>(
    null
  );
  const [referenceImagePreview, setReferenceImagePreview] = useState<
    string | null
  >(null);

  const [frontViewImage, setFrontViewImage] = useState<string | null>(null);
  const [sideViewImage, setSideViewImage] = useState<string | null>(null);
  const [backViewImage, setBackViewImage] = useState<string | null>(null);
  const [isGenerating3DViews, setIsGenerating3DViews] = useState(false);

  // Colorist Mode State
  const [clientImageForColor, setClientImageForColor] = useState<File | null>(
    null
  );
  const [coloristClientImageInputMode, setColoristClientImageInputMode] =
    useState<"upload" | "camera">("upload");
  const [inspirationForColor, setInspirationForColor] = useState<
    { type: "image"; value: File } | { type: "text"; value: string } | null
  >(null);
  const [cosmeticsBrand, setCosmeticsBrand] = useState("Wella Professionals");
  const [coloristReport, setColoristReport] = useState<{
    report: ColoristReport;
    tryOnImage: string;
  } | null>(null);
  const [clientImageForColorPreview, setClientImageForColorPreview] = useState<
    string | null
  >(null);
  const [inspirationImagePreview, setInspirationImagePreview] = useState<
    string | null
  >(null);

  // Visagismo 360° State
  const [clientImageForVisagism, setClientImageForVisagism] =
    useState<File | null>(null);
  const [visagismClientImageInputMode, setVisagismClientImageInputMode] =
    useState<"upload" | "camera">("upload");
  const [visagismReport, setVisagismReport] = useState<VisagismReport | null>(
    null
  );
  const [clientImageForVisagismPreview, setClientImageForVisagismPreview] =
    useState<string | null>(null);

  // Generic state for actions
  const [resultImage, setResultImage] = useState<string | null>(null); // Holds the main result image for any tab
  const [imageFilterClass, setImageFilterClass] = useState("filter-original");

  // Modals & Overlays
  const [isTutorialOpen, setIsTutorialOpen] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [tutorialType, setTutorialType] = useState<
    "analyze" | "color-expert" | "visagism" | null
  >(null);
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
          setTrialTimeLeft("00:00:00");
          setIsTrialExpired(true);
          clearInterval(intervalId); // Stop the timer when it's done
        } else {
          const hours = Math.floor(timeLeftMs / (1000 * 60 * 60));
          const minutes = Math.floor(
            (timeLeftMs % (1000 * 60 * 60)) / (1000 * 60)
          );
          const seconds = Math.floor((timeLeftMs % (1000 * 60)) / 1000);

          setTrialTimeLeft(
            `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
              2,
              "0"
            )}:${String(seconds).padStart(2, "0")}`
          );
          setIsTrialExpired(false);
        }
      }, 1000);

      // Perform an initial calculation immediately to set state correctly on load
      const trialStartDate = userProfile.trialStartedAt.toDate();
      const trialEndDate = new Date(trialStartDate.getTime() + trialDuration);
      const now = new Date();
      if (trialEndDate.getTime() - now.getTime() <= 0) {
        setTrialTimeLeft("00:00:00");
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
    setInspirationForColor({ type: "image", value: file });
    setInspirationImagePreview(await fileToBase64WithDataURL(file));
  }, []);

  const handleClientImageForVisagismChange = useCallback(async (file: File) => {
    setClientImageForVisagism(file);
    setClientImageForVisagismPreview(await fileToBase64WithDataURL(file));
  }, []);

  const handleInspirationTextSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const text = formData.get("inspirationText") as string;
    if (text.trim()) {
      setInspirationForColor({ type: "text", value: text.trim() });
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
      const report = await generateHairstylistReport(
        clientImageForHairstylist,
        referenceImageForHairstylist,
        brandForHairstylist
      );
      setHairstylistReport(report);
      setLoadingMessage("Criando simulação de imagem realista...");

      const clientImageBase64 = await fileToBase64WithDataURL(
        clientImageForHairstylist
      );
      const realisticResult = await editImageWithText(
        clientImageBase64,
        report.cuttingPlan.detailedPrompt
      );
      setRealisticImage(realisticResult);
      setResultImage(realisticResult); // Set generic result image for actions
      resetHistory(realisticResult); // Initialize history

      // Start generating 3D views in the background
      setIsGenerating3DViews(true);
      editImageWithText(
        clientImageBase64,
        report.cuttingPlan.threeDViews.frontPrompt
      ).then(setFrontViewImage);
      editImageWithText(
        clientImageBase64,
        report.cuttingPlan.threeDViews.sidePrompt
      ).then(setSideViewImage);
      editImageWithText(
        clientImageBase64,
        report.cuttingPlan.threeDViews.backPrompt
      )
        .then(setBackViewImage)
        .finally(() => setIsGenerating3DViews(false));
    } catch (error) {
      console.error(error);
      alert(
        `Ocorreu um erro ao gerar o relatório: ${(error as Error).message}`
      );
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  const handleGenerateColoristReport = async () => {
    if (!clientImageForColor || !inspirationForColor) {
      alert(
        "Por favor, envie a foto da cliente e forneça uma inspiração (imagem ou texto)."
      );
      return;
    }
    setIsLoading(true);
    setLoadingMessage("Analisando colorimetria e montando o plano...");
    setColoristReport(null);
    resetHistory();
    try {
      const result = await generateColoristReport(
        clientImageForColor,
        inspirationForColor,
        cosmeticsBrand
      );
      setColoristReport(result);
      setResultImage(result.tryOnImage); // Set generic result image for actions
      resetHistory(result.tryOnImage); // Initialize history
    } catch (error) {
      console.error("Error generating colorist report:", error);
      alert(
        `Ocorreu um erro ao gerar o relatório de colorimetria: ${
          (error as Error).message
        }`
      );
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
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
      const clientImageBase64 = await fileToBase64WithDataURL(
        clientImageForVisagism
      );
      setResultImage(clientImageBase64); // The result image is the client's own image
    } catch (error) {
      console.error("Error generating visagism report:", error);
      alert(
        `Ocorreu um erro ao gerar o relatório de visagismo: ${
          (error as Error).message
        }`
      );
    } finally {
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  // --- Action Button Handlers ---
  const handleEditResultImage = async (prompt: string) => {
    const baseImage =
      resultImage || (activeTab === "hairstylist" ? realisticImage : null);
    if (!baseImage) {
      alert("Nenhuma imagem de resultado para editar.");
      return;
    }
    setIsLoading(true);
    setLoadingMessage("Editando imagem com sua instrução...");
    try {
      const editedImage = await editImageWithText(baseImage, prompt);
      setRealisticImage(editedImage);
      setResultImage(editedImage);
      if (coloristReport) {
        setColoristReport((prev) =>
          prev ? { ...prev, tryOnImage: editedImage } : null
        );
      }
    } catch (error) {
      console.error("Image edit error:", error);
      alert(`Não foi possível editar a imagem: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnimateImage = async (prompt: string) => {
    if (!prompt || !prompt.trim()) {
      alert("Por favor, forneça uma instrução para a animação.");
      return;
    }

    const imageFile =
      activeTab === "hairstylist" && realisticImage
        ? dataURLtoFile(realisticImage, "result.png")
        : activeTab === "colorist" && coloristReport?.tryOnImage
        ? dataURLtoFile(coloristReport.tryOnImage, "result.png")
        : null;

    if (!imageFile) {
      alert("Nenhuma imagem de resultado para animar.");
      return;
    }

    setIsLoading(true);
    setLoadingMessage(
      "Gerando animação com Veo... Isso pode levar alguns minutos."
    );
    try {
      const generatedVideoUrl = await generateVideoFromImage(imageFile, prompt);
      setVideoUrl(generatedVideoUrl);
    } catch (error) {
      console.error("Video generation error:", error);
      alert(`Erro ao gerar vídeo: ${(error as Error).message}`);
      if ((error as Error).message.includes("API Key not found or invalid")) {
        setIsPaymentModalOpen(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleTextToSpeech = async () => {
    let textToRead = "";
    if (activeTab === "hairstylist" && hairstylistReport) {
      textToRead = `Plano de corte para ${
        hairstylistReport.cuttingPlan.styleName
      }. ${hairstylistReport.cuttingPlan.steps.join(". ")}`;
    } else if (activeTab === "colorist" && coloristReport) {
      textToRead = `Plano de coloração. Técnica: ${
        coloristReport.report.mechasTechnique.name
      }. ${coloristReport.report.applicationSteps.mechas.join(". ")}`;
    }
    if (!textToRead) {
      alert("Nenhum plano para ler em voz alta.");
      return;
    }
    setIsLoading(true);
    setLoadingMessage("Gerando áudio...");
    try {
      await textToSpeech(textToRead);
    } catch (error) {
      console.error("TTS Error:", error);
      alert("Não foi possível gerar o áudio.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFindSupplies = async () => {
    setIsLoading(true);
    setLoadingMessage("Buscando fornecedores próximos...");
    try {
      const query =
        "Lojas de cosméticos e produtos para cabeleireiros perto de mim";
      const data = await findNearbyStores(query);
      setSuppliesData(data);
      setIsSuppliesModalOpen(true);
    } catch (error) {
      console.error("Find supplies error:", error);
      alert("Não foi possível buscar fornecedores.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPdf = async () => {
    setIsLoading(true);
    setLoadingMessage("Gerando PDF...");
    try {
      if (
        activeTab === "hairstylist" &&
        hairstylistReport &&
        clientImagePreview &&
        referenceImagePreview
      ) {
        await generateHairstylistPdf(
          hairstylistReport,
          clientImagePreview,
          referenceImagePreview,
          realisticImage
        );
      } else if (
        activeTab === "colorist" &&
        coloristReport &&
        clientImageForColorPreview
      ) {
        const blob = await generateColoristPdf(
          coloristReport,
          clientImageForColorPreview
        );
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
      } else if (
        activeTab === "visagism" &&
        visagismReport &&
        clientImageForVisagismPreview
      ) {
        const blob = await generateVisagismPdf(
          visagismReport,
          clientImageForVisagismPreview
        );
        const url = URL.createObjectURL(blob);
        window.open(url, "_blank");
      } else {
        alert("Nenhum relatório completo para gerar PDF.");
      }
    } catch (e) {
      console.error("PDF Generation failed", e);
      alert("Ocorreu um erro ao gerar o PDF.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectFromCatalog = async (
    imageUrl: string,
    imageName: string
  ) => {
    setIsLoading(true);
    setLoadingMessage("Carregando imagem do catálogo...");
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) throw new Error("Network response was not ok.");
      const blob = await response.blob();
      const file = new File(
        [blob],
        `${imageName.replace(/\s+/g, "_") || "catalog_image"}.jpg`,
        { type: blob.type }
      );

      if (activeTab === "hairstylist") {
        await handleReferenceImageChange(file);
      } else if (activeTab === "colorist") {
        await handleInspirationImageChange(file);
      }
    } catch (error) {
      console.error("Failed to fetch image from catalog:", error);
      alert(
        `Não foi possível carregar a imagem do catálogo: ${
          (error as Error).message
        }`
      );
    } finally {
      setIsCatalogOpen(false);
      setIsLoading(false);
      setLoadingMessage("");
    }
  };

  const handleResetHairstylist = () => {
    setClientImageForHairstylist(null);
    setReferenceImageForHairstylist(null);
    setHairstylistReport(null);
    setRealisticImage(null);
    setClientImagePreview(null);
    setReferenceImagePreview(null);
    setVideoUrl(null);
    setFrontViewImage(null);
    setSideViewImage(null);
    setBackViewImage(null);
  };

  const handleResetColorist = () => {
    setClientImageForColor(null);
    setInspirationForColor(null);
    setColoristReport(null);
    setClientImageForColorPreview(null);
    setInspirationImagePreview(null);
  };

  const handleResetVisagism = () => {
    setClientImageForVisagism(null);
    setVisagismReport(null);
    setClientImageForVisagismPreview(null);
  };

  const isAnyReportActive =
    !!hairstylistReport || !!coloristReport || !!visagismReport;

  // --- RENDER ---
  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col">
      {isLoading && <LoadingOverlay message={loadingMessage} />}
      {isTutorialOpen && (
        <TutorialOverlay
          step={tutorialStep}
          onNext={() => setTutorialStep((s) => s + 1)}
          onSkip={() => setIsTutorialOpen(false)}
          tutorialType={tutorialType}
        />
      )}

      <Header
        onShowSavedPlans={() => setIsSavedPlansOpen(true)}
        onOpenPaymentModal={() => setIsPaymentModalOpen(true)}
        onStartTutorial={() => {
          if (activeTab === "colorist") setTutorialType("color-expert");
          else if (activeTab === "visagism") setTutorialType("visagism");
          else setTutorialType("analyze");
          setTutorialStep(0);
          setIsTutorialOpen(true);
        }}
        onToggleFullscreen={() => {}}
        isFullscreen={isFullscreen}
        onRestartProject={() => {}}
        onUndo={() => {}}
        onRedo={() => {}}
        canUndo={canUndo}
        canRedo={canRedo}
        onLogout={onLogout}
        isTrialActive={!userProfile?.isPremium}
        trialTimeLeft={trialTimeLeft}
      />

      <main className="flex-grow flex flex-col lg:flex-row p-2 sm:p-4 gap-4">
        {/* Main Content Area */}
        <div className="flex-grow flex flex-col gap-4">
          <div className="flex-shrink-0 flex items-center justify-center p-1 bg-gray-800 rounded-lg shadow-md">
            {/* Tab buttons */}
            <button
              onClick={() => setActiveTab("hairstylist")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                activeTab === "hairstylist"
                  ? "bg-emerald-600 text-white"
                  : "text-gray-300 hover:bg-gray-600"
              }`}
            >
              <Icon name="scissors" className="w-5 h-5" /> Hairstylist Visagista
            </button>
            <button
              onClick={() => setActiveTab("colorist")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                activeTab === "colorist"
                  ? "bg-emerald-600 text-white"
                  : "text-gray-300 hover:bg-gray-600"
              }`}
            >
              <Icon name="color-palette" className="w-5 h-5" /> Colorista Expert
            </button>
            <button
              onClick={() => setActiveTab("visagism")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 text-sm font-medium rounded-md transition-colors ${
                activeTab === "visagism"
                  ? "bg-emerald-600 text-white"
                  : "text-gray-300 hover:bg-gray-600"
              }`}
            >
              <Icon name="consultant" className="w-5 h-5" /> Visagismo 360°
            </button>
          </div>

          <div className="flex-grow bg-gray-800/50 rounded-2xl p-4 min-h-[400px]">
            {/* Hairstylist Tab Content */}
            {activeTab === "hairstylist" &&
              (hairstylistReport ? (
                <HairstylistReportDisplay
                  report={hairstylistReport}
                  clientImage={clientImagePreview}
                  referenceImage={referenceImagePreview}
                  realisticImage={realisticImage}
                  videoUrl={videoUrl}
                  imageFilterClass={imageFilterClass}
                  frontViewImage={frontViewImage}
                  sideViewImage={sideViewImage}
                  backViewImage={backViewImage}
                  isGenerating3DViews={isGenerating3DViews}
                  onClose={handleResetHairstylist}
                />
              ) : (
                <div className="flex flex-col h-full">
                  <div
                    id="image-uploader-container"
                    className="flex flex-col md:flex-row gap-6 flex-grow"
                  >
                    <div className="bg-gray-800 p-4 rounded-xl flex-grow flex flex-col">
                      <h3 className="text-lg font-semibold mb-2 text-center">
                        1. Foto da Cliente
                      </h3>
                      {clientImagePreview ? (
                        <div className="relative group flex-grow">
                          <img
                            src={clientImagePreview}
                            alt="Cliente"
                            className="w-full h-full object-contain rounded-md"
                          />
                          <button
                            onClick={() => {
                              setClientImageForHairstylist(null);
                              setClientImagePreview(null);
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-gray-900/50 rounded-full text-white hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Icon name="close" className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex-grow flex flex-col">
                          <div className="p-1 bg-gray-900 rounded-lg flex mb-2">
                            <button
                              onClick={() => setClientImageInputMode("upload")}
                              className={`flex-1 text-xs py-1 rounded ${
                                clientImageInputMode === "upload"
                                  ? "bg-emerald-600"
                                  : "bg-gray-700"
                              }`}
                            >
                              Upload
                            </button>
                            <button
                              onClick={() => setClientImageInputMode("camera")}
                              className={`flex-1 text-xs py-1 rounded ${
                                clientImageInputMode === "camera"
                                  ? "bg-emerald-600"
                                  : "bg-gray-700"
                              }`}
                            >
                              Câmera
                            </button>
                          </div>
                          {clientImageInputMode === "upload" ? (
                            <ImageUploader
                              id="client-image-hairstylist"
                              onImageUpload={handleClientImageChange}
                            />
                          ) : (
                            <CameraCapture
                              onImageCapture={handleClientImageChange}
                            />
                          )}
                        </div>
                      )}
                    </div>
                    <div className="bg-gray-800 p-4 rounded-xl flex-grow flex flex-col">
                      <h3 className="text-lg font-semibold mb-2 text-center">
                        2. Foto de Referência
                      </h3>
                      {referenceImagePreview ? (
                        <div className="relative group flex-grow">
                          <img
                            src={referenceImagePreview}
                            alt="Referência"
                            className="w-full h-full object-contain rounded-md"
                          />
                          <button
                            onClick={() => {
                              setReferenceImageForHairstylist(null);
                              setReferenceImagePreview(null);
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-gray-900/50 rounded-full text-white hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Icon name="close" className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex-grow flex flex-col gap-4">
                          <ImageUploader
                            id="reference-image-hairstylist"
                            onImageUpload={handleReferenceImageChange}
                          />
                          <button
                            onClick={() => setIsCatalogOpen(true)}
                            className="w-full py-2 px-4 bg-gray-700 text-white rounded-md font-medium hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
                          >
                            <Icon name="grid" className="w-5 h-5" />
                            Buscar no Catálogo
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex-shrink-0">
                    <button
                      onClick={handleGenerateHairstylistReport}
                      disabled={
                        !clientImageForHairstylist ||
                        !referenceImageForHairstylist
                      }
                      className="w-full py-3 px-4 bg-emerald-600 text-white rounded-lg font-bold text-center hover:bg-emerald-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      <Icon name="magic" className="w-6 h-6" /> Gerar Análise 5D
                    </button>
                  </div>
                </div>
              ))}

            {/* Colorist Tab Content */}
            {activeTab === "colorist" &&
              (coloristReport ? (
                <ColoristReportDisplay
                  reportData={coloristReport}
                  clientImage={clientImageForColorPreview!}
                  onReset={handleResetColorist}
                  imageFilterClass={imageFilterClass}
                />
              ) : (
                <div className="flex flex-col h-full">
                  <div className="flex flex-col md:flex-row gap-6 flex-grow">
                    <div
                      id="colorist-client-photo-container"
                      className="bg-gray-800 p-4 rounded-xl flex-grow flex flex-col"
                    >
                      <h3 className="text-lg font-semibold mb-2 text-center">
                        1. Foto da Cliente
                      </h3>
                      {clientImageForColorPreview ? (
                        <div className="relative group flex-grow">
                          <img
                            src={clientImageForColorPreview}
                            alt="Cliente Cor"
                            className="w-full h-full object-contain rounded-md"
                          />
                          <button
                            onClick={() => {
                              setClientImageForColor(null);
                              setClientImageForColorPreview(null);
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-gray-900/50 rounded-full text-white hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Icon name="close" className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex-grow flex flex-col">
                          <div className="p-1 bg-gray-900 rounded-lg flex mb-2">
                            <button
                              onClick={() =>
                                setColoristClientImageInputMode("upload")
                              }
                              className={`flex-1 text-xs py-1 rounded ${
                                coloristClientImageInputMode === "upload"
                                  ? "bg-emerald-600"
                                  : "bg-gray-700"
                              }`}
                            >
                              Upload
                            </button>
                            <button
                              onClick={() =>
                                setColoristClientImageInputMode("camera")
                              }
                              className={`flex-1 text-xs py-1 rounded ${
                                coloristClientImageInputMode === "camera"
                                  ? "bg-emerald-600"
                                  : "bg-gray-700"
                              }`}
                            >
                              Câmera
                            </button>
                          </div>
                          {coloristClientImageInputMode === "upload" ? (
                            <ImageUploader
                              id="client-image-colorist"
                              onImageUpload={handleClientImageForColorChange}
                            />
                          ) : (
                            <CameraCapture
                              onImageCapture={handleClientImageForColorChange}
                            />
                          )}
                        </div>
                      )}
                    </div>
                    <div
                      id="colorist-inspiration-container"
                      className="bg-gray-800 p-4 rounded-xl flex-grow flex flex-col"
                    >
                      <h3 className="text-lg font-semibold mb-2 text-center">
                        2. Inspiração de Cor
                      </h3>
                      {inspirationForColor?.type === "image" &&
                      inspirationImagePreview ? (
                        <div className="relative group flex-grow">
                          <img
                            src={inspirationImagePreview}
                            alt="Inspiração"
                            className="w-full h-full object-contain rounded-md"
                          />
                          <button
                            onClick={() => {
                              setInspirationForColor(null);
                              setInspirationImagePreview(null);
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-gray-900/50 rounded-full text-white hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Icon name="close" className="w-5 h-5" />
                          </button>
                        </div>
                      ) : inspirationForColor?.type === "text" ? (
                        <div className="relative group flex-grow bg-gray-700/50 rounded-md flex items-center justify-center p-4">
                          <p className="text-center italic">
                            "{inspirationForColor.value}"
                          </p>
                          <button
                            onClick={() => setInspirationForColor(null)}
                            className="absolute top-2 right-2 p-1.5 bg-gray-900/50 rounded-full text-white hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Icon name="close" className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex-grow flex flex-col gap-4">
                          <ImageUploader
                            id="inspiration-image-colorist"
                            onImageUpload={handleInspirationImageChange}
                          />
                          <div className="flex items-center gap-2">
                            <div className="flex-grow h-px bg-gray-600"></div>
                            <span className="text-gray-400 text-sm">OU</span>
                            <div className="flex-grow h-px bg-gray-600"></div>
                          </div>
                          <button
                            onClick={() => setIsCatalogOpen(true)}
                            className="w-full py-2 px-4 bg-gray-700 text-white rounded-md font-medium hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
                          >
                            <Icon name="grid" className="w-5 h-5" /> Buscar no
                            Catálogo
                          </button>
                          <div className="flex-grow h-px bg-gray-600"></div>
                          <form
                            onSubmit={handleInspirationTextSubmit}
                            className="flex gap-2"
                          >
                            <input
                              type="text"
                              name="inspirationText"
                              placeholder="Descreva a cor (ex: 'ruivo acobreado')"
                              className="flex-grow bg-gray-700 border border-gray-600 rounded-md py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                            <button
                              type="submit"
                              className="px-4 py-2 bg-emerald-600 text-white rounded-md font-medium hover:bg-emerald-500 transition-colors"
                            >
                              Usar
                            </button>
                          </form>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex-shrink-0">
                    <button
                      id="colorist-generate-button"
                      onClick={handleGenerateColoristReport}
                      disabled={!clientImageForColor || !inspirationForColor}
                      className="w-full py-3 px-4 bg-emerald-600 text-white rounded-lg font-bold text-center hover:bg-emerald-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      <Icon name="magic" className="w-6 h-6" /> Gerar Análise de
                      Cor
                    </button>
                  </div>
                </div>
              ))}

            {/* Visagism Tab Content */}
            {activeTab === "visagism" &&
              (visagismReport ? (
                <VisagismReportDisplay
                  report={visagismReport}
                  clientImage={clientImageForVisagismPreview!}
                  onReset={handleResetVisagism}
                  imageFilterClass={imageFilterClass}
                />
              ) : (
                <div className="flex flex-col h-full">
                  <div id="visagism-uploader-container" className="flex-grow">
                    <div className="bg-gray-800 p-4 rounded-xl flex-grow flex flex-col h-full max-w-lg mx-auto">
                      <h3 className="text-lg font-semibold mb-2 text-center">
                        Foto da Cliente para Análise
                      </h3>
                      {clientImageForVisagismPreview ? (
                        <div className="relative group flex-grow">
                          <img
                            src={clientImageForVisagismPreview}
                            alt="Cliente Visagismo"
                            className="w-full h-full object-contain rounded-md"
                          />
                          <button
                            onClick={() => {
                              setClientImageForVisagism(null);
                              setClientImageForVisagismPreview(null);
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-gray-900/50 rounded-full text-white hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                          >
                            <Icon name="close" className="w-5 h-5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex-grow flex flex-col">
                          <div className="p-1 bg-gray-900 rounded-lg flex mb-2">
                            <button
                              onClick={() =>
                                setVisagismClientImageInputMode("upload")
                              }
                              className={`flex-1 text-xs py-1 rounded ${
                                visagismClientImageInputMode === "upload"
                                  ? "bg-emerald-600"
                                  : "bg-gray-700"
                              }`}
                            >
                              Upload
                            </button>
                            <button
                              onClick={() =>
                                setVisagismClientImageInputMode("camera")
                              }
                              className={`flex-1 text-xs py-1 rounded ${
                                visagismClientImageInputMode === "camera"
                                  ? "bg-emerald-600"
                                  : "bg-gray-700"
                              }`}
                            >
                              Câmera
                            </button>
                          </div>
                          {visagismClientImageInputMode === "upload" ? (
                            <ImageUploader
                              id="client-image-visagism"
                              onImageUpload={handleClientImageForVisagismChange}
                            />
                          ) : (
                            <CameraCapture
                              onImageCapture={
                                handleClientImageForVisagismChange
                              }
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="mt-4 flex-shrink-0 max-w-lg mx-auto w-full">
                    <button
                      id="visagism-generate-button"
                      onClick={handleGenerateVisagismReport}
                      disabled={!clientImageForVisagism}
                      className="w-full py-3 px-4 bg-emerald-600 text-white rounded-lg font-bold text-center hover:bg-emerald-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                    >
                      <Icon name="magic" className="w-6 h-6" /> Gerar
                      Consultoria 360°
                    </button>
                  </div>
                </div>
              ))}
          </div>

          <div className="flex-shrink-0">
            <ActionButtons
              isReady={isAnyReportActive}
              canAnimate={!!(hairstylistReport || coloristReport)}
              onAnimate={handleAnimateImage}
              onEdit={handleEditResultImage}
              onApplyFilter={(filter) =>
                setImageFilterClass(`filter-${filter}`)
              }
              onTextToSpeech={handleTextToSpeech}
              onFindSupplies={handleFindSupplies}
              onSave={() => {}}
              onDownloadPdf={handleDownloadPdf}
              onShare={() => {}}
            />
          </div>
        </div>

        {/* Side Panel: Chat */}
        <div
          id="chat-panel-container"
          className="lg:w-96 lg:flex-shrink-0 bg-gray-800/50 rounded-2xl"
        >
          <ChatPanel />
        </div>
      </main>

      <SavedPlansModal
        isOpen={isSavedPlansOpen}
        onClose={() => setIsSavedPlansOpen(false)}
        plans={savedPlans}
        onLoadPlan={() => {}}
        onDeletePlan={() => {}}
      />
      <PaymentModal
        isOpen={isPaymentModalOpen || isTrialExpired}
        onClose={() => setIsPaymentModalOpen(false)}
        forceOpen={isTrialExpired}
        userProfile={userProfile}
      />
      <CatalogModal
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        onImageSelect={handleSelectFromCatalog}
      />
      <SuppliesModal
        isOpen={isSuppliesModalOpen}
        onClose={() => setIsSuppliesModalOpen(false)}
        data={suppliesData}
      />
    </div>
  );
}
