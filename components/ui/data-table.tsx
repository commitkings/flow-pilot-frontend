"use client";

import { cn } from "@/lib/utils";

// ---------------------------------------------------------------------------
// Column definition
// ---------------------------------------------------------------------------

export interface TableColumn<T = Record<string, unknown>> {
  id: string;
  header: string;
  /** Render function for the cell content */
  cell: (row: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

// ---------------------------------------------------------------------------
// DataTable
// ---------------------------------------------------------------------------

interface DataTableProps<T> {
  columns: TableColumn<T>[];
  data: T[];
  /** Unique key per row */
  keyExtractor: (row: T) => string;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  skeletonRows?: number;
  /** Shown when data is empty and not loading */
  emptyState?: React.ReactNode;
  className?: string;
}

// Vary skeleton widths per cell so they look natural
const WIDTHS = ["w-1/4", "w-1/2", "w-1/3", "w-1/5", "w-2/5", "w-3/4"];

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  loading = false,
  skeletonRows = 6,
  emptyState,
  className,
}: DataTableProps<T>) {
  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <table className="w-full min-w-xl text-left text-sm">
        {/* Head */}
        <thead>
          <tr className="border-b border-border">
            {columns.map((col) => (
              <th
                key={col.id}
                className={cn(
                  "px-4 py-3 text-[11px] font-black uppercase tracking-wider text-black",
                  col.headerClassName
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>

        {/* Body */}
        <tbody>
          {loading ? (
            // Skeleton rows
            Array.from({ length: skeletonRows }).map((_, i) => (
              <tr key={i} className="border-b border-border last:border-0">
                {columns.map((col, j) => (
                  <td key={col.id} className="px-4 py-3.5">
                    <div
                      className={cn(
                        "h-3.5 animate-pulse rounded-full bg-muted",
                        WIDTHS[(i * columns.length + j) % WIDTHS.length]
                      )}
                    />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            // Empty state
            <tr>
              <td colSpan={columns.length} className="px-4 py-16">
                {emptyState ?? (
                  <p className="text-center text-sm text-muted-foreground">No results found.</p>
                )}
              </td>
            </tr>
          ) : (
            // Data rows
            data.map((row, index) => (
              <tr
                key={keyExtractor(row)}
                onClick={() => onRowClick?.(row)}
                className={cn(
                  "border-b border-border last:border-0 transition-colors",
                  onRowClick && "cursor-pointer hover:bg-muted/40"
                )}
              >
                {columns.map((col) => (
                  <td key={col.id} className={cn("px-4 py-3", col.className)}>
                    {col.cell(row, index)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
