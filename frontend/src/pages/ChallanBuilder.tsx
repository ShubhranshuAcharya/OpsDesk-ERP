import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthStore } from '../store/auth';
import { Button } from '../components/ui/Button';
import { CustomerSelect } from '../components/challans/CustomerSelect';
import { ProductLineItem } from '../components/challans/ProductLineItem';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { ArrowLeft, Save, CheckCircle, AlertCircle, Plus } from 'lucide-react';

export default function ChallanBuilder() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { token } = useAuthStore();
  const queryClient = useQueryClient();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  const [customerId, setCustomerId] = useState('');
  const [items, setItems] = useState<any[]>([{ id: crypto.randomUUID(), productId: '', quantity: 1, unitPrice: 0, currentStock: 0, productName: '', productSku: '' }]);
  
  // Fetch existing draft if editing
  const { data: existingChallan } = useQuery({
    queryKey: ['challan', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await axios.get(`${API_URL}/challans/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    },
    enabled: !!id
  });

  useEffect(() => {
    if (existingChallan && existingChallan.status === 'DRAFT') {
      setCustomerId(existingChallan.customerId);
      setItems(existingChallan.items.map((item: any) => ({
        id: item.id || crypto.randomUUID(),
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        currentStock: item.product?.currentStock || 0,
        productName: item.productName,
        productSku: item.productSku
      })));
    }
  }, [existingChallan]);

  // Validation State
  const [showErrors, setShowErrors] = useState(false);
  const [stockFailures, setStockFailures] = useState<any[]>([]);
  
  // Dialog State
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  const handleAddItem = () => {
    setItems([...items, { id: crypto.randomUUID(), productId: '', quantity: 1, unitPrice: 0, currentStock: 0, productName: '', productSku: '' }]);
  };

  const handleUpdateItem = (index: number, updates: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], ...updates };
    setItems(newItems);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) return; // always keep at least one
    const newItems = [...items];
    newItems.splice(index, 1);
    setItems(newItems);
  };

  const totalQuantity = items.reduce((sum, item) => sum + (Number.isNaN(item.quantity) ? 0 : item.quantity), 0);
  const grandTotal = items.reduce((sum, item) => sum + (Number.isNaN(item.quantity) ? 0 : (item.quantity * item.unitPrice)), 0);

  const isValid = customerId && items.every(item => item.productId && item.quantity > 0);

  const saveMutation = useMutation({
    mutationFn: async (status: 'DRAFT' | 'CONFIRMED') => {
      const payload = {
        customerId,
        status,
        items: items.map(i => ({ productId: i.productId, quantity: i.quantity }))
      };
      
      // If we are confirming an existing draft directly, we should just use the /confirm endpoint
      // But the spec says "allow editing line items". If they click Confirm, we first PUT the draft, then PUT confirm.
      // Wait, let's just save the draft first if it's editing, or if it's CONFIRMED and we have an ID, maybe PUT /:id then PUT /:id/confirm?
      // Actually, if we just POST it creates a new one. If we PUT it updates.
      // Let's do the simplest:
      
      let challanId = id;
      
      if (id) {
        // Update existing draft. We always send DRAFT to the update endpoint.
        await axios.put(`${API_URL}/challans/${id}`, { ...payload, status: 'DRAFT' }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (status === 'CONFIRMED') {
          const confirmRes = await axios.put(`${API_URL}/challans/${id}/confirm`, {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
          return confirmRes.data;
        }
      } else {
        // Create new challan directly with the requested status
        const res = await axios.post(`${API_URL}/challans`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        challanId = res.data.id;
      }
      
      return { id: challanId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challans'] });
      queryClient.invalidateQueries({ queryKey: ['products'] }); // stock changed
      navigate('/challans');
    },
    onError: (error: any) => {
      setIsConfirmDialogOpen(false); // close dialog if open
      if (error.response?.data?.error === 'INSUFFICIENT_STOCK') {
        setStockFailures(error.response.data.failures);
      } else {
        setShowErrors(true);
        // We will just push this error to a new state if needed, but for now we'll just show it in the UI somehow
        setStockFailures([{ name: 'Error', required: 0, available: 0, _raw: error.response?.data?.error || 'An error occurred' }]);
      }
    }
  });

  const handleSaveDraft = () => {
    if (!isValid) {
      setShowErrors(true);
      return;
    }
    saveMutation.mutate('DRAFT');
  };

  const handleConfirm = () => {
    if (!isValid) {
      setShowErrors(true);
      return;
    }
    // Check local stock first
    const hasOverStock = items.some(i => i.quantity > i.currentStock);
    if (hasOverStock) {
      setShowErrors(true);
      return;
    }
    setStockFailures([]); // reset failures
    setIsConfirmDialogOpen(true);
  };

  const executeConfirm = () => {
    saveMutation.mutate('CONFIRMED');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button 
          onClick={() => navigate('/challans')}
          className="p-2 -ml-2 rounded-full hover:bg-ops-bg-surface text-ops-text-secondary transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="text-ops-xl font-bold text-ops-text-primary tracking-tight">New Sales Challan</h2>
          <p className="text-ops-sm text-ops-text-secondary">Draft a new outbound delivery or sale.</p>
        </div>
      </div>

      {stockFailures.length > 0 && (
        <div className="p-4 bg-ops-danger-bg border border-ops-danger/30 rounded-ops-md flex items-start gap-3">
          <AlertCircle className="text-ops-danger shrink-0 mt-0.5" size={18} />
          <div>
            <h4 className="text-ops-sm font-semibold text-ops-danger mb-1">Insufficient Stock (Live Update)</h4>
            <p className="text-ops-sm text-ops-danger/80 mb-2">The following items could not be fulfilled due to a stock shortage:</p>
            <ul className="list-disc pl-5 text-ops-sm text-ops-danger">
              {stockFailures.map((f, i) => (
                <li key={i}>{f.name} (Need {f.required}, Only {f.available} available)</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Step 1 */}
      <div className="bg-ops-bg-surface border border-ops-border-default rounded-ops-md shadow-ops-sm p-6">
        <h3 className="text-ops-base font-semibold text-ops-text-primary mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-ops-primary/10 text-ops-primary flex items-center justify-center text-[13px] font-bold">1</span>
          Select Customer
        </h3>
        <CustomerSelect 
          value={customerId}
          onChange={(id) => setCustomerId(id)}
          error={showErrors && !customerId ? 'Please select a customer' : undefined}
        />
      </div>

      {/* Step 2 */}
      <div className="bg-ops-bg-surface border border-ops-border-default rounded-ops-md shadow-ops-sm p-6">
        <h3 className="text-ops-base font-semibold text-ops-text-primary mb-4 flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-ops-primary/10 text-ops-primary flex items-center justify-center text-[13px] font-bold">2</span>
          Line Items
        </h3>
        
        <div className="space-y-6">
          {items.map((item, index) => (
            <ProductLineItem 
              key={item.id}
              item={item}
              index={index}
              onUpdate={handleUpdateItem}
              onRemove={handleRemoveItem}
              error={showErrors && !item.productId ? 'Please select a product' : (showErrors && item.quantity <= 0 ? 'Invalid quantity' : undefined)}
            />
          ))}
          
          <Button variant="secondary" onClick={handleAddItem}>
            <Plus size={16} className="mr-2" /> Add Line Item
          </Button>
        </div>

        {/* Totals */}
        <div className="mt-8 pt-6 border-t border-ops-border-default flex flex-col items-end gap-2">
          <div className="flex items-center gap-8 w-64 justify-between">
            <span className="text-ops-sm text-ops-text-secondary">Total Quantity:</span>
            <span className="text-ops-base font-semibold text-ops-text-primary">{totalQuantity}</span>
          </div>
          <div className="flex items-center gap-8 w-64 justify-between">
            <span className="text-ops-sm text-ops-text-secondary">Grand Total:</span>
            <span className="text-ops-lg font-bold text-ops-primary">${grandTotal.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-ops-bg-surface border-t border-ops-border-default p-4 flex justify-end gap-3 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pl-64">
        <Button 
          variant="secondary" 
          onClick={handleSaveDraft}
          disabled={saveMutation.isPending}
          isLoading={saveMutation.isPending && saveMutation.variables === 'DRAFT'}
        >
          <Save size={16} className="mr-2" />
          Save as Draft
        </Button>
        <Button 
          onClick={handleConfirm}
          disabled={saveMutation.isPending}
        >
          <CheckCircle size={16} className="mr-2" />
          Confirm Challan
        </Button>
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={isConfirmDialogOpen}
        title="Confirm Sales Challan"
        description={<>
          <p className="mb-2">Are you sure you want to confirm this challan?</p>
          <p className="font-semibold text-ops-text-primary mb-2">Total Items: {items.length} (Qty: {totalQuantity})</p>
          <p className="text-ops-danger font-medium">This will reduce stock levels permanently and cannot be undone except by cancelling the challan.</p>
        </>}
        confirmText="Confirm & Deduct Stock"
        cancelText="Go Back"
        onConfirm={executeConfirm}
        onCancel={() => setIsConfirmDialogOpen(false)}
        isLoading={saveMutation.isPending && saveMutation.variables === 'CONFIRMED'}
        variant="primary" // Wait, the UI said 'danger' usually for destructive, but it's primary action.
      />

    </div>
  );
}
