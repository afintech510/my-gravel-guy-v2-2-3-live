import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Phone, 
  MapPin, 
  CreditCard, 
  Zap, 
  Percent,
  Shield,
  Truck,
  Headphones,
  FileCheck
} from 'lucide-react';

const benefitChips = [
  { label: "Single Point of Contact", icon: Phone },
  { label: "Multi-City Projects", icon: MapPin },
  { label: "PO / Card / Invoice", icon: CreditCard },
  { label: "Expedited Options", icon: Zap },
  { label: "Annual % Credit Rewards", icon: Percent },
];

const rewardsStats = [
  { label: "Priority Dispatch", icon: Truck },
  { label: "Nationwide Network", icon: MapPin },
  { label: "Dedicated Support", icon: Headphones },
  { label: "Clean Closeout", icon: FileCheck },
];

const ContractorHero = () => {
  return (
    <section 
      className="relative py-16 md:py-24 px-4 bg-cover bg-center bg-no-repeat overflow-hidden"
      style={{
        backgroundImage: "linear-gradient(to right, hsl(var(--background)) 0%, hsl(var(--background) / 0.85) 40%, hsl(var(--background) / 0.6) 100%), url('https://losrkjvrcambvgijfism.supabase.co/storage/v1/object/public/images//loader-with-driveway-gravel.png')"
      }}
    >
      {/* Subtle glow effect */}
      <div className="absolute top-0 right-0 w-1/2 h-1/2 bg-primary/5 blur-[120px] rounded-full" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-5 gap-8 lg:gap-12 items-start">
          {/* Left content - 3 cols */}
          <div className="lg:col-span-3 space-y-6">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold font-montserrat leading-tight text-foreground">
              Nationwide Aggregate Delivery for{' '}
              <span className="text-primary">Contractors</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground font-montserrat max-w-2xl">
              One point of contact for sourcing + trucking. Expedited options, job-site scheduling, and annual rewards credit.
            </p>
            
            {/* Benefit chips */}
            <div className="flex flex-wrap gap-2 pt-2">
              {benefitChips.map((chip) => (
                <Badge 
                  key={chip.label}
                  variant="outline"
                  className="bg-card/50 backdrop-blur-sm border-border text-foreground px-3 py-1.5 text-sm font-medium font-montserrat"
                >
                  <chip.icon className="h-3.5 w-3.5 mr-1.5 text-primary" />
                  {chip.label}
                </Badge>
              ))}
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <Link to="/shop">
                <Button 
                  size="lg" 
                  className="w-full sm:w-auto bg-primary text-primary-foreground hover:bg-primary/90 font-montserrat font-semibold text-base px-8"
                >
                  Order Material Now
                </Button>
              </Link>
              <Link to="/contact">
                <Button 
                  size="lg" 
                  variant="outline"
                  className="w-full sm:w-auto font-montserrat font-medium text-base px-8 border-border hover:bg-accent"
                >
                  Get a Fast Quote
                </Button>
              </Link>
            </div>
            
            {/* Tertiary link */}
            <div className="pt-1">
              <Link 
                to="/product-calculator" 
                className="text-primary hover:text-primary/80 text-sm font-medium font-montserrat underline underline-offset-4 transition-colors"
              >
                Open Calculator →
              </Link>
            </div>
          </div>
          
          {/* Right: Rewards Card - 2 cols */}
          <div className="lg:col-span-2">
            <div className="bg-card/80 backdrop-blur-md border border-border rounded-xl p-6 shadow-lg">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <Shield className="h-4 w-4 text-primary" />
                </div>
                <h3 className="text-lg font-bold font-montserrat text-foreground">
                  Contractor Rewards Program
                </h3>
              </div>
              
              <p className="text-muted-foreground text-sm font-montserrat mb-5">
                Earn a % credit on total purchases and apply it to next year's material.
              </p>
              
              <div className="grid grid-cols-2 gap-3">
                {rewardsStats.map((stat) => (
                  <div 
                    key={stat.label}
                    className="bg-background/50 border border-border rounded-lg p-3 text-center"
                  >
                    <stat.icon className="h-5 w-5 text-primary mx-auto mb-1.5" />
                    <span className="text-xs font-medium text-foreground font-montserrat">
                      {stat.label}
                    </span>
                  </div>
                ))}
              </div>
              
              <Link to="/contractors" className="block mt-5">
                <Button 
                  variant="ghost" 
                  className="w-full text-primary hover:text-primary hover:bg-primary/10 font-montserrat text-sm"
                >
                  Learn More About Rewards →
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContractorHero;
