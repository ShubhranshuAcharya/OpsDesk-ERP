import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import dayjs from 'dayjs';
import { useAuthStore } from '../store/auth';
import { Button } from '../components/ui/Button';
import { DataTable } from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import StatusBadge from '../components/ui/StatusBadge';
import EmptyState from '../components/ui/EmptyState';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Modal } from '../components/ui/Modal';
import { Textarea } from '../components/ui/Textarea';
import { ArrowLeft, XCircle, CheckCircle, Package, AlertCircle, FileDown, Edit3 } from 'lucide-react';

export default function ChallanDetail() {
  const { id } = useParams<{ id: string }>();
  const { token, user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isCancelDraftDialogOpen, setIsCancelDraftDialogOpen] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [isPdfLoading, setIsPdfLoading] = useState(false);

  const handleExportPdf = async () => {
    setIsPdfLoading(true);
    try {
      const res = await fetch(`${API_URL}/challans/${id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to generate PDF');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${challan?.challanNumber ?? 'challan'}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setGlobalError('Failed to export PDF. Please try again.');
    } finally {
      setIsPdfLoading(false);
    }
  };

  // Cancel Modal State
  const [cancelReason, setCancelReason] = useState('');
  const [restockItems, setRestockItems] = useState(false);

  const { data: challan, isLoading, error } = useQuery({
    queryKey: ['challan', id],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/challans/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    },
    enabled: !!id
  });

  const confirmMutation = useMutation({
    mutationFn: async () => {
      await axios.put(`${API_URL}/challans/${id}/confirm`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challan', id] });
      setIsConfirmDialogOpen(false);
    },
    onError: (error: any) => {
      setIsConfirmDialogOpen(false);
      setGlobalError(error.response?.data?.error === 'INSUFFICIENT_STOCK' ? 
        'Insufficient stock. Cannot confirm challan.' : 
        (error.response?.data?.error || 'Failed to confirm challan'));
    }
  });

  const cancelMutation = useMutation({
    mutationFn: async () => {
      const payload = challan.status === 'CONFIRMED' ? { reason: cancelReason, restock: restockItems } : {};
      await axios.put(`${API_URL}/challans/${id}/cancel`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challan', id] });
      setIsCancelModalOpen(false);
    },
    onError: (error: any) => {
      setGlobalError(error.response?.data?.error || 'Failed to cancel challan');
    }
  });

  if (isLoading) {
    return <div className="animate-pulse space-y-6">
      <div className="h-32 bg-ops-bg-surface rounded-ops-md border border-ops-border-default"></div>
      <div className="h-64 bg-ops-bg-surface rounded-ops-md border border-ops-border-default"></div>
    </div>;
  }

  if (error || !challan) {
    return <EmptyState title="Challan not found" description="This challan does not exist or you lack permissions." actionText="Back to challans" actionTo="/challans" />;
  }

  const isDraft = challan.status === 'DRAFT';
  const isConfirmed = challan.status === 'CONFIRMED';
  const isCancelled = challan.status === 'CANCELLED';

  const canEdit = (user?.role === 'ADMIN' || user?.role === 'SALES');
  const grandTotal = challan.items.reduce((sum: number, item: any) => sum + Number(item.lineTotal), 0);

  const columns: Column<any>[] = [
    {
      header: 'SKU',
      accessorKey: 'productSku',
      cell: (item) => <span className="text-ops-sm font-medium text-ops-text-secondary">{item.productSku}</span>
    },
    {
      header: 'Product Name',
      accessorKey: 'productName',
      cell: (item) => <span className="text-ops-sm font-medium text-ops-text-primary">{item.productName}</span>
    },
    {
      header: 'Unit Price',
      accessorKey: 'unitPrice',
      align: 'right',
      cell: (item) => <span className="text-ops-sm text-ops-text-secondary">${parseFloat(item.unitPrice).toFixed(2)}</span>
    },
    {
      header: 'Qty',
      accessorKey: 'quantity',
      align: 'right',
      cell: (item) => <span className="text-ops-sm font-semibold text-ops-text-primary">{item.quantity}</span>
    },
    {
      header: 'Line Total',
      accessorKey: 'lineTotal',
      align: 'right',
      cell: (item) => <span className="text-ops-sm font-semibold text-ops-text-primary">${parseFloat(item.lineTotal).toFixed(2)}</span>
    }
  ];


  const handleCancelClick = () => {
    if (isDraft) {
      setIsCancelDraftDialogOpen(true);
    } else {
      // Confirmed needs modal for restock and reason
      setCancelReason('');
      setRestockItems(false);
      setIsCancelModalOpen(true);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      
      {/* Back link */}
      <button 
        onClick={() => navigate('/challans')}
        className="flex items-center text-ops-sm text-ops-text-secondary hover:text-ops-primary transition-colors w-fit"
      >
        <ArrowLeft size={16} className="mr-1" /> Back to challans
      </button>

      {globalError && (
        <div className="p-4 bg-ops-danger-bg border border-ops-danger/30 rounded-ops-md flex items-start gap-3">
          <AlertCircle className="text-ops-danger shrink-0 mt-0.5" size={18} />
          <p className="text-ops-sm text-ops-danger">{globalError}</p>
        </div>
      )}

      {/* Header Card */}
      <div className="bg-ops-bg-surface border border-ops-border-default rounded-ops-md shadow-ops-sm p-6 flex flex-col md:flex-row md:items-start justify-between gap-6 relative overflow-hidden">
        
        {isCancelled && (
          <div className="absolute -right-12 top-6 bg-ops-danger text-white text-ops-xs font-bold py-1 px-14 transform rotate-45">
            CANCELLED
          </div>
        )}

        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <h2 className="text-ops-xl font-bold text-ops-text-primary">{challan.challanNumber}</h2>
            <StatusBadge status={challan.status} />
          </div>
          
          <div className="grid grid-cols-2 gap-x-12 gap-y-2">
            <div>
              <p className="text-ops-xs text-ops-text-muted uppercase tracking-wider mb-1">Customer</p>
              <p className="text-ops-sm font-medium text-ops-text-primary">{challan.customer.name}</p>
              {challan.customer.businessName && <p className="text-ops-xs text-ops-text-secondary">{challan.customer.businessName}</p>}
            </div>
            <div>
              <p className="text-ops-xs text-ops-text-muted uppercase tracking-wider mb-1">Created By</p>
              <p className="text-ops-sm text-ops-text-secondary">{challan.createdBy.name}</p>
              <p className="text-ops-xs text-ops-text-muted">{dayjs(challan.createdAt).format('MMM D, YYYY h:mm A')}</p>
            </div>
          </div>
        </div>

      </div>

      {/* Snapshot Note */}
      <div className="flex items-center gap-2 p-3 bg-ops-bg-base border border-ops-border-default rounded-ops-sm">
        <Package className="text-ops-text-muted shrink-0" size={16} />
        <p className="text-ops-xs text-ops-text-secondary">
          Prices and product names below reflect a <span className="font-semibold text-ops-text-primary">snapshot</span> from when the challan was created.
        </p>
      </div>

      {/* Items Table */}
      <div className="bg-ops-bg-surface border border-ops-border-default rounded-ops-md shadow-ops-sm overflow-hidden">
        <DataTable
          data={challan.items}
          columns={columns}
          emptyTitle="No items"
        />
        <div className="p-4 bg-ops-bg-base border-t border-ops-border-default flex justify-end">
          <div className="w-64 space-y-2">
            <div className="flex justify-between text-ops-sm">
              <span className="text-ops-text-secondary">Total Quantity:</span>
              <span className="font-semibold text-ops-text-primary">{challan.totalQuantity}</span>
            </div>
            <div className="flex justify-between text-ops-base">
              <span className="font-medium text-ops-text-primary">Grand Total:</span>
              <span className="font-bold text-ops-primary">${grandTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-ops-bg-surface border-t border-ops-border-default p-4 flex justify-end gap-3 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pl-64">
        <Button
          variant="ghost"
          onClick={handleExportPdf}
          disabled={isPdfLoading}
          isLoading={isPdfLoading}
        >
          <FileDown size={16} className="mr-2" />
          {isPdfLoading ? 'Generating...' : 'Export PDF'}
        </Button>

        {canEdit && !isCancelled && (
          <>
            <Button 
              variant="danger" 
              onClick={handleCancelClick}
            >
              <XCircle size={16} className="mr-2" />
              Cancel Challan
            </Button>

            {isDraft && (
              <>
                <Button 
                  variant="secondary"
                  onClick={() => navigate(`/challans/${id}/edit`)}
                >
                  <Edit3 size={16} className="mr-2" />
                  Edit Draft
                </Button>
                <Button 
                  onClick={() => setIsConfirmDialogOpen(true)}
                >
                  <CheckCircle size={16} className="mr-2" />
                  Confirm Challan
                </Button>
              </>
            )}
          </>
        )}
      </div>

      {/* Confirm Dialog for DRAFT Cancellation */}
      <ConfirmDialog
        isOpen={isCancelDraftDialogOpen}
        title="Cancel Draft Challan"
        description={<p>Are you sure you want to cancel this draft? This cannot be undone.</p>}
        confirmText="Yes, Cancel"
        cancelText="Go Back"
        onConfirm={() => {
          setIsCancelDraftDialogOpen(false);
          cancelMutation.mutate();
        }}
        onCancel={() => setIsCancelDraftDialogOpen(false)}
        variant="danger"
      />

      {/* Confirm Dialog for Confirm Challan */}
      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        title="Confirm Sales Challan"
        description={<>
          <p className="mb-2">Are you sure you want to confirm this challan?</p>
          <p className="font-semibold text-ops-text-primary mb-2">Total Items: {challan.items.length} (Qty: {challan.totalQuantity})</p>
          <p className="text-ops-danger font-medium">This will reduce stock levels permanently and cannot be undone except by cancelling the challan.</p>
        </>}
        confirmText="Confirm & Deduct Stock"
        cancelText="Go Back"
        onConfirm={() => confirmMutation.mutate()}
        onCancel={() => setIsConfirmDialogOpen(false)}
        isLoading={confirmMutation.isPending}
        variant="primary"
      />

      {/* Cancel CONFIRMED Challan Modal */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Cancel Confirmed Challan"
        size="sm"
        footer={<>
          <Button variant="ghost" onClick={() => setIsCancelModalOpen(false)} disabled={cancelMutation.isPending}>Close</Button>
          <Button 
            variant="danger" 
            onClick={() => cancelMutation.mutate()} 
            disabled={cancelMutation.isPending || cancelReason.trim() === ''}
            isLoading={cancelMutation.isPending}
          >
            Confirm Cancellation
          </Button>
        </>}
      >
        <div className="space-y-4">
          <p className="text-ops-sm text-ops-text-secondary">
            Cancelling a confirmed challan is permanent. Please provide a reason for the audit log.
          </p>

          <label className="flex items-center gap-3 p-3 border border-ops-border-strong rounded-ops-sm cursor-pointer hover:bg-ops-bg-base transition-colors">
            <input 
              type="checkbox" 
              checked={restockItems} 
              onChange={(e) => setRestockItems(e.target.checked)}
              className="w-4 h-4 rounded border-ops-border-strong text-ops-primary focus:ring-ops-primary"
            />
            <div className="flex flex-col">
              <span className="text-ops-sm font-medium text-ops-text-primary">Restock Items</span>
              <span className="text-ops-xs text-ops-text-secondary">Generate IN stock movements to return these {challan.totalQuantity} items to inventory. Uncheck if items were lost/damaged.</span>
            </div>
          </label>

          <div className="pt-2">
            <Textarea 
              label="Cancellation Reason" 
              placeholder="e.g. Customer cancelled order..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              required
            />
          </div>
        </div>
      </Modal>

    </div>
  );
}
