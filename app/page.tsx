'use client'

import { useState, useEffect } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { Bus, BatteryCharging, Moon, Skull, ArrowUp, ArrowDown, ArrowUpDown, MessageSquare, Cloud, Wind, Droplets, CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { StatCard } from '@/components/stat-card'
import { NavBar, type NavItem } from '@/components/nav-bar'
import { AlertDrawer } from '@/components/alert-drawer'
import { DriverAvatar } from '@/components/driver-avatar'
import { FleetIdleChart } from '@/components/fleet-idle-chart'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { ALERTS, type Alert } from '@/lib/fleet-data'

function getOrdinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

function formatTime(date: Date): string {
  const h = date.getHours()
  const m = date.getMinutes().toString().padStart(2, '0')
  const ampm = h >= 12 ? 'PM' : 'AM'
  const hour = h % 12 || 12
  const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${hour}:${m} ${ampm} PST ${DAYS[date.getDay()]} ${MONTHS[date.getMonth()]} ${getOrdinal(date.getDate())}, ${date.getFullYear()}`
}

function BatteryBar({ pct }: { pct: number }) {
  const color = pct < 15 ? 'bg-destructive' : pct < 30 ? 'bg-warning' : 'bg-foreground'
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-1 w-28 overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full rounded-full', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className={cn('font-mono text-xs tabular-nums', pct < 15 ? 'text-destructive' : 'text-muted-foreground')}>
        {pct}%
      </span>
    </div>
  )
}

function SeverityBadge({ severity }: { severity: Alert['severity'] }) {
  return severity === 'critical' ? (
    <Badge className="bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300">Critical</Badge>
  ) : (
    <Badge className="bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300">Warning</Badge>
  )
}

function SortIcon({ sorted }: { sorted: false | 'asc' | 'desc' }) {
  if (sorted === 'asc') return <ArrowUp className="h-3 w-3" />
  if (sorted === 'desc') return <ArrowDown className="h-3 w-3" />
  return <ArrowUpDown className="h-3 w-3 opacity-30" />
}

const COL_WIDTHS: Record<string, string> = {
  vehicleId: 'w-[150px]',
  driver: 'w-[110px]',
  alertTitle: '',
  unreadMessages: 'w-[130px]',
  batteryPct: 'w-[180px]',
  severity: 'w-[90px]',
}

export default function Page() {
  "use no memo"
  const [activeNav, setActiveNav] = useState<NavItem>('DASHBOARD')
  const [time, setTime] = useState<Date | null>(null)
  const [sorting, setSorting] = useState<SortingState>([{ id: 'batteryPct', desc: false }])
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null)
  const [drawerTab, setDrawerTab] = useState<'overview' | 'location' | 'chat'>('overview')
  const [confirmedAlerts, setConfirmedAlerts] = useState<Set<string>>(new Set())

  const columns: ColumnDef<Alert>[] = [
    {
      accessorKey: 'vehicleId',
      header: 'Vehicle',
      cell: ({ row }) => (
        <div>
          <div className="font-semibold">{row.original.vehicleId}</div>
          <div className="text-sm text-muted-foreground">{row.original.model}</div>
        </div>
      ),
    },
    {
      accessorKey: 'driver',
      header: 'Driver',
      cell: ({ row }) => (
        <div className="flex items-center gap-2">
          <DriverAvatar name={row.original.driver} />
          <span className="text-sm">{row.original.driver}</span>
        </div>
      ),
    },
    {
      accessorKey: 'alertTitle',
      header: 'Alert',
      cell: ({ row }) =>
        confirmedAlerts.has(row.original.id) ? (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-base font-medium text-green-700 dark:text-green-400">
              <CheckCircle className="h-4 w-4 shrink-0" />
              Driver confirmed · Heading to charger after dropoff
            </div>
            <div className="font-mono text-xs text-muted-foreground">{row.original.alertDetail}</div>
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            <div className="text-base font-medium">{row.original.alertTitle}</div>
            <div className="font-mono text-xs text-muted-foreground">{row.original.alertDetail}</div>
          </div>
        ),
    },
    {
      accessorKey: 'unreadMessages',
      header: 'Messages',
      cell: ({ row }) =>
        row.original.unreadMessages > 0 ? (
          <span
            onClick={(e) => { e.stopPropagation(); setDrawerTab('chat'); setSelectedAlert(row.original) }}
            className="inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 font-mono text-xs text-accent-foreground hover:opacity-80 transition-opacity"
          >
            <MessageSquare className="h-3 w-3" />
            {row.original.unreadMessages}
          </span>
        ) : (
          <span className="font-mono text-xs text-muted-foreground">—</span>
        ),
    },
    {
      accessorKey: 'batteryPct',
      header: 'Battery',
      cell: ({ row }) => <BatteryBar pct={row.original.batteryPct} />,
    },
    {
      accessorKey: 'severity',
      header: 'Status',
      cell: ({ row }) => <SeverityBadge severity={row.original.severity} />,
    },
  ]

  useEffect(() => {
    setTime(new Date())
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: ALERTS,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="flex min-h-screen flex-col bg-background pt-16">
      <NavBar
        activeNav={activeNav}
        onNavChange={setActiveNav}
        onSelectVehicle={(id) => setSelectedAlert(ALERTS.find(a => a.vehicleId === id) ?? null)}
      />

      <AlertDrawer
        alert={selectedAlert}
        onClose={() => setSelectedAlert(null)}
        initialTab={drawerTab}
        onAssigned={(id) => setConfirmedAlerts(prev => new Set(prev).add(id))}
      />

      {/* Content */}
      <main className="flex-1 overflow-y-auto px-4 py-4">
        {/* Header */}
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2.5">
            <h1
              className="text-2xl tracking-[0.01em] leading-[1.2]"
              suppressHydrationWarning
            >
              {time ? formatTime(time) : ' '}
            </h1>
            <p className="font-mono text-xs uppercase tracking-[0.06em] opacity-60 text-foreground">
              DEPOT: WEST LA 01 · 142 VEHICLES
            </p>
          </div>

          {/* Weather widget */}
          <div className="flex shrink-0 items-center gap-4 rounded-2xl border bg-card px-5 py-3">
            <div className="flex items-center gap-2">
              <Cloud className="h-5 w-5 text-muted-foreground" />
              <span className="text-2xl font-light">72°</span>
            </div>
            <div className="w-px self-stretch bg-border" />
            <div className="flex flex-col gap-1">
              <p className="font-mono text-xs uppercase text-muted-foreground">Partly Cloudy</p>
              <p className="font-mono text-xs uppercase text-muted-foreground">West Los Angeles</p>
            </div>
            <div className="w-px self-stretch bg-border" />
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 font-mono text-xs uppercase text-muted-foreground">
                <Wind className="h-3 w-3" /> 8 mph
              </div>
              <div className="flex items-center gap-1.5 font-mono text-xs uppercase text-muted-foreground">
                <Droplets className="h-3 w-3" /> 68%
              </div>
            </div>
          </div>
        </div>

        {/* Stat cards */}
        <div className="mb-4 grid grid-cols-4 gap-4">
          <StatCard
            label="Total Vehicles"
            value={142}
            note="UNCHANGED FROM YESTERDAY"
            icon={<Bus className="h-5 w-5" />}
          />
          <StatCard
            label="Charging Now"
            value={23}
            note="-5 SCHEDULED SOON"
            icon={<BatteryCharging className="h-5 w-5" />}
          />
          <StatCard
            label="Idle"
            value={5}
            note="↓ 6 VS. YESTERDAY THIS TIME"
            icon={<Moon className="h-5 w-5" />}
          />
          <StatCard
            label="Needs Attention"
            value={4}
            note="+4 VS YESTERDAY AVERAGE"
            icon={<Skull className="h-5 w-5" />}
            critical
          />
        </div>

        {/* Fleet idle chart */}
        <div className="mb-4">
          <FleetIdleChart />
        </div>

        {/* Alerts table */}
        <div className="overflow-x-auto">
          <div className="rounded-3xl border bg-card overflow-hidden min-w-265">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((headerGroup) => (
                  <TableRow key={headerGroup.id} className="border-b">
                    {headerGroup.headers.map((header) => (
                      <TableHead
                        key={header.id}
                        className={cn('px-6 py-4', COL_WIDTHS[header.id] ?? '')}
                      >
                        {header.isPlaceholder ? null : (
                          <button
                            onClick={header.column.getToggleSortingHandler()}
                            className="flex items-center gap-1 font-mono text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                          >
                            {flexRender(header.column.columnDef.header, header.getContext())}
                            <SortIcon sorted={header.column.getIsSorted()} />
                          </button>
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                ))}
              </TableHeader>
              <TableBody>
                {table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    onClick={() => { setDrawerTab('overview'); setSelectedAlert(row.original) }}
                    className="cursor-pointer border-b last:border-b-0"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className={cn('px-6 py-4', COL_WIDTHS[cell.column.id] ?? '')}
                      >
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>
    </div>
  )
}
