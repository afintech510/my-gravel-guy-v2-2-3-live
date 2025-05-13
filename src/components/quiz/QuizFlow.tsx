
import React, { useEffect } from "react";
import { useQuiz } from "../../contexts/QuizContext";
import QuizProgress from "./QuizProgress";
import ProjectTypeStep from "./steps/ProjectTypeStep";
import RequirementsStep from "./steps/RequirementsStep";
import AreaCalculatorStep from "./steps/AreaCalculatorStep";
import DeliveryStep from "./steps/DeliveryStep";
import ResultsStep from "./steps/ResultsStep";

const QuizFlow: React.FC = () => {
  const { state, nextStep, generateRecommendations } = useQuiz();

  // When reaching results step, generate recommendations
  useEffect(() => {
    if (state.currentStep === "results" && state.recommendations.length === 0) {
      generateRecommendations();
    }
  }, [state.currentStep, state.recommendations.length, generateRecommendations]);

  // Render the current step
  const renderCurrentStep = () => {
    switch (state.currentStep) {
      case "projectType":
        return <ProjectTypeStep />;
      case "requirements":
        return <RequirementsStep />;
      case "areaCalculator":
        return <AreaCalculatorStep />;
      case "delivery":
        return <DeliveryStep />;
      case "results":
        return <ResultsStep />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      <QuizProgress />
      <div className="min-h-[400px]">
        {renderCurrentStep()}
      </div>
    </div>
  );
};

export default QuizFlow;
