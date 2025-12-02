"use client";

import { Search, Filter } from "lucide-react";

type SearchFilterProps = {
  onSearch: (query: string) => void;
  onFilterChange: (category: string) => void;
  categories: string[];
};

export default function SearchFilter({ onSearch, onFilterChange, categories }: SearchFilterProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Search items..."
          onChange={(e) => onSearch(e.target.value)}
          className="w-full rounded-lg border border-white/10 bg-roblox-card py-2.5 pl-10 pr-4 text-sm text-white placeholder-roblox-textSecondary focus:border-roblox-blue focus:outline-none focus:ring-1 focus:ring-roblox-blue"
        />
      </div>
      
      <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
        <Filter className="h-4 w-4 text-roblox-textSecondary" />
        <button
          onClick={() => onFilterChange("all")}
          className="whitespace-nowrap rounded-full border border-white/10 bg-roblox-card px-4 py-1.5 text-sm text-roblox-textSecondary hover:bg-white/10 hover:text-white focus:border-roblox-blue focus:text-roblox-blue"
        >
          All
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => onFilterChange(cat)}
            className="whitespace-nowrap rounded-full border border-white/10 bg-roblox-card px-4 py-1.5 text-sm text-roblox-textSecondary hover:bg-white/10 hover:text-white focus:border-roblox-blue focus:text-roblox-blue"
          >
            {cat}
          </button>
        ))}
      </div>
    </div>
  );
}
