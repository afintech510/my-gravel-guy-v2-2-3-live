
import React from "react";
import { useQuiz } from "../../../contexts/QuizContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCart } from "../../../contexts/CartContext";
import { toast } from "sonner";
import { Loader, ShoppingCart, Star, Mail, Calculator, PenTool } from "lucide-react";

const ResultsStep: React.FC = () => {
  const { state, prevStep, resetQuiz, calculatedValues } = useQuiz();
  const { addToCart } = useCart();
  
  const handleAddToCart = (productId: string | number) => {
    const product = state.recommendations.find(p => p.id === productId);
    if (product) {
      addToCart({
        ...product,
        tons: calculatedValues.totalTons
      });
      toast.success("Added to cart!");
    }
  };

  const handleRequestQuote = () => {
    toast.success("Quote request submitted! We'll contact you shortly.");
  };

  const getRecommendationReason = (productIndex: number) => {
    const { projectType, requirements, gravelSize } = state;
    
    if (productIndex === 0) {
      if (requirements.drainage) {
        return "Excellent drainage properties";
      } else if (projectType === "driveway") {
        return "Ideal for driveway durability";
      } else if (projectType === "walkway") {
        return "Perfect for walkway applications";
      } else if (projectType === "drainage") {
        return "Optimal for drainage solutions";
      } else if (projectType === "patio") {
        return "Great for patio construction";
      } else if (requirements.aesthetics) {
        return "Superior aesthetic qualities";
      } else {
        return "Best overall match for your project";
      }
    } else if (productIndex === 1) {
      if (requirements.durability) {
        return "Excellent durability";
      } else if (requirements.aesthetics) {
        return "Great visual appeal";
      } else {
        return "Good all-around option";
      }
    } else {
      if (gravelSize === "small") {
        return "Matches your small gravel preference";
      } else if (gravelSize === "medium") {
        return "Matches your medium gravel preference";
      } else if (gravelSize === "large") {
        return "Matches your large gravel preference";
      } else {
        return "Alternative option";
      }
    }
  };

  const getGravelSizeText = (size: string): string => {
    switch (state.gravelSize) {
      case "small": return "Small (≤ ¾\")";
      case "medium": return "Medium (1-2\")";
      case "large": return "Large (2\"+)";
      default: return "Medium";
    }
  };

  if (state.recommendations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader className="animate-spin h-10 w-10 text-gray-400 mb-4" />
        <p className="text-gray-600">Generating recommendations based on your answers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h2 className="text-2xl font-semibold mb-2">Your Recommended Materials</h2>
        <p className="text-gray-600">Based on your project needs, here are our top recommendations:</p>
      </div>
      
      {/* Project Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PenTool className="h-5 w-5" /> Project Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Project Type</h3>
              <p className="text-base font-medium capitalize">{state.projectType}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500">Key Requirements</h3>
              <div className="flex flex-wrap gap-2 mt-1">
                {Object.entries(state.requirements)
                  .filter(([_, value]) => value === true)
                  .map(([key]) => (
                    <Badge key={key} variant="outline" className="capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </Badge>
                  ))}
              </div>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="h-5 w-5 text-gray-500" />
              <h3 className="text-base font-semibold">Material Calculations</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Total Area</h3>
                <p className="text-base font-medium">{calculatedValues.totalSquareFeet.toFixed(2)} sq.ft.</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Material Depth</h3>
                <p className="text-base font-medium">{state.depth}" inches</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Cubic Yards</h3>
                <p className="text-base font-medium">{calculatedValues.totalCubicYards.toFixed(2)} cu.yds.</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Gravel Size</h3>
                <p className="text-base font-medium">{getGravelSizeText(state.gravelSize)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Recommendations */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {state.recommendations.map((product, index) => (
          <Card key={product.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-300">
            <div className="aspect-video bg-gray-100 relative">
              <img 
                src={product.image} 
                alt={product.name} 
                className="w-full h-full object-cover"
              />
              {index === 0 && (
                <Badge className="absolute top-2 right-2 bg-yellow-500">
                  <Star className="h-3 w-3 mr-1" /> Top Pick
                </Badge>
              )}
            </div>
            <CardHeader>
              <CardTitle>{product.name}</CardTitle>
              <CardDescription>${product.price.toFixed(2)} per ton</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-4">{product.description}</p>
              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                {getRecommendationReason(index)}
              </Badge>
              
              <div className="mt-3 text-sm text-gray-600">
                <p>Est. Total: <span className="font-semibold">${(product.price * calculatedValues.totalTons).toFixed(2)}</span> ({calculatedValues.totalTons} tons)</p>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button 
                variant="outline"
                onClick={() => handleAddToCart(product.id)}
                className="flex items-center gap-2"
              >
                <ShoppingCart className="h-4 w-4" />
                Add to Cart
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-2">Need more help?</h3>
        <p className="mb-4">
          Our team can provide you with a custom quote and expert advice for your {state.projectType} project.
        </p>
        <Button 
          onClick={handleRequestQuote}
          className="flex items-center gap-2"
        >
          <Mail className="h-4 w-4" />
          Request a Quote
        </Button>
      </div>
      
      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={prevStep}>
          Back
        </Button>
        <Button variant="secondary" onClick={resetQuiz}>
          Start New Quiz
        </Button>
      </div>
    </div>
  );
};

export default ResultsStep;
