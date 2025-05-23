
import React from "react";
import { useQuiz, QuizStep } from "../../contexts/QuizContext";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

const QuizProgress: React.FC = () => {
  const { state, isStepComplete, goToStep } = useQuiz();
  
  const steps: { id: QuizStep; title: string }[] = [
    { id: "projectType", title: "Project Type" },
    { id: "requirements", title: "Requirements" },
    { id: "areaCalculator", title: "Area Calculator" },
    { id: "delivery", title: "Delivery" },
    { id: "results", title: "Results" },
  ];

  // Calculate progress percentage
  const currentStepIndex = steps.findIndex(step => step.id === state.currentStep);
  const progressPercentage = Math.round(((currentStepIndex) / (steps.length - 1)) * 100);

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div 
          className="bg-primary h-2.5 rounded-full transition-all duration-300 ease-in-out" 
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>
      
      {/* Step indicators */}
      <div className="flex justify-between">
        {steps.map((step, index) => {
          const isComplete = isStepComplete(step.id);
          const isCurrent = state.currentStep === step.id;
          const isPrevious = steps.findIndex(s => s.id === state.currentStep) > index;
          
          const canNavigate = isPrevious || isComplete;
          
          return (
            <div 
              key={step.id} 
              className={cn(
                "flex flex-col items-center space-y-2 cursor-pointer group",
                (canNavigate ? "cursor-pointer" : "cursor-not-allowed opacity-50")
              )}
              onClick={() => canNavigate && goToStep(step.id)}
            >
              <div 
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors",
                  isCurrent && "border-primary bg-primary text-white",
                  isComplete && !isCurrent && "border-primary bg-white text-primary",
                  !isComplete && !isCurrent && "border-gray-300 bg-white text-gray-300"
                )}
              >
                {isComplete ? <Check size={16} /> : index + 1}
              </div>
              <span 
                className={cn(
                  "text-xs font-medium hidden md:block transition-colors",
                  isCurrent && "text-primary",
                  !isCurrent && "text-gray-500 group-hover:text-gray-700"
                )}
              >
                {step.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default QuizProgress;
