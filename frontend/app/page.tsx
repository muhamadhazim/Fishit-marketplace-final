"use client";

import Hero from "@/components/ui/Hero";
import GameCard from "@/components/ui/GameCard";
import SearchFilter from "@/components/ui/SearchFilter";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";

type Product = {
  id: string;
  name: string;
  price: number;
  image_url: string;
  specifications: Record<string, unknown>;
  category: { name: string; slug: string } | null;
};

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await api.get('/api/products');
        const data = res.data as { products: Product[] };
        setProducts(data.products);
        setFilteredProducts(data.products);
        
        // Extract unique categories
        const cats = Array.from(new Set(data.products.map(p => p.category?.name).filter(Boolean))) as string[];
        setCategories(cats);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      }
    }
    fetchProducts();
  }, []);

  const handleSearch = (query: string) => {
    const lowerQuery = query.toLowerCase();
    const filtered = products.filter(p => 
      p.name.toLowerCase().includes(lowerQuery) || 
      p.category?.name.toLowerCase().includes(lowerQuery)
    );
    setFilteredProducts(filtered);
  };

  const handleFilterChange = (category: string) => {
    if (category === "all") {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(p => p.category?.name === category);
      setFilteredProducts(filtered);
    }
  };

  return (
    <main className="mx-auto max-w-6xl p-6 min-h-screen">
      <Hero />
      <section id="market" className="py-16">
        <h2 className="mb-8 text-3xl font-bold text-center text-slate-100">
          Trending Marketplace
        </h2>
        
        <SearchFilter 
          onSearch={handleSearch} 
          onFilterChange={handleFilterChange} 
          categories={categories} 
        />

        {filteredProducts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-xl text-slate-400">No products found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {filteredProducts.map((p) => (
              <GameCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
