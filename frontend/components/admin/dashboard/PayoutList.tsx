import { CreditCard } from "lucide-react";
import { formatDate } from "@/lib/date";

interface PayoutListProps {
    payouts: any[];
    loading: boolean;
}

export default function PayoutList({ payouts, loading }: PayoutListProps) {
    if (loading) {
        return <div className="text-center py-10 animate-pulse">Memuat pencairan...</div>;
    }

    if (payouts.length === 0) {
        return (
            <div className="glass-card rounded-2xl p-10 text-center border-2 border-dashed border-white/10">
                <CreditCard className="w-12 h-12 text-web3-text-muted mx-auto mb-4" />
                <p className="text-web3-text-secondary">Belum ada riwayat pencairan.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {payouts.map(payout => (
                <div key={payout._id} className="glass-card border border-emerald-500/20 rounded-2xl overflow-hidden hover:border-emerald-500/40 transition-all bg-emerald-500/5">
                    <div className="p-6 flex flex-col md:flex-row justify-between gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <span className="font-mono bg-white/5 px-2 py-1 rounded text-emerald-400 text-xs border border-emerald-500/20">{payout.payout_no}</span>
                                <span className="text-xs px-2 py-1 rounded font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                    PAID
                                </span>
                            </div>
                            <div className="text-sm text-web3-text-secondary">
                                Tanggal: <span className="text-white font-semibold">{formatDate(payout.paid_at)}</span>
                            </div>
                        </div>

                        <div className="flex flex-col items-end justify-center">
                             <div className="text-xs text-emerald-400 font-bold mb-1 uppercase tracking-wider">Jumlah Diterima</div>
                             <div className="font-bold text-3xl tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                                 Rp {new Intl.NumberFormat("id-ID").format(payout.amount)}
                             </div>
                        </div>
                    </div>

                    {/* Transaction Items List */}
                    <div className="bg-black/20 p-4 border-t border-white/5">
                        <div className="text-xs font-bold text-web3-text-secondary uppercase mb-2 tracking-wider">
                            Pesanan Termasuk ({payout.transaction_ids?.length || 0})
                        </div>
                        <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                            {payout.transaction_ids?.map((tx: any) => (
                                <div key={tx._id} className="flex justify-between items-center text-sm p-2 rounded hover:bg-white/5 transition-colors">
                                    <div className="flex flex-col">
                                        {tx.items?.map((item: any, idx: number) => (
                                            <span key={idx} className="text-white font-medium">
                                                {item.name} <span className="text-web3-text-secondary text-xs">x{item.quantity}</span>
                                            </span>
                                        ))}
                                        <span className="text-xs text-web3-text-muted font-mono">{tx.invoice_number}</span>
                                    </div>
                                    <div className="text-emerald-400 font-mono text-xs">
                                        Rp {new Intl.NumberFormat("id-ID").format(tx.total_transfer)}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}