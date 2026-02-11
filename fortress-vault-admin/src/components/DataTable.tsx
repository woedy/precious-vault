import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  render?: (item: T) => React.ReactNode;
  className?: string;
}

export interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string | number;
  onRowClick?: (item: T) => void;
  isLoading?: boolean;
  emptyMessage?: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    pageSize: number;
    totalItems: number;
    onPageChange: (page: number) => void;
  };
  sorting?: {
    sortBy: string | null;
    sortOrder: 'asc' | 'desc';
    onSort: (key: string) => void;
  };
  selection?: {
    selectedIds: Set<string | number>;
    onSelectionChange: (ids: Set<string | number>) => void;
    maxSelection?: number;
  };
  className?: string;
}

function DataTable<T>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  isLoading = false,
  emptyMessage = 'No data available',
  pagination,
  sorting,
  selection,
  className,
}: DataTableProps<T>) {
  const [localSortBy, setLocalSortBy] = useState<string | null>(null);
  const [localSortOrder, setLocalSortOrder] = useState<'asc' | 'desc'>('asc');

  const sortBy = sorting?.sortBy ?? localSortBy;
  const sortOrder = sorting?.sortOrder ?? localSortOrder;

  const handleSort = (key: string) => {
    if (sorting) {
      sorting.onSort(key);
    } else {
      if (sortBy === key) {
        setLocalSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
      } else {
        setLocalSortBy(key);
        setLocalSortOrder('asc');
      }
    }
  };

  const handleSelectAll = () => {
    if (!selection) return;

    const allIds = new Set(data.map(keyExtractor));
    const isAllSelected = data.every((item) =>
      selection.selectedIds.has(keyExtractor(item))
    );

    if (isAllSelected) {
      selection.onSelectionChange(new Set());
    } else {
      if (selection.maxSelection && allIds.size > selection.maxSelection) {
        // Don't select all if it exceeds max
        return;
      }
      selection.onSelectionChange(allIds);
    }
  };

  const handleSelectRow = (item: T) => {
    if (!selection) return;

    const id = keyExtractor(item);
    const newSelection = new Set(selection.selectedIds);

    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      if (selection.maxSelection && newSelection.size >= selection.maxSelection) {
        // Don't add if max reached
        return;
      }
      newSelection.add(id);
    }

    selection.onSelectionChange(newSelection);
  };

  const getSortIcon = (columnKey: string) => {
    if (sortBy !== columnKey) {
      return <ArrowUpDown className="ml-2 h-4 w-4" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="ml-2 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-2 h-4 w-4" />
    );
  };

  const isAllSelected =
    selection && data.length > 0
      ? data.every((item) => selection.selectedIds.has(keyExtractor(item)))
      : false;

  return (
    <div className={cn('space-y-4', className)}>
      {/* Table */}
      <div className="rounded-md border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                {selection && (
                  <th className="h-12 px-4 text-left align-middle font-medium w-12">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      className="h-4 w-4 rounded border-gray-300"
                      disabled={
                        selection.maxSelection
                          ? data.length > selection.maxSelection
                          : false
                      }
                    />
                  </th>
                )}
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={cn(
                      'h-12 px-4 text-left align-middle font-medium text-muted-foreground',
                      column.className
                    )}
                  >
                    {column.sortable ? (
                      <button
                        onClick={() => handleSort(column.key)}
                        className="flex items-center hover:text-foreground transition-colors"
                      >
                        {column.header}
                        {getSortIcon(column.key)}
                      </button>
                    ) : (
                      column.header
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={columns.length + (selection ? 1 : 0)}
                    className="h-24 text-center"
                  >
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (selection ? 1 : 0)}
                    className="h-24 text-center text-muted-foreground"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                data.map((item) => {
                  const id = keyExtractor(item);
                  const isSelected = selection?.selectedIds.has(id) ?? false;

                  return (
                    <tr
                      key={id}
                      onClick={() => onRowClick?.(item)}
                      className={cn(
                        'border-b transition-colors',
                        onRowClick && 'cursor-pointer hover:bg-muted/50',
                        isSelected && 'bg-muted'
                      )}
                    >
                      {selection && (
                        <td className="px-4 py-3">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleSelectRow(item)}
                            onClick={(e) => e.stopPropagation()}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                        </td>
                      )}
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          className={cn('px-4 py-3', column.className)}
                        >
                          {column.render
                            ? column.render(item)
                            : String((item as Record<string, unknown>)[column.key] ?? '')}
                        </td>
                      ))}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            Showing {(pagination.currentPage - 1) * pagination.pageSize + 1} to{' '}
            {Math.min(
              pagination.currentPage * pagination.pageSize,
              pagination.totalItems
            )}{' '}
            of {pagination.totalItems} results
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(1)}
              disabled={pagination.currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.currentPage - 1)}
              disabled={pagination.currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="text-sm">
              Page {pagination.currentPage} of {pagination.totalPages}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.currentPage + 1)}
              disabled={pagination.currentPage === pagination.totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => pagination.onPageChange(pagination.totalPages)}
              disabled={pagination.currentPage === pagination.totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Selection info */}
      {selection && selection.selectedIds.size > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            {selection.selectedIds.size} item(s) selected
            {selection.maxSelection &&
              ` (max ${selection.maxSelection})`}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => selection.onSelectionChange(new Set())}
          >
            Clear selection
          </Button>
        </div>
      )}
    </div>
  );
}

export default DataTable;
