import React from 'react';
import { Star } from 'lucide-react';

const CustomerReviews = () => {
  const reviews = [
    {
      text: "MyGravelGuy delivered exactly what I needed for my driveway renovation. The quality of the gravel was excellent, and the team was professional and efficient.",
      name: "John Doe",
      title: "Homeowner",
      initials: "JD"
    },
    {
      text: "I was impressed by how quickly they responded to my quote request and delivered the gravel. The price was competitive and the service was outstanding.",
      name: "Jane Smith", 
      title: "Property Manager",
      initials: "JS"
    },
    {
      text: "The team at MyGravelGuy helped me choose the right type of gravel for my landscaping project. Their expertise and attention to detail made all the difference.",
      name: "Robert Johnson",
      title: "Landscape Designer", 
      initials: "RJ"
    }
  ];

  const StarRating = () => (
    <div className="flex gap-1 mb-4">
      {[...Array(5)].map((_, i) => (
        <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
      ))}
    </div>
  );

  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            What Our Customers Say
          </h2>
          <p className="text-gray-600 text-lg">
            Don't just take our word for it. Here's what our satisfied customers have to say.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {reviews.map((review, index) => (
            <div key={index} className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <StarRating />
              <blockquote className="text-gray-700 mb-6 italic">
                "{review.text}"
              </blockquote>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-700">
                    {review.initials}
                  </span>
                </div>
                <div>
                  <div className="font-semibold text-gray-900">
                    {review.name}
                  </div>
                  <div className="text-sm text-gray-500">
                    {review.title}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CustomerReviews;