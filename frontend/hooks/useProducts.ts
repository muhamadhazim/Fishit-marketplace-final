import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Product } from '@/types';

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProducts() {
      try {
        setLoading(true);
        const res = await api.get('/api/products');
        // Type assertion to ensure we handle the response structure correctly
        const data = res.data as { products: Product[] };
        setProducts(data.products || []);
      } catch (err) {
        console.error("Failed to fetch products:", err);
        setError('Failed to fetch products');
      } finally {
        setLoading(false);
      }
    }
    fetchProducts();
  }, []);

  return { products, loading, error };
}
