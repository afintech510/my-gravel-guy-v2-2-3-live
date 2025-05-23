
import React, { createContext, useContext, useState, useEffect } from "react";
import { getProducts } from "../services/productService";
import { Product, UIMaterialCategory, MaterialCategory, mapUICategoryToDBCategory } from "../services/productTypes";

// Quiz step types
export type QuizStep = 
  | "projectType" 
  | "requirements"
  | "areaCalculator"
  | "delivery"
  | "results";

// Project types
export type ProjectType = 
  | "driveway" 
  | "landscaping" 
  | "patio" 
  | "walkway"
  | "drainage"
  | "base"
  | "general"
  | "other";

// Material requirements
export interface MaterialRequirements {
  drainage: boolean;
  aesthetics: boolean;
  durability: boolean;
  easeOfInstallation: boolean;
  newInstall: boolean;
  topDressing: boolean;
  fillHole: boolean;
  gradeProperty: boolean;
}

// Area input interface
export interface AreaInput {
  length: number;
  width: number;
}

// Gravel size options
export type GravelSize = "small" | "medium" | "large";

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
  areas: AreaInput[];
  depth: number;
  extraPercentage: number;
  gravelSize: GravelSize;
  deliveryInfo: DeliveryInfo;
  recommendations: Product[];
}

// Context type
interface QuizContextType {
  state: QuizState;
  setProjectType: (type: ProjectType) => void;
  setRequirements: (requirements: MaterialRequirements) => void;
  setAreas: (areas: AreaInput[]) => void;
  setDepth: (depth: number) => void;
  setExtraPercentage: (percentage: number) => void;
  setGravelSize: (size: GravelSize) => void;
  setDeliveryInfo: (info: DeliveryInfo) => void;
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (step: QuizStep) => void;
  generateRecommendations: () => Promise<void>;
  isStepComplete: (step: QuizStep) => boolean;
  resetQuiz: () => void;
  calculatedValues: {
    totalSquareFeet: number;
    totalCubicYards: number;
    totalTons: number;
  };
  getRecommendedDepth: () => number;
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
    newInstall: false,
    topDressing: false,
    fillHole: false,
    gradeProperty: false,
  },
  areas: [{ length: 10, width: 10 }],
  depth: 4,
  extraPercentage: 10,
  gravelSize: "medium",
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

  // Calculate recommended depth based on requirements
  const getRecommendedDepth = (): number => {
    if (state.requirements.drainage) {
      return 6; // 6" for good drainage
    } else if (state.requirements.newInstall) {
      return 3; // 3" for new installation
    } else if (state.requirements.topDressing) {
      return 1.5; // 1.5" for top dressing (middle of 1-2" range)
    }
    return 4; // Default depth
  };

  // Update depth when requirements change
  useEffect(() => {
    const recommendedDepth = getRecommendedDepth();
    if (state.depth !== recommendedDepth) {
      setState((prev) => ({ ...prev, depth: recommendedDepth }));
    }
  }, [state.requirements]);

  const setProjectType = (type: ProjectType) => {
    setState((prev) => ({ ...prev, projectType: type }));
  };

  const setRequirements = (requirements: MaterialRequirements) => {
    setState((prev) => ({ ...prev, requirements }));
  };

  const setAreas = (areas: AreaInput[]) => {
    setState((prev) => ({ ...prev, areas }));
  };

  const setDepth = (depth: number) => {
    setState((prev) => ({ ...prev, depth }));
  };

  const setExtraPercentage = (percentage: number) => {
    setState((prev) => ({ ...prev, extraPercentage: percentage }));
  };

  const setGravelSize = (size: GravelSize) => {
    setState((prev) => ({ ...prev, gravelSize: size }));
  };

  const setDeliveryInfo = (info: DeliveryInfo) => {
    setState((prev) => ({ ...prev, deliveryInfo: { ...prev.deliveryInfo, ...info } }));
  };

  const nextStep = () => {
    const steps: QuizStep[] = ["projectType", "requirements", "areaCalculator", "delivery", "results"];
    const currentIndex = steps.indexOf(state.currentStep);
    
    if (currentIndex < steps.length - 1) {
      setState((prev) => ({ ...prev, currentStep: steps[currentIndex + 1] }));
    }
  };

  const prevStep = () => {
    const steps: QuizStep[] = ["projectType", "requirements", "areaCalculator", "delivery", "results"];
    const currentIndex = steps.indexOf(state.currentStep);
    
    if (currentIndex > 0) {
      setState((prev) => ({ ...prev, currentStep: steps[currentIndex - 1] }));
    }
  };

  const goToStep = (step: QuizStep) => {
    setState((prev) => ({ ...prev, currentStep: step }));
  };

  // Calculate values for area, cubic yards, and tons
  const calculatedValues = {
    totalSquareFeet: state.areas.reduce((total, area) => total + area.length * area.width, 0),
    get totalCubicYards() {
      const cubicFeet = (this.totalSquareFeet * state.depth) / 12;
      return +(cubicFeet / 27 * (1 + state.extraPercentage / 100)).toFixed(2);
    },
    get totalTons() {
      // Using 1.5 as default tons per cubic yard
      return Math.floor(this.totalCubicYards * 1.5);
    }
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
            if (mapUICategoryToDBCategory('gravel').includes(product.category)) score += 10;
            if (product.categories?.includes("driveway")) score += 10;
            break;
          case "landscaping":
            if (mapUICategoryToDBCategory('dirt').includes(product.category) || 
                mapUICategoryToDBCategory('mulch').includes(product.category) ||
                mapUICategoryToDBCategory('gravel').includes(product.category)) score += 8;
            if (product.categories?.includes("landscaping")) score += 10;
            break;
          case "patio":
            if (mapUICategoryToDBCategory('gravel').includes(product.category)) score += 8;
            if (product.categories?.includes("patio")) score += 10;
            break;
          case "walkway":
            if (mapUICategoryToDBCategory('gravel').includes(product.category)) score += 8;
            if (product.categories?.includes("walkway")) score += 10;
            break;
          case "drainage":
            if (mapUICategoryToDBCategory('gravel').includes(product.category)) score += 10;
            if (product.categories?.includes("drainage")) score += 10;
            break;
          case "base":
            if (mapUICategoryToDBCategory('base').includes(product.category) || 
                mapUICategoryToDBCategory('gravel').includes(product.category)) score += 8;
            if (product.categories?.includes("base")) score += 10;
            break;
          default:
            break;
        }
        
        // Requirements scoring
        if (state.requirements.drainage) {
          if (mapUICategoryToDBCategory('gravel').includes(product.category)) score += 5;
          if (product.categories?.includes("drainage")) score += 10;
        }
        
        if (state.requirements.aesthetics) {
          if (product.categories?.includes("decorative")) score += 8;
          if (product.color) score += 5; // Products with color info are likely decorative
        }
        
        if (state.requirements.durability) {
          if (mapUICategoryToDBCategory('gravel').includes(product.category) || 
              mapUICategoryToDBCategory('base').includes(product.category)) score += 5;
          if (product.categories?.includes("durable")) score += 8;
        }
        
        if (state.requirements.newInstall) {
          if (product.categories?.includes("new-installation")) score += 8;
        }
        
        if (state.requirements.topDressing) {
          if (product.categories?.includes("top-dressing")) score += 10;
        }
        
        if (state.requirements.fillHole) {
          if (product.categories?.includes("fill")) score += 10;
        }
        
        if (state.requirements.gradeProperty) {
          if (product.categories?.includes("grading")) score += 10;
        }
        
        // Gravel size scoring
        if (mapUICategoryToDBCategory('gravel').includes(product.category) || 
            product.categories?.includes("gravel")) {
          const sizeStr = product.size?.toLowerCase() || "";
          
          switch (state.gravelSize) {
            case "small": // ≤ ¾"
              if (sizeStr.includes("3/8") || 
                  sizeStr.includes("1/4") ||
                  sizeStr.includes("1/2") ||
                  sizeStr.includes("3/4")) {
                score += 10;
              }
              break;
            case "medium": // 1-2"
              if (sizeStr.includes("1\"") || 
                  sizeStr.includes("1-") || 
                  sizeStr.includes("1.5") || 
                  sizeStr.includes("1 1/2")) {
                score += 10;
              }
              break;
            case "large": // 2+"
              if (sizeStr.includes("2\"") || 
                  sizeStr.includes("3\"") || 
                  sizeStr.includes("4\"") || 
                  parseInt(sizeStr) >= 2) {
                score += 10;
              }
              break;
          }
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
      case "areaCalculator":
        return state.areas.length > 0 && 
               state.areas.every(area => area.length > 0 && area.width > 0) && 
               state.depth > 0;
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
        setAreas,
        setDepth,
        setExtraPercentage,
        setGravelSize,
        setDeliveryInfo,
        nextStep,
        prevStep,
        goToStep,
        generateRecommendations,
        isStepComplete,
        resetQuiz,
        calculatedValues,
        getRecommendedDepth,
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
