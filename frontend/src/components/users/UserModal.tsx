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

// Schema for creation (requires password)
const userCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  role: z.enum(['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']),
  isActive: z.union([z.boolean(), z.string()]).transform(val => val === true || val === 'true'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

// Schema for editing (password optional/omitted)
const userEditSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email format'),
  role: z.enum(['ADMIN', 'SALES', 'WAREHOUSE', 'ACCOUNTS']),
  isActive: z.union([z.boolean(), z.string()]).transform(val => val === true || val === 'true'),
});

type UserFormData = {
  name: string;
  email: string;
  role: 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS';
  isActive: boolean | string;
  password?: string;
};

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  userToEdit?: {
    id: string;
    name: string;
    email: string;
    role: string;
    isActive: boolean;
  } | null;
}

export function UserModal({ isOpen, onClose, userToEdit }: UserModalProps) {
  const { token, user: currentUser } = useAuthStore();
  const queryClient = useQueryClient();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  const isEditing = !!userToEdit;
  const isEditingSelf = isEditing && currentUser?.id === userToEdit.id;

  const { register, handleSubmit, formState: { errors, isValid, isDirty }, reset } = useForm<UserFormData>({
    resolver: zodResolver(isEditing ? userEditSchema : userCreateSchema),
    mode: 'onChange',
    defaultValues: {
      name: '',
      email: '',
      role: 'SALES',
      isActive: true,
      password: ''
    }
  });

  useEffect(() => {
    if (isOpen) {
      if (isEditing && userToEdit) {
        reset({
          name: userToEdit.name,
          email: userToEdit.email,
          role: userToEdit.role as 'ADMIN' | 'SALES' | 'WAREHOUSE' | 'ACCOUNTS',
          isActive: userToEdit.isActive ? 'true' : 'false',
          password: '' // Don't prefill password on edit
        });
      } else {
        reset({
          name: '',
          email: '',
          role: 'SALES',
          isActive: 'true',
          password: ''
        });
      }
    }
  }, [isOpen, isEditing, userToEdit, reset]);

  const saveMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      // transform isActive back to boolean if it's a string
      const payload = {
        ...data,
        isActive: data.isActive === true || data.isActive === 'true'
      };

      if (isEditing && userToEdit) {
        // Exclude password from PUT request
        const { password, ...putData } = payload;
        await axios.put(`${API_URL}/users/${userToEdit.id}`, putData, {
          headers: { Authorization: `Bearer ${token}` }
        });
      } else {
        await axios.post(`${API_URL}/users`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      onClose();
    }
  });

  const onSubmit = (data: UserFormData) => {
    saveMutation.mutate(data);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? 'Edit User' : 'Add New User'}
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={saveMutation.isPending}>Cancel</Button>
          <Button 
            onClick={handleSubmit(onSubmit)} 
            disabled={!isValid || (!isDirty && isEditing) || saveMutation.isPending}
            isLoading={saveMutation.isPending}
          >
            {isEditing ? 'Save Changes' : 'Create User'}
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
          label="Full Name" 
          placeholder="e.g. Jane Doe"
          {...register('name')} 
          error={errors.name?.message} 
        />
        
        <Input 
          label="Email Address" 
          type="email"
          placeholder="jane@example.com"
          {...register('email')} 
          error={errors.email?.message} 
        />

        {!isEditing && (
          <Input 
            label="Password" 
            type="password"
            placeholder="At least 6 characters"
            {...register('password')} 
            error={errors.password?.message} 
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <Select 
            label="Role"
            {...register('role')}
            error={errors.role?.message}
            disabled={isEditingSelf}
            options={[
              { label: 'Admin', value: 'ADMIN' },
              { label: 'Sales', value: 'SALES' },
              { label: 'Warehouse', value: 'WAREHOUSE' },
              { label: 'Accounts', value: 'ACCOUNTS' }
            ]}
          />

          <Select 
            label="Status"
            {...register('isActive')}
            disabled={isEditingSelf}
            options={[
              { label: 'Active', value: 'true' },
              { label: 'Inactive', value: 'false' }
            ]}
          />
        </div>

        {isEditingSelf && (
          <p className="text-ops-xs text-ops-text-muted mt-2">
            You cannot change your own role or deactivate your own account to prevent lockout.
          </p>
        )}
      </form>
    </Modal>
  );
}
