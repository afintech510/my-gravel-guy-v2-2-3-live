import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ImageIcon } from 'lucide-react';

const TopProducts = () => {
  const products = [
    {
      title: "Driveway Gravel",
      description: "Perfect for driveways and high-traffic areas",
      image: "https://losrkjvrcambvgijfism.supabase.co/storage/v1/object/public/images//crushed-stone.png"
    },
    {
      title: "Pea Gravel", 
      description: "Smooth, rounded stones ideal for walkways",
      image: "https://losrkjvrcambvgijfism.supabase.co/storage/v1/object/public/images//pea-gravel.png"
    },
    {
      title: "River Rock",
      description: "Decorative option for landscaping features", 
      image: "https://losrkjvrcambvgijfism.supabase.co/storage/v1/object/public/images//river-rocks.png"
    }
  ];

  return (
    <section className="py-16 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Our Gravel Products
          </h2>
          <p className="text-gray-600 text-lg">
            Choose from our wide selection of high-quality gravel options for any project.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {products.map((product, index) => (
            <Card key={index} className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="relative h-48 bg-gray-200 flex items-center justify-center">
                <img
                  src={product.image}
                  alt={product.title}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    const parent = target.parentElement;
                    if (parent) {
                      const icon = parent.querySelector('.fallback-icon');
                      if (icon) {
                        (icon as HTMLElement).style.display = 'block';
                      }
                    }
                  }}
                />
                <ImageIcon 
                  className="fallback-icon w-16 h-16 text-gray-400 absolute" 
                  style={{ display: 'none' }}
                />
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-6 text-white">
                <h3 className="text-xl font-bold mb-2">{product.title}</h3>
                <p className="text-sm opacity-90">{product.description}</p>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center">
          <Link to="/shop">
            <Button 
              size="lg" 
              className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-3"
            >
              View All Products & Pricing
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default TopProducts;