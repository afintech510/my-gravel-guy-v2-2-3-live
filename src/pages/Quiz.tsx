
import { QuizProvider } from "../contexts/QuizContext";
import QuizFlow from "../components/quiz/QuizFlow";

const Quiz = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-8">
          Material Selection Quiz
        </h1>
        <p className="text-lg text-gray-600 text-center mb-12 max-w-2xl mx-auto">
          Answer a few questions about your project and we'll recommend the best materials for your needs.
        </p>
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <QuizProvider>
            <QuizFlow />
          </QuizProvider>
        </div>
      </div>
    </div>
  );
};

export default Quiz;
