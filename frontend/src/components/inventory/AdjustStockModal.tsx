import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthStore } from '../../store/auth';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';

const adjustSchema = z.object({
  movementType: z.enum(['IN', 'OUT']),
  quantity: z.number({ invalid_type_error: "Must be a number" }).int().positive("Must be greater than 0"),
  reason: z.string().min(1, 'Reason is required'),
});

type AdjustFormData = z.infer<typeof adjustSchema>;

interface AdjustStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName?: string;
  currentStock: number;
  /** Default movement type when opened. Defaults to 'IN'. */
  defaultMovementType?: 'IN' | 'OUT';
}

export function AdjustStockModal({ isOpen, onClose, productId, productName, currentStock, defaultMovementType = 'IN' }: AdjustStockModalProps) {
  const { token } = useAuthStore();
  const queryClient = useQueryClient();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  const { register, handleSubmit, formState: { errors, isValid, isDirty }, reset, watch } = useForm<AdjustFormData>({
    resolver: zodResolver(adjustSchema),
    mode: 'onChange',
    defaultValues: {
      movementType: 'IN',
      quantity: 1,
      reason: ''
    }
  });

  const movementType = watch('movementType');
  const quantity = watch('quantity');

  useEffect(() => {
    if (isOpen) {
      reset({
        movementType: defaultMovementType,
        quantity: 1,
        reason: ''
      });
    }
  }, [isOpen, reset, defaultMovementType]);

  const adjustMutation = useMutation({
    mutationFn: async (data: AdjustFormData) => {
      await axios.put(`${API_URL}/products/${productId}/stock`, data, {
        headers: { Authorization: `Bearer ${token}` }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product', productId] });
      queryClient.invalidateQueries({ queryKey: ['productMovements', productId] });
      // Refresh dashboard KPIs + stock alerts panel so changes are reflected immediately
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
      // Refresh notification bell badge (low-stock count may have changed)
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      onClose();
    }
  });

  const onSubmit = (data: AdjustFormData) => {
    adjustMutation.mutate(data);
  };

  // Preview what the new stock will be
  const qty = Number.isNaN(quantity) ? 0 : quantity;
  const newStockPreview = movementType === 'IN' ? currentStock + qty : currentStock - qty;
  const isInvalidOut = movementType === 'OUT' && newStockPreview < 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={productName ? `Adjust Stock — ${productName}` : 'Adjust Stock Manually'}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={adjustMutation.isPending}>Cancel</Button>
          <Button 
            onClick={handleSubmit(onSubmit)} 
            disabled={!isValid || !isDirty || isInvalidOut || adjustMutation.isPending}
            isLoading={adjustMutation.isPending}
          >
            Confirm Adjustment
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        
        {adjustMutation.isError && (
          <div className="p-3 text-[13px] bg-ops-danger-bg text-ops-danger border border-ops-danger/20 rounded-ops-sm mb-4">
            {(adjustMutation.error as any).response?.data?.error || 'An error occurred'}
          </div>
        )}

        <Select 
          label="Movement Type"
          {...register('movementType')}
          error={errors.movementType?.message}
          options={[
            { label: 'Stock IN (Add)', value: 'IN' },
            { label: 'Stock OUT (Remove)', value: 'OUT' }
          ]}
        />
        
        <Input 
          label="Quantity" 
          type="number"
          {...register('quantity', { valueAsNumber: true })} 
          error={errors.quantity?.message || (isInvalidOut ? 'Cannot reduce stock below 0' : undefined)} 
        />
        
        <Input 
          label="Reason" 
          placeholder="e.g. Audit correction, found damaged..."
          {...register('reason')} 
          error={errors.reason?.message} 
        />

        <div className="mt-4 p-3 bg-ops-bg-base border border-ops-border-default rounded-ops-sm flex justify-between items-center">
          <span className="text-ops-sm text-ops-text-secondary">New Stock Preview:</span>
          <span className={`text-ops-base font-semibold ${isInvalidOut ? 'text-ops-danger' : 'text-ops-text-primary'}`}>
            {newStockPreview}
          </span>
        </div>

      </form>
    </Modal>
  );
}
