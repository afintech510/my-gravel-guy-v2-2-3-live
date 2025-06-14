
import React from 'react';
import { Button } from "@/components/ui/button";
import { Truck } from "lucide-react";

export const WhatHappensNextSection: React.FC = () => {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold mb-4">What Happens Next?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-lg border">
            <div className="flex items-center mb-3">
              <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold mr-2">1</span>
              <h3 className="font-medium">Order Processing</h3>
            </div>
            <p className="text-sm text-gray-600">
              We've received your order and are preparing your delivery. You'll receive a confirmation email soon.
            </p>
          </div>
          
          <div className="bg-white p-5 rounded-lg border">
            <div className="flex items-center mb-3">
              <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold mr-2">2</span>
              <h3 className="font-medium">Delivery Preparation</h3>
            </div>
            <p className="text-sm text-gray-600">
              Our team will prepare your materials and schedule the delivery for your selected date.
            </p>
          </div>
          
          <div className="bg-white p-5 rounded-lg border">
            <div className="flex items-center mb-3">
              <span className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold mr-2">3</span>
              <h3 className="font-medium">Delivery</h3>
            </div>
            <p className="text-sm text-gray-600">
              On your scheduled delivery date, our driver will deliver your materials to the specified location.
            </p>
          </div>
        </div>
      </div>
      
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
        <div className="flex items-center gap-3 mb-4">
          <Truck className="h-5 w-5 text-blue-600" />
          <h2 className="text-xl font-semibold">Delivery Information</h2>
        </div>
        <p className="mb-4">
          If you need to make any changes to your delivery details or have questions about your order, 
          please contact our customer service team as soon as possible.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium mb-2">Customer Service</h3>
            <p className="text-sm">Phone: (555) 123-4567</p>
            <p className="text-sm">Email: support@mygravelguy.com</p>
            <p className="text-sm">Hours: Mon-Fri, 8am-5pm</p>
          </div>
          <div>
            <h3 className="font-medium mb-2">Need Help?</h3>
            <p className="text-sm mb-2">Have questions about your delivery or need assistance?</p>
            <Button variant="outline" asChild>
              <a href="/contact">Contact Support</a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
