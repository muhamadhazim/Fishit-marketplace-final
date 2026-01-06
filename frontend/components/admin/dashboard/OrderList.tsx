import { Package, CheckCircle, CreditCard } from "lucide-react";
import { formatDate } from "@/lib/date";

interface OrderListProps {
    transactions: any[];
    loading: boolean;
    viewOnly?: boolean;
    activeTab: string;
    onActionClick: (transactionId: string, newStatus: string) => void;
}

export default function OrderList({ transactions, loading, viewOnly, activeTab, onActionClick }: OrderListProps) {
    if (loading) {
        return <div className="text-center py-10 animate-pulse">Memuat data...</div>;
    }

    if (transactions.length === 0) {
        return (
            <div className="glass-card rounded-2xl p-10 text-center border-2 border-dashed border-white/10">
                <Package className="w-12 h-12 text-web3-text-muted mx-auto mb-4" />
                <p className="text-web3-text-secondary">Tidak ada pesanan ditemukan.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-4">
            {transactions.map(tx => (
                <div key={tx._id} className="glass-card p-6 border border-white/10 rounded-2xl flex flex-col md:flex-row justify-between gap-6 hover:border-white/20 transition-all">
                    <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-3">
                            <span className="font-mono bg-white/5 px-2 py-1 rounded text-web3-accent-cyan text-xs">{tx.invoice_number}</span>
                            <span className={`text-xs px-2 py-1 rounded font-bold uppercase tracking-wider ${
                                tx.status === 'Paid' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' :
                                tx.status === 'Processing' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                                tx.status === 'Pending' ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' :
                                ['Failed', 'Cancelled', 'Expired'].includes(tx.status) ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                                'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}>
                                {tx.status === 'Paid' ? 'Dibayar' :
                                 tx.status === 'Processing' ? 'Diproses' :
                                 tx.status === 'Pending' ? 'Menunggu' :
                                 tx.status === 'Success' ? 'Sukses' :
                                 tx.status === 'Failed' ? 'Gagal' :
                                 tx.status === 'Cancelled' ? 'Dibatalkan' :
                                 tx.status === 'Expired' ? 'Kadaluarsa' : tx.status}
                            </span>
                        </div>
                        <div>
                             {tx.items.map((item: any, idx: number) => (
                                 <div key={idx} className="font-bold text-lg text-white">
                                     {item.name} <span className="text-sm font-normal text-web3-text-secondary">x{item.quantity}</span>
                                 </div>
                             ))}
                        </div>
                        <div className="text-sm text-web3-text-secondary">
                             Pembeli: <span className="text-white">{tx.user_roblox_username || tx.email}</span>
                        </div>

                        {/* Payout Info in History Tab */}
                        {activeTab === 'history' && tx.status === 'Success' && (
                            <div className="pt-2">
                                {tx.payout_status === 'Paid' && tx.payout_paid_at ? (
                                    <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 w-fit">
                                        <CheckCircle className="w-3.5 h-3.5" />
                                        Dana Ditransfer: {formatDate(tx.payout_paid_at)}
                                    </div>
                                ) : tx.payout_status === 'Paid' ? (
                                    <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 w-fit">
                                        <CheckCircle className="w-3.5 h-3.5" />
                                        Dana Ditransfer (Tanggal N/A)
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 text-xs text-yellow-400 font-bold bg-yellow-500/10 px-3 py-1.5 rounded-lg border border-yellow-500/20 w-fit">
                                        <CreditCard className="w-3.5 h-3.5" />
                                        Menunggu Pencairan
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col items-end gap-3 justify-center min-w-[150px]">
                         <div className="font-bold text-2xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">
                             Rp {new Intl.NumberFormat("id-ID").format(tx.total_transfer)}
                         </div>

                         {!viewOnly && activeTab === 'paid' && tx.status === 'Paid' && (
                             <button onClick={() => onActionClick(tx._id, 'Processing')} className="w-full bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-500/20">
                                 Mulai Proses
                             </button>
                         )}
                         {!viewOnly && activeTab === 'paid' && tx.status === 'Pending' && (
                             <div className="w-full bg-yellow-500/10 text-yellow-400 px-4 py-2.5 rounded-xl font-bold text-sm text-center border border-yellow-500/20">
                                 Menunggu Pembayaran
                             </div>
                         )}
                         {!viewOnly && activeTab === 'processing' && (
                             <button onClick={() => onActionClick(tx._id, 'Success')} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-xl font-bold text-sm transition-all shadow-lg shadow-emerald-500/20">
                                 Selesaikan Pesanan
                             </button>
                         )}
                         {viewOnly && (
                            <div className="text-xs text-web3-text-muted italic">Hanya Melihat</div>
                         )}
                    </div>
                </div>
            ))}
        </div>
    );
}