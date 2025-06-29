
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Product } from '@/services/productTypes';

interface ProductTabsProps {
  product: Product;
}

const ProductTabs = ({ product }: ProductTabsProps) => {
  return (
    <div className="mt-16">
      <Tabs defaultValue="details">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="specifications">Specifications</TabsTrigger>
          <TabsTrigger value="delivery">Delivery Info</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="prose prose-gray max-w-none mt-6">
          <div dangerouslySetInnerHTML={{ __html: product.description }} />
        </TabsContent>
        
        <TabsContent value="specifications" className="mt-6">
          <h3 className="text-xl font-semibold mb-4">Specifications</h3>
        </TabsContent>
        
        <TabsContent value="delivery" className="mt-6">
          <h3 className="text-xl font-semibold mb-4">Delivery Information</h3>
          <ul className="list-disc list-inside space-y-2 text-gray-600">
            <li>Minimum 72-hour lead time required for all deliveries</li>
            <li>Delivery available Monday through Friday</li>
            <li>Morning (8am-12pm) and afternoon (12pm-4pm) delivery windows</li>
            <li>Someone must be present to accept delivery</li>
          </ul>
        </TabsContent>
        
        <TabsContent value="faq" className="mt-6">
          <h3 className="text-xl font-semibold mb-4">Frequently Asked Questions</h3>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ProductTabs;
