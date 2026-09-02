import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import dayjs from 'dayjs';
import { useAuthStore } from '../store/auth';
import { useLayoutStore } from '../store/layout';
import { Button } from '../components/ui/Button';
import { DataTable } from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import EmptyState from '../components/ui/EmptyState';
import { ProductFormModal } from '../components/inventory/ProductFormModal';
import { AdjustStockModal } from '../components/inventory/AdjustStockModal';
import { 
  ArrowLeft, 
  Edit3, 
  Package,
  MapPin,
  Tag,
  DollarSign,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { token, user } = useAuthStore();
  const { setPageTitle } = useLayoutStore();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  
  const [page, setPage] = useState(1);

  const { data: product, isLoading: isProductLoading, error } = useQuery({
    queryKey: ['product', id],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    },
    enabled: !!id
  });

  // Set top-bar title to the product name; clear on unmount
  useEffect(() => {
    if (product?.name) {
      setPageTitle(product.name);
    }
    return () => setPageTitle(null);
  }, [product?.name, setPageTitle]);

  const { data: movementsData, isLoading: isMovementsLoading } = useQuery({
    queryKey: ['productMovements', id, page],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/products/${id}/movements?page=${page}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    },
    enabled: !!id
  });

  const canEdit = user?.role === 'ADMIN' || user?.role === 'WAREHOUSE';

  if (isProductLoading) {
    return <div className="animate-pulse space-y-6">
      <div className="h-32 bg-ops-bg-surface rounded-ops-md border border-ops-border-default"></div>
      <div className="h-64 bg-ops-bg-surface rounded-ops-md border border-ops-border-default"></div>
    </div>;
  }

  if (error || !product) {
    return <EmptyState title="Product not found" description="This product does not exist or you lack permissions." actionText="Back to inventory" actionTo="/inventory" />;
  }

  const isLowStock = product.currentStock <= product.minStockAlert;
  const stockRatio = product.minStockAlert > 0 ? product.currentStock / product.minStockAlert : Infinity;
  const isWarning = !isLowStock && stockRatio <= 2; // within 2× of threshold

  const movementColumns: Column<any>[] = [
    {
      header: 'Date',
      accessorKey: 'createdAt',
      cell: (item) => <span className="text-ops-sm text-ops-text-secondary">{dayjs(item.createdAt).format('MMM D, YYYY h:mm A')}</span>
    },
    {
      header: 'Type',
      accessorKey: 'movementType',
      cell: (item) => {
        const isIN = item.movementType === 'IN';
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold border ${isIN ? 'bg-ops-success-bg text-ops-success border-ops-success/20' : 'bg-ops-danger-bg text-ops-danger border-ops-danger/20'}`}>
            {isIN ? '+ IN' : '- OUT'}
          </span>
        );
      }
    },
    {
      header: 'Qty',
      accessorKey: 'quantity',
      align: 'right',
      cell: (item) => <span className="text-ops-sm font-semibold text-ops-text-primary">{item.quantity}</span>
    },
    {
      header: 'Reason',
      accessorKey: 'reason',
      cell: (item) => <span className="text-ops-sm text-ops-text-secondary">{item.reason}</span>
    },
    {
      header: 'Recorded By',
      accessorKey: 'createdBy.name',
      cell: (item) => <span className="text-ops-sm text-ops-text-secondary">{item.createdBy?.name || 'System'}</span>
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Back link */}
      <button 
        onClick={() => navigate('/inventory')}
        className="flex items-center text-ops-sm text-ops-text-secondary hover:text-ops-primary transition-colors w-fit"
      >
        <ArrowLeft size={16} className="mr-1" /> Back to inventory
      </button>

      {/* Header Card */}
      <div className="bg-ops-bg-surface border border-ops-border-default rounded-ops-md shadow-ops-sm p-6 flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-ops-xl font-bold text-ops-text-primary">{product.name}</h2>
            <span className="px-2 py-0.5 rounded-ops-sm font-mono text-[12px] bg-ops-bg-base border border-ops-border-strong text-ops-text-secondary">
              {product.sku}
            </span>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 text-ops-sm text-ops-text-secondary mt-3">
            <span className="flex items-center gap-1.5"><Tag size={16} className="text-ops-text-muted" /> {product.category || 'No Category'}</span>
            <span className="flex items-center gap-1.5"><MapPin size={16} className="text-ops-text-muted" /> {product.location || 'No Location'}</span>
            <span className="flex items-center gap-1.5 font-medium text-ops-text-primary"><DollarSign size={16} className="text-ops-text-muted" /> {parseFloat(product.unitPrice).toFixed(2)}</span>
          </div>
        </div>

        {canEdit && (
          <div className="flex items-center gap-3 shrink-0">
            <Button variant="secondary" onClick={() => setIsEditModalOpen(true)}><Edit3 size={16} className="mr-2" /> Edit Details</Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Col: Stock Stats */}
        <div className="lg:col-span-1 space-y-6">

          {/* ── Compact Current Stock Card ── */}
          <div className="bg-ops-bg-surface border border-ops-border-default rounded-ops-md shadow-ops-sm p-4">
            <div className="flex justify-between items-start mb-3">
              <h3 className="text-ops-sm font-medium text-ops-text-secondary">Current Stock</h3>
              <div className="w-8 h-8 rounded-ops-sm bg-ops-bg-base flex items-center justify-center text-ops-text-secondary">
                <Package size={16} />
              </div>
            </div>

            <div className="flex items-end justify-between">
              <div className="flex items-baseline gap-2 min-w-0">
                <span className="text-3xl font-semibold text-ops-text-primary tracking-tight leading-none">
                  {product.currentStock.toLocaleString()}
                </span>
                <span className="text-ops-sm text-ops-text-muted whitespace-nowrap">
                  / min: {product.minStockAlert}
                </span>
              </div>

              {/* Stock Status Badge */}
              {isLowStock ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-ops-danger-bg text-ops-danger border border-ops-danger/20 shrink-0">
                  <AlertTriangle size={11} /> Low
                </span>
              ) : isWarning ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-600 border border-amber-200 shrink-0">
                  <AlertTriangle size={11} /> Warning
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-ops-success-bg text-ops-success border border-ops-success/20 shrink-0">
                  <CheckCircle size={11} /> Healthy
                </span>
              )}
            </div>
          </div>

          {/* ── Stock Parameters Card ── */}
          <div className="bg-ops-bg-surface border border-ops-border-default rounded-ops-md shadow-ops-sm p-6">
            <h3 className="text-ops-sm font-semibold text-ops-text-primary mb-4">Stock Parameters</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-3 border-b border-ops-border-default">
                <span className="text-ops-sm text-ops-text-secondary">Minimum Alert Threshold</span>
                <span className="text-ops-sm font-medium text-ops-text-primary">{product.minStockAlert}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-ops-sm text-ops-text-secondary">Stock Status</span>
                {isLowStock ? (
                  <span className="flex items-center gap-1 text-ops-sm font-semibold text-ops-danger">
                    <AlertTriangle size={14} /> Low Stock
                  </span>
                ) : (
                  <span className="text-ops-sm font-medium text-ops-success">Healthy</span>
                )}
              </div>
            </div>

            {canEdit && (
              <Button className="w-full mt-6" onClick={() => setIsAdjustModalOpen(true)}>
                Adjust Stock Manually
              </Button>
            )}
          </div>
        </div>

        {/* Right Col: Movement Log */}
        <div className="lg:col-span-2">
          <div className="bg-ops-bg-surface border border-ops-border-default rounded-ops-md shadow-ops-sm overflow-hidden flex flex-col h-full">
            <div className="px-6 py-4 border-b border-ops-border-default bg-ops-bg-base">
              <h3 className="text-ops-base font-semibold text-ops-text-primary">Stock Movement Log</h3>
              <p className="text-ops-xs text-ops-text-secondary mt-1">Audit trail of all inventory changes for this product.</p>
            </div>
            
            <div className="flex-1">
              <DataTable
                data={movementsData?.data || []}
                columns={movementColumns}
                isLoading={isMovementsLoading}
                page={movementsData?.pagination?.page}
                totalPages={movementsData?.pagination?.totalPages}
                onPageChange={setPage}
                emptyTitle="No movements recorded"
                emptyDescription="Stock adjustments and challans will appear here."
              />
            </div>
          </div>
        </div>

      </div>

      {canEdit && (
        <>
          <ProductFormModal 
            isOpen={isEditModalOpen} 
            onClose={() => setIsEditModalOpen(false)} 
            product={product}
          />
          <AdjustStockModal
            isOpen={isAdjustModalOpen}
            onClose={() => setIsAdjustModalOpen(false)}
            productId={product.id}
            currentStock={product.currentStock}
          />
        </>
      )}

    </div>
  );
}
