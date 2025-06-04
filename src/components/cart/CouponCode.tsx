import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, X, Tag, ChevronDown, ChevronUp } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';

interface CouponCodeProps {
  onCouponApplied?: (code: string, discount: number) => void;
}

// Sample coupon codes for demonstration
const COUPON_CODES = {
  'SAVE10': { discount: 10, type: 'percentage' as const, description: '10% off your order' },
  'WELCOME20': { discount: 20, type: 'percentage' as const, description: '20% off for new customers' },
  'FLAT50': { discount: 50, type: 'fixed' as const, description: '$50 off your order' },
  'FREE25': { discount: 25, type: 'fixed' as const, description: '$25 off your order' },
  'MEGA99': { discount: 99, type: 'percentage' as const, description: '99% off your order - Special promotion!' }
};

const CouponCode: React.FC<CouponCodeProps> = ({ onCouponApplied }) => {
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const { items, updateDeliveryDetails, total } = useCart();
  const { toast } = useToast();

  const calculateDiscount = (code: string, orderTotal: number) => {
    const coupon = COUPON_CODES[code as keyof typeof COUPON_CODES];
    if (!coupon) return 0;

    if (coupon.type === 'percentage') {
      return Math.min(orderTotal * (coupon.discount / 100), orderTotal);
    } else {
      return Math.min(coupon.discount, orderTotal);
    }
  };

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;

    setIsApplying(true);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 500));

    const upperCode = couponCode.toUpperCase();
    const coupon = COUPON_CODES[upperCode as keyof typeof COUPON_CODES];

    if (coupon) {
      const discount = calculateDiscount(upperCode, total);
      setAppliedCoupon(upperCode);
      setCouponDiscount(discount);
      setIsExpanded(false);
      
      // Apply coupon to all items in cart
      items.forEach(item => {
        const itemDiscount = discount * (item.price * item.tons / total);
        updateDeliveryDetails(item.id, {
          couponApplied: true,
          couponAmount: itemDiscount
        });
      });

      onCouponApplied?.(upperCode, discount);

      toast({
        title: "Coupon Applied!",
        description: `${coupon.description} - You saved $${discount.toFixed(2)}`,
        className: "border-green-500 border-2 shadow-[0_0_15px_rgba(20,255,106,0.5)]"
      });
    } else {
      toast({
        variant: "destructive",
        title: "Invalid Coupon",
        description: "The coupon code you entered is not valid or has expired.",
      });
    }

    setIsApplying(false);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponCode('');
    
    // Remove coupon from all items in cart
    items.forEach(item => {
      updateDeliveryDetails(item.id, {
        couponApplied: false,
        couponAmount: 0
      });
    });

    toast({
      title: "Coupon Removed",
      description: "The coupon has been removed from your order.",
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      applyCoupon();
    }
  };

  return (
    <div className="mt-4">
      {appliedCoupon ? (
        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">
              Coupon "{appliedCoupon}" applied
            </span>
            <span className="text-sm text-green-600">
              (-${couponDiscount.toFixed(2)})
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={removeCoupon}
            className="h-auto p-1 text-green-600 hover:text-green-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <>
          <Button
            variant="ghost"
            className="w-full text-blue-600 hover:text-blue-700 p-2 h-auto"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            <Tag className="mr-2 h-4 w-4" />
            <span className="flex-1 text-left">Have a coupon code?</span>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>

          {isExpanded && (
            <div className="mt-2 p-4 border border-gray-200 rounded-md bg-gray-50">
              <div className="flex gap-2">
                <Input
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1"
                />
                <Button
                  onClick={applyCoupon}
                  disabled={!couponCode.trim() || isApplying}
                  className="px-6"
                >
                  {isApplying ? 'Applying...' : 'Apply'}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Try: SAVE10, WELCOME20, FLAT50, FREE25, or MEGA99
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default CouponCode;
