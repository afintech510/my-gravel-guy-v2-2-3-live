
import React from "react";
import { useQuiz, BudgetPreference } from "../../../contexts/QuizContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const budgetOptions: { id: BudgetPreference; title: string; description: string }[] = [
  {
    id: "economy",
    title: "Economy ($)",
    description: "Budget-friendly options without compromising on quality."
  },
  {
    id: "standard",
    title: "Standard ($$)",
    description: "Mid-range options with good quality and durability."
  },
  {
    id: "premium",
    title: "Premium ($$$)",
    description: "Premium materials with superior quality and features."
  }
];

const BudgetStep: React.FC = () => {
  const { state, setBudget, prevStep, nextStep, isStepComplete } = useQuiz();
  
  const handleContinue = () => {
    if (isStepComplete("budget")) {
      nextStep();
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-semibold mb-2">What is your budget preference?</h2>
        <p className="text-gray-600">This helps us recommend materials that fit within your price range.</p>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          <RadioGroup
            value={state.budget || ""}
            onValueChange={(value) => setBudget(value as BudgetPreference)}
            className="space-y-4"
          >
            {budgetOptions.map((option) => (
              <div 
                key={option.id} 
                className={`flex items-start space-x-3 p-4 rounded-md ${
                  state.budget === option.id ? 'bg-blue-50 border border-blue-200' : 'border hover:bg-gray-50'
                }`}
              >
                <RadioGroupItem value={option.id} id={option.id} className="mt-1" />
                <div className="flex-grow">
                  <Label htmlFor={option.id} className="text-base font-medium cursor-pointer">
                    {option.title}
                  </Label>
                  <p className="text-sm text-gray-500 mt-1">{option.description}</p>
                </div>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>
      
      <div className="flex justify-between">
        <Button variant="outline" onClick={prevStep}>
          Back
        </Button>
        <Button 
          onClick={handleContinue}
          disabled={!isStepComplete("budget")}
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

export default BudgetStep;
