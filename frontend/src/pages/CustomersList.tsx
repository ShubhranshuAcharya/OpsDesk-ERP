import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';
dayjs.extend(isToday);
import { useAuthStore } from '../store/auth';
import { DataTable } from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import StatusBadge from '../components/ui/StatusBadge';
import { CustomerFormDrawer } from '../components/customers/CustomerFormDrawer';
import { Plus, Search, FilterX } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';

export default function CustomersList() {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  
  // Pagination & Sort state
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Data fetching
  const { data, isLoading } = useQuery({
    queryKey: ['customers', { page, search: debouncedSearch, status: statusFilter, type: typeFilter, sortBy, sortOrder }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        sortBy,
        sortOrder
      });
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('type', typeFilter);

      const res = await axios.get(`${API_URL}/customers?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    }
  });

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc'); // Default to asc when switching columns
    }
  };

  const columns: Column<any>[] = [
    {
      header: 'Name',
      accessorKey: 'name',
      sortable: true,
      cell: (item) => (
        <div>
          <p className="text-ops-sm font-medium text-ops-text-primary">{item.name}</p>
          {item.email && <p className="text-[11px] text-ops-text-muted">{item.email}</p>}
        </div>
      )
    },
    {
      header: 'Business',
      accessorKey: 'businessName',
      cell: (item) => (
        <span className="text-ops-sm text-ops-text-secondary">{item.businessName || '—'}</span>
      )
    },
    {
      header: 'Mobile',
      accessorKey: 'mobile',
      cell: (item) => <span className="text-ops-sm text-ops-text-secondary">{item.mobile}</span>
    },
    {
      header: 'Type',
      accessorKey: 'customerType',
      cell: (item) => {
        const types: any = {
          'RETAIL': 'bg-blue-50 text-blue-700 border-blue-200',
          'WHOLESALE': 'bg-purple-50 text-purple-700 border-purple-200',
          'DISTRIBUTOR': 'bg-indigo-50 text-indigo-700 border-indigo-200'
        };
        return (
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${types[item.customerType]}`}>
            {item.customerType}
          </span>
        );
      }
    },
    {
      header: 'Follow-up',
      accessorKey: 'followUpDate',
      sortable: true,
      cell: (item) => {
        if (!item.followUpDate) return <span className="text-ops-sm text-ops-text-muted">—</span>;
        
        const date = dayjs(item.followUpDate);
        const isOverdue = date.isBefore(dayjs(), 'day');
        const isToday = date.isToday();

        let style = 'text-ops-text-secondary';
        if (isOverdue) style = 'text-ops-danger font-medium';
        else if (isToday) style = 'text-ops-warning font-medium';

        return <span className={`text-ops-sm ${style}`}>{date.format('MMM D, YYYY')}</span>;
      }
    },
    {
      header: 'Status',
      accessorKey: 'status',
      align: 'right',
      cell: (item) => <StatusBadge status={item.status} />
    }
  ];

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('');
    setTypeFilter('');
    setPage(1);
    setSortBy('createdAt');
    setSortOrder('desc');
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-ops-xl font-semibold text-ops-text-primary tracking-tight">Customers</h2>
          <p className="text-ops-sm text-ops-text-secondary">Manage your retail and B2B client relationships.</p>
        </div>
        <Button onClick={() => setIsDrawerOpen(true)}>
          <Plus size={16} className="mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 p-4 bg-ops-bg-surface border border-ops-border-default rounded-ops-md shadow-ops-sm">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ops-text-muted" size={16} />
          <input
            type="text"
            placeholder="Search by name, mobile, or business..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            className="w-full h-9 pl-9 pr-3 bg-ops-bg-base border border-ops-border-default rounded-ops-sm text-ops-sm focus:outline-none focus:border-ops-border-strong focus:bg-ops-bg-surface transition-colors"
          />
        </div>
        
        <div className="flex gap-4">
          <div className="w-40">
            <Select 
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              options={[
                { label: 'All Statuses', value: '' },
                { label: 'Lead', value: 'LEAD' },
                { label: 'Active', value: 'ACTIVE' },
                { label: 'Inactive', value: 'INACTIVE' }
              ]}
            />
          </div>
          <div className="w-40">
            <Select 
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              options={[
                { label: 'All Types', value: '' },
                { label: 'Retail', value: 'RETAIL' },
                { label: 'Wholesale', value: 'WHOLESALE' },
                { label: 'Distributor', value: 'DISTRIBUTOR' }
              ]}
            />
          </div>
          {(searchTerm || statusFilter || typeFilter) && (
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
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSort={handleSort}
        onRowClick={(item) => navigate(`/customers/${item.id}`)}
        emptyTitle="No customers found"
        emptyDescription={searchTerm ? 'Try adjusting your search or filters.' : 'Get started by adding your first customer.'}
      />

      <CustomerFormDrawer 
        isOpen={isDrawerOpen} 
        onClose={() => setIsDrawerOpen(false)} 
      />
    </div>
  );
}
