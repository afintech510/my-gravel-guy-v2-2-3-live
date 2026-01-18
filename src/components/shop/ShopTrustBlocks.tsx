
import React from 'react';
import { Mountain, Handshake, RotateCcw, Globe } from 'lucide-react';
import ShopContentBlock from './ShopContentBlock';

const ShopTrustBlocks = () => {
  const trustBlocks = [
    {
      icon: <Mountain className="h-6 w-6 text-primary" />,
      title: "Get Back to the Good Stuff",
      subtitle: "Rock. Dirt. Work you can feel.",
      description: "We make it easy to source bulk landscaping materials—gravel, sand, mulch, topsoil—delivered straight to your driveway. Whether you're laying a walkway or leveling your backyard, we help you reconnect with the joy of shaping the land."
    },
    {
      icon: <Handshake className="h-6 w-6 text-primary" />,
      title: "Built on Trust, Delivered with Care",
      subtitle: "Quality materials from real, local suppliers.",
      description: "We work with trusted partners in your area and vet every product to ensure reliability, consistency, and fair pricing. No middlemen. No surprises. Just what you need—on time and hassle-free."
    },
    {
      icon: <RotateCcw className="h-6 w-6 text-primary" />,
      title: "A Smarter Gravel Marketplace",
      subtitle: "Connecting customers and suppliers like never before.",
      description: "We're not just selling dirt—we're building a national supply network using AI to automate logistics, optimize deliveries, and keep costs low. Think of us as your gravel guy, but smarter, faster, and everywhere."
    },
    {
      icon: <Globe className="h-6 w-6 text-primary" />,
      title: "Powering Local Business with Every Order",
      subtitle: "Buy local. Get nationwide reach.",
      description: "Your order supports nearby haulers and yards. We empower small businesses by giving them access to more customers—and you get better service because it's coming from people who know your zip code, weather, and roads."
    }
  ];

  return (
    <section className="py-16 px-4 bg-background">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 text-foreground">Why Choose My Gravel Guy</h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            More than just materials—we're building the future of landscape supply
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {trustBlocks.map((block, index) => (
            <ShopContentBlock
              key={index}
              icon={block.icon}
              title={block.title}
              subtitle={block.subtitle}
              description={block.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default ShopTrustBlocks;
