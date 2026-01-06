import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Product } from '@/types';

interface TopSellingProduct extends Product {
  totalSold?: number;
}

export function useTopSellingProducts(limit: number = 10) {
  const [products, setProducts] = useState<TopSellingProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchTopSelling() {
      try {
        setLoading(true);
        const res = await api.get(`/api/products/top-selling?limit=${limit}`);
        const data = res.data as { products: TopSellingProduct[] };
        setProducts(data.products || []);
      } catch (err) {
        console.error("Failed to fetch top selling products:", err);
        setError('Failed to fetch top selling products');
      } finally {
        setLoading(false);
      }
    }
    fetchTopSelling();
  }, [limit]);

  return { products, loading, error };
}
