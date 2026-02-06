
import { QuizProvider } from "../contexts/QuizContext";
import QuizFlow from "../components/quiz/QuizFlow";

const Quiz = () => {
  return (
    <div className="min-h-screen bg-muted py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-8">
          Build Your Project Plan
        </h1>
        <p className="text-lg text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
          Answer a few questions about your project and we'll help you calculate material needs and recommend the perfect materials for your specific requirements.
        </p>
        
        <div className="bg-card rounded-lg shadow-lg p-6">
          <QuizProvider>
            <QuizFlow />
          </QuizProvider>
        </div>
      </div>
    </div>
  );
};

export default Quiz;
