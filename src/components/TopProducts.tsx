import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const TopProducts = () => {
  const products = [
    {
      name: "Driveway Gravel",
      description: "Perfect for driveways and high-traffic areas",
      slug: "driveway-gravel",
      image: "https://losrkjvrcambvgijfism.supabase.co/storage/v1/object/public/images//driveway-gravel-3-4_cat.jpg"
    },
    {
      name: "Pea Gravel",
      description: "Smooth, rounded stones ideal for walkways",
      slug: "pea-gravel", 
      image: "https://losrkjvrcambvgijfism.supabase.co/storage/v1/object/public/images//3-8-Natural-Pea-Gravel-EDIT.jpg"
    },
    {
      name: "River Rock",
      description: "Decorative option for landscaping features",
      slug: "river-rock-large-2-3in-gravel",
      image: "https://losrkjvrcambvgijfism.supabase.co/storage/v1/object/public/images//river-rocks.png"
    }
  ];

  return (
    <section className="py-16 px-4 bg-card border-y border-border">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Explore Products
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose from our wide selection of high-quality gravel options for any project.
          </p>
        </div>

        {/* Product Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {products.map((product, index) => (
            <Link 
              key={index}
              to={`/products/${product.slug}`}
              className="group block"
            >
              <div className="relative h-64 rounded-lg overflow-hidden bg-muted transition-transform duration-300 group-hover:scale-105">
                {/* Background Image */}
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
                
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                
                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="text-xl font-bold mb-2">{product.name}</h3>
                  <p className="text-sm text-white/90">{product.description}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
            <Link to="/shop">
              View All Products & Pricing
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default TopProducts;
