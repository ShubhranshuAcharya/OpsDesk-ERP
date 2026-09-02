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

const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().min(1, 'SKU is required'),
  category: z.string().optional(),
  unitPrice: z.number({ invalid_type_error: "Must be a number" }).nonnegative("Cannot be negative"),
  currentStock: z.number({ invalid_type_error: "Must be a number" }).int().nonnegative("Cannot be negative").default(0),
  minStockAlert: z.number({ invalid_type_error: "Must be a number" }).int().nonnegative("Cannot be negative").default(0),
  location: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: any; // null if adding
}

export function ProductFormModal({ isOpen, onClose, product }: ProductFormModalProps) {
  const isEditing = !!product;
  const { token } = useAuthStore();
  const queryClient = useQueryClient();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  const { register, handleSubmit, formState: { errors, isDirty, isValid }, reset } = useForm<ProductFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(productSchema) as any,
    mode: 'onChange',
    defaultValues: {
      name: '',
      sku: '',
      category: '',
      unitPrice: 0,
      currentStock: 0,
      minStockAlert: 0,
      location: ''
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (isEditing && product) {
        reset({
          name: product.name,
          sku: product.sku,
          category: product.category || '',
          unitPrice: parseFloat(product.unitPrice), // backend returns Decimal as string/number
          currentStock: product.currentStock,
          minStockAlert: product.minStockAlert,
          location: product.location || ''
        });
      } else {
        reset({
          name: '',
          sku: '',
          category: '',
          unitPrice: 0,
          currentStock: 0,
          minStockAlert: 0,
          location: ''
        });
      }
    }
  }, [isOpen, isEditing, product, reset]);

  const saveMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      const payload = { ...data };
      if (!payload.category) delete payload.category;
      if (!payload.location) delete payload.location;

      if (isEditing) {
        // Can't edit currentStock via this endpoint (only via adjustments)
        // But for this form, we'll just pass what we have; backend ignores it or updates it, 
        // wait, backend put /products/:id doesn't specifically block currentStock but it's dangerous.
        // I will omit currentStock from the PUT payload to be safe.
        const { currentStock, ...updatePayload } = payload;
        await axios.put(`${API_URL}/products/${product.id}`, updatePayload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_URL}/products`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product', product?.id] });
      onClose();
    }
  });

  const onSubmit = (data: ProductFormData) => {
    saveMutation.mutate(data);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit Product' : 'Add Product'}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saveMutation.isPending}>Cancel</Button>
          <Button 
            onClick={handleSubmit(onSubmit)} 
            disabled={!isDirty || !isValid || saveMutation.isPending}
            isLoading={saveMutation.isPending}
          >
            {isEditing ? 'Save Changes' : 'Create Product'}
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        
        {saveMutation.isError && (
          <div className="p-3 text-[13px] bg-ops-danger-bg text-ops-danger border border-ops-danger/20 rounded-ops-sm mb-4">
            {(saveMutation.error as any).response?.data?.error || 'An error occurred'}
          </div>
        )}

        <Input 
          label="Product Name" 
          placeholder="e.g. Ergonomic Office Chair"
          {...register('name')} 
          error={errors.name?.message} 
          required
        />
        
        <div className="grid grid-cols-2 gap-4">
          <Input 
            label="SKU" 
            placeholder="e.g. FUR-CHAIR-001"
            {...register('sku')} 
            error={errors.sku?.message} 
            required
          />
          <Input 
            label="Category" 
            placeholder="e.g. Furniture"
            {...register('category')} 
            error={errors.category?.message} 
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input 
            label="Unit Price ($)" 
            type="number"
            step="0.01"
            {...register('unitPrice', { valueAsNumber: true })} 
            error={errors.unitPrice?.message} 
            required
          />
          <Input 
            label="Location (Warehouse/Bin)" 
            placeholder="e.g. Aisle 4, Bin B"
            {...register('location')} 
            error={errors.location?.message} 
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input 
            label="Initial Stock" 
            type="number"
            disabled={isEditing}
            helperText={isEditing ? 'Adjust via detail page' : undefined}
            {...register('currentStock', { valueAsNumber: true })} 
            error={errors.currentStock?.message} 
          />
          <Input 
            label="Min Stock Alert" 
            type="number"
            {...register('minStockAlert', { valueAsNumber: true })} 
            error={errors.minStockAlert?.message} 
          />
        </div>

      </form>
    </Modal>
  );
}
