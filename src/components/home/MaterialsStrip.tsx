import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight } from 'lucide-react';

const materials = [
  "#57 Stone",
  "3/4\" Clean",
  "1 1/2\" Clean", 
  "Crusher Run/Road Base",
  "RCA (Recycled Concrete)",
  "Asphalt Millings",
  "Screenings/Stone Dust",
  "Mason Sand",
  "Concrete Sand",
  "Fill Dirt",
  "Topsoil",
  "Rip Rap"
];

const MaterialsStrip = () => {
  return (
    <section className="py-12 md:py-16 px-4 bg-card border-y border-border">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold font-montserrat text-foreground mb-2">
            Common Materials We Deliver
          </h2>
          <p className="text-muted-foreground font-montserrat">
            Aggregates, sand, soil, and more — delivered to your job site
          </p>
        </div>
        
        <div className="flex flex-wrap justify-center gap-2 md:gap-3 mb-8">
          {materials.map((material) => (
            <Badge 
              key={material}
              variant="outline"
              className="bg-background hover:bg-accent border-border text-foreground px-4 py-2 text-sm font-medium font-montserrat cursor-pointer transition-colors"
            >
              {material}
            </Badge>
          ))}
        </div>
        
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/shop">
            <Button 
              variant="outline" 
              className="font-montserrat border-border hover:bg-accent"
            >
              See All Materials
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
          <Link to="/contact">
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-montserrat font-semibold">
              Get Quote
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default MaterialsStrip;
