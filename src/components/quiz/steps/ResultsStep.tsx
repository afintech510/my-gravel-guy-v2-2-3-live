
import React from "react";
import { useQuiz } from "../../../contexts/QuizContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useCart } from "../../../contexts/CartContext";
import { toast } from "sonner";
import { Loader, ShoppingCart, Star, Mail } from "lucide-react";

const ResultsStep: React.FC = () => {
  const { state, prevStep, resetQuiz } = useQuiz();
  const { addToCart } = useCart();
  
  const handleAddToCart = (productId: string | number) => {
    const product = state.recommendations.find(p => p.id === productId);
    if (product) {
      addToCart(product);
      toast.success("Added to cart!");
    }
  };

  const handleRequestQuote = () => {
    toast.success("Quote request submitted! We'll contact you shortly.");
  };

  const getRecommendationReason = (productIndex: number) => {
    const { projectType, requirements, budget } = state;
    
    if (productIndex === 0) {
      return "Best match for your " + projectType + " project";
    } else if (productIndex === 1) {
      if (requirements.drainage) {
        return "Great drainage properties";
      } else if (requirements.durability) {
        return "Excellent durability";
      } else {
        return "Good all-around option";
      }
    } else {
      if (budget === "economy") {
        return "Budget-friendly alternative";
      } else if (budget === "premium") {
        return "Premium quality option";
      } else {
        return "Alternative option";
      }
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
