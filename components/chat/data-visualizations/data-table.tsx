"use client"

import { type DataPoint, type Column, calculateStats } from '@/lib/data-parsers'
import { useMemo } from 'react'
import { cn } from '@/lib/utils'

interface DataTableProps {
  data: DataPoint[] | Record<string, any>[]
  columns?: Column[]
  title?: string
  query?: string
  summary?: Record<string, any>
  onToggle?: () => void
}

// Default columns for legacy arrow format
const DEFAULT_ARROW_COLUMNS: Column[] = [
  { key: 'date', label: 'Date', type: 'date', align: 'left' },
  { key: 'initialDrop', label: 'Initial Drop', type: 'percentage', align: 'left' },
  { key: 'forwardReturn', label: 'Forward Return', type: 'percentage', align: 'left' },
  { key: 'status', label: 'Status', type: 'text', align: 'center' },
]

// Helper: Format value based on type
function formatValue(value: any, type?: string): string {
  if (value === null || value === undefined) return '—'
  return String(value)
}

// Helper: Get cell styling based on type and value
function getCellClass(value: any, type?: string, isFirstColumn?: boolean): string {
  const base = "px-4 py-3 text-sm"
  const sticky = isFirstColumn ? "sticky left-0 bg-inherit" : ""

  if (type === 'percentage' && value !== null && value !== undefined && value !== '—') {
    const strValue = String(value).replace(/[–-]/g, '-').replace(/%/g, '').replace(/\+/g, '').trim()
    const num = parseFloat(strValue)

    if (!isNaN(num)) {
      const color = num >= 0
        ? "text-green-600 dark:text-green-400 font-semibold"
        : "text-red-600 dark:text-red-400 font-semibold"
      return `${base} ${color} ${sticky}`.trim()
    }
  }

  if (isFirstColumn) {
    return `${base} font-medium text-gray-900 dark:text-gray-100 ${sticky}`.trim()
  }

  return `${base} text-gray-900 dark:text-gray-100`.trim()
}

// Helper: Check if data is legacy arrow format
function isArrowFormat(data: any[]): data is DataPoint[] {
  return data.length > 0 && 'forwardReturn' in data[0]
}

export function DataTable({ data, columns, title = "Market Data", query, summary, onToggle }: DataTableProps) {
  // Determine which columns to use
  const displayColumns = useMemo(() => {
    if (columns) {
      return columns
    }

    // Legacy arrow format - use default columns
    if (isArrowFormat(data)) {
      return DEFAULT_ARROW_COLUMNS
    }

    // Auto-detect columns from data keys
    if (data.length > 0) {
      const firstRow = data[0]
      if (firstRow && typeof firstRow === 'object') {
        return Object.keys(firstRow).map(key => ({
          key,
          label: key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1'),
          type: 'text' as const,
          align: 'left' as const,
        }))
      }
    }

    return DEFAULT_ARROW_COLUMNS
  }, [data, columns])

  // Calculate stats for legacy format (only works with DataPoint[])
  const stats = useMemo(() => {
    if (isArrowFormat(data)) {
      return calculateStats(data)
    }
    return null
  }, [data])

  return (
    <div className="my-6 rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50/40 via-white to-purple-50/20 p-8 shadow-xl dark:bg-gray-900 dark:border-gray-700 relative overflow-hidden">

      {/* LARGE PROMINENT WATERMARK - 30% opacity, no blur */}
      <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none overflow-hidden">
        <img
          src="/pelican-logo.png"
          alt=""
          className="w-96 h-96 object-contain"
          aria-hidden="true"
        />
      </div>

      {/* Content layer above watermark */}
      <div className="relative z-10">

        {/* Header with logo and branding */}
        <div className="mb-6 flex items-center gap-3">
          <img src="/pelican-logo.png" alt="Pelican" className="h-12 w-12" />
          <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">Pelican</span>
        </div>

        {/* User's query (if provided by AI) */}
        {query && (
          <p className="mb-6 text-lg font-medium text-gray-800 dark:text-gray-200 leading-relaxed">
            {query}
          </p>
        )}

        {/* Title (if different from query) */}
        {title && title !== query && (
          <h3 className="mb-4 text-lg font-semibold text-gray-800 dark:text-gray-200">{title}</h3>
        )}

        {/* Table */}
        <div className="overflow-x-auto rounded-lg">
          <table className="w-full border-collapse" aria-label="Market data visualization">
            <thead>
              <tr className="border-b-2 border-gray-300 dark:border-gray-700">
                {displayColumns.map((col, i) => (
                  <th
                    key={col.key}
                    className={cn(
                      "px-4 py-3 text-base font-semibold text-gray-900 dark:text-gray-300",
                      i === 0 && "sticky left-0 bg-transparent",
                      col.align === 'center' ? 'text-center' :
                      col.align === 'right' ? 'text-right' : 'text-left'
                    )}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr
                  key={i}
                  className={cn(
                    "border-b border-gray-200 dark:border-gray-700 transition",
                    i % 2 === 0 ? "bg-white/40" : "bg-purple-50/20"
                  )}
                >
                  {displayColumns.map((col, colIndex) => {
                    const value = row[col.key as keyof typeof row]

                    // Special handling for status column in arrow format
                    if (col.key === 'status' && isArrowFormat(data)) {
                      const returnValue = (row as DataPoint).forwardReturn
                      const isPositive = parseFloat(returnValue.replace(/[–-]/g, '-').replace(/%/g, '').replace(/\+/g, '')) >= 0
                      return (
                        <td key={col.key} className="px-4 py-3 text-center text-lg">
                          {isPositive ? (
                            <span className="text-green-600 dark:text-green-400">✓</span>
                          ) : (
                            <span className="text-red-600 dark:text-red-400">✗</span>
                          )}
                        </td>
                      )
                    }

                    return (
                      <td
                        key={col.key}
                        className={getCellClass(value, col.type, colIndex === 0)}
                      >
                        {formatValue(value, col.type)}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>

            {/* Summary row - either from props or calculated for legacy format */}
            {(summary || stats) && (
              <tfoot className="bg-purple-100/80 dark:bg-purple-900/30 border-t-2 border-purple-300 dark:border-purple-700">
                <tr>
                  {summary ? (
                    // Structured format summary
                    displayColumns.map((col, i) => (
                      <td
                        key={col.key}
                        className={cn(
                          "px-4 py-4 text-sm font-bold text-gray-900 dark:text-gray-200",
                          i === 0 && "sticky left-0 bg-inherit"
                        )}
                      >
                        {formatValue(summary[col.key], col.type)}
                      </td>
                    ))
                  ) : stats ? (
                    // Legacy format stats
                    <td colSpan={displayColumns.length} className="px-4 py-4">
                      <div className="flex gap-6 text-sm font-bold text-gray-900 dark:text-gray-200">
                        <span>Avg Return: <span className="text-purple-600 dark:text-purple-400">{stats.avgReturn}</span></span>
                        <span>Positive: <span className="text-purple-600 dark:text-purple-400">{stats.percentPositive}</span></span>
                      </div>
                    </td>
                  ) : null}
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Toggle button */}
        {onToggle && (
          <button
            onClick={onToggle}
            className="mt-4 text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline"
          >
            View Raw Text
          </button>
        )}
      </div>
    </div>
  )
}
