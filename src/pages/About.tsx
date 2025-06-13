
import React from 'react';
import ZipCodeSearch from '../components/zip-code/ZipCodeSearch';
import { CheckCircle, Truck, DollarSign, HeadphonesIcon, MapPin, Users, MessageCircle } from 'lucide-react';

const About = () => {
  const features = [
    {
      icon: <Truck className="h-6 w-6 text-primary" />,
      title: "Free delivery on every order",
      description: "No hidden fees or delivery charges"
    },
    {
      icon: <DollarSign className="h-6 w-6 text-primary" />,
      title: "Transparent pricing by location",
      description: "See exact costs upfront, no surprises"
    },
    {
      icon: <CheckCircle className="h-6 w-6 text-primary" />,
      title: "Top-rated materials vetted by real customers",
      description: "Quality guaranteed by customer reviews"
    },
    {
      icon: <HeadphonesIcon className="h-6 w-6 text-primary" />,
      title: "Dedicated support from a real team—not robots",
      description: "Personal assistance when you need it"
    }
  ];

  const stats = [
    {
      icon: <MapPin className="h-8 w-8 text-primary" />,
      label: "Based in the USA",
      value: "Nationwide Service"
    },
    {
      icon: <Truck className="h-8 w-8 text-primary" />,
      label: "1,000+ deliveries",
      value: "And Counting"
    },
    {
      icon: <MessageCircle className="h-8 w-8 text-primary" />,
      label: "Have a question?",
      value: "We're Here to Help"
    }
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="py-20 px-4 bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">
            {/* Text content - left side */}
            <div className="text-left md:w-1/2">
              <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                About My Gravel Guy
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                We're redefining how homeowners, contractors, and businesses get quality gravel, sand, mulch, and dirt—fast.
              </p>
              <div className="mt-8 p-6 bg-primary/10 rounded-lg border-l-4 border-primary">
                <p className="text-gray-700 font-medium">
                  We're not a traditional supply yard. We're a modern online platform that connects customers with trusted, local landscape material suppliers across the USA.
                </p>
              </div>
            </div>
            
            {/* Logo - right side */}
            <div className="md:w-1/2 flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl"></div>
                <img 
                  src="/lovable-uploads/4ed875b4-fd42-46f3-8b63-d65844a33ff0.png" 
                  alt="My Gravel Guy Logo" 
                  className="relative h-64 w-auto z-10"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Value Proposition Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-6">Why Choose My Gravel Guy?</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Whether you're upgrading a driveway, refreshing a garden path, or laying the foundation for a new build, we make ordering bulk materials simple, reliable, and affordable.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-4 p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-shrink-0 p-2 bg-white rounded-lg shadow-sm">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">No More Hassle</h3>
            <p className="text-lg text-gray-700 mb-6">
              No more calling around or waiting days for quotes. Just choose your product, enter your zip code, and order in minutes. We handle the sourcing and logistics so you get your delivery on time—every time.
            </p>
            <div className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold">
              <CheckCircle className="h-5 w-5" />
              Simple. Reliable. Affordable.
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Impact</h2>
            <p className="text-lg text-gray-600">
              We're proud to support local businesses and make landscaping easier for everyone, from DIYers to pros.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center p-6 bg-white rounded-lg shadow-sm">
                <div className="flex justify-center mb-4">
                  {stat.icon}
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-gray-900 to-gray-700 text-white rounded-xl p-12">
            <h2 className="text-3xl font-bold mb-6">Let's Get Your Project Moving</h2>
            <p className="text-xl mb-4 text-gray-200">
              – The My Gravel Guy Team
            </p>
            <div className="flex justify-center items-center gap-2 text-primary-foreground">
              <Users className="h-5 w-5" />
              <span className="font-medium">Real people, real support</span>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-16 px-4 bg-primary/5">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">Ready to Get Started?</h2>
          <p className="text-lg text-gray-600 mb-8">Check if we deliver to your area and start your project today.</p>
          <div className="max-w-md mx-auto">
            <ZipCodeSearch />
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;
