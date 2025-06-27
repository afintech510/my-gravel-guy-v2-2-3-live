
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Product } from '@/services/productTypes';

interface ProductTabsProps {
  product: Product;
}

const ProductTabs = ({ product }: ProductTabsProps) => {
  return (
    <Tabs defaultValue="details" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="details">Details</TabsTrigger>
        <TabsTrigger value="specifications">Specifications</TabsTrigger>
        <TabsTrigger value="uses">Uses</TabsTrigger>
      </TabsList>
      
      <TabsContent value="details" className="mt-6">
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Product Details</h3>
            <div 
              className="prose max-w-none text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: product.description }}
            />
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="specifications" className="mt-6">
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Specifications</h3>
            {product.specifications ? (
              <div className="space-y-3">
                {product.specifications.size && (
                  <div className="flex justify-between border-b pb-2">
                    <span className="font-medium">Size:</span>
                    <span>{product.specifications.size}</span>
                  </div>
                )}
                {product.specifications.color && (
                  <div className="flex justify-between border-b pb-2">
                    <span className="font-medium">Color:</span>
                    <span>{product.specifications.color}</span>
                  </div>
                )}
                {product.specifications.coverage && (
                  <div className="flex justify-between border-b pb-2">
                    <span className="font-medium">Coverage:</span>
                    <span>{product.specifications.coverage}</span>
                  </div>
                )}
                {product.tonYardRatio && (
                  <div className="flex justify-between border-b pb-2">
                    <span className="font-medium">Ton to Yard Ratio:</span>
                    <span>{product.tonYardRatio}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500">No specifications available for this product.</p>
            )}
          </CardContent>
        </Card>
      </TabsContent>
      
      <TabsContent value="uses" className="mt-6">
        <Card>
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold mb-4">Common Uses</h3>
            {product.uses && product.uses.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {product.uses.map((use, index) => (
                  <Badge key={index} variant="outline" className="text-sm">
                    {use}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No specific uses listed for this product.</p>
            )}
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
};

export default ProductTabs;
