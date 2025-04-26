
import React, { createContext, useContext, useState, useEffect } from "react";
import { Product, getProducts } from "../services/productService";

// Quiz step types
export type QuizStep = 
  | "projectType" 
  | "requirements"
  | "budget"
  | "delivery"
  | "results";

// Project types
export type ProjectType = 
  | "driveway" 
  | "landscaping" 
  | "patio" 
  | "walkway" 
  | "other";

// Material requirements
export interface MaterialRequirements {
  drainage: boolean;
  aesthetics: boolean;
  durability: boolean;
  easeOfInstallation: boolean;
}

// Budget preferences
export type BudgetPreference = "economy" | "standard" | "premium";

// Delivery information
export interface DeliveryInfo {
  name: string;
  email: string;
  phone: string;
  zipCode: string;
  address?: string;
  comments?: string;
}

// Quiz state interface
export interface QuizState {
  currentStep: QuizStep;
  projectType: ProjectType | null;
  requirements: MaterialRequirements;
  budget: BudgetPreference | null;
  deliveryInfo: DeliveryInfo;
  recommendations: Product[];
}

// Context type
interface QuizContextType {
  state: QuizState;
  setProjectType: (type: ProjectType) => void;
  setRequirements: (requirements: MaterialRequirements) => void;
  setBudget: (budget: BudgetPreference) => void;
  setDeliveryInfo: (info: DeliveryInfo) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: QuizStep) => void;
  generateRecommendations: () => Promise<void>;
  isStepComplete: (step: QuizStep) => boolean;
  resetQuiz: () => void;
}

// Initial quiz state
const initialState: QuizState = {
  currentStep: "projectType",
  projectType: null,
  requirements: {
    drainage: false,
    aesthetics: false,
    durability: false,
    easeOfInstallation: false,
  },
  budget: null,
  deliveryInfo: {
    name: "",
    email: "",
    phone: "",
    zipCode: "",
    address: "",
    comments: "",
  },
  recommendations: [],
};

// Create context
const QuizContext = createContext<QuizContextType | undefined>(undefined);

// Create provider component
export const QuizProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<QuizState>(() => {
    // Try to load from localStorage
    const savedState = localStorage.getItem("quizState");
    return savedState ? JSON.parse(savedState) : initialState;
  });

  // Save state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem("quizState", JSON.stringify(state));
  }, [state]);

  const setProjectType = (type: ProjectType) => {
    setState((prev) => ({ ...prev, projectType: type }));
  };

  const setRequirements = (requirements: MaterialRequirements) => {
    setState((prev) => ({ ...prev, requirements }));
  };

  const setBudget = (budget: BudgetPreference) => {
    setState((prev) => ({ ...prev, budget }));
  };

  const setDeliveryInfo = (info: DeliveryInfo) => {
    setState((prev) => ({ ...prev, deliveryInfo: { ...prev.deliveryInfo, ...info } }));
  };

  const nextStep = () => {
    const steps: QuizStep[] = ["projectType", "requirements", "budget", "delivery", "results"];
    const currentIndex = steps.indexOf(state.currentStep);
    
    if (currentIndex < steps.length - 1) {
      setState((prev) => ({ ...prev, currentStep: steps[currentIndex + 1] }));
    }
  };

  const prevStep = () => {
    const steps: QuizStep[] = ["projectType", "requirements", "budget", "delivery", "results"];
    const currentIndex = steps.indexOf(state.currentStep);
    
    if (currentIndex > 0) {
      setState((prev) => ({ ...prev, currentStep: steps[currentIndex - 1] }));
    }
  };

  const goToStep = (step: QuizStep) => {
    setState((prev) => ({ ...prev, currentStep: step }));
  };

  const generateRecommendations = async () => {
    try {
      // Get all products
      const products = await getProducts();
      
      // Score each product based on quiz answers
      const scoredProducts = products.map(product => {
        let score = 0;
        
        // Project type scoring
        switch (state.projectType) {
          case "driveway":
            if (product.category === "gravel") score += 10;
            break;
          case "landscaping":
            if (["gravel", "dirt"].includes(product.category)) score += 10;
            break;
          case "patio":
            if (product.category === "gravel") score += 8;
            if (product.category === "sand") score += 5;
            break;
          case "walkway":
            if (product.category === "gravel") score += 10;
            break;
          default:
            break;
        }
        
        // Requirements scoring
        if (state.requirements.drainage && product.category === "gravel") score += 5;
        if (state.requirements.aesthetics && product.category === "gravel") score += 3;
        if (state.requirements.durability && product.category === "gravel") score += 5;
        if (state.requirements.easeOfInstallation && product.category === "sand") score += 3;
        
        // Budget scoring
        switch (state.budget) {
          case "economy":
            if (product.price < 30) score += 10;
            else if (product.price < 50) score += 5;
            break;
          case "standard":
            if (product.price >= 30 && product.price <= 70) score += 10;
            break;
          case "premium":
            if (product.price > 70) score += 10;
            break;
          default:
            break;
        }
        
        return { product, score };
      });
      
      // Sort by score (highest first) and get top 3
      const topRecommendations = scoredProducts
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(item => item.product);
      
      // Update state with recommendations
      setState(prev => ({ ...prev, recommendations: topRecommendations }));
      
    } catch (error) {
      console.error("Failed to generate recommendations:", error);
    }
  };

  const isStepComplete = (step: QuizStep): boolean => {
    switch (step) {
      case "projectType":
        return state.projectType !== null;
      case "requirements":
        return Object.values(state.requirements).some(val => val === true);
      case "budget":
        return state.budget !== null;
      case "delivery":
        return !!state.deliveryInfo.name && 
               !!state.deliveryInfo.email && 
               !!state.deliveryInfo.phone && 
               !!state.deliveryInfo.zipCode;
      case "results":
        return state.recommendations.length > 0;
      default:
        return false;
    }
  };

  const resetQuiz = () => {
    setState(initialState);
    localStorage.removeItem("quizState");
  };

  return (
    <QuizContext.Provider
      value={{
        state,
        setProjectType,
        setRequirements,
        setBudget,
        setDeliveryInfo,
        nextStep,
        prevStep,
        goToStep,
        generateRecommendations,
        isStepComplete,
        resetQuiz,
      }}
    >
      {children}
    </QuizContext.Provider>
  );
};

// Custom hook to use the quiz context
export const useQuiz = () => {
  const context = useContext(QuizContext);
  if (context === undefined) {
    throw new Error("useQuiz must be used within a QuizProvider");
  }
  return context;
};
