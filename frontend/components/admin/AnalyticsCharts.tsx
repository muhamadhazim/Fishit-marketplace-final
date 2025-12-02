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
import { DollarSign, ShoppingBag, TrendingUp, Package } from "lucide-react";

interface AnalyticsData {
  totalRevenue: number;
  totalOrders: number;
  successRate: number;
  revenueTrend: { date: string; revenue: number }[];
  topProducts: { name: string; sales: number; revenue: number }[];
}

export default function AnalyticsCharts() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get("/api/transactions/analytics");
        setData(res.data);
      } catch (error) {
        console.error("Failed to fetch analytics:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return <div className="animate-pulse h-64 glass-card rounded-2xl" />;
  }

  if (!data) return null;

  return (
    <div className="space-y-6 mb-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-6 rounded-2xl border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <DollarSign className="w-16 h-16 text-web3-accent-green" />
          </div>
          <h3 className="text-web3-text-secondary text-sm font-medium">Total Revenue</h3>
          <p className="text-3xl font-bold text-white mt-2">
            Rp {data.totalRevenue.toLocaleString()}
          </p>
          <div className="mt-4 flex items-center text-xs text-web3-accent-green">
            <TrendingUp className="w-3 h-3 mr-1" />
            <span>Lifetime Earnings</span>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <ShoppingBag className="w-16 h-16 text-web3-accent-cyan" />
          </div>
          <h3 className="text-web3-text-secondary text-sm font-medium">Total Orders</h3>
          <p className="text-3xl font-bold text-white mt-2">{data.totalOrders}</p>
          <div className="mt-4 flex items-center text-xs text-web3-accent-cyan">
            <TrendingUp className="w-3 h-3 mr-1" />
            <span>{data.successRate}% Success Rate</span>
          </div>
        </div>

        <div className="glass-card p-6 rounded-2xl border border-white/10 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Package className="w-16 h-16 text-web3-accent-purple" />
          </div>
          <h3 className="text-web3-text-secondary text-sm font-medium">Top Product</h3>
          <p className="text-xl font-bold text-white mt-2 truncate">
            {data.topProducts[0]?.name || "N/A"}
          </p>
          <div className="mt-4 flex items-center text-xs text-web3-accent-purple">
            <TrendingUp className="w-3 h-3 mr-1" />
            <span>{data.topProducts[0]?.sales || 0} Sold</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Trend Chart */}
        <div className="glass-card p-6 rounded-2xl border border-white/10">
          <h3 className="text-lg font-bold text-white mb-6">Revenue Trend (7 Days)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.revenueTrend}>
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
          <h3 className="text-lg font-bold text-white mb-6">Top Products by Sales</h3>
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
