'use client'

import { useMemo, useState } from 'react'

import { Button } from '@cryptonext/ui/button'
import { Card, CardContent } from '@cryptonext/ui/card'
import { Label } from '@cryptonext/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@cryptonext/ui/select'
import { Skeleton } from '@cryptonext/ui/skeleton'
import { useQuery } from '@tanstack/react-query'
import {
  ColumnDef,
  SortingState,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { format } from 'date-fns'
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronsUpDown,
} from 'lucide-react'

import { isDeprecatedAlgorithm } from '@/components/dashboard/chartTheme'
import {
  DEFAULT_FILTERS,
  type DashboardFilters,
  GlobalFilters,
} from '@/components/dashboard/globalFilters'
import { CryptoEvent, Severity, api } from '@/lib/api'

function SeverityCell({ severity }: { severity: Severity }) {
  const styles: Record<Severity, string> = {
    info: 'bg-primary/10 text-primary border-primary/20',
    warning: 'bg-warning/10 text-warning border-warning/20',
    critical: 'bg-destructive/10 text-destructive border-destructive/20',
  }
  const dot: Record<Severity, string> = {
    info: 'bg-primary',
    warning: 'bg-warning',
    critical: 'bg-destructive',
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11px] font-medium ${styles[severity]}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot[severity]}`} />
      <span className="capitalize">{severity}</span>
    </span>
  )
}

function AlgorithmCell({ algorithm }: { algorithm: string }) {
  const isDeprecated = isDeprecatedAlgorithm(algorithm)
  return (
    <span
      className={`font-mono text-xs font-medium ${
        isDeprecated ? 'text-destructive' : 'text-foreground'
      }`}
    >
      {algorithm}
      {isDeprecated && (
        <span className="text-destructive/70 ml-1 text-[10px]">⚠</span>
      )}
    </span>
  )
}

export default function EventsPage() {
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULT_FILTERS)
  const [assetType, setAssetType] = useState<string>('all')
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })

  const { data, isPending, isError } = useQuery({
    queryKey: ['events', 'list'],
    queryFn: () =>
      api.events.list({
        page: 1,
        limit: 1000,
      }),
  })

  const allEvents = useMemo(() => data?.data ?? [], [data])

  const assetTypeOptions = useMemo(() => {
    const set = new Set(allEvents.map((e) => e.assetType))
    return Array.from(set).sort()
  }, [allEvents])

  const filteredEvents = useMemo<CryptoEvent[]>(() => {
    const term = filters.search.trim().toLowerCase()
    const from = filters.from?.getTime()
    const to = filters.to?.getTime()
    return allEvents.filter((e) => {
      if (filters.algorithm !== 'all' && e.algorithm !== filters.algorithm)
        return false
      if (filters.severity !== 'all' && e.severity !== filters.severity)
        return false
      if (assetType !== 'all' && e.assetType !== assetType) return false
      if (from !== undefined || to !== undefined) {
        const observed = new Date(e.observedAt).getTime()
        if (from !== undefined && observed < from) return false
        if (to !== undefined && observed > to) return false
      }
      if (term) {
        const haystack =
          e.assetId.toLowerCase() +
          ' ' +
          e.sourceIp.toLowerCase() +
          ' ' +
          e.algorithm.toLowerCase() +
          ' ' +
          e.assetType.toLowerCase()
        if (!haystack.includes(term)) return false
      }
      return true
    })
  }, [allEvents, filters, assetType])

  const columns = useMemo<ColumnDef<CryptoEvent>[]>(
    () => [
      {
        id: 'time',
        header: 'Time',
        accessorKey: 'observedAt',
        cell: ({ getValue }) => (
          <span className="text-muted-foreground font-mono text-xs">
            {format(new Date(getValue<string>()), 'MMM d yyyy, HH:mm:ss')}
          </span>
        ),
      },
      {
        id: 'eventType',
        header: 'Event Type',
        accessorKey: 'eventType',
        cell: ({ getValue }) => (
          <span className="text-foreground text-xs capitalize">
            {getValue<string>().replace(/-/g, ' ')}
          </span>
        ),
      },
      {
        id: 'algorithm',
        header: 'Algorithm',
        accessorKey: 'algorithm',
        cell: ({ getValue }) => (
          <AlgorithmCell algorithm={getValue<string>()} />
        ),
      },
      {
        id: 'sourceIp',
        header: 'Source IP',
        accessorKey: 'sourceIp',
        cell: ({ getValue }) => (
          <span className="text-muted-foreground font-mono text-xs">
            {getValue<string>()}
          </span>
        ),
      },
      {
        id: 'assetType',
        header: 'Asset Type',
        accessorKey: 'assetType',
        cell: ({ getValue }) => (
          <span className="text-muted-foreground text-xs capitalize">
            {getValue<string>()}
          </span>
        ),
      },
      {
        id: 'assetId',
        header: 'Asset',
        accessorKey: 'assetId',
        cell: ({ getValue }) => (
          <span className="text-muted-foreground max-w-[200px] truncate font-mono text-xs">
            {getValue<string>().slice(0, 12)}
          </span>
        ),
      },
      {
        id: 'severity',
        header: 'Severity',
        accessorKey: 'severity',
        cell: ({ getValue }) => (
          <SeverityCell severity={getValue<Severity>()} />
        ),
      },
    ],
    []
  )

  const table = useReactTable({
    data: filteredEvents,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  const assetTypeControl = (
    <Select value={assetType} onValueChange={setAssetType}>
      <SelectTrigger className="bg-muted border-border h-9 w-[160px] text-sm">
        <SelectValue placeholder="Asset type" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All asset types</SelectItem>
        {assetTypeOptions.map((t) => (
          <SelectItem key={t} value={t}>
            <span className="capitalize">{t}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-foreground text-xl font-bold tracking-tight">
          Events
        </h1>
        <p className="text-muted-foreground mt-1 text-sm">
          {filteredEvents.length} events — detailed log with local filtering
        </p>
      </div>

      <GlobalFilters
        filters={filters}
        onChange={setFilters}
        extras={assetTypeControl}
      />

      {isPending ? (
        <Skeleton className="h-[400px]" />
      ) : isError ? (
        <div className="text-muted-foreground rounded-lg border px-4 py-12 text-center text-sm">
          Failed to load events.
        </div>
      ) : (
        <Card className="overflow-hidden p-0">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id} className="border-border border-b">
                      {headerGroup.headers.map((header) => (
                        <th
                          key={header.id}
                          className="text-muted-foreground px-4 py-3 text-left text-[11px] font-semibold tracking-wider uppercase"
                        >
                          {header.isPlaceholder ? null : (
                            <button
                              type="button"
                              onClick={header.column.getToggleSortingHandler()}
                              disabled={!header.column.getCanSort()}
                              className="inline-flex items-center gap-1 disabled:cursor-default"
                            >
                              {flexRender(
                                header.column.columnDef.header,
                                header.getContext()
                              )}
                              {header.column.getCanSort() && (
                                <ChevronsUpDown className="h-3 w-3 opacity-50" />
                              )}
                            </button>
                          )}
                        </th>
                      ))}
                    </tr>
                  ))}
                </thead>
                <tbody>
                  {table.getRowModel().rows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={columns.length}
                        className="text-muted-foreground px-4 py-12 text-center text-sm"
                      >
                        No events found
                      </td>
                    </tr>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <tr
                        key={row.id}
                        className="border-border hover:bg-muted/50 border-b transition-colors last:border-0"
                      >
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id} className="px-4 py-3">
                            {flexRender(
                              cell.column.columnDef.cell,
                              cell.getContext()
                            )}
                          </td>
                        ))}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="border-border flex items-center justify-between border-t px-4 py-3">
              <div className="text-muted-foreground hidden flex-1 text-sm lg:flex">
                {filteredEvents.length} row(s) filtered.
              </div>
              <div className="flex w-full items-center gap-6 lg:w-fit">
                <div className="hidden items-center gap-2 lg:flex">
                  <Label
                    htmlFor="rows-per-page"
                    className="text-sm font-medium"
                  >
                    Rows per page
                  </Label>
                  <Select
                    value={`${table.getState().pagination.pageSize}`}
                    onValueChange={(value) => table.setPageSize(Number(value))}
                  >
                    <SelectTrigger
                      size="sm"
                      className="w-20"
                      id="rows-per-page"
                    >
                      <SelectValue
                        placeholder={table.getState().pagination.pageSize}
                      />
                    </SelectTrigger>
                    <SelectContent side="top">
                      {[10, 20, 30, 40, 50].map((s) => (
                        <SelectItem key={s} value={`${s}`}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex w-fit items-center justify-center text-sm font-medium">
                  Page {table.getState().pagination.pageIndex + 1} of{' '}
                  {table.getPageCount()}
                </div>
                <div className="ml-auto flex items-center gap-2 lg:ml-0">
                  <Button
                    variant="outline"
                    className="hidden h-8 w-8 p-0 lg:flex"
                    onClick={() => table.setPageIndex(0)}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <span className="sr-only">Go to first page</span>
                    <ChevronsLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="size-8"
                    size="icon"
                    onClick={() => table.previousPage()}
                    disabled={!table.getCanPreviousPage()}
                  >
                    <span className="sr-only">Go to previous page</span>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="size-8"
                    size="icon"
                    onClick={() => table.nextPage()}
                    disabled={!table.getCanNextPage()}
                  >
                    <span className="sr-only">Go to next page</span>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    className="hidden size-8 lg:flex"
                    size="icon"
                    onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                    disabled={!table.getCanNextPage()}
                  >
                    <span className="sr-only">Go to last page</span>
                    <ChevronsRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
