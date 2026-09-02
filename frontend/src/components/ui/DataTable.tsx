import { type ReactNode } from 'react';
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight } from 'lucide-react';
import EmptyState from './EmptyState';

export interface Column<T> {
  header: string;
  accessorKey: keyof T | string;
  cell?: (item: T) => ReactNode;
  sortable?: boolean;
  align?: 'left' | 'right' | 'center';
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  isLoading?: boolean;
  
  // Pagination
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  
  // Sorting
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSort?: (column: string) => void;
  
  // Empty state props
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: ReactNode;
  
  onRowClick?: (item: T) => void;
}

export function DataTable<T>({
  data,
  columns,
  isLoading,
  page = 1,
  totalPages = 1,
  onPageChange,
  sortBy,
  sortOrder,
  onSort,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no items matching your criteria.',
  emptyIcon,
  onRowClick
}: DataTableProps<T>) {

  if (isLoading) {
    return (
      <div className="bg-ops-bg-surface border border-ops-border-default rounded-ops-md shadow-ops-sm overflow-hidden animate-pulse">
        <div className="h-10 bg-ops-bg-base border-b border-ops-border-default"></div>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-14 border-b border-ops-border-default px-6 flex items-center">
            <div className="h-4 bg-ops-bg-base rounded w-1/4"></div>
          </div>
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="bg-ops-bg-surface border border-ops-border-default rounded-ops-md shadow-ops-sm h-64">
        <EmptyState title={emptyTitle} description={emptyDescription} icon={emptyIcon} />
      </div>
    );
  }

  return (
    <div className="bg-ops-bg-surface border border-ops-border-default rounded-ops-md shadow-ops-sm flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-ops-bg-base border-b border-ops-border-default">
            <tr>
              {columns.map((col, idx) => (
                <th 
                  key={idx}
                  onClick={() => col.sortable && onSort && onSort(col.accessorKey as string)}
                  className={`px-6 py-3 text-ops-xs font-semibold text-ops-text-secondary uppercase tracking-wider ${
                    col.sortable ? 'cursor-pointer hover:bg-ops-border-default/30 transition-colors select-none' : ''
                  } ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                >
                  <div className={`flex items-center gap-1 ${col.align === 'right' ? 'justify-end' : col.align === 'center' ? 'justify-center' : 'justify-start'}`}>
                    {col.header}
                    {col.sortable && sortBy === col.accessorKey && (
                      <span className="text-ops-primary">
                        {sortOrder === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ops-border-default">
            {data.map((item, rowIdx) => (
              <tr 
                key={rowIdx} 
                onClick={() => onRowClick && onRowClick(item)}
                className={`transition-colors ${onRowClick ? 'cursor-pointer hover:bg-ops-bg-base' : ''}`}
              >
                {columns.map((col, colIdx) => (
                  <td 
                    key={colIdx} 
                    className={`px-6 py-4 whitespace-nowrap ${
                      col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                    }`}
                  >
                    {col.cell ? col.cell(item) : (item as any)[col.accessorKey] as ReactNode}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Pagination Controls */}
      {totalPages > 1 && onPageChange && (
        <div className="px-6 py-3 border-t border-ops-border-default flex items-center justify-between bg-ops-bg-base shrink-0">
          <p className="text-ops-xs text-ops-text-secondary">
            Page <span className="font-medium text-ops-text-primary">{page}</span> of <span className="font-medium text-ops-text-primary">{totalPages}</span>
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => onPageChange(page - 1)}
              disabled={page <= 1}
              className="w-8 h-8 flex items-center justify-center rounded-ops-sm border border-ops-border-strong bg-ops-bg-surface text-ops-text-secondary hover:bg-ops-bg-base hover:text-ops-text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => onPageChange(page + 1)}
              disabled={page >= totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-ops-sm border border-ops-border-strong bg-ops-bg-surface text-ops-text-secondary hover:bg-ops-bg-base hover:text-ops-text-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
