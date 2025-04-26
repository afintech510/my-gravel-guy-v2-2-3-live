
import React from "react";
import { useQuiz, ProjectType } from "../../../contexts/QuizContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

const projectTypes: { id: ProjectType; title: string; description: string }[] = [
  {
    id: "driveway",
    title: "Driveway",
    description: "Durable materials for vehicle traffic and parking areas."
  },
  {
    id: "landscaping",
    title: "Landscaping",
    description: "Materials for garden paths, beds, and decorative areas."
  },
  {
    id: "patio",
    title: "Patio",
    description: "Materials for outdoor seating and entertainment areas."
  },
  {
    id: "walkway",
    title: "Walkway",
    description: "Materials for pedestrian paths and walkways."
  },
  {
    id: "other",
    title: "Other Project",
    description: "Custom projects with specific material requirements."
  }
];

const ProjectTypeStep: React.FC = () => {
  const { state, setProjectType, nextStep, isStepComplete } = useQuiz();
  
  const handleContinue = () => {
    if (isStepComplete("projectType")) {
      nextStep();
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-semibold mb-2">What type of project are you working on?</h2>
        <p className="text-gray-600">This helps us recommend the right materials for your specific needs.</p>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          <RadioGroup
            value={state.projectType || ""}
            onValueChange={(value) => setProjectType(value as ProjectType)}
            className="space-y-4"
          >
            {projectTypes.map((type) => (
              <div 
                key={type.id} 
                className={`flex items-start space-x-3 p-4 rounded-md ${
                  state.projectType === type.id ? 'bg-blue-50 border border-blue-200' : 'border hover:bg-gray-50'
                }`}
              >
                <RadioGroupItem value={type.id} id={type.id} className="mt-1" />
                <div className="flex-grow">
                  <Label htmlFor={type.id} className="text-base font-medium cursor-pointer">
                    {type.title}
                  </Label>
                  <p className="text-sm text-gray-500 mt-1">{type.description}</p>
                </div>
              </div>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>
      
      <div className="flex justify-end">
        <Button 
          onClick={handleContinue}
          disabled={!isStepComplete("projectType")}
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

export default ProjectTypeStep;
