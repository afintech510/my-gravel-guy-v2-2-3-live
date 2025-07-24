import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Plus } from 'lucide-react';
import { getProducts } from '@/services/products/productQueries';
import { Product } from '@/services/productTypes';
import { useToast } from '@/hooks/use-toast';

interface ProductSelectorProps {
  onAddProduct: (product: Product & { unit: string }, quantity: number, customPrice?: number) => void;
}

export function ProductSelector({ onAddProduct }: ProductSelectorProps) {
  const [products, setProducts] = useState<(Product & { unit: string })[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<(Product & { unit: string }) | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [customPrice, setCustomPrice] = useState<number | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoading(true);
        const productData = await getProducts();
        // Transform products to include unit field
        const productsWithUnit = productData.map(product => ({
          ...product,
          unit: 'ton' // Default unit for all products
        }));
        setProducts(productsWithUnit);
      } catch (error) {
        console.error('Error loading products:', error);
        toast({
          title: "Error loading products",
          description: "Could not load product list. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, [toast]);

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAddProduct = () => {
    if (!selectedProduct) {
      toast({
        title: "No product selected",
        description: "Please select a product first.",
        variant: "destructive",
      });
      return;
    }

    if (quantity <= 0) {
      toast({
        title: "Invalid quantity",
        description: "Please enter a valid quantity.",
        variant: "destructive",
      });
      return;
    }

    onAddProduct(selectedProduct, quantity, customPrice);
    
    // Reset form
    setSelectedProduct(null);
    setQuantity(1);
    setCustomPrice(undefined);
    setSearchTerm('');

    toast({
      title: "Product added",
      description: `${selectedProduct.name} has been added to the order.`,
    });
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search products..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-8"
        />
      </div>

      {/* Product List */}
      <div className="max-h-60 overflow-y-auto space-y-2">
        {isLoading ? (
          <div className="text-center text-muted-foreground">Loading products...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center text-muted-foreground">
            {searchTerm ? 'No products found matching your search.' : 'No products available.'}
          </div>
        ) : (
          filteredProducts.map((product) => (
            <Card
              key={product.id}
              className={`cursor-pointer transition-colors ${
                selectedProduct?.id === product.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => setSelectedProduct(product)}
            >
              <CardContent className="p-3">
                <div className="flex justify-between items-center w-full">
                  <h4 className="font-medium">{product.name}</h4>
                  <span className="text-sm text-muted-foreground">${product.price.toFixed(2)} per {product.unit}</span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Add Product Form */}
      {selectedProduct && (
        <Card>
          <CardContent className="p-4 space-y-4">
            <div>
              <h4 className="font-medium">Selected: {selectedProduct.name}</h4>
              <p className="text-sm text-muted-foreground">
                Default price: ${selectedProduct.price.toFixed(2)} per {selectedProduct.unit}
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={quantity}
                  onChange={(e) => setQuantity(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div>
                <Label htmlFor="custom-price">Custom Price (optional)</Label>
                <Input
                  id="custom-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={customPrice || ''}
                  onChange={(e) => setCustomPrice(parseFloat(e.target.value) || undefined)}
                  placeholder={`Default: $${selectedProduct.price.toFixed(2)}`}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleAddProduct} className="w-full flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Product
                </Button>
              </div>
            </div>
            
            <div className="text-sm text-muted-foreground">
              Total: ${((customPrice || selectedProduct.price) * quantity).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}