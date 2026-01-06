import { BarChart3, Package, Truck, Archive, CreditCard, Settings } from "lucide-react";

interface DashboardTabsProps {
    activeTab: "overview" | "paid" | "processing" | "history" | "payouts" | "settings";
    setActiveTab: (tab: "overview" | "paid" | "processing" | "history" | "payouts" | "settings") => void;
    viewOnly?: boolean;
}

export default function DashboardTabs({ activeTab, setActiveTab, viewOnly }: DashboardTabsProps) {
    return (
        <div className="flex gap-4 border-b border-white/10 pb-4 overflow-x-auto">
            <button
                onClick={() => setActiveTab("overview")}
                className={`px-4 py-2 font-bold rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
                    activeTab === "overview"
                        ? "bg-web3-accent-cyan/20 text-web3-accent-cyan border border-web3-accent-cyan/50"
                        : "text-web3-text-secondary hover:text-white hover:bg-white/5"
                }`}
            >
                <BarChart3 className="w-4 h-4" /> Ringkasan
            </button>
            <button
                onClick={() => setActiveTab("paid")}
                className={`px-4 py-2 font-bold rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
                    activeTab === "paid"
                        ? "bg-web3-accent-purple/20 text-web3-accent-purple border border-web3-accent-purple/50"
                        : "text-web3-text-secondary hover:text-white hover:bg-white/5"
                }`}
            >
                <Package className="w-4 h-4" /> Pesanan Baru
            </button>
            <button
                onClick={() => setActiveTab("processing")}
                className={`px-4 py-2 font-bold rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
                    activeTab === "processing"
                        ? "bg-blue-500/20 text-blue-400 border border-blue-500/50"
                        : "text-web3-text-secondary hover:text-white hover:bg-white/5"
                }`}
            >
                <Truck className="w-4 h-4" /> Diproses
            </button>
            <button
                onClick={() => setActiveTab("history")}
                className={`px-4 py-2 font-bold rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
                    activeTab === "history"
                        ? "bg-gray-700/50 text-white border border-gray-600"
                        : "text-web3-text-secondary hover:text-white hover:bg-white/5"
                }`}
            >
                <Archive className="w-4 h-4" /> Riwayat
            </button>
            <button
                onClick={() => setActiveTab("payouts")}
                className={`px-4 py-2 font-bold rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
                    activeTab === "payouts"
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/50"
                        : "text-web3-text-secondary hover:text-white hover:bg-white/5"
                }`}
            >
                <CreditCard className="w-4 h-4" /> Pencairan
            </button>
            {!viewOnly && (
                <button
                    onClick={() => setActiveTab("settings")}
                    className={`px-4 py-2 font-bold rounded-xl flex items-center gap-2 whitespace-nowrap transition-all ${
                        activeTab === "settings"
                            ? "bg-pink-500/20 text-pink-400 border border-pink-500/50"
                            : "text-web3-text-secondary hover:text-white hover:bg-white/5"
                    }`}
                >
                    <Settings className="w-4 h-4" /> Pengaturan
                </button>
            )}
        </div>
    );
}