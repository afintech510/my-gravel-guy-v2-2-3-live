
import { CheckCircle, Shield, Truck, ShoppingCart, Award, Star } from "lucide-react";
import { LucideIcon } from "lucide-react";

export interface TrustBadgeItem {
  title: string;
  description?: string;
  icon: LucideIcon;
}

export const trustItems: TrustBadgeItem[] = [
  {
    title: "Free Delivery",
    description: "Direct to your project site",
    icon: Truck
  },
  {
    title: "Quality Checked",
    description: "Premium materials guaranteed",
    icon: CheckCircle
  },
  {
    title: "Secure Checkout",
    description: "Safe & protected transactions",
    icon: Shield
  },
  {
    title: "Hassle-Free Ordering",
    description: "Simple selection process",
    icon: ShoppingCart
  },
  {
    title: "Top Tier Aggregates",
    description: "Industry-leading materials",
    icon: Award
  },
  {
    title: "Years of Experience",
    description: "Trusted industry expertise",
    icon: Star
  }
];
