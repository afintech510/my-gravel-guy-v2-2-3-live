import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";

import QuoteForm from '@/components/forms/QuoteForm';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });
  const {
    toast
  } = useToast();
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const {
      name,
      value
    } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would send the form data to a server
    console.log('Form submitted:', formData);
    toast({
      title: "Message sent!",
      description: "We'll get back to you as soon as possible."
    });
    setFormData({
      name: '',
      email: '',
      message: ''
    });
  };
  return (
    <div className="min-h-screen bg-background">
      <div className="py-20 px-4 bg-card border-b border-border">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">Get a Quote</h1>
          <p className="text-xl text-muted-foreground">
            Fill out the form below and we'll get back to you with a custom quote for your material needs.
          </p>
        </div>
      </div>
      
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 gap-12">
            <div className="bg-card rounded-lg shadow-sm border border-border p-6">
              <QuoteForm />
            </div>
            
            <div>
              <h2 className="text-3xl font-bold mb-6 text-foreground">Contact Information</h2>
              <div className="space-y-6">
                <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                  <p className="text-foreground font-medium text-sm">
                    <strong>Business Entity:</strong> MyGravelGuy.com is a service provided by Eastern Building Supply Inc.
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-foreground">Email</h3>
                  <p className="text-muted-foreground">support@mygravelguy.com</p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-foreground">Phone</h3>
                  <p className="text-muted-foreground">(844) 624-0400</p>
                </div>
                
                <div>
                  <h3 className="text-lg font-semibold mb-2 text-foreground">Hours (Eastern Daylight Time)</h3>
                  <p className="text-muted-foreground">Monday - Friday: 8am - 5pm</p>
                  <p className="text-muted-foreground">Saturday: 8am - 1pm</p>
                </div>
                
                <div className="mt-8">
                  <h3 className="text-lg font-semibold mb-2 text-foreground">Frequently Asked Questions</h3>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-foreground">What areas do you service?</h4>
                      <p className="text-sm text-muted-foreground">We deliver to most areas across the United States. Enter your ZIP code to check availability.</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">How is pricing calculated?</h4>
                      <p className="text-sm text-muted-foreground">Pricing is based on material type, volume, and delivery distance.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
    </div>
  );
};

export default Contact;
