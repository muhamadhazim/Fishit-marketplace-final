"use client";

import Hero from "@/components/ui/Hero";
import GameCard from "@/components/ui/GameCard";
import SearchFilter from "@/components/ui/SearchFilter";
import { useState, useMemo } from "react";
import { useProducts } from "@/hooks/useProducts";

export default function Home() {
  const { products, loading } = useProducts();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const categories = useMemo(() => {
    return Array.from(new Set(products.map(p => p.category?.name).filter(Boolean))) as string[];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const lowerQuery = searchQuery.toLowerCase();
      const matchesSearch = p.name.toLowerCase().includes(lowerQuery) || 
                            p.category?.name.toLowerCase().includes(lowerQuery);
      const matchesCategory = selectedCategory === "all" || p.category?.name === selectedCategory;
      
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleFilterChange = (category: string) => {
    setSelectedCategory(category);
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

        {loading ? (
          <div className="text-center py-20">
            <p className="text-xl text-slate-400">Loading products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
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
