"use client";
import { useState, useEffect } from "react";
import api from "@/lib/api";
import SellerSettings from "./SellerSettings";
import AnalyticsCharts from "./AnalyticsCharts";
import DashboardTabs from "./dashboard/DashboardTabs";
import OrderList from "./dashboard/OrderList";
import PayoutList from "./dashboard/PayoutList";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/Toast";

interface SellerDashboardProps {
    sellerId?: string | null;
    viewOnly?: boolean;
}

export default function SellerDashboard({ sellerId, viewOnly = false }: SellerDashboardProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "paid" | "processing" | "history" | "payouts" | "settings">("overview");
  const [txs, setTxs] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    transactionId: string;
    newStatus: string;
  }>({ isOpen: false, transactionId: "", newStatus: "" });
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const toast = useToast();

  const fetchTransactions = async () => {
      if (activeTab === 'settings' || activeTab === 'overview') return;

      setLoading(true);
      try {
        if (activeTab === 'payouts') {
            let url = '/api/payouts/my-payouts';
            if (sellerId) {
                url += `?seller_id=${sellerId}`;
            }
            const res = await api.get(url);
            setPayouts(res.data.payouts);
        } else {
            let url = `/api/transactions/my-orders?status=${activeTab}`;
            if (sellerId) {
                url += `&seller_id=${sellerId}`;
            }
            const res = await api.get(url);
            setTxs(res.data.transactions);
        }
      } catch(e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
  };

  useEffect(() => {
     fetchTransactions();
  }, [activeTab, sellerId]);

  const openConfirmDialog = (transactionId: string, newStatus: string) => {
    setConfirmDialog({ isOpen: true, transactionId, newStatus });
  };

  const updateStatus = async () => {
    if (viewOnly) return;
    setUpdatingStatus(true);
    try {
      await api.put("/api/transactions/status", {
        transactionId: confirmDialog.transactionId,
        status: confirmDialog.newStatus
      });
      fetchTransactions();
      toast.success("Status Diperbarui", `Status pesanan berubah menjadi ${confirmDialog.newStatus}`);
    } catch (e) {
      toast.error("Update Gagal", "Gagal update status. Silakan coba lagi.");
    } finally {
      setUpdatingStatus(false);
      setConfirmDialog({ isOpen: false, transactionId: "", newStatus: "" });
    }
  };

  return (
    <div className="space-y-6">
      <DashboardTabs activeTab={activeTab} setActiveTab={setActiveTab} viewOnly={viewOnly} />

      {activeTab === 'overview' && (
          <div className="animate-fade-in">
              <AnalyticsCharts sellerId={sellerId} />
          </div>
      )}

      {activeTab === 'payouts' && (
        <PayoutList payouts={payouts} loading={loading} />
      )}

      {activeTab === 'settings' && !viewOnly ? (
        <SellerSettings />
      ) : activeTab !== 'overview' && activeTab !== 'payouts' && (
        <OrderList
            transactions={txs}
            loading={loading}
            viewOnly={viewOnly}
            activeTab={activeTab}
            onActionClick={openConfirmDialog}
        />
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, transactionId: "", newStatus: "" })}
        onConfirm={updateStatus}
        title="Update Status Pesanan"
        message={`Apakah Anda yakin ingin mengubah status pesanan menjadi "${
          confirmDialog.newStatus === 'Processing' ? 'Diproses' :
          confirmDialog.newStatus === 'Success' ? 'Selesai' :
          confirmDialog.newStatus
        }"?`}
        confirmText={confirmDialog.newStatus === 'Processing' ? 'Mulai Proses' : 'Selesaikan Pesanan'}
        cancelText="Batal"
        variant={confirmDialog.newStatus === 'Success' ? 'confirm' : 'info'}
        loading={updatingStatus}
      />
    </div>
  );
}