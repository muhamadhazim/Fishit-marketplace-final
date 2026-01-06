"use client";

import { useState, useMemo } from "react";
import { useProducts } from "@/hooks/useProducts";
import GameCard from "@/components/ui/GameCard";
import { Search, Filter, X, Package } from "lucide-react";

export default function ProductsPage() {
  const { products, loading } = useProducts();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Get unique categories
  const categories = useMemo(() => {
    return Array.from(new Set(products.map(p => p.category?.name).filter(Boolean))) as string[];
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const lowerQuery = searchQuery.toLowerCase();
      const matchesSearch = p.name.toLowerCase().includes(lowerQuery) ||
        p.category?.name?.toLowerCase().includes(lowerQuery);
      const matchesCategory = selectedCategory === "all" || p.category?.name === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredProducts.slice(start, start + itemsPerPage);
  }, [filteredProducts, currentPage]);

  // Reset to page 1 when filter changes
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("all");
    setCurrentPage(1);
  };

  return (
    <main className="mx-auto max-w-6xl p-6 min-h-screen">
      {/* Header */}
      <div className="py-8">
        <div className="flex items-center gap-3 mb-2">
          <Package className="w-10 h-10 text-cyan-400" />
          <h1 className="text-4xl font-bold text-white">Semua Produk</h1>
        </div>
        <p className="text-slate-400">Temukan berbagai produk game terbaik untuk kebutuhanmu</p>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-4 mb-8 border border-slate-700">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari produk..."
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => handleSearch("")}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="pl-12 pr-8 py-3 bg-slate-900/50 border border-slate-600 rounded-xl text-white appearance-none cursor-pointer focus:outline-none focus:border-cyan-500 transition-colors min-w-[180px]"
            >
              <option value="all">Semua Kategori</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          {(searchQuery || selectedCategory !== "all") && (
            <button
              onClick={clearFilters}
              className="px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl transition-colors flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Reset
            </button>
          )}
        </div>

        {/* Active Filters Info */}
        {(searchQuery || selectedCategory !== "all") && (
          <div className="mt-3 text-sm text-slate-400">
            Menampilkan {filteredProducts.length} produk
            {searchQuery && <span> untuk &quot;{searchQuery}&quot;</span>}
            {selectedCategory !== "all" && <span> di kategori {selectedCategory}</span>}
          </div>
        )}
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="text-center py-20">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-xl text-slate-400">Memuat produk...</p>
        </div>
      ) : paginatedProducts.length === 0 ? (
        <div className="text-center py-20">
          <Package className="w-16 h-16 mx-auto mb-4 text-slate-600" />
          <p className="text-xl text-slate-400 mb-2">Tidak ada produk ditemukan</p>
          <p className="text-slate-500">Coba ubah kata kunci atau filter pencarian</p>
          {(searchQuery || selectedCategory !== "all") && (
            <button
              onClick={clearFilters}
              className="mt-4 text-cyan-400 hover:text-cyan-300 font-medium"
            >
              Reset Filter
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {paginatedProducts.map((p) => (
              <GameCard key={p.id} product={p} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-12">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
              >
                Sebelumnya
              </button>

              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                      currentPage === page
                        ? "bg-cyan-600 text-white"
                        : "bg-slate-800 border border-slate-600 text-slate-300 hover:bg-slate-700"
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-700 transition-colors"
              >
                Selanjutnya
              </button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
