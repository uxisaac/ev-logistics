'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts'
import { useCSSColor } from '@/lib/use-css-color'
import { Zap, ArrowUp, ArrowDown, ArrowUpDown, Cloud, Wind, Droplets, X, Bus, Route, Plug } from 'lucide-react'
import { NavBar } from '@/components/nav-bar'
import { StatCard } from '@/components/stat-card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { DriverAvatar } from '@/components/driver-avatar'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { toast } from 'sonner'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from '@/components/ui/table'
import { ChargingYardMap } from '@/components/charging-yard-map'
import { SegmentTabs } from '@/components/segment-tabs'
import { StationUsageChart } from '@/components/station-usage-chart'
import { RecentActivity } from '@/components/recent-activity'

interface ChargingSession {
  id: string
  vehicleId: string
  model: string
  driver: string
  station: string
  stall: string
  batteryStart: number
  batteryCurrent: number
  batteryTarget: number
  rateKw: number
  eta: string
  status: 'charging' | 'queued' | 'complete' | 'fault'
}

const SESSIONS: ChargingSession[] = [
  { id: '1', vehicleId: 'VH-0012', model: 'Ford E-Transit', driver: 'A. Reyes', station: 'Depot North Lot A', stall: 'A-01', batteryStart: 18, batteryCurrent: 54, batteryTarget: 100, rateKw: 50, eta: '2:41 PM', status: 'charging' },
  { id: '2', vehicleId: 'VH-0028', model: 'BYD eBus-12', driver: 'C. Park', station: 'Depot North Lot A', stall: 'A-02', batteryStart: 31, batteryCurrent: 67, batteryTarget: 100, rateKw: 60, eta: '3:05 PM', status: 'charging' },
  { id: '3', vehicleId: 'VH-0047', model: 'Rivian EDV', driver: 'M. Singh', station: 'Depot South Lot B', stall: 'B-03', batteryStart: 9, batteryCurrent: 42, batteryTarget: 80, rateKw: 50, eta: '2:58 PM', status: 'charging' },
  { id: '4', vehicleId: 'VH-0061', model: 'Mercedes eSprinter', driver: 'T. Brown', station: 'Depot South Lot B', stall: 'B-01', batteryStart: 22, batteryCurrent: 22, batteryTarget: 90, rateKw: 0, eta: 'Waiting', status: 'queued' },
  { id: '5', vehicleId: 'VH-0074', model: 'Ford E-Transit', driver: 'L. Davis', station: 'West Hub Lot C', stall: 'C-04', batteryStart: 45, batteryCurrent: 100, batteryTarget: 100, rateKw: 0, eta: 'Done', status: 'complete' },
  { id: '6', vehicleId: 'VH-0083', model: 'BYD eBus-12', driver: 'R. Kim', station: 'Depot North Lot A', stall: 'A-03', batteryStart: 14, batteryCurrent: 38, batteryTarget: 100, rateKw: 60, eta: '3:22 PM', status: 'charging' },
  { id: '7', vehicleId: 'VH-0091', model: 'Rivian EDV', driver: 'N. Lopez', station: 'West Hub Lot C', stall: 'C-02', batteryStart: 5, batteryCurrent: 5, batteryTarget: 100, rateKw: 0, eta: 'Waiting', status: 'queued' },
  { id: '8', vehicleId: 'VH-0103', model: 'Ford E-Transit', driver: 'S. Hall', station: 'Depot South Lot B', stall: 'B-02', batteryStart: 27, batteryTarget: 100, batteryCurrent: 27, rateKw: 0, eta: 'Fault', status: 'fault' },
]

const STATUS_BADGE: Record<ChargingSession['status'], { label: string; className: string }> = {
  charging: { label: 'Charging', className: 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300' },
  queued:   { label: 'Queued',   className: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300' },
  complete: { label: 'Complete', className: 'bg-sky-50 text-sky-700 dark:bg-sky-950 dark:text-sky-300' },
  fault:    { label: 'Fault',    className: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300' },
}

function BatteryBar({ current, target }: { current: number; target: number }) {
  const color = current < 20 ? 'bg-destructive' : current < 50 ? 'bg-warning' : 'bg-foreground'
  return (
    <div className="flex items-center gap-2.5">
      <div className="relative h-1 w-28 overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full rounded-full', color)} style={{ width: `${current}%` }} />
        <div className="absolute top-0 h-full w-px bg-muted-foreground/40" style={{ left: `${target}%` }} />
      </div>
      <span className="font-mono text-xs tabular-nums text-muted-foreground">{current}%</span>
    </div>
  )
}

function SortIcon({ sorted }: { sorted: false | 'asc' | 'desc' }) {
  if (sorted === 'asc') return <ArrowUp className="h-3 w-3" />
  if (sorted === 'desc') return <ArrowDown className="h-3 w-3" />
  return <ArrowUpDown className="h-3 w-3 opacity-30" />
}

const MODEL_IMAGE: Record<string, string> = {
  'Ford E-Transit':     'ford-e-transit.webp',
  'BYD eBus-12':        'byd-ebus-12.webp',
  'Rivian EDV':         'rivian-edv.webp',
  'Mercedes eSprinter': 'mercedes-esprinter.webp',
}

const CHARGING_CURVE = [
  { soc: 0,   kw: 103 },
  { soc: 3,   kw: 107 },
  { soc: 6,   kw: 180 },
  { soc: 7,   kw: 245 },
  { soc: 10,  kw: 225 },
  { soc: 15,  kw: 210 },
  { soc: 20,  kw: 195 },
  { soc: 25,  kw: 175 },
  { soc: 30,  kw: 155 },
  { soc: 40,  kw: 145 },
  { soc: 50,  kw: 125 },
  { soc: 60,  kw: 100 },
  { soc: 70,  kw: 82  },
  { soc: 75,  kw: 65  },
  { soc: 80,  kw: 45  },
  { soc: 90,  kw: 30  },
  { soc: 100, kw: 12  },
]

const MAX_RANGE_MI: Record<string, number> = {
  'Ford E-Transit':     126,
  'BYD eBus-12':        186,
  'Rivian EDV':         168,
  'Mercedes eSprinter': 130,
}

const COL_WIDTHS: Record<string, string> = {
  vehicleId:      'w-[140px]',
  stall:          'w-[100px]',
  batteryCurrent: 'w-[180px]',
  rangeMi:        'w-[100px]',
  rateKw:         'w-[100px]',
  eta:            'w-[100px]',
  status:         'w-[110px]',
}

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

export default function ChargingPage() {
  "use no memo"
  const [sorting, setSorting] = useState<SortingState>([{ id: 'status', desc: false }])
  const [time, setTime] = useState<Date | null>(null)
  const [activeStation, setActiveStation] = useState('lot-a')
  const [selectedSession, setSelectedSession] = useState<ChargingSession | null>(null)
  const [assignDriverOpen, setAssignDriverOpen] = useState(false)
  const [timePickerOpen, setTimePickerOpen] = useState(false)
  const [pickedDriver, setPickedDriver] = useState<ChargingSession | null>(null)
  const [customTime, setCustomTime] = useState('')
  const [showCustom, setShowCustom] = useState(false)
  const [assignedDrivers, setAssignedDrivers] = useState<Record<string, { session: ChargingSession; time: string }>>({})
  const [imgError, setImgError] = useState(false)
  const fgColor     = useCSSColor('--foreground',       'rgb(24,24,27)')
  const mutedColor  = useCSSColor('--muted-foreground', 'rgb(136,136,136)')
  const cardColor   = useCSSColor('--card',             'rgb(255,255,255)')
  const borderColor = useCSSColor('--border',           'rgb(229,231,235)')

  useEffect(() => { setImgError(false) }, [selectedSession?.id])

  const RECOMMENDED_TIMES = [
    { label: 'Now',                  sub: '2:45 PM' },
    { label: 'Next available',       sub: '3:00 PM' },
    { label: 'After current session', sub: '3:22 PM' },
    { label: '+ 1 hour',             sub: '3:45 PM' },
  ]

  const suggestedDrivers = SESSIONS
    .filter(s => s.batteryCurrent < 40)
    .sort((a, b) => a.batteryCurrent - b.batteryCurrent)

  const otherDrivers = SESSIONS
    .filter(s => s.batteryCurrent >= 40)

  useEffect(() => {
    setTime(new Date())
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  const columns: ColumnDef<ChargingSession>[] = [
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
      accessorKey: 'stall',
      header: 'Stall',
      cell: ({ row }) => (
        <span className="font-mono text-xs text-muted-foreground uppercase">{row.original.stall}</span>
      ),
    },
    {
      accessorKey: 'batteryCurrent',
      header: 'Battery',
      cell: ({ row }) => (
        <BatteryBar current={row.original.batteryCurrent} target={row.original.batteryTarget} />
      ),
    },
    {
      id: 'rangeMi',
      header: 'Range',
      cell: ({ row }) => {
        const max = MAX_RANGE_MI[row.original.model]
        const miles = max ? Math.round((row.original.batteryCurrent / 100) * max) : null
        return miles !== null
          ? <span className="font-mono text-sm">{miles} mi</span>
          : <span className="font-mono text-xs text-muted-foreground">—</span>
      },
    },
    {
      accessorKey: 'rateKw',
      header: 'Rate',
      cell: ({ row }) =>
        row.original.rateKw > 0 ? (
          <span className="font-mono text-sm">{row.original.rateKw} kW</span>
        ) : (
          <span className="font-mono text-xs text-muted-foreground">—</span>
        ),
    },
    {
      accessorKey: 'eta',
      header: 'ETA',
      cell: ({ row }) => (
        <span className="font-mono text-sm">{row.original.eta}</span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const s = STATUS_BADGE[row.original.status]
        return <Badge className={s.className}>{s.label}</Badge>
      },
    },
  ]

  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: SESSIONS,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="flex min-h-screen flex-col bg-background pt-16">
      <NavBar activeNav="CHARGING" onNavChange={() => {}} />

      <main className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div className="flex flex-col gap-2.5">
            <h1
              className="text-2xl tracking-[0.01em] leading-[1.2]"
              suppressHydrationWarning
            >
              {time ? formatTime(time) : ' '}
            </h1>
            <p className="font-mono text-xs uppercase tracking-[0.06em] opacity-60 text-foreground">
              DEPOT: WEST LA 01 · CHARGING
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

        {/* Station segment control */}
        <div className="mb-4">
          <SegmentTabs
            tabs={[
              { label: 'Depot North · Lot A', value: 'lot-a' },
              { label: 'Depot South · Lot B', value: 'lot-b' },
              { label: 'West Hub · Lot C',    value: 'lot-c' },
            ]}
            active={activeStation}
            onChange={setActiveStation}
            className="w-auto"
          />
        </div>

        <div className="mb-4 grid grid-cols-4 gap-4">
          <StatCard label="Vehicles at Depot" value={12} note="CURRENTLY ON SITE" icon={<Bus className="h-5 w-5" />} />
          <StatCard label="Vehicles on Duty" value={31} note="ACTIVE ON ROUTES" icon={<Route className="h-5 w-5" />} />
          <StatCard label="Vehicles Charging" value={5} note="ACTIVE SESSIONS" icon={<Zap className="h-5 w-5" />} />
          <StatCard label="Spare Chargers" value={10} note="STALLS AVAILABLE" icon={<Plug className="h-5 w-5" />} />
        </div>

        {/* Main content: left column + right activity panel */}
        <div className="mb-4 flex gap-4 items-stretch">
          <div className="flex-2 flex flex-col gap-4 min-w-0">
            <ChargingYardMap
              sessions={SESSIONS}
              onSelectSession={(vehicleId) => {
                const session = SESSIONS.find(s => s.vehicleId === vehicleId)
                if (session) setSelectedSession(session)
              }}
            />
          </div>
          <div className="flex-1 min-w-0 h-120">
            <RecentActivity />
          </div>
        </div>

        <div className="overflow-x-auto">
          <div className="rounded-3xl border bg-card overflow-hidden min-w-265">
            <Table>
              <TableHeader>
                {table.getHeaderGroups().map((hg) => (
                  <TableRow key={hg.id} className="border-b">
                    {hg.headers.map((header) => (
                      <TableHead key={header.id} className={cn('px-6 py-4', COL_WIDTHS[header.id] ?? '')}>
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
                    className={cn('border-b last:border-b-0 cursor-pointer', selectedSession?.id === row.original.id && 'bg-muted/50')}
                    onClick={() => setSelectedSession(prev => prev?.id === row.original.id ? null : row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className={cn('px-6 py-4', COL_WIDTHS[cell.column.id] ?? '')}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="mt-4">
          <StationUsageChart />
        </div>
      </main>

      {/* Assign driver command */}
      <CommandDialog open={assignDriverOpen} onOpenChange={setAssignDriverOpen} className="p-4 sm:max-w-xl">
        <Command>
          <div className="pr-4 pt-4 pb-4">
            <p className="text-base leading-normal tracking-[0.01em] opacity-70 text-card-foreground">Assign Driver</p>
            {selectedSession && (
              <p className="font-mono text-xs text-muted-foreground uppercase mt-0.5">Stall {selectedSession.stall}</p>
            )}
          </div>
          <CommandInput placeholder="Search drivers…" />
          <CommandList>
            <CommandEmpty>No drivers found.</CommandEmpty>
            <CommandGroup heading="Suggested · Low Battery">
              {suggestedDrivers.map(s => (
                <CommandItem
                  key={s.id}
                  onSelect={() => { setPickedDriver(s); setAssignDriverOpen(false); setShowCustom(false); setTimePickerOpen(true) }}
                  className="flex items-center gap-3"
                >
                  <DriverAvatar name={s.driver} />
                  <div className="flex flex-1 flex-col min-w-0">
                    <span className="text-sm font-medium">{s.driver}</span>
                    <span className="font-mono text-xs text-muted-foreground">{s.vehicleId} · {s.model} · {s.batteryCurrent}% battery</span>
                  </div>
                  <Badge className="shrink-0 ml-auto bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">On Duty</Badge>
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="All Drivers">
              {otherDrivers.map(s => (
                <CommandItem
                  key={s.id}
                  onSelect={() => { setPickedDriver(s); setAssignDriverOpen(false); setShowCustom(false); setTimePickerOpen(true) }}
                  className="flex items-center gap-3"
                >
                  <DriverAvatar name={s.driver} />
                  <div className="flex flex-1 flex-col min-w-0">
                    <span className="text-sm font-medium">{s.driver}</span>
                    <span className="font-mono text-xs text-muted-foreground">{s.vehicleId} · {s.model} · {s.batteryCurrent}% battery</span>
                  </div>
                  <Badge className="shrink-0 ml-auto bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">On Duty</Badge>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>

      {/* Time picker dialog */}
      <Dialog open={timePickerOpen} onOpenChange={setTimePickerOpen}>
        <DialogContent className="sm:max-w-xs p-0 gap-0 overflow-hidden rounded-3xl">
          <VisuallyHidden><DialogTitle>Schedule Assignment</DialogTitle></VisuallyHidden>
          <p className="px-5 pt-5 pb-0 text-base leading-normal tracking-[0.01em] opacity-70 text-card-foreground">Schedule Assignment</p>

          {pickedDriver && (
            <div className="flex items-center gap-3 px-5 pt-3 pb-0">
              <DriverAvatar name={pickedDriver.driver} size="md" />
              <div>
                <p className="text-sm font-medium">{pickedDriver.driver}</p>
                <p className="font-mono text-xs text-muted-foreground">{pickedDriver.vehicleId} · {pickedDriver.batteryCurrent}% battery</p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1 p-3 pt-4">
            {RECOMMENDED_TIMES.map(({ label, sub }) => (
              <button
                key={label}
                onClick={() => {
                  if (selectedSession && pickedDriver) {
                    setAssignedDrivers(prev => ({ ...prev, [selectedSession.id]: { session: pickedDriver, time: `${label} · ${sub}` } }))
                  }
                  setTimePickerOpen(false)
                  toast.success('Driver assigned', {
                    description: `${pickedDriver?.driver} · ${selectedSession?.stall} · ${label} (${sub})`,
                  })
                }}
                className="flex items-center justify-between rounded-2xl px-4 py-3 text-left hover:bg-muted transition-colors"
              >
                <span className="text-sm font-medium">{label}</span>
                <span className="font-mono text-xs text-muted-foreground">{sub}</span>
              </button>
            ))}

            {/* Custom time */}
            {!showCustom ? (
              <button
                onClick={() => setShowCustom(true)}
                className="flex items-center justify-between rounded-2xl px-4 py-3 text-left hover:bg-muted transition-colors"
              >
                <span className="text-sm font-medium text-muted-foreground">Custom time…</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 rounded-2xl border px-4 py-2 mt-1">
                <input
                  type="time"
                  value={customTime}
                  onChange={e => setCustomTime(e.target.value)}
                  className="flex-1 bg-transparent font-mono text-sm outline-none text-foreground"
                  autoFocus
                />
                <button
                  onClick={() => {
                    if (selectedSession && pickedDriver) {
                      setAssignedDrivers(prev => ({ ...prev, [selectedSession.id]: { session: pickedDriver, time: customTime } }))
                    }
                    setTimePickerOpen(false)
                    toast.success('Driver assigned', {
                      description: `${pickedDriver?.driver} · ${selectedSession?.stall} · ${customTime}`,
                    })
                  }}
                  className="font-mono text-xs uppercase tracking-widest text-foreground hover:text-muted-foreground transition-colors"
                >
                  Confirm
                </button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 top-16 z-30 bg-black/50 transition-opacity duration-300',
          selectedSession ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        )}
        onClick={() => setSelectedSession(null)}
      />

      {/* Session detail panel */}
      <div
        className={cn(
          'fixed top-16 right-0 bottom-0 w-104 bg-card border-l flex flex-col z-40',
          'transition-transform duration-300 ease-in-out',
          selectedSession ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {selectedSession && (() => {
          const s = selectedSession
          const sb = STATUS_BADGE[s.status]
          const fillPct = s.batteryCurrent
          const fillColor = s.batteryCurrent < 20 ? 'bg-destructive' : s.batteryCurrent < 50 ? 'bg-warning' : 'bg-foreground'
          return (
            <>
              {/* Header */}
              <div className="shrink-0 border-b px-6 py-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-muted overflow-hidden">
                      {imgError || !MODEL_IMAGE[s.model] ? (
                        <Bus className="h-7 w-7 text-muted-foreground" />
                      ) : (
                        <Image alt={s.model} className="h-full w-full object-contain" src={`/${MODEL_IMAGE[s.model]}`} width={64} height={64} onError={() => setImgError(true)} />
                      )}
                    </div>
                    <div className="min-w-0">
                      <h2 className="truncate text-2xl font-semibold tracking-tight">{s.vehicleId}</h2>
                      <p className="mt-0.5 font-mono text-xs uppercase text-muted-foreground">{s.model}</p>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <span className={cn('rounded-full px-3 py-0.5 font-mono text-xs uppercase tracking-wide', sb.className)}>{sb.label}</span>
                    <button
                      onClick={() => setSelectedSession(null)}
                      className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Body */}
              <div className="flex flex-col gap-6 px-5 py-5 overflow-y-auto flex-1">
                {/* Assign driver / assigned info */}
                {assignedDrivers[s.id] ? (() => {
                  const a = assignedDrivers[s.id]
                  return (
                    <div className="flex flex-col gap-3 rounded-2xl border p-4">
                      <div className="flex items-center justify-between">
                        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Assigned Driver</p>
                        <button
                          onClick={() => setAssignedDrivers(prev => { const next = { ...prev }; delete next[s.id]; return next })}
                          className="font-mono text-xs uppercase tracking-widest text-destructive hover:text-destructive/80 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <DriverAvatar name={a.session.driver} size="md" />
                        <div className="flex flex-col min-w-0">
                          <p className="text-sm font-medium">{a.session.driver}</p>
                          <p className="font-mono text-xs text-muted-foreground">{a.session.vehicleId}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t">
                        <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Time</span>
                        <span className="font-mono text-xs text-foreground">{a.time}</span>
                      </div>
                    </div>
                  )
                })() : (
                  <button
                    onClick={() => setAssignDriverOpen(true)}
                    className="w-full rounded-2xl bg-primary text-primary-foreground py-3 font-mono text-xs uppercase tracking-widest hover:bg-primary/90 transition-colors"
                  >
                    + Assign Driver
                  </button>
                )}

                {/* Battery */}
                <div className="flex flex-col gap-2">
                  <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Battery</p>
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-muted">
                    <div className={cn('h-full rounded-full transition-all', fillColor)} style={{ width: `${fillPct}%` }} />
                    <div className="absolute top-0 h-full w-0.5 bg-muted-foreground/40" style={{ left: `${s.batteryTarget}%` }} />
                  </div>
                  <div className="flex justify-between font-mono text-xs text-muted-foreground">
                    <span>Start {s.batteryStart}%</span>
                    <span className="text-foreground font-semibold">{s.batteryCurrent}%</span>
                    <span>Target {s.batteryTarget}%</span>
                  </div>
                </div>

                {/* Stats */}
                <div className="flex flex-col gap-0 rounded-2xl border overflow-hidden">
                  {[
                    { label: 'Stall',   value: s.stall },
                    { label: 'Station', value: s.station },
                    { label: 'Rate',    value: s.rateKw > 0 ? `${s.rateKw} kW` : '—' },
                    { label: 'ETA',     value: s.eta },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex items-center justify-between px-4 py-3 border-b last:border-b-0">
                      <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
                      <span className="font-mono text-xs text-foreground">{value}</span>
                    </div>
                  ))}
                </div>

                {/* Charging curve */}
                <div className="flex flex-col gap-3">
                  <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Charging Curve</p>
                  <div className="rounded-2xl border overflow-hidden px-2 py-3">
                    <ResponsiveContainer width="100%" height={140}>
                      <AreaChart data={CHARGING_CURVE} margin={{ top: 4, right: 8, bottom: 0, left: -16 }}>
                        <defs>
                          <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={fgColor} stopOpacity={0.12} />
                            <stop offset="100%" stopColor={fgColor} stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke={borderColor} strokeDasharray="4 4" vertical={false} />
                        <XAxis
                          dataKey="soc"
                          tick={{ fontSize: 9, fill: mutedColor, fontFamily: 'NectoMono, monospace' }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) => `${v}%`}
                          ticks={[0, 25, 50, 75, 100]}
                        />
                        <YAxis
                          domain={[0, 260]}
                          tick={{ fontSize: 9, fill: mutedColor, fontFamily: 'NectoMono, monospace' }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) => `${v}`}
                          ticks={[0, 100, 200]}
                        />
                        <Tooltip
                          contentStyle={{
                            background: fgColor,
                            border: 'none',
                            borderRadius: '0.5rem',
                            color: cardColor,
                            fontFamily: 'NectoMono, monospace',
                            fontSize: 10,
                          }}
                          itemStyle={{ color: cardColor }}
                          formatter={(v) => [`${v} kW`, 'Power']}
                          labelFormatter={(v) => `SoC ${v}%`}
                          cursor={{ stroke: borderColor, strokeWidth: 1 }}
                        />
                        <Area
                          type="monotone"
                          dataKey="kw"
                          stroke={fgColor}
                          strokeWidth={1.5}
                          fill="url(#curveGradient)"
                          dot={false}
                          activeDot={{ r: 4, fill: fgColor, strokeWidth: 2, stroke: cardColor }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </>
          )
        })()}
      </div>
    </div>
  )
}
