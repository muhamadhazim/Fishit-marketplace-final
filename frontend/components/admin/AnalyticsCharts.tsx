"use client";

import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { api } from "@/lib/api";
import { DollarSign, ShoppingBag, TrendingUp, Package, Calendar as CalendarIcon, Filter } from "lucide-react";

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  successRate: number;
  revenueTrend: { date: string; revenue: number }[];
  topProducts: { name: string; sales: number; revenue: number }[];
}

interface AnalyticsChartsProps {
  sellerId?: string | null;
}

export default function AnalyticsCharts({ sellerId }: AnalyticsChartsProps) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  // Default to last 30 days
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const getPeriodLabel = () => {
    if (!startDate || !endDate) return "Periode Terpilih";
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays >= 29 && diffDays <= 31) return "30 Hari Terakhir";
    if (diffDays >= 6 && diffDays <= 7) return "7 Hari Terakhir";
    if (diffDays === 0) return "Hari Ini";
    return `${diffDays + 1} Hari`;
  };

  async function fetchData() {
    setLoading(true);
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      // set end to end of day
      end.setHours(23, 59, 59, 999);
      
      let query = `?startDate=${start.toISOString()}&endDate=${end.toISOString()}`;
      if (sellerId) {
          query += `&seller_id=${sellerId}`;
      }

      const res = await api.get("/api/transactions/analytics" + query);
      setData(res.data);
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, [sellerId]); // Re-fetch when seller changes or on mount

  // Auto-fetch when dates change is a bit aggressive but requested "apply" usually.
  // Actually the previous code had useEffect on [] only, relying on manual apply or auto?
  // Previous code had: useEffect(() => fetchData(), []);
  // But also the "Apply Filter" button calls fetchData.
  // Let's keep it simple: fetch on mount and on sellerId change.
  // Date changes wait for button click.

  if (loading && !data) {
     return <div className="animate-pulse h-64 glass-card rounded-2xl border border-white/10" />;
  }

  if (!data) return null;

  return (
    <div className="space-y-6 mb-8">
      {/* Date Filter & Summary Cards */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 mb-2">
         <h2 className="text-xl font-bold text-white">Ringkasan Dashboard</h2>

         <div className="flex flex-wrap items-center gap-2 bg-black/20 backdrop-blur-sm p-1.5 rounded-2xl border border-white/10 w-full xl:w-auto">
             <div className="relative group flex-1 xl:flex-none">
                 <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-web3-text-muted pointer-events-none group-focus-within:text-web3-accent-cyan transition-colors" />
                 <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full xl:w-auto bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-xl pl-10 pr-3 py-2 text-sm text-white focus:outline-none focus:border-web3-accent-cyan focus:ring-1 focus:ring-web3-accent-cyan/20 transition-all cursor-pointer"
                    style={{ colorScheme: "dark" }}
                 />
             </div>

             <span className="text-web3-text-muted font-bold hidden xl:block">-</span>

             <div className="relative group flex-1 xl:flex-none">
                 <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-web3-text-muted pointer-events-none group-focus-within:text-web3-accent-cyan transition-colors" />
                 <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full xl:w-auto bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-xl pl-10 pr-3 py-2 text-sm text-white focus:outline-none focus:border-web3-accent-cyan focus:ring-1 focus:ring-web3-accent-cyan/20 transition-all cursor-pointer"
                    style={{ colorScheme: "dark" }}
                 />
             </div>

             <button
                onClick={fetchData}
                disabled={loading}
                className="w-full xl:w-auto flex items-center justify-center gap-2 px-6 py-2 rounded-xl bg-gradient-to-r from-web3-accent-cyan to-blue-500 hover:to-blue-400 text-white font-bold text-sm shadow-lg shadow-cyan-500/20 hover:shadow-cyan-500/40 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
             >
                 {loading ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                 ) : (
                    <Filter className="w-4 h-4" />
                 )}
                 <span>Terapkan Filter</span>
             </button>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* ... existing summary cards ... */}
        <div className="glass-card p-6 rounded-2xl border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign className="w-16 h-16 text-web3-accent-green" />
          </div>
          <h3 className="text-web3-text-secondary text-sm font-medium">Total Pendapatan</h3>
          <p className="text-3xl font-bold text-white mt-2">
            Rp {data.totalRevenue.toLocaleString()}
          </p>
          <div className="mt-4 flex items-center text-xs text-web3-accent-green">
            <TrendingUp className="w-3 h-3 mr-1" />
            <span>Pendapatan {getPeriodLabel()}</span>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <ShoppingBag className="w-16 h-16 text-web3-accent-cyan" />
          </div>
          <h3 className="text-web3-text-secondary text-sm font-medium">Total Pesanan</h3>
          <p className="text-3xl font-bold text-white mt-2">{data.totalOrders}</p>
          <div className="mt-4 flex items-center text-xs text-web3-accent-cyan">
            <TrendingUp className="w-3 h-3 mr-1" />
            <span>{data.successRate}% Tingkat Sukses</span>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Package className="w-16 h-16 text-web3-accent-purple" />
          </div>
          <h3 className="text-web3-text-secondary text-sm font-medium">Produk Terlaris</h3>
          <p className="text-xl font-bold text-white mt-2 truncate">
            {data.topProducts[0]?.name || "N/A"}
          </p>
          <div className="mt-4 flex items-center text-xs text-web3-accent-purple">
            <TrendingUp className="w-3 h-3 mr-1" />
            <span>{data.topProducts[0]?.sales || 0} Terjual</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <div className="glass-card p-6 rounded-2xl border border-white/10">
          <h3 className="text-lg font-bold text-white mb-6">
              Tren Pendapatan
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.revenueTrend}>
                {/* ... chart config ... */}
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis
                  dataKey="date"
                  stroke="#94a3b8"
                  fontSize={12}
                  tickFormatter={(value) => new Date(value).toLocaleDateString(undefined, { weekday: 'short' })}
                />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={12}
                  tickFormatter={(value) => `Rp ${value / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.9)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    color: "#fff",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#06b6d4"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products Chart */}
        <div className="glass-card p-6 rounded-2xl border border-white/10">
          <h3 className="text-lg font-bold text-white mb-6">Produk Terlaris</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.topProducts} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={false} />
                <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  stroke="#94a3b8" 
                  fontSize={12} 
                  width={100}
                  tickFormatter={(value) => value.length > 15 ? `${value.substring(0, 15)}...` : value}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.9)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "12px",
                    color: "#fff",
                  }}
                />
                <Bar dataKey="sales" fill="#8b5cf6" radius={[0, 4, 4, 0]} barSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
