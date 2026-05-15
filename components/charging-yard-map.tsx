'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'
import { useTheme } from 'next-themes'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { VisuallyHidden } from '@radix-ui/react-visually-hidden'
import { Wifi, Battery } from 'lucide-react'
import type { Stall, YardCanvasProps } from './yard-canvas'
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
import { toast } from 'sonner'

const YardCanvas = dynamic<YardCanvasProps>(
  () => import('./yard-canvas').then(m => ({ default: m.YardCanvas })),
  {
    ssr: false,
    loading: () => <div className="h-full w-full animate-pulse rounded-2xl bg-muted/30" />,
  }
)

const ROW_CONFIG = [
  { id: 'A', count: 4 },
  { id: 'B', count: 5 },
  { id: 'C', count: 10 },
]

interface SessionLike {
  stall: string
  vehicleId: string
  model?: string
  driver?: string
  status: 'charging' | 'queued' | 'complete' | 'fault'
  batteryCurrent: number
  batteryTarget: number
  rateKw: number
  eta: string
}

function buildStalls(
  sessions: SessionLike[],
  assignments: Record<string, { vehicle: SessionLike; time: string }> = {}
): Stall[] {
  const byStall = new Map(sessions.map(s => [s.stall, s]))
  return ROW_CONFIG.flatMap(row =>
    Array.from({ length: row.count }, (_, i) => {
      const id = `${row.id}-${String(i + 1).padStart(2, '0')}`
      const s = byStall.get(id)
      const a = assignments[id]
      if (s) {
        return { id, vehicleId: s.vehicleId, status: s.status, batteryCurrent: s.batteryCurrent, rateKw: s.rateKw, eta: s.eta }
      }
      if (a) {
        return { id, vehicleId: a.vehicle.vehicleId, status: 'assigned' as const, assignedTime: a.time }
      }
      return { id, status: 'empty' as const }
    })
  )
}

interface ChargingYardMapProps {
  sessions: SessionLike[]
  onSelectSession?: (vehicleId: string) => void
}

function LiveFeedDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [time, setTime] = useState('')

  useEffect(() => {
    function tick() {
      const now = new Date()
      const y = now.getFullYear()
      const mo = String(now.getMonth() + 1).padStart(2, '0')
      const d = String(now.getDate()).padStart(2, '0')
      const h = now.getHours()
      const mi = String(now.getMinutes()).padStart(2, '0')
      const s = String(now.getSeconds()).padStart(2, '0')
      const ampm = h >= 12 ? 'PM' : 'AM'
      const h12 = String(h % 12 || 12).padStart(2, '0')
      setTime(`${y}-${mo}-${d} ${h12}:${mi}:${s} ${ampm}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-5xl p-0 gap-0 overflow-hidden rounded-2xl border-0">
        <VisuallyHidden><DialogTitle>Live Video Feed</DialogTitle></VisuallyHidden>
        {/* Camera feed */}
        <div className="relative bg-zinc-950 dark:bg-zinc-950 aspect-video w-full overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/live-footage-placeholder.webp"
            alt="Live camera feed"
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Scan line effect */}
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 4px)',
          }} />

          {/* Vignette */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)',
          }} />

          {/* Ring logo */}
          <div className="absolute top-3 left-4 font-bold text-white text-lg tracking-wide" style={{ fontFamily: 'sans-serif', letterSpacing: '0.05em' }}>
            ring
          </div>

          {/* Timestamp */}
          <div className="absolute top-3 right-4 font-mono text-white text-xs opacity-90 tabular-nums">
            {time}
          </div>

          {/* LIVE badge */}
          <div className="absolute bottom-3 left-4 flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
            </span>
            <span className="font-mono text-xs text-white font-semibold tracking-widest">LIVE</span>
          </div>

          {/* Signal strength */}
          <div className="absolute bottom-3 right-4 flex items-center gap-1 text-white/60">
            <Wifi className="h-3 w-3" />
            <span className="font-mono text-[10px]">HD</span>
          </div>
        </div>

        {/* Info bar */}
        <div className="bg-card border-t px-5 py-4 flex items-start gap-6">
          <div className="flex-1 min-w-0">
            <p className="text-foreground text-sm font-semibold">Depot North · Lot A Overhead</p>
            <p className="font-mono text-xs text-muted-foreground mt-0.5">CAM-03 · West LA 01 · Fixed wide-angle</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function ChargingYardMap({ sessions, onSelectSession }: ChargingYardMapProps) {
  const { resolvedTheme } = useTheme()
  const [selectedStallId, setSelectedStallId] = useState<string | null>(null)
  const [liveOpen, setLiveOpen] = useState(false)
  const [assignStallId, setAssignStallId] = useState<string | null>(null)
  const [assignedStalls, setAssignedStalls] = useState<Record<string, { vehicle: SessionLike; time: string }>>({})
  const [pickedVehicle, setPickedVehicle] = useState<SessionLike | null>(null)
  const [stallTimePickerOpen, setStallTimePickerOpen] = useState(false)
  const [stallCustomTime, setStallCustomTime] = useState('')
  const [stallShowCustom, setStallShowCustom] = useState(false)

  const RECOMMENDED_TIMES = [
    { label: 'Now',                   sub: '2:45 PM' },
    { label: 'Next available',        sub: '3:00 PM' },
    { label: 'After current session', sub: '3:22 PM' },
    { label: '+ 1 hour',              sub: '3:45 PM' },
  ]

  function confirmAssignment(timeLabel: string) {
    if (assignStallId && pickedVehicle) {
      setAssignedStalls(prev => ({ ...prev, [assignStallId]: { vehicle: pickedVehicle, time: timeLabel } }))
    }
    setStallTimePickerOpen(false)
    toast.success('Vehicle assigned', {
      description: `${pickedVehicle?.vehicleId} → Stall ${assignStallId} · ${timeLabel}`,
    })
    setAssignStallId(null)
  }

  const stalls = buildStalls(sessions, assignedStalls)
  const isDark = resolvedTheme === 'dark'

  const sorted = [...sessions].sort((a, b) => a.batteryCurrent - b.batteryCurrent)
  const lowBattery = sorted.filter(s => s.batteryCurrent < 40)
  const otherVehicles = sorted.filter(s => s.batteryCurrent >= 40)

  return (
    <>
      <div className="relative h-120 rounded-3xl border bg-card overflow-hidden">
        <button
          onClick={() => setLiveOpen(true)}
          className="absolute top-3 right-3 z-20 flex items-center gap-2 rounded-full bg-background/80 backdrop-blur-sm border px-3 py-1.5 text-xs font-mono hover:bg-background transition-colors"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          <span className="uppercase tracking-widest text-foreground">Live Video</span>
        </button>

        <YardCanvas
          stalls={stalls}
          selectedStallId={selectedStallId}
          onSelectStall={(id) => {
            setSelectedStallId(id)
            if (id) {
              const stall = stalls.find(s => s.id === id)
              if (stall?.vehicleId) onSelectSession?.(stall.vehicleId)
            }
          }}
          onClickEmptyStall={(id) => setAssignStallId(id)}
          isDark={isDark}
        />
        <LiveFeedDialog open={liveOpen} onOpenChange={setLiveOpen} />
      </div>

      <CommandDialog open={assignStallId !== null} onOpenChange={(v) => !v && setAssignStallId(null)} className="p-4 sm:max-w-xl">
        <Command>
          <div className="pr-4 pt-4 pb-4">
            <p className="text-base leading-normal tracking-[0.01em] opacity-70 text-card-foreground">Assign Vehicle</p>
            {assignStallId && (
              <p className="font-mono text-xs text-muted-foreground uppercase mt-0.5">Stall {assignStallId}</p>
            )}
          </div>
          <CommandInput placeholder="Search vehicles…" />
          <CommandList>
            <CommandEmpty>No vehicles found.</CommandEmpty>
            {lowBattery.length > 0 && (
              <CommandGroup heading="Suggested · Low Battery">
                {lowBattery.map(s => (
                  <CommandItem
                    key={s.vehicleId}
                    onSelect={() => { setPickedVehicle(s); setStallShowCustom(false); setStallCustomTime(''); setStallTimePickerOpen(true) }}
                    className="flex items-center gap-3"
                  >
                    {s.driver && <DriverAvatar name={s.driver} />}
                    <div className="flex flex-1 flex-col min-w-0">
                      <span className="text-sm font-medium">{s.vehicleId}</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {s.model ? `${s.model} · ` : ''}{s.batteryCurrent}% battery
                      </span>
                    </div>
                    <div className="ml-auto flex items-center gap-1 text-destructive">
                      <Battery className="h-3.5 w-3.5" />
                      <span className="font-mono text-xs tabular-nums">{s.batteryCurrent}%</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
            {otherVehicles.length > 0 && (
              <CommandGroup heading="All Vehicles">
                {otherVehicles.map(s => (
                  <CommandItem
                    key={s.vehicleId}
                    onSelect={() => { setPickedVehicle(s); setStallShowCustom(false); setStallCustomTime(''); setStallTimePickerOpen(true) }}
                    className="flex items-center gap-3"
                  >
                    {s.driver && <DriverAvatar name={s.driver} />}
                    <div className="flex flex-1 flex-col min-w-0">
                      <span className="text-sm font-medium">{s.vehicleId}</span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {s.model ? `${s.model} · ` : ''}{s.batteryCurrent}% battery
                      </span>
                    </div>
                    <div className="ml-auto flex items-center gap-1 text-muted-foreground">
                      <Battery className="h-3.5 w-3.5" />
                      <span className="font-mono text-xs tabular-nums">{s.batteryCurrent}%</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </CommandDialog>

      <Dialog open={stallTimePickerOpen} onOpenChange={(v) => { if (!v) { setStallTimePickerOpen(false) } }}>
        <DialogContent className="sm:max-w-xs p-0 gap-0 overflow-hidden rounded-3xl">
          <VisuallyHidden><DialogTitle>Schedule Assignment</DialogTitle></VisuallyHidden>
          <p className="px-5 pt-5 pb-0 text-base leading-normal tracking-[0.01em] opacity-70 text-card-foreground">Schedule Assignment</p>

          {pickedVehicle && (
            <div className="flex items-center gap-3 px-5 pt-3 pb-0">
              {pickedVehicle.driver && <DriverAvatar name={pickedVehicle.driver} size="md" />}
              <div>
                <p className="text-sm font-medium">{pickedVehicle.vehicleId}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  {pickedVehicle.model ? `${pickedVehicle.model} · ` : ''}{pickedVehicle.batteryCurrent}% battery
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1 p-3 pt-4">
            {RECOMMENDED_TIMES.map(({ label, sub }) => (
              <button
                key={label}
                onClick={() => confirmAssignment(`${label} · ${sub}`)}
                className="flex items-center justify-between rounded-2xl px-4 py-3 text-left hover:bg-muted transition-colors"
              >
                <span className="text-sm font-medium">{label}</span>
                <span className="font-mono text-xs text-muted-foreground">{sub}</span>
              </button>
            ))}

            {!stallShowCustom ? (
              <button
                onClick={() => setStallShowCustom(true)}
                className="flex items-center justify-between rounded-2xl px-4 py-3 text-left hover:bg-muted transition-colors"
              >
                <span className="text-sm font-medium text-muted-foreground">Custom time…</span>
              </button>
            ) : (
              <div className="flex items-center gap-2 rounded-2xl border px-4 py-2 mt-1">
                <input
                  type="time"
                  value={stallCustomTime}
                  onChange={e => setStallCustomTime(e.target.value)}
                  className="flex-1 bg-transparent font-mono text-sm outline-none text-foreground"
                  autoFocus
                />
                <button
                  onClick={() => confirmAssignment(stallCustomTime)}
                  className="font-mono text-xs uppercase tracking-widest text-foreground hover:text-muted-foreground transition-colors"
                >
                  Confirm
                </button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
