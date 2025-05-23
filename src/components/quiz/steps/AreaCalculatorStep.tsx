
import React, { useEffect } from "react";
import { useQuiz } from "../../../contexts/QuizContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import AreaInputs from "../../calculator/AreaInputs";
import { Calculator, Ruler } from "lucide-react";

const AreaCalculatorStep: React.FC = () => {
  const { 
    state, 
    setAreas, 
    setDepth, 
    setExtraPercentage, 
    setGravelSize,
    prevStep, 
    nextStep, 
    isStepComplete,
    calculatedValues,
    getRecommendedDepth
  } = useQuiz();
  
  // Set recommended depth when component mounts
  useEffect(() => {
    const recommendedDepth = getRecommendedDepth();
    if (state.depth !== recommendedDepth) {
      setDepth(recommendedDepth);
    }
  }, []);

  const handleContinue = () => {
    if (isStepComplete("areaCalculator")) {
      nextStep();
    }
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Calculate Area & Material Needs</h2>
        <p className="text-gray-600">Specify the dimensions, depth, and gravel size for your project.</p>
      </div>
      
      <Card>
        <CardContent className="pt-6 space-y-6">
          <AreaInputs 
            areas={state.areas} 
            onAreaChange={setAreas} 
          />
          
          <div className="pt-4 border-t">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="flex items-center text-sm font-medium">
                  <Ruler className="h-4 w-4 mr-2" />
                  Depth: {state.depth} inches {state.requirements.drainage && "(Recommended: 6\" for good drainage)"}
                  {state.requirements.newInstall && !state.requirements.drainage && "(Recommended: 3\" for new installation)"}
                  {state.requirements.topDressing && !state.requirements.drainage && !state.requirements.newInstall && "(Recommended: 1-2\" for top dressing)"}
                </label>
                <Slider
                  value={[state.depth]}
                  onValueChange={([value]) => setDepth(value)}
                  min={1}
                  max={12}
                  step={0.5}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Order Extra: {state.extraPercentage}%
                </label>
                <Slider
                  value={[state.extraPercentage]}
                  onValueChange={([value]) => setExtraPercentage(value)}
                  min={0}
                  max={30}
                  step={1}
                />
              </div>
            </div>
          </div>
          
          <div className="pt-4 border-t">
            <h3 className="text-lg font-medium mb-3">Select Gravel Size</h3>
            <RadioGroup
              value={state.gravelSize}
              onValueChange={(value) => setGravelSize(value as "small" | "medium" | "large")}
              className="space-y-4"
            >
              <div className={`flex items-start space-x-3 p-4 rounded-md ${
                state.gravelSize === "small" ? 'bg-blue-50 border border-blue-200' : 'border hover:bg-gray-50'
              }`}>
                <RadioGroupItem value="small" id="small" className="mt-1" />
                <div className="flex-grow">
                  <Label htmlFor="small" className="text-base font-medium cursor-pointer">
                    Small (≤ ¾")
                  </Label>
                  <p className="text-sm text-gray-500 mt-1">
                    Fine gravel suitable for walkways and smaller projects.
                  </p>
                </div>
              </div>
              
              <div className={`flex items-start space-x-3 p-4 rounded-md ${
                state.gravelSize === "medium" ? 'bg-blue-50 border border-blue-200' : 'border hover:bg-gray-50'
              }`}>
                <RadioGroupItem value="medium" id="medium" className="mt-1" />
                <div className="flex-grow">
                  <Label htmlFor="medium" className="text-base font-medium cursor-pointer">
                    Medium (1-2")
                  </Label>
                  <p className="text-sm text-gray-500 mt-1">
                    Standard size for most driveways and landscaping projects.
                  </p>
                </div>
              </div>
              
              <div className={`flex items-start space-x-3 p-4 rounded-md ${
                state.gravelSize === "large" ? 'bg-blue-50 border border-blue-200' : 'border hover:bg-gray-50'
              }`}>
                <RadioGroupItem value="large" id="large" className="mt-1" />
                <div className="flex-grow">
                  <Label htmlFor="large" className="text-base font-medium cursor-pointer">
                    Large (2"+)
                  </Label>
                  <p className="text-sm text-gray-500 mt-1">
                    Larger stones for drainage, erosion control, and accent areas.
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>
          
          <div className="pt-4 border-t">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium mb-3 flex items-center">
                <Calculator className="h-5 w-5 mr-2" />
                Material Calculations
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Total Area</p>
                  <p className="text-xl font-bold">{calculatedValues.totalSquareFeet.toFixed(2)} sq. ft.</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Cubic Yards</p>
                  <p className="text-xl font-bold">{calculatedValues.totalCubicYards.toFixed(2)} cu. yds.</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Estimated Tons</p>
                  <p className="text-xl font-bold">{calculatedValues.totalTons} tons</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-between">
        <Button variant="outline" onClick={prevStep}>
          Back
        </Button>
        <Button 
          onClick={handleContinue}
          disabled={!isStepComplete("areaCalculator")}
        >
          Continue
        </Button>
      </div>
    </div>
  );
};

export default AreaCalculatorStep;
