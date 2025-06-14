
import { useEffect, useState } from "react";
import { getProductById } from "@/services/productService";

export interface ProductNameResolutionItem {
  productId: string | number;
  fallbackName?: string;
}

/**
 * Resolves an array of product IDs (with optional fallbackName)
 * to their full product names from the product service/cache.
 */
export const useProductNameResolver = (
  items: ProductNameResolutionItem[] | undefined
) => {
  const [names, setNames] = useState<{ [key: string]: string }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (!items || items.length === 0) {
      setNames({});
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    Promise.all(
      items.map(async item => {
        try {
          const product = await getProductById(item.productId);
          return [
            item.productId,
            product?.name ||
              item.fallbackName || // fallback from order row
              item.productId?.toString() // fallback: stringified ID
          ];
        } catch (err) {
          return [
            item.productId,
            item.fallbackName || "Unresolved Product"
          ];
        }
      })
    )
      .then(results => {
        if (!isMounted) return;
        const resolved: { [key: string]: string } = {};
        results.forEach(([id, name]) => {
          resolved[id] = name;
        });
        setNames(resolved);
        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError("Failed to resolve some product names.");
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [items?.length, JSON.stringify(items)]);

  return { names, loading, error };
};
