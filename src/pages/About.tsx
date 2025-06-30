
import React from 'react';
import ZipCodeSearch from '../components/zip-code/ZipCodeSearch';
import { CheckCircle, Truck, DollarSign, HeadphonesIcon, MapPin, Users, MessageCircle, Camera, Shield } from 'lucide-react';

const About = () => {
  const features = [
    {
      icon: <DollarSign className="h-6 w-6 text-primary" />,
      title: "Transparent, Instant Pricing",
      description: "Enter your zip code, choose your product, and get clear pricing—including delivery—in seconds. No hidden fees. No back-and-forth quotes."
    },
    {
      icon: <Truck className="h-6 w-6 text-primary" />,
      title: "Nationwide Delivery",
      description: "Whether you're refreshing your backyard or managing multiple job sites, we deliver bulk materials anywhere in the U.S., on your schedule."
    },
    {
      icon: <Camera className="h-6 w-6 text-primary" />,
      title: "Personalized Order Follow-Through",
      description: "We'll send real photos of the material you're receiving, verify your delivery address and access instructions, and make sure everything is 100% correct."
    },
    {
      icon: <Shield className="h-6 w-6 text-primary" />,
      title: "High-Quality Materials, Handled Right",
      description: "We partner with a trusted network of local suppliers to ensure quality, consistency, and on-time delivery."
    }
  ];

  const stats = [
    {
      icon: <MapPin className="h-8 w-8 text-primary" />,
      label: "Nationwide Service",
      value: "All 50 States"
    },
    {
      icon: <Users className="h-8 w-8 text-primary" />,
      label: "We Serve",
      value: "Homeowners & Pros"
    },
    {
      icon: <MessageCircle className="h-8 w-8 text-primary" />,
      label: "Real Support",
      value: "Every Step"
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
                About MyGravelGuy.com
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed mb-6">
                We believe ordering gravel, mulch, topsoil, or fill dirt should be as simple as buying anything else online. No more guessing prices, chasing down suppliers, or worrying about whether your delivery will show up on time.
              </p>
              <div className="mt-8 p-6 bg-primary/10 rounded-lg border-l-4 border-primary">
                <p className="text-gray-700 font-medium">
                  We're here to take the hassle out of bulk material delivery—nationwide. We serve <strong>homeowners, contractors, landscapers, and developers</strong> with one clear goal: make ordering bulk landscaping and construction materials easy, fast, and frustration-free.
                </p>
              </div>
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-800">
                  <strong>Business Information:</strong> MyGravelGuy.com is a service provided by Eastern Building Supply Inc.
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
            <h2 className="text-4xl font-bold mb-6">What Makes Us Different?</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              From your first click to your last delivery, we've got your back with a reliable, transparent, online-first platform backed by real people who care about your project as much as you do.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-4 p-6 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                <div className="flex-shrink-0 p-2 bg-white rounded-lg shadow-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2" />
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
            <h3 className="text-2xl font-bold mb-4">From Premium Materials to Perfect Delivery</h3>
            <p className="text-lg text-gray-700 mb-6">
              From crushed concrete gravel and river rock to clean fill dirt, rich topsoil, and premium mulch—we deliver quality materials that meet your project's exact specifications, every time.
            </p>
            <div className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-3 rounded-lg font-semibold">
              <CheckCircle className="h-5 w-5" />
              Let's get it delivered.
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Why We Exist</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              We started MyGravelGuy.com because we saw how outdated and frustrating bulk material ordering could be—especially for homeowners and smaller contractors. Too many delays. Too much confusion. Too little accountability.
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

      {/* Mission Statement */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="bg-gradient-to-r from-gray-900 to-gray-700 text-white rounded-xl p-12">
            <h2 className="text-3xl font-bold mb-6">So We Built a Better Way</h2>
            <p className="text-xl mb-4 text-gray-200">
              A reliable, transparent, online-first platform backed by real people who care about your project as much as you do.
            </p>
            <div className="flex justify-center items-center gap-2 text-primary mt-6">
              <Users className="h-5 w-5" />
              <span className="font-medium">Real people, real support, every step of the way</span>
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
