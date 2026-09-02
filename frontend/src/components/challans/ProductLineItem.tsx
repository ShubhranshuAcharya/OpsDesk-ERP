import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuthStore } from '../../store/auth';
import { Search, ChevronDown, Check, Trash2, AlertTriangle } from 'lucide-react';
import { Input } from '../ui/Input';

interface LineItem {
  id: string; // unique local id
  productId: string;
  productName: string;
  productSku: string;
  unitPrice: number;
  currentStock: number;
  quantity: number;
}

interface ProductLineItemProps {
  item: LineItem;
  index: number;
  onUpdate: (index: number, updates: Partial<LineItem>) => void;
  onRemove: (index: number) => void;
  error?: string;
}

export function ProductLineItem({ item, index, onUpdate, onRemove, error }: ProductLineItemProps) {
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

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', 'all'],
    queryFn: async () => {
      const res = await axios.get(`${API_URL}/products?limit=1000`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      return res.data.data;
    }
  });

  const filteredProducts = products?.filter((p: any) => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const subtotal = item.quantity * item.unitPrice;
  const isOverStock = item.productId && item.quantity > item.currentStock;

  return (
    <div className="flex flex-col md:flex-row items-start gap-4 p-4 border border-ops-border-default rounded-ops-md bg-ops-bg-surface hover:border-ops-border-strong transition-colors relative group">
      
      {/* Product Selection */}
      <div className="flex-1 w-full relative" ref={wrapperRef}>
        <label className="block text-ops-xs font-medium text-ops-text-secondary uppercase tracking-wider mb-1.5">
          Product
        </label>
        
        <div 
          className={`w-full min-h-[42px] px-3 py-2 bg-ops-bg-base border ${error ? 'border-ops-danger focus:ring-ops-danger/20' : 'border-ops-border-default focus:border-ops-border-strong focus:ring-ops-border-strong/20'} rounded-ops-sm text-ops-sm flex items-center justify-between cursor-pointer transition-colors focus:outline-none focus:ring-4`}
          onClick={() => setIsOpen(!isOpen)}
          tabIndex={0}
        >
          {item.productId ? (
            <div className="flex flex-col">
              <span className="font-medium text-ops-text-primary">{item.productName}</span>
              <span className="text-ops-xs text-ops-text-secondary font-mono">{item.productSku}</span>
            </div>
          ) : (
            <span className="text-ops-text-muted">Search product...</span>
          )}
          <ChevronDown size={16} className={`text-ops-text-muted transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>

        {isOpen && (
          <div className="absolute z-20 w-full mt-1 bg-ops-bg-surface border border-ops-border-default rounded-ops-md shadow-ops-lg max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2">
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
                <div className="px-3 py-2 text-ops-sm text-ops-text-muted">Loading products...</div>
              ) : filteredProducts.length === 0 ? (
                <div className="px-3 py-2 text-ops-sm text-ops-text-muted">No products found.</div>
              ) : (
                filteredProducts.map((p: any) => (
                  <div 
                    key={p.id}
                    className={`px-3 py-2 flex items-center justify-between cursor-pointer hover:bg-ops-bg-base transition-colors ${item.productId === p.id ? 'bg-ops-bg-base' : ''}`}
                    onClick={() => {
                      onUpdate(index, {
                        productId: p.id,
                        productName: p.name,
                        productSku: p.sku,
                        unitPrice: parseFloat(p.unitPrice),
                        currentStock: p.currentStock
                      });
                      setIsOpen(false);
                      setSearchTerm('');
                    }}
                  >
                    <div className="flex flex-col">
                      <span className="text-ops-sm font-medium text-ops-text-primary">{p.name}</span>
                      <span className="text-ops-xs text-ops-text-secondary">{p.sku} &middot; ${parseFloat(p.unitPrice).toFixed(2)}</span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className={`text-ops-xs font-semibold ${p.currentStock > 0 ? 'text-ops-text-primary' : 'text-ops-danger'}`}>
                        {p.currentStock} in stock
                      </span>
                      {item.productId === p.id && <Check size={16} className="text-ops-primary" />}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Quantity & Pricing */}
      <div className="flex items-start gap-4 w-full md:w-auto">
        <div className="w-24">
          <Input 
            label="Qty" 
            type="number"
            min={1}
            value={item.quantity || ''}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              onUpdate(index, { quantity: isNaN(val) ? 0 : val });
            }}
            error={error ? ' ' : undefined}
          />
        </div>
        
        <div className="w-24 pt-[28px]">
          <div className="h-[42px] px-3 flex items-center justify-end bg-ops-bg-base border border-transparent rounded-ops-sm text-ops-sm text-ops-text-secondary">
            ${item.unitPrice.toFixed(2)}
          </div>
        </div>

        <div className="w-28 pt-[28px]">
          <div className="h-[42px] px-3 flex items-center justify-end bg-ops-bg-base border border-transparent rounded-ops-sm text-ops-base font-semibold text-ops-text-primary">
            ${subtotal.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Remove Line */}
      <button 
        type="button"
        onClick={() => onRemove(index)}
        className="absolute -right-3 -top-3 w-7 h-7 bg-ops-bg-surface border border-ops-border-default rounded-full flex items-center justify-center text-ops-text-muted hover:text-ops-danger hover:border-ops-danger hover:bg-ops-danger-bg transition-colors shadow-ops-sm opacity-0 group-hover:opacity-100"
      >
        <Trash2 size={14} />
      </button>

      {/* Error/Warning Line */}
      {(error || isOverStock) && (
        <div className="absolute -bottom-5 left-0 right-0 flex justify-between px-1">
          <span className="text-[11px] text-ops-danger font-medium flex items-center gap-1">
            {isOverStock ? (
              <><AlertTriangle size={12} /> Only {item.currentStock} in stock</>
            ) : (
              error
            )}
          </span>
        </div>
      )}

    </div>
  );
}
