"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { Users, ChevronDown, Check } from "lucide-react";

interface Seller {
    id: string;
    username: string;
    email: string;
}

interface SellerSelectorProps {
    selectedSellerId: string | null;
    onSelect: (sellerId: string | null) => void;
    label?: string;
}

export default function SellerSelector({ selectedSellerId, onSelect, label = "Select Seller" }: SellerSelectorProps) {
    const [sellers, setSellers] = useState<Seller[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        setLoading(true);
        api.get('/api/admin/users?role=seller')
           .then(res => setSellers(res.data.users))
           .catch(err => console.error("Failed to load sellers", err))
           .finally(() => setLoading(false));
    }, []);

    const selectedSeller = sellers.find(s => s.id === selectedSellerId);

    return (
        <div className="relative z-20">
            <div className="text-xs text-web3-text-secondary font-bold uppercase mb-1 ml-1">{label}</div>
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center justify-between w-[200px] bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-white/10 transition-all text-white"
            >
                <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-web3-accent-cyan" />
                    <span className="truncate">{selectedSeller ? selectedSeller.username : "All Sellers"}</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-web3-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
                    <div className="absolute top-full left-0 mt-2 w-[240px] max-h-[300px] overflow-y-auto glass-card border border-white/10 rounded-xl shadow-2xl z-20 p-2 space-y-1">
                        <button 
                            onClick={() => { onSelect(null); setIsOpen(false); }}
                            className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors ${!selectedSellerId ? 'bg-web3-accent-cyan/20 text-web3-accent-cyan' : 'hover:bg-white/5 text-web3-text-secondary hover:text-white'}`}
                        >
                            <Users className="w-4 h-4" />
                            <span>All Sellers</span>
                            {!selectedSellerId && <Check className="w-3.5 h-3.5 ml-auto" />}
                        </button>
                        
                        {loading && <div className="px-3 py-2 text-xs text-center text-web3-text-muted">Loading sellers...</div>}

                        {sellers.map(seller => (
                            <button 
                                key={seller.id}
                                onClick={() => { onSelect(seller.id); setIsOpen(false); }}
                                className={`flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm transition-colors ${selectedSellerId === seller.id ? 'bg-web3-accent-cyan/20 text-web3-accent-cyan' : 'hover:bg-white/5 text-web3-text-secondary hover:text-white'}`}
                            >
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center text-[10px] font-bold border border-white/10">
                                    {seller.username.substring(0,2).toUpperCase()}
                                </div>
                                <div className="text-left flex-1 min-w-0">
                                    <div className="truncate font-medium">{seller.username}</div>
                                    <div className="truncate text-[10px] text-web3-text-muted opacity-70">{seller.email}</div>
                                </div>
                                {selectedSellerId === seller.id && <Check className="w-3.5 h-3.5 ml-auto" />}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
