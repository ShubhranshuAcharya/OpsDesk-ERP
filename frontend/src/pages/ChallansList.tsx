import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';
import { useAuthStore } from '../store/auth';
import { DataTable } from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Plus, FilterX } from 'lucide-react';
import StatusBadge from '../components/ui/StatusBadge';

export default function ChallansList() {
  const { token, user } = useAuthStore();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  // Filters state
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['challans', { page, status: statusFilter }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15'
      });
      if (statusFilter) params.append('status', statusFilter);

      const res = await axios.get(`${API_URL}/challans?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    }
  });

  const columns: Column<any>[] = [
    {
      header: 'Challan #',
      accessorKey: 'challanNumber',
      cell: (item) => <span className="text-ops-sm font-semibold text-ops-text-primary">{item.challanNumber}</span>
    },
    {
      header: 'Customer',
      accessorKey: 'customer.name',
      cell: (item) => (
        <div className="flex flex-col">
          <span className="text-ops-sm font-medium text-ops-text-primary">{item.customer?.name}</span>
          {item.customer?.businessName && <span className="text-ops-xs text-ops-text-secondary">{item.customer.businessName}</span>}
        </div>
      )
    },
    {
      header: 'Total Qty',
      accessorKey: 'totalQuantity',
      align: 'right',
      cell: (item) => <span className="text-ops-sm font-semibold text-ops-text-primary">{item.totalQuantity}</span>
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (item) => <StatusBadge status={item.status} />
    },
    {
      header: 'Created By',
      accessorKey: 'createdBy.name',
      cell: (item) => <span className="text-ops-sm text-ops-text-secondary">{item.createdBy?.name}</span>
    },
    {
      header: 'Date',
      accessorKey: 'createdAt',
      cell: (item) => <span className="text-ops-sm text-ops-text-secondary">{dayjs(item.createdAt).format('MMM D, YYYY')}</span>
    }
  ];

  const clearFilters = () => {
    setStatusFilter('');
    setPage(1);
  };

  const canCreate = user?.role === 'ADMIN' || user?.role === 'SALES';

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-ops-xl font-semibold text-ops-text-primary tracking-tight">Sales Challans</h2>
          <p className="text-ops-sm text-ops-text-secondary">Manage outbound delivery notes and stock deductions.</p>
        </div>
        {canCreate && (
          <Button onClick={() => navigate('/challans/new')}>
            <Plus size={16} className="mr-2" />
            New Challan
          </Button>
        )}
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 p-4 bg-ops-bg-surface border border-ops-border-default rounded-ops-md shadow-ops-sm items-center">
        
        <div className="flex gap-4 w-full md:w-auto items-center">
          <Select 
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            options={[
              { label: 'All Statuses', value: '' },
              { label: 'Draft', value: 'DRAFT' },
              { label: 'Confirmed', value: 'CONFIRMED' },
              { label: 'Cancelled', value: 'CANCELLED' }
            ]}
          />

          {statusFilter && (
            <Button variant="ghost" className="px-2" onClick={clearFilters} title="Clear filters">
              <FilterX size={16} />
            </Button>
          )}
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={data?.data || []}
        columns={columns}
        isLoading={isLoading}
        page={data?.pagination?.page}
        totalPages={data?.pagination?.totalPages}
        onPageChange={setPage}
        onRowClick={(item) => navigate(`/challans/${item.id}`)}
        emptyTitle="No challans found"
        emptyDescription="Start tracking sales by creating a new challan."
      />

    </div>
  );
}
