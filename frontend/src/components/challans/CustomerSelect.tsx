import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthStore } from '../../store/auth';
import { Search, ChevronDown, Check } from 'lucide-react';
import StatusBadge from '../ui/StatusBadge';

interface CustomerSelectProps {
  value: string; // customerId
  onChange: (customerId: string, customerData: any) => void;
  error?: string;
}

export function CustomerSelect({ value, onChange, error }: CustomerSelectProps) {
  const { token } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch all customers for now (in real app, we'd debounce search the API)
  const { data: customers, isLoading } = useQuery({
    queryKey: ['customers', 'all'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/customers?limit=1000`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data.data;
    }
  });

  const filteredCustomers = customers?.filter((c: any) => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.mobile.includes(searchTerm) ||
    (c.businessName && c.businessName.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  const selectedCustomer = customers?.find((c: any) => c.id === value);

  return (
    <div className="relative" ref={wrapperRef}>
      <label className="block text-ops-sm font-medium text-ops-text-primary mb-1.5">
        Select Customer <span className="text-ops-danger">*</span>
      </label>
      
      <div 
        className={`w-full min-h-[42px] px-3 py-2 bg-ops-bg-base border ${error ? 'border-ops-danger focus:ring-ops-danger/20' : 'border-ops-border-default focus:border-ops-border-strong focus:ring-ops-border-strong/20'} rounded-ops-sm text-ops-sm flex items-center justify-between cursor-pointer transition-colors focus:outline-none focus:ring-4`}
        onClick={() => setIsOpen(!isOpen)}
        tabIndex={0}
      >
        {selectedCustomer ? (
          <div className="flex flex-col">
            <span className="font-medium text-ops-text-primary">{selectedCustomer.name}</span>
            <span className="text-ops-xs text-ops-text-secondary">{selectedCustomer.businessName || selectedCustomer.mobile}</span>
          </div>
        ) : (
          <span className="text-ops-text-muted">Search and select a customer...</span>
        )}
        <ChevronDown size={16} className={`text-ops-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      
      {error && <p className="mt-1.5 text-ops-xs text-ops-danger">{error}</p>}

      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-ops-bg-surface border border-ops-border-default rounded-ops-md shadow-ops-lg max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2">
          <div className="sticky top-0 bg-ops-bg-surface p-2 border-b border-ops-border-default">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ops-text-muted" size={14} />
              <input
                type="text"
                placeholder="Type to search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-8 pl-8 pr-3 bg-ops-bg-base border border-ops-border-default rounded-ops-sm text-ops-sm focus:outline-none focus:border-ops-border-strong"
                autoFocus
              />
            </div>
          </div>
          
          <div className="py-1">
            {isLoading ? (
              <div className="px-3 py-2 text-ops-sm text-ops-text-muted">Loading customers...</div>
            ) : filteredCustomers.length === 0 ? (
              <div className="px-3 py-2 text-ops-sm text-ops-text-muted">No customers found.</div>
            ) : (
              filteredCustomers.map((c: any) => (
                <div 
                  key={c.id}
                  className={`px-3 py-2 flex items-center justify-between cursor-pointer hover:bg-ops-bg-base transition-colors ${value === c.id ? 'bg-ops-bg-base' : ''}`}
                  onClick={() => {
                    onChange(c.id, c);
                    setIsOpen(false);
                    setSearchTerm('');
                  }}
                >
                  <div className="flex flex-col">
                    <span className="text-ops-sm font-medium text-ops-text-primary">{c.name}</span>
                    <span className="text-ops-xs text-ops-text-secondary">{c.mobile} &middot; {c.customerType}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusBadge status={c.status} />
                    {value === c.id && <Check size={16} className="text-ops-primary" />}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
