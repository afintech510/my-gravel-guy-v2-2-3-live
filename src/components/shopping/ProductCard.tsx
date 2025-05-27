
import React from 'react';
import { Button } from '@/components/ui/button';
import { Product } from '@/services/productTypes';
import { Plus, Minus } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ProductCardProps {
  product: Product;
  quantity: number;
  totalPrice: number;
  onQuantityChange: (productId: string, change: number) => void;
  onAddToCart: (product: Product) => void;
  getProductImage: (product: Product) => string;
}

const ProductCard: React.FC<ProductCardProps> = ({
  product,
  quantity,
  totalPrice,
  onQuantityChange,
  onAddToCart,
  getProductImage
}) => {
  const cubicYards = Math.round(quantity / (product.tonYardRatio || 1.5) * 10) / 10;

  return (
    <div className="border rounded-lg p-4">
      {/* Mobile Layout */}
      <div className="md:hidden space-y-4">
        <div className="flex items-start gap-3">
          <img 
            src={getProductImage(product)} 
            alt={product.name} 
            className="w-16 h-16 object-cover rounded-md flex-shrink-0" 
          />
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-sm leading-tight">{product.name}</h4>
            {product.size && <p className="text-xs text-gray-500 mt-1">{product.size}</p>}
            <Link 
              to={`/products/${product.slug}`} 
              className="text-xs text-blue-600 hover:text-blue-800 mt-1 inline-block"
            >
              More Details...
            </Link>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center border rounded-md">
            <button 
              onClick={() => onQuantityChange(product.id.toString(), -1)} 
              className="p-2 hover:bg-gray-100" 
              disabled={quantity <= 1}
            >
              <Minus className="h-3 w-3" />
            </button>
            <div className="px-3 py-2 text-center">
              <div className="text-sm font-medium">{quantity} tons</div>
              <div className="text-xs text-gray-500">≡ {cubicYards} yd³</div>
            </div>
            <button 
              onClick={() => onQuantityChange(product.id.toString(), 1)} 
              className="p-2 hover:bg-gray-100"
            >
              <Plus className="h-3 w-3" />
            </button>
          </div>

          <div className="text-right">
            <div className="text-lg font-bold">${totalPrice.toFixed(2)}</div>
            <Button 
              onClick={() => onAddToCart(product)} 
              className="bg-green-500 hover:bg-green-600 text-white mt-1" 
              size="sm"
            >
              Add to Cart
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden md:flex items-center gap-4">
        <img 
          src={getProductImage(product)} 
          alt={product.name} 
          className="w-16 h-16 object-cover rounded-md flex-shrink-0" 
        />
        
        <div className="flex-1">
          <h4 className="font-semibold">{product.name}</h4>
          {product.size && <p className="text-sm text-gray-500">{product.size}</p>}
          <Link 
            to={`/products/${product.slug}`} 
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            More Details...
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center border rounded-md">
            <button 
              onClick={() => onQuantityChange(product.id.toString(), -1)} 
              className="p-2 hover:bg-gray-100" 
              disabled={quantity <= 1}
            >
              <Minus className="h-4 w-4" />
            </button>
            <div className="px-4 py-2 text-center">
              <div className="font-medium">{quantity} tons</div>
              <div className="text-xs text-gray-500">≡ {cubicYards} yd³</div>
            </div>
            <button 
              onClick={() => onQuantityChange(product.id.toString(), 1)} 
              className="p-2 hover:bg-gray-100"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          <div className="text-right">
            <div className="text-lg font-bold">${totalPrice.toFixed(2)}</div>
            <Button 
              onClick={() => onAddToCart(product)} 
              className="bg-green-500 hover:bg-green-600 text-white mt-1" 
              size="sm"
            >
              Add to Cart
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
