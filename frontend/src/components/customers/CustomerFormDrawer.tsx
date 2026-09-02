import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthStore } from '../../store/auth';
import { Drawer } from '../ui/Drawer';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Textarea } from '../ui/Textarea';
import { ConfirmDialog } from '../ui/ConfirmDialog';

const customerSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  mobile: z.string().min(10, 'Mobile must be at least 10 digits').regex(/^[0-9+() -]+$/, 'Invalid mobile format'),
  email: z.union([z.string().email('Invalid email address'), z.string().length(0)]).optional().transform(e => e === "" ? undefined : e),
  businessName: z.string().optional(),
  gstNumber: z.string().optional(),
  customerType: z.enum(['RETAIL', 'WHOLESALE', 'DISTRIBUTOR']),
  status: z.enum(['LEAD', 'ACTIVE', 'INACTIVE']),
  address: z.string().optional(),
  followUpDate: z.string().optional().transform(d => d === "" ? undefined : d)
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface CustomerFormDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: any; // null if adding
}

export function CustomerFormDrawer({ isOpen, onClose, customer }: CustomerFormDrawerProps) {
  const isEditing = !!customer;
  const { token } = useAuthStore();
  const queryClient = useQueryClient();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  const [showInactiveConfirm, setShowInactiveConfirm] = useState(false);
  const [pendingSubmitData, setPendingSubmitData] = useState<CustomerFormData | null>(null);

  const { register, handleSubmit, control, formState: { errors, isDirty, isValid }, reset, watch } = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      mobile: '',
      email: '',
      businessName: '',
      gstNumber: '',
      customerType: 'RETAIL',
      status: 'LEAD',
      address: '',
      followUpDate: ''
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (isEditing && customer) {
        reset({
          name: customer.name,
          mobile: customer.mobile,
          email: customer.email || '',
          businessName: customer.businessName || '',
          gstNumber: customer.gstNumber || '',
          customerType: customer.customerType,
          status: customer.status,
          address: customer.address || '',
          followUpDate: customer.followUpDate ? new Date(customer.followUpDate).toISOString().split('T')[0] : ''
        });
      } else {
        reset({
          name: '',
          mobile: '',
          email: '',
          businessName: '',
          gstNumber: '',
          customerType: 'RETAIL',
          status: 'LEAD',
          address: '',
          followUpDate: ''
        });
      }
    }
  }, [isOpen, isEditing, customer, reset]);

  const saveMutation = useMutation({
    mutationFn: async (data: CustomerFormData) => {
      const payload = { ...data };
      if (!payload.email) delete payload.email;
      if (!payload.followUpDate) delete payload.followUpDate;

      if (isEditing) {
        await axios.put(`${API_URL}/customers/${customer.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // If followUpDate was provided during edit, and it's changed, we'd ideally use the notes endpoint.
        // But the PUT endpoint updates the customer fields natively. Wait, the PUT endpoint does NOT update followUpDate in the backend.
        // Actually, let's just pass it, the backend customerSchema does NOT include followUpDate.
        // So for followUpDate we must call the notes endpoint if it's new/changed.
        if (payload.followUpDate && payload.followUpDate !== (customer.followUpDate ? new Date(customer.followUpDate).toISOString().split('T')[0] : '')) {
          await axios.post(`${API_URL}/customers/${customer.id}/notes`, {
            note: 'Updated follow-up date manually from profile.',
            followUpDate: payload.followUpDate
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }
      } else {
        const res = await axios.post(`${API_URL}/customers`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (payload.followUpDate) {
           await axios.post(`${API_URL}/customers/${res.data.id}/notes`, {
            note: 'Initial follow-up date set during creation.',
            followUpDate: payload.followUpDate
          }, {
            headers: { Authorization: `Bearer ${token}` }
          });
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer', customer?.id] });
      onClose();
    }
  });

  const onSubmit = (data: CustomerFormData) => {
    if (data.status === 'INACTIVE' && customer?.status !== 'INACTIVE') {
      setPendingSubmitData(data);
      setShowInactiveConfirm(true);
    } else {
      saveMutation.mutate(data);
    }
  };

  const handleConfirmInactive = () => {
    if (pendingSubmitData) {
      saveMutation.mutate(pendingSubmitData);
    }
    setShowInactiveConfirm(false);
  };

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <>
      <Drawer
        isOpen={isOpen}
        onClose={onClose}
        title={isEditing ? 'Edit Customer' : 'Add Customer'}
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={onClose} disabled={saveMutation.isPending}>Cancel</Button>
            <Button 
              onClick={handleSubmit(onSubmit)} 
              disabled={!isDirty || !isValid || saveMutation.isPending}
              isLoading={saveMutation.isPending}
            >
              {isEditing ? 'Save Changes' : 'Create Customer'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          
          {/* Basic Info */}
          <div>
            <h3 className="text-ops-sm font-semibold text-ops-text-primary mb-4 pb-2 border-b border-ops-border-default">Basic Info</h3>
            <div className="space-y-4">
              <Input 
                label="Full Name" 
                placeholder="e.g. John Doe"
                {...register('name')} 
                error={errors.name?.message} 
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <Input 
                  label="Mobile Number" 
                  placeholder="e.g. 9876543210"
                  {...register('mobile')} 
                  error={errors.mobile?.message} 
                  required
                />
                <Input 
                  label="Email Address" 
                  type="email"
                  placeholder="john@example.com"
                  {...register('email')} 
                  error={errors.email?.message} 
                />
              </div>
            </div>
          </div>

          {/* Business Info */}
          <div>
            <h3 className="text-ops-sm font-semibold text-ops-text-primary mb-4 pb-2 border-b border-ops-border-default">Business Info</h3>
            <div className="space-y-4">
              <Input 
                label="Business Name" 
                placeholder="e.g. Acme Corp"
                {...register('businessName')} 
                error={errors.businessName?.message} 
              />
              <div className="grid grid-cols-2 gap-4">
                <Input 
                  label="GST Number" 
                  placeholder="e.g. 22AAAAA0000A1Z5"
                  {...register('gstNumber')} 
                  error={errors.gstNumber?.message} 
                />
                <Select 
                  label="Customer Type"
                  {...register('customerType')}
                  error={errors.customerType?.message}
                  options={[
                    { label: 'Retail', value: 'RETAIL' },
                    { label: 'Wholesale', value: 'WHOLESALE' },
                    { label: 'Distributor', value: 'DISTRIBUTOR' }
                  ]}
                  required
                />
              </div>
            </div>
          </div>

          {/* Status & Follow-up */}
          <div>
            <h3 className="text-ops-sm font-semibold text-ops-text-primary mb-4 pb-2 border-b border-ops-border-default">Status & Follow-up</h3>
            <div className="grid grid-cols-2 gap-4">
              <Select 
                label="Status"
                {...register('status')}
                error={errors.status?.message}
                options={[
                  { label: 'Lead', value: 'LEAD' },
                  { label: 'Active', value: 'ACTIVE' },
                  { label: 'Inactive', value: 'INACTIVE' }
                ]}
                required
              />
              <Input 
                label="Follow-up Date" 
                type="date"
                min={!isEditing ? todayStr : undefined} // Only restrict past dates on creation
                {...register('followUpDate')} 
                error={errors.followUpDate?.message} 
                helperText="When should sales contact them?"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <h3 className="text-ops-sm font-semibold text-ops-text-primary mb-4 pb-2 border-b border-ops-border-default">Address</h3>
            <Textarea 
              label="Billing/Shipping Address" 
              placeholder="Enter full address details..."
              {...register('address')} 
              error={errors.address?.message} 
            />
          </div>

        </form>
      </Drawer>

      <ConfirmDialog
        isOpen={showInactiveConfirm}
        onClose={() => setShowInactiveConfirm(false)}
        onConfirm={handleConfirmInactive}
        title="Mark customer inactive?"
        message="They will be hidden from default list views and dashboard alerts. You can still find them via direct search."
        confirmText="Mark Inactive"
        variant="warning"
        isLoading={saveMutation.isPending}
      />
    </>
  );
}
