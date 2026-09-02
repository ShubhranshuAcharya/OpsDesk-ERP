import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthStore } from '../store/auth';
import { User, Mail, Shield, KeyRound, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import dayjs from 'dayjs';

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your new password'),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type ChangePasswordForm = z.infer<typeof changePasswordSchema>;

const ROLE_LABELS: Record<string, { label: string; color: string }> = {
  ADMIN: { label: 'Admin', color: 'bg-purple-100 text-purple-700' },
  SALES: { label: 'Sales', color: 'bg-blue-100 text-blue-700' },
  WAREHOUSE: { label: 'Warehouse', color: 'bg-yellow-100 text-yellow-700' },
  ACCOUNTS: { label: 'Accounts', color: 'bg-green-100 text-green-700' },
};

export default function Profile() {
  const { user, token } = useAuthStore();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isValid },
    setError,
  } = useForm<ChangePasswordForm>({
    resolver: zodResolver(changePasswordSchema),
    mode: 'onChange',
  });

  const changePwMutation = useMutation({
    mutationFn: async (data: ChangePasswordForm) => {
      const res = await axios.patch(`${API_URL}/auth/change-password`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    },
    onSuccess: () => {
      setSuccessMsg('Password changed successfully. Use your new password on your next login.');
      reset();
      setTimeout(() => setSuccessMsg(''), 6000);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error || 'Something went wrong.';
      if (msg.toLowerCase().includes('current password') || msg.toLowerCase().includes('incorrect')) {
        setError('currentPassword', { message: msg });
      } else {
        setError('root', { message: msg });
      }
    },
  });

  const onSubmit = (data: ChangePasswordForm) => {
    setSuccessMsg('');
    changePwMutation.mutate(data);
  };

  const roleInfo = ROLE_LABELS[user?.role || ''] || { label: user?.role || '', color: 'bg-gray-100 text-gray-700' };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-ops-xl font-bold text-ops-text-primary">My Profile</h2>
        <p className="text-ops-sm text-ops-text-secondary mt-1">Account details and security settings</p>
      </div>

      {/* Profile Info Card */}
      <div className="bg-ops-bg-surface border border-ops-border-default rounded-ops-md shadow-ops-sm">
        <div className="p-6 border-b border-ops-border-default">
          <h3 className="text-ops-base font-semibold text-ops-text-primary">Account Information</h3>
        </div>
        <div className="p-6 space-y-5">
          {/* Avatar + Name Row */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-ops-primary text-white flex items-center justify-center text-2xl font-bold shrink-0">
              {user?.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-ops-lg font-semibold text-ops-text-primary">{user?.name}</div>
              <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-ops-xs font-semibold ${roleInfo.color}`}>
                {roleInfo.label}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <label className="text-ops-xs font-semibold text-ops-text-muted uppercase tracking-wider flex items-center gap-1.5">
                <Mail size={12} /> Email
              </label>
              <div className="text-ops-sm text-ops-text-primary bg-ops-bg-base border border-ops-border-default rounded-ops-sm px-3 py-2">
                {user?.email}
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-ops-xs font-semibold text-ops-text-muted uppercase tracking-wider flex items-center gap-1.5">
                <Shield size={12} /> Role
              </label>
              <div className="text-ops-sm text-ops-text-secondary bg-ops-bg-base border border-ops-border-default rounded-ops-sm px-3 py-2 flex items-center gap-2">
                {roleInfo.label}
                <span className="text-ops-xs text-ops-text-muted">(read-only — contact Admin to change)</span>
              </div>
            </div>
          </div>

          <div className="pt-1">
            <p className="text-ops-xs text-ops-text-muted flex items-center gap-1.5">
              <User size={12} /> User ID: <span className="font-mono">{user?.id}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Change Password Card */}
      <div className="bg-ops-bg-surface border border-ops-border-default rounded-ops-md shadow-ops-sm">
        <div className="p-6 border-b border-ops-border-default">
          <h3 className="text-ops-base font-semibold text-ops-text-primary flex items-center gap-2">
            <KeyRound size={18} className="text-ops-primary" />
            Change Password
          </h3>
          <p className="text-ops-xs text-ops-text-secondary mt-1">Your new password must be at least 8 characters.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          {/* Success Banner */}
          {successMsg && (
            <div className="flex items-start gap-3 p-3 bg-green-50 border border-green-200 rounded-ops-sm text-green-700 text-ops-sm">
              <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Root error */}
          {errors.root && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-ops-sm text-red-600 text-ops-sm">
              {errors.root.message}
            </div>
          )}

          {/* Current Password */}
          <div className="space-y-1.5">
            <label className="block text-ops-sm font-medium text-ops-text-secondary">
              Current Password <span className="text-ops-danger">*</span>
            </label>
            <div className="relative">
              <input
                {...register('currentPassword')}
                type={showCurrent ? 'text' : 'password'}
                className={`w-full h-9 px-3 pr-10 bg-ops-bg-base border rounded-ops-sm text-ops-sm focus:outline-none focus:border-ops-border-strong transition-colors ${
                  errors.currentPassword ? 'border-ops-danger' : 'border-ops-border-default'
                }`}
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ops-text-muted hover:text-ops-text-primary"
              >
                {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.currentPassword && (
              <p className="text-ops-xs text-ops-danger">{errors.currentPassword.message}</p>
            )}
          </div>

          {/* New Password */}
          <div className="space-y-1.5">
            <label className="block text-ops-sm font-medium text-ops-text-secondary">
              New Password <span className="text-ops-danger">*</span>
            </label>
            <div className="relative">
              <input
                {...register('newPassword')}
                type={showNew ? 'text' : 'password'}
                className={`w-full h-9 px-3 pr-10 bg-ops-bg-base border rounded-ops-sm text-ops-sm focus:outline-none focus:border-ops-border-strong transition-colors ${
                  errors.newPassword ? 'border-ops-danger' : 'border-ops-border-default'
                }`}
                placeholder="Min. 8 characters"
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ops-text-muted hover:text-ops-text-primary"
              >
                {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.newPassword && (
              <p className="text-ops-xs text-ops-danger">{errors.newPassword.message}</p>
            )}
          </div>

          {/* Confirm New Password */}
          <div className="space-y-1.5">
            <label className="block text-ops-sm font-medium text-ops-text-secondary">
              Confirm New Password <span className="text-ops-danger">*</span>
            </label>
            <div className="relative">
              <input
                {...register('confirmPassword')}
                type={showConfirm ? 'text' : 'password'}
                className={`w-full h-9 px-3 pr-10 bg-ops-bg-base border rounded-ops-sm text-ops-sm focus:outline-none focus:border-ops-border-strong transition-colors ${
                  errors.confirmPassword ? 'border-ops-danger' : 'border-ops-border-default'
                }`}
                placeholder="Re-enter new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ops-text-muted hover:text-ops-text-primary"
              >
                {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="text-ops-xs text-ops-danger">{errors.confirmPassword.message}</p>
            )}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={!isDirty || !isValid || changePwMutation.isPending}
              className="h-9 px-5 bg-ops-primary text-white text-ops-sm font-medium rounded-ops-sm hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {changePwMutation.isPending ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Password'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
