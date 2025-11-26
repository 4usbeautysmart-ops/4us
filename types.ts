

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}

// This represents the viability part of the new report
export interface ViabilityAnalysis {
  verdict: 'Altamente Recomendado' | 'Recomendado com Adaptações' | 'Não Recomendado';
  justification: string;
  adaptationRecommendations: string;
}

// A detailed visagism analysis of the reference image subject
export interface ReferenceVisagismAnalysis {
  faceShape: string;
  keyFacialFeatures: {
    forehead: string;
    jawline: string;
    nose: string;
  };
  hairAnalysis: {
    hairType: string;
    hairDensity: string;
  };
  styleHarmony: string; // Justification for why the cut works for the reference person
}

// Updated CuttingPlan to be part of the new report
export interface CuttingPlan {
  styleName: string;
  description: string;
  tools: string[];
  accessories: string[];
  preparationSteps: string[];
  steps: string[];
  finishingSteps: string[];
  diagrams: { title: string; svg: string }[];
  detailedPrompt: string;
  threeDViews: {
    frontPrompt: string;
    sidePrompt: string;
    backPrompt: string;
  };
}

// The main report for the new "Hairstylist Visagista" tab
export interface HairstylistReport {
  viabilityAnalysis: ViabilityAnalysis;
  cuttingPlan: CuttingPlan;
  referenceVisagism: ReferenceVisagismAnalysis;
}

// Update SavedPlan to reflect the new structure
export interface SavedPlan {
  id: number;
  report: HairstylistReport;
  clientImage: string; // base64
  referenceImage: string; // base64
  resultImage: string | null; // base64
}


export interface VisagismReport {
  faceShape: string;
  keyFacialFeatures: {
    forehead: string;
    jawline: string;
    nose: string;
    eyes: string;
  };
  hairAnalysis: {
    hairType: string;
    hairDensity: string;
    currentCondition: string;
  };
  styleRecommendations: Array<{
    styleName: string;
    description: string;
    category: 'Corte' | 'Coloração' | 'Penteado';
  }>;
  stylesToAvoid: Array<{
    styleName: string;
    description: string;
  }>;
  makeupTips: string[];
  accessoriesTips: string[];
  summary: string;
}

export interface ColoristReport {
  visagismAndColorimetryAnalysis: {
    skinTone: string;
    contrast: string;
    recommendation: string;
  };
  initialDiagnosis: string;
  products: string[];
  mechasTechnique: {
    name: string;
    description: string;
  };
  applicationSteps: {
    preparation: string[];
    mechas: string[];
    baseColor: string[];
    toning: string[];
    treatment: string[];
  };
  diagrams: { title: string; svg: string }[];
  tryOnImagePrompt: string;
  postChemicalCare: {
    recommendation: string;
    products: string[];
    steps: string[];
  };
}


// Declare a global interface for aistudio to satisfy TypeScript
declare global {
  // Fix: Resolved type conflict by defining a named interface for aistudio.
  // The error message indicated that `window.aistudio` was expected to have the type `AIStudio`.
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }

  interface Window {
    // FIX: Made 'aistudio' optional to resolve the "All declarations of 'aistudio' must have identical modifiers" error.
    aistudio?: AIStudio;
    webkitAudioContext: typeof AudioContext;
    jspdf: any;
    html2canvas: any;
  }
}