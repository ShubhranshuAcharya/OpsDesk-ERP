import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../store/auth';
import { DataTable } from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { ProductFormModal } from '../components/inventory/ProductFormModal';
import { Plus, Search, FilterX, AlertTriangle, ArrowDown, ArrowUp } from 'lucide-react';
import { useDebounce } from '../hooks/useDebounce';

export default function InventoryList() {
  const { token, user } = useAuthStore();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  // Read initial lowStock from URL
  const initialLowStock = searchParams.get('lowStock') === 'true';

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 500);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(initialLowStock);
  
  // Pagination & Sort state
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Sync URL when lowStockOnly changes so reloading keeps it
  useEffect(() => {
    if (lowStockOnly) {
      setSearchParams({ lowStock: 'true' });
    } else {
      setSearchParams({});
    }
  }, [lowStockOnly, setSearchParams]);

  const { data, isLoading } = useQuery({
    queryKey: ['products', { page, search: debouncedSearch, category: categoryFilter, location: locationFilter, lowStockOnly, sortBy, sortOrder }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        sortBy,
        sortOrder
      });
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (categoryFilter) params.append('category', categoryFilter);
      if (locationFilter) params.append('location', locationFilter);
      if (lowStockOnly) params.append('lowStockOnly', 'true');

      const res = await axios.get(`${API_URL}/products?${params.toString()}`, {
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
      setSortOrder('asc'); 
    }
  };

  const columns: Column<any>[] = [
    {
      header: 'SKU',
      accessorKey: 'sku',
      sortable: true,
      cell: (item) => <span className="text-ops-sm font-medium text-ops-text-secondary">{item.sku}</span>
    },
    {
      header: 'Product Name',
      accessorKey: 'name',
      sortable: true,
      cell: (item) => <span className="text-ops-sm font-medium text-ops-text-primary">{item.name}</span>
    },
    {
      header: 'Category',
      accessorKey: 'category',
      cell: (item) => (
        <span className="text-ops-sm text-ops-text-secondary">{item.category || '—'}</span>
      )
    },
    {
      header: 'Unit Price',
      accessorKey: 'unitPrice',
      sortable: true,
      align: 'right',
      cell: (item) => (
        <span className="text-ops-sm text-ops-text-primary font-medium">
          ${parseFloat(item.unitPrice).toFixed(2)}
        </span>
      )
    },
    {
      header: 'Current Stock',
      accessorKey: 'currentStock',
      sortable: true,
      align: 'right',
      cell: (item) => {
        const isLow = item.currentStock <= item.minStockAlert;
        return (
          <div className={`flex items-center justify-end gap-1.5 ${isLow ? 'text-ops-danger font-semibold' : 'text-ops-text-primary'}`}>
            {isLow && <AlertTriangle size={14} />}
            <span>{item.currentStock}</span>
          </div>
        );
      }
    },
    {
      header: 'Location',
      accessorKey: 'location',
      cell: (item) => <span className="text-ops-sm text-ops-text-secondary">{item.location || '—'}</span>
    }
  ];

  const clearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('');
    setLocationFilter('');
    setLowStockOnly(false);
    setPage(1);
    setSortBy('name');
    setSortOrder('asc');
  };

  const canEdit = user?.role === 'ADMIN' || user?.role === 'WAREHOUSE';

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-ops-xl font-semibold text-ops-text-primary tracking-tight">Products & Inventory</h2>
          <p className="text-ops-sm text-ops-text-secondary">Manage your product catalog and monitor stock levels.</p>
        </div>
        {canEdit && (
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus size={16} className="mr-2" />
            Add Product
          </Button>
        )}
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 p-4 bg-ops-bg-surface border border-ops-border-default rounded-ops-md shadow-ops-sm items-center">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ops-text-muted" size={16} />
          <input
            type="text"
            placeholder="Search by name or SKU..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
            className="w-full h-9 pl-9 pr-3 bg-ops-bg-base border border-ops-border-default rounded-ops-sm text-ops-sm focus:outline-none focus:border-ops-border-strong focus:bg-ops-bg-surface transition-colors"
          />
        </div>
        
        <div className="flex gap-4 w-full md:w-auto items-center">
          <Input 
            placeholder="Filter Category"
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            className="w-32"
          />
          <Input 
            placeholder="Filter Location"
            value={locationFilter}
            onChange={(e) => { setLocationFilter(e.target.value); setPage(1); }}
            className="w-32"
          />
          
          <label className="flex items-center gap-2 text-ops-sm text-ops-text-secondary cursor-pointer shrink-0">
            <input 
              type="checkbox" 
              checked={lowStockOnly} 
              onChange={(e) => { setLowStockOnly(e.target.checked); setPage(1); }}
              className="rounded border-ops-border-strong text-ops-primary focus:ring-ops-primary"
            />
            Low Stock Alerts
          </label>

          {(searchTerm || categoryFilter || locationFilter || lowStockOnly) && (
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
        onRowClick={(item) => navigate(`/inventory/${item.id}`)}
        emptyTitle="No products found"
        emptyDescription={searchTerm || lowStockOnly ? 'Try adjusting your search or filters.' : 'Your inventory is currently empty.'}
      />

      {canEdit && (
        <ProductFormModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
        />
      )}
    </div>
  );
}
