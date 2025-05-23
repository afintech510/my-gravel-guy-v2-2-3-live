
import React from "react";
import { useQuiz } from "../../../contexts/QuizContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

const requirements = [
  {
    id: "drainage",
    title: "Good Drainage",
    description: "Materials that allow water to flow through and prevent pooling."
  },
  {
    id: "aesthetics",
    title: "Aesthetic Appeal",
    description: "Materials that enhance the visual appearance of your project."
  },
  {
    id: "durability",
    title: "High Durability",
    description: "Materials that withstand heavy use and weather conditions."
  },
  {
    id: "easeOfInstallation",
    title: "Easy Installation",
    description: "Materials that are easier to work with and install."
  },
  {
    id: "newInstall",
    title: "New Installation",
    description: "Starting a new project from scratch."
  },
  {
    id: "topDressing",
    title: "Top Dressing",
    description: "Adding a new layer over existing material."
  },
  {
    id: "fillHole",
    title: "Fill Hole",
    description: "Materials to fill in depressions or excavated areas."
  },
  {
    id: "gradeProperty",
    title: "Grade Property",
    description: "Materials for leveling or creating a slope on your property."
  }
];

const RequirementsStep: React.FC = () => {
  const { state, setRequirements, prevStep, nextStep, isStepComplete } = useQuiz();
  
  const handleRequirementChange = (id: string, checked: boolean) => {
    setRequirements({
      ...state.requirements,
      [id]: checked
    });
  };

  const handleContinue = () => {
    if (isStepComplete("requirements")) {
      nextStep();
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-semibold mb-2">What are your material requirements?</h2>
        <p className="text-gray-600">Select all that apply to your project.</p>
      </div>
      
      <Card>
        <CardContent className="pt-6 space-y-4">
          {requirements.map((req) => (
            <div 
              key={req.id} 
              className={`flex items-start space-x-3 p-4 rounded-md ${
                state.requirements[req.id as keyof typeof state.requirements] 
                  ? 'bg-blue-50 border border-blue-200' 
                  : 'border hover:bg-gray-50'
              }`}
            >
              <Checkbox 
                id={req.id}
                checked={state.requirements[req.id as keyof typeof state.requirements]}
                onCheckedChange={(checked) => 
                  handleRequirementChange(req.id, checked === true)
                }
                className="mt-1"
              />
              <div className="flex-grow">
                <Label htmlFor={req.id} className="text-base font-medium cursor-pointer">
                  {req.title}
                </Label>
                <p className="text-sm text-gray-500 mt-1">{req.description}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      
      <div className="flex justify-between">
        <Button variant="outline" onClick={prevStep}>
          Back
        </Button>
        <Button 
          onClick={handleContinue}
          disabled={!isStepComplete("requirements")}
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

export default RequirementsStep;
