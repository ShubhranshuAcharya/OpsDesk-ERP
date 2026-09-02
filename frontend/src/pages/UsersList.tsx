import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthStore } from '../store/auth';
import { DataTable } from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { UserModal } from '../components/users/UserModal';
import { Plus, Search, FilterX, Edit } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';
import dayjs from 'dayjs';

export default function UsersList() {
  const { token, user: currentUser } = useAuthStore();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<any | null>(null);

  const { data: response, isLoading } = useQuery({
    queryKey: ['users', debouncedSearch, roleFilter, statusFilter, page],
    queryFn: async () => {
      const params = new URLSearchParams({ page: page.toString(), limit: '10' });
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) params.append('status', statusFilter === 'active' ? 'Active' : 'Inactive');

      const res = await axios.get(`${API_URL}/users?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data;
    }
  });

  const users = response?.data || [];
  const pagination = response?.pagination;

  const columns: Column<any>[] = [
    {
      header: 'Name',
      accessorKey: 'name',
      sortable: true,
      cell: (item) => (
        <span className="text-ops-sm font-medium text-ops-text-primary">
          {item.name}
          {item.id === currentUser?.id && <span className="ml-2 text-[10px] uppercase bg-ops-bg-base px-1.5 py-0.5 rounded text-ops-text-muted">You</span>}
        </span>
      )
    },
    {
      header: 'Email',
      accessorKey: 'email',
      cell: (item) => <span className="text-ops-sm text-ops-text-secondary">{item.email}</span>
    },
    {
      header: 'Role',
      accessorKey: 'role',
      sortable: true,
      cell: (item) => {
        const roleColors: Record<string, string> = {
          'ADMIN': 'bg-purple-100 text-purple-700',
          'SALES': 'bg-blue-100 text-blue-700',
          'WAREHOUSE': 'bg-amber-100 text-amber-700',
          'ACCOUNTS': 'bg-emerald-100 text-emerald-700'
        };
        const color = roleColors[item.role] || 'bg-gray-100 text-gray-700';
        
        return (
          <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${color}`}>
            {item.role}
          </span>
        );
      }
    },
    {
      header: 'Status',
      accessorKey: 'isActive',
      sortable: true,
      cell: (item) => (
        <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
          item.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        }`}>
          {item.isActive ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      header: 'Date Created',
      accessorKey: 'createdAt',
      sortable: true,
      cell: (item) => <span className="text-ops-sm text-ops-text-secondary">{dayjs(item.createdAt).format('MMM D, YYYY')}</span>
    },
    {
      header: '',
      accessorKey: 'actions',
      align: 'right',
      cell: (item) => (
        <Button 
          variant="ghost" 
          className="h-8 w-8 p-0" 
          onClick={(e) => {
            e.stopPropagation();
            setUserToEdit(item);
            setIsModalOpen(true);
          }}
          title="Edit User"
        >
          <Edit size={16} className="text-ops-text-secondary" />
        </Button>
      )
    }
  ];

  const clearFilters = () => {
    setSearchTerm('');
    setRoleFilter('');
    setStatusFilter('');
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-ops-xl font-semibold text-ops-text-primary tracking-tight">Users & Roles</h2>
          <p className="text-ops-sm text-ops-text-secondary">Manage system access and team permissions.</p>
        </div>
        <Button onClick={() => { setUserToEdit(null); setIsModalOpen(true); }}>
          <Plus size={16} className="mr-2" />
          Add User
        </Button>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 p-4 bg-ops-bg-surface border border-ops-border-default rounded-ops-md shadow-ops-sm items-center">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ops-text-muted" size={16} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-9 pl-9 pr-3 bg-ops-bg-base border border-ops-border-default rounded-ops-sm text-ops-sm focus:outline-none focus:border-ops-border-strong focus:bg-ops-bg-surface transition-colors"
          />
        </div>
        
        <div className="flex gap-4 w-full md:w-auto items-center">
          <Select 
            label=""
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-32 h-9"
            options={[
              { label: 'All Roles', value: '' },
              { label: 'Admin', value: 'ADMIN' },
              { label: 'Sales', value: 'SALES' },
              { label: 'Warehouse', value: 'WAREHOUSE' },
              { label: 'Accounts', value: 'ACCOUNTS' },
            ]}
          />
          <Select 
            label=""
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-32 h-9"
            options={[
              { label: 'All Status', value: '' },
              { label: 'Active', value: 'active' },
              { label: 'Inactive', value: 'inactive' },
            ]}
          />

          {(searchTerm || roleFilter || statusFilter) && (
            <Button variant="ghost" className="px-2 h-9" onClick={clearFilters} title="Clear filters">
              <FilterX size={16} />
            </Button>
          )}
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        data={users}
        columns={columns}
        isLoading={isLoading}
        page={pagination?.page}
        totalPages={pagination?.totalPages}
        onPageChange={setPage}
        onRowClick={(item) => {
          setUserToEdit(item);
          setIsModalOpen(true);
        }}
        emptyTitle="No users found"
        emptyDescription="Try adjusting your search or filters."
      />

      <UserModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        userToEdit={userToEdit}
      />
    </div>
  );
}
