'use client'

import { useState, useEffect } from 'react'
import { X, Bus, ArrowUpRight, RotateCcw, Phone, Send } from 'lucide-react'
import { toast } from 'sonner'
import { Chat } from '@/components/chat/chat'
import { ChatMessages } from '@/components/chat/chat-messages'
import { ChatEvent, ChatEventAddon, ChatEventAvatar, ChatEventBody, ChatEventContent, ChatEventTime, ChatEventTitle } from '@/components/chat/chat-event'
import { ChatToolbar, ChatToolbarAddon, ChatToolbarButton, ChatToolbarTextarea } from '@/components/chat/chat-toolbar'
import { DriverAvatar } from '@/components/driver-avatar'
import { Badge } from '@/components/ui/badge'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { cn } from '@/lib/utils'
import { useCSSColor } from '@/lib/use-css-color'
import { useTheme } from 'next-themes'
import MapGL, { Marker } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'

interface Alert {
  id: string
  vehicleId: string
  model: string
  driver: string
  alertTitle: string
  alertDetail: string
  riskLabel: string
  batteryPct: number
  severity: 'critical' | 'warning'
  unreadMessages: number
}

interface AlertDrawerProps {
  alert: Alert | null
  onClose: () => void
  initialTab?: 'overview' | 'location' | 'chat'
  onAssigned?: (alertId: string) => void
  showBackdrop?: boolean
  showLocationTab?: boolean
}

const SHIFT_HOURS = ['5AM', '6AM', '7AM', '8AM', '9AM', '10AM', '11AM', '12PM', '1PM', '2PM', '3PM']

function getIdleData(alert: Alert): number[] {
  const base = [24, 9, 5, 11, 6, 4, 7, 32, 14, 8, 21]
  if (alert.severity === 'critical' && alert.batteryPct < 20) {
    return base.map((v, i) => (i >= 7 ? v + 18 : v))
  }
  if (alert.severity === 'warning') {
    return base.map((v, i) => (i === 5 || i === 6 ? v + 12 : v))
  }
  return base
}

function getActivity(alert: Alert) {
  const base = [
    { time: '05:12 AM', event: 'Alert triggered', detail: alert.alertTitle, status: alert.severity },
    { time: '05:13 AM', event: 'Dispatcher notified', detail: 'Auto-escalated to on-duty dispatcher', status: 'info' },
  ]
  if (alert.severity === 'critical') {
    base.push({ time: '05:15 AM', event: 'Reroute attempted', detail: 'System searched for nearby charging stations', status: 'info' })
    base.push({ time: '05:18 AM', event: 'No station found', detail: 'No available station within range', status: 'critical' })
  } else {
    base.push({ time: '05:16 AM', event: 'Driver contacted', detail: `${alert.driver} acknowledged via app`, status: 'info' })
    base.push({ time: '05:21 AM', event: 'Monitoring', detail: 'Situation under observation', status: 'warning' })
  }
  return base
}

const VEHICLE_COORDS: Record<string, [number, number]> = {
  'VH-0041': [-118.387, 34.002],
  'VH-0089': [-118.442, 34.021],
  'VH-0023': [-118.365, 33.994],
  'VH-0112': [-118.410, 34.015],
  'VH-0067': [-118.395, 33.985],
  'VH-0055': [-118.378, 34.008],
  'VH-0098': [-118.450, 34.030],
  'VH-0034': [-118.420, 33.998],
  'VH-0076': [-118.360, 34.025],
}

const DRIVER_MESSAGE_POOLS: Record<string, string[]> = {
  critical: [
    "Hey, my battery is really low — what should I do?",
    "Should I finish the route or head back now?",
    "Do I have enough charge to make it to the depot?",
    "I'm getting a low battery warning on the dash.",
    "Can you send me the nearest charger location?",
    "What's the plan here, should I pull over?",
    "I have a passenger on board, can't stop mid-route.",
  ],
  warning: [
    "The charger at the station isn't responding.",
    "I tried twice but it won't connect.",
    "Charging station says out of service.",
    "Can you find me another charging spot?",
    "I missed my check-in, sorry — got held up in traffic.",
    "Lost signal for a bit, I'm back now.",
    "Everything's fine on my end, not sure why the alert fired.",
  ],
}

function getPreloadedMessages(alert: Alert): { sender: 'dispatch' | 'driver'; text: string; timestamp: Date }[] {
  const pool = DRIVER_MESSAGE_POOLS[alert.severity]
  const count = Math.min(alert.unreadMessages, pool.length)
  const now = Date.now()
  return pool.slice(0, count).map((text, i) => ({
    sender: 'driver' as const,
    text,
    timestamp: new Date(now - (count - i) * 3 * 60 * 1000),
  }))
}

const WARNING_COPY: Record<string, string> = {
  'Charging session failed': 'Station unreachable · retry or reassign charger',
  'Telematics signal lost': 'Signal lost · location unavailable',
  'Driver check-in overdue': 'No response · check-in window passed',
}

function parseDetail(detail: string) {
  const range = detail.match(/RANGE (\d+) MI/)?.[1]
  const route = detail.match(/(\d+) MI REMAINING/)?.[1]
  return { range: range ? `${range} MI` : null, route: route ? `${route} MI` : null }
}


const VEHICLE_IMAGES: Record<string, string> = {
  'Ford E-Transit': '/ford-e-transit.webp',
  'BYD eBus-12': '/byd-ebus-12.webp',
}

function VehicleThumb({ model }: { model: string }) {
  const src = VEHICLE_IMAGES[model]
  return (
    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-muted overflow-hidden">
      {src
        ? <img src={src} alt={model} className="h-full w-full object-contain" />
        : <Bus className="h-7 w-7 text-muted-foreground" />
      }
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{children}</p>
}

function InfoCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border bg-muted/30 px-4 py-3">
      {children}
    </div>
  )
}

export function AlertDrawer({ alert, onClose, initialTab = 'overview', onAssigned, showBackdrop = true, showLocationTab = true }: AlertDrawerProps) {
  const open = alert !== null
  const [assignState, setAssignState] = useState<'idle' | 'loading' | 'confirmed'>('idle')
  const [activeTab, setActiveTab] = useState<'overview' | 'location' | 'chat'>('overview')
  const [messages, setMessages] = useState<{ sender: 'dispatch' | 'driver'; text: string; timestamp: Date }[]>([])
  const [draft, setDraft] = useState('')

  useEffect(() => {
    setAssignState('idle')
    setActiveTab(initialTab)
    setMessages(alert && alert.unreadMessages > 0 ? getPreloadedMessages(alert) : [])
  }, [alert?.id])

  const { resolvedTheme } = useTheme()
  const mapStyle = resolvedTheme === 'dark'
    ? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
    : 'https://tiles.openfreemap.org/styles/positron'

  const DRIVER_REPLIES = [
    'Got it, heading to North Lot A after dropoff.',
    'Copy that, on my way to charge after this ride.',
    'Understood, will switch to VH-0033 after drop off.',
    'Roger, I\'ll head to the depot charger when done.',
  ]

  function scheduleDriverReply() {
    const text = DRIVER_REPLIES[Math.floor(Math.random() * DRIVER_REPLIES.length)]
    setTimeout(() => {
      setMessages(prev => [...prev, { sender: 'driver', text, timestamp: new Date() }])
    }, 2500 + Math.random() * 1500)
  }

  function handleAssign() {
    setAssignState('loading')
    setTimeout(() => {
      const firstName = alert?.driver.split(' ')[0] ?? 'Driver'
      setMessages([{
        sender: 'dispatch',
        text: `Hi ${firstName}, after dropping off your current rider please head to Depot North Lot A to charge. Switch to VH-0033 (currently at 78%) for your next dispatch — it's ready to go. Your vehicle will be back at 100% by 3:18 PM.`,
        timestamp: new Date(),
      }])
      setAssignState('confirmed')
      setActiveTab('chat')
      if (alert) onAssigned?.(alert.id)
      toast.success('Vehicle reassigned', {
        description: `${alert?.vehicleId} reassigned to Depot North Lot A · Message sent to driver`,
      })
      scheduleDriverReply()
    }, 1600)
  }

  function handleSend() {
    if (!draft.trim()) return
    setMessages(prev => [...prev, { sender: 'dispatch', text: draft.trim(), timestamp: new Date() }])
    setDraft('')
    scheduleDriverReply()
  }

  const fgColor = useCSSColor('--foreground', 'rgb(24, 24, 27)')
  const mutedColor = useCSSColor('--muted-foreground', 'rgb(136, 136, 136)')
  const cardColor = useCSSColor('--card', 'rgb(255, 255, 255)')
  const borderColor = useCSSColor('--border', 'rgb(229, 231, 235)')

  const activity = alert ? getActivity(alert) : []
  const idleData = alert ? getIdleData(alert) : []
  const chartData = SHIFT_HOURS.map((hour, i) => ({ hour, idle: idleData[i] }))

  return (
    <>
      {/* Backdrop */}
      {showBackdrop && (
        <div
          onClick={onClose}
          className={cn(
            'fixed inset-0 z-40 bg-foreground/20 dark:bg-black/60 transition-opacity duration-300',
            open ? 'opacity-100' : 'pointer-events-none opacity-0',
          )}
        />
      )}

      {/* Panel */}
      <aside
        className={cn(
          'fixed inset-y-0 right-0 z-50 flex w-136 flex-col border-l bg-card shadow-2xl transition-transform duration-300 ease-in-out',
          open ? 'translate-x-0' : 'translate-x-full',
        )}
      >
        {alert && (
          <>
            {/* Header */}
            <div className="shrink-0 border-b px-6 py-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <VehicleThumb model={alert.model} />
                  <div className="min-w-0">
                    <h2 className="truncate text-2xl font-semibold tracking-tight">{alert.vehicleId}</h2>
                    <p className="mt-0.5 font-mono text-xs uppercase text-muted-foreground">{alert.model}</p>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className={cn(
                    'rounded-full px-3 py-0.5 font-mono text-xs uppercase tracking-wide',
                    alert.severity === 'critical' ? 'bg-destructive/12 text-destructive' : 'bg-warning/12 text-warning',
                  )}>
                    {alert.severity}
                  </span>
                  <button
                    onClick={onClose}
                    className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Segment control */}
            <div className="shrink-0 border-b px-6 py-3">
              <div className="flex gap-1 rounded-full bg-muted p-1 w-full">
                {(['overview', 'location', 'chat'] as const).filter(tab => tab !== 'location' || showLocationTab).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={cn(
                      'flex-1 rounded-full px-4 py-1.5 font-mono text-xs uppercase tracking-widest transition-colors',
                      activeTab === tab
                        ? 'bg-card text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Body */}
            <div className={cn('flex-1 min-h-0', (activeTab === 'chat' || activeTab === 'location') ? 'flex flex-col overflow-hidden' : 'overflow-y-auto')}>
              {activeTab === 'chat' ? (
                <Chat className="h-full">
                  {/* Driver contact strip */}
                  <div className="shrink-0 border-b px-4 py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <DriverAvatar name={alert.driver} size="md" />
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{alert.driver}</p>
                        <p className="font-mono text-xs uppercase text-muted-foreground truncate">(310) 555-0142 · CH-7 · Culver City</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {assignState === 'confirmed' && (
                        <button
                          onClick={() => { setAssignState('idle'); setMessages([]); setActiveTab('overview') }}
                          className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <RotateCcw className="h-3 w-3" />
                          Undo
                        </button>
                      )}
                      <button className="flex items-center gap-1.5 rounded-full bg-foreground px-3 py-1.5 font-mono text-xs uppercase tracking-widest text-background transition-opacity hover:opacity-80">
                        <Phone className="h-3 w-3" />
                        Call
                      </button>
                    </div>
                  </div>

                  <ChatMessages className="px-4 gap-1">
                    {[...messages].reverse().map((msg, i) => {
                      const isMe = msg.sender === 'dispatch'
                      return (
                        <div key={i} className={cn('flex flex-col gap-1', isMe ? 'items-end' : 'items-start')}>
                          <div
                            className={cn(
                              'max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                              isMe
                                ? 'rounded-br-sm bg-foreground text-background'
                                : 'rounded-bl-sm bg-muted text-foreground',
                            )}
                          >
                            {msg.text}
                          </div>
                          <ChatEventTime
                            timestamp={msg.timestamp}
                            format="time"
                            className={cn('px-1', isMe ? 'text-right' : 'text-left')}
                          />
                        </div>
                      )
                    })}
                  </ChatMessages>

                  <ChatToolbar className="px-4 pb-4 pt-4">
                    <ChatToolbarTextarea
                      value={draft}
                      onChange={(e) => setDraft(e.target.value)}
                      onSubmit={handleSend}
                      placeholder="Message driver..."
                    />
                    <ChatToolbarAddon align="inline-end">
                      <ChatToolbarButton onClick={handleSend}>
                        <Send />
                      </ChatToolbarButton>
                    </ChatToolbarAddon>
                  </ChatToolbar>
                </Chat>
              ) : activeTab === 'location' ? (() => {
                const coords = VEHICLE_COORDS[alert.vehicleId] ?? [-118.387, 34.002]
                return (
                  <div className="relative flex-1">
                    <MapGL
                      initialViewState={{ longitude: coords[0], latitude: coords[1], zoom: 14 }}
                      style={{ width: '100%', height: '100%' }}
                      mapStyle={mapStyle}
                      attributionControl={false}
                    >
                      <Marker longitude={coords[0]} latitude={coords[1]} anchor="bottom">
                        <div className="flex flex-col items-center gap-1">
                          <div className="flex items-center gap-1.5 rounded-full border bg-card px-2.5 py-1 shadow-md">
                            <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
                            <span className="font-mono text-xs font-medium">{alert.vehicleId}</span>
                          </div>
                          <div className="h-2 w-0.5 bg-foreground/40 rounded-full" />
                          <div className="h-2 w-2 rounded-full bg-foreground shadow" />
                        </div>
                      </Marker>
                    </MapGL>
                    {/* Location overlay card */}
                    <div className="absolute bottom-4 left-4 right-4 rounded-xl border bg-card/90 backdrop-blur-sm px-4 py-3 shadow-lg">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">Sepulveda & Venice</p>
                          <p className="font-mono text-xs uppercase text-muted-foreground">Culver City, CA · Updated just now</p>
                        </div>
                        <Badge className={alert.severity === 'critical' ? 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300' : 'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300'}>
                          {alert.severity}
                        </Badge>
                      </div>
                    </div>
                  </div>
                )
              })() : (
              <div className="flex flex-col gap-5 p-6">

                {/* Active rider */}
                <InfoCard>
                  <div className="flex items-center gap-3">
                    <DriverAvatar name={alert.driver} size="md" />
                    <div>
                      <p className="text-base font-medium">{alert.driver}</p>
                      <p className="font-mono text-xs uppercase text-muted-foreground">Pickup complete · Dropoff ETA 2:21 PM</p>
                      <p className="font-mono text-xs text-muted-foreground">(310) 555-0142</p>
                    </div>
                  </div>
                  <Badge className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">In Vehicle</Badge>
                </InfoCard>

                {/* Metric cards */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="flex flex-col gap-2 rounded-xl border bg-muted/30 p-4">
                    <SectionLabel>Battery</SectionLabel>
                    <p className={cn('font-mono text-2xl tabular-nums', alert.batteryPct < 15 ? 'text-destructive' : 'text-foreground')}>
                      {alert.batteryPct}%
                    </p>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={cn('h-full rounded-full', alert.batteryPct < 15 ? 'bg-destructive' : alert.batteryPct < 30 ? 'bg-warning' : 'bg-foreground')}
                        style={{ width: `${alert.batteryPct}%` }}
                      />
                    </div>
                    <p className="font-mono text-xs uppercase text-muted-foreground">
                      {parseDetail(alert.alertDetail).range ? `${parseDetail(alert.alertDetail).range} range` : '—'}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 rounded-xl border bg-muted/30 p-4">
                    <SectionLabel>Route Left</SectionLabel>
                    <p className="font-mono text-2xl uppercase text-foreground">
                      {parseDetail(alert.alertDetail).route ?? '—'}
                    </p>
                    <p className="font-mono text-xs uppercase text-muted-foreground">Remaining</p>
                  </div>
                  <div className="flex flex-col gap-2 rounded-xl border bg-muted/30 p-4">
                    <SectionLabel>Est. Done</SectionLabel>
                    <p className="font-mono text-2xl uppercase text-foreground">2:45 PM</p>
                    <Badge className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">On Schedule</Badge>
                  </div>
                </div>

                {/* Alert banner */}
                {alert.severity === 'critical' ? (
                  <div className="rounded-xl border bg-muted/30 p-4 flex flex-col gap-3">
                    <div className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
                      <p className="font-mono text-xs uppercase tracking-widest text-destructive">Active</p>
                    </div>
                    {assignState === 'loading' ? (
                      <div className="flex flex-col items-center gap-3 py-6">
                        <div className="h-7 w-7 animate-spin rounded-full border-2 border-muted-foreground border-t-foreground" />
                        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Processing reassignment…</p>
                      </div>
                    ) : (
                      <>
                        <div className="rounded-xl bg-destructive/8 p-4">
                          <p className="font-mono text-base font-semibold uppercase text-destructive">{alert.alertTitle}</p>
                          <p className="mt-1 font-mono text-xs text-destructive opacity-80 uppercase">
                            Clears this ride · charge required before next dispatch
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col gap-2 rounded-xl border bg-card p-4">
                            <p className="font-mono text-xs uppercase text-muted-foreground">Charging Location</p>
                            <div className="flex items-baseline gap-1.5">
                              <span className="font-mono text-2xl uppercase text-foreground">0.8mi</span>
                              <span className="font-mono text-xs uppercase text-muted-foreground">Miles Away</span>
                            </div>
                            <p className="font-mono text-xs uppercase text-foreground">Depot North Lot A</p>
                          </div>
                          <div className="flex flex-col gap-2 rounded-xl border bg-card p-4">
                            <p className="font-mono text-xs uppercase text-muted-foreground">Charge Time</p>
                            <p className="font-mono text-2xl uppercase text-foreground">42min</p>
                            <p className="font-mono text-xs uppercase text-foreground">100% @ 3:18 PM</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 rounded-xl border bg-card p-4">
                          <VehicleThumb model={alert.model} />
                          <div className="min-w-0 flex-1">
                            <p className="font-mono text-xs uppercase text-muted-foreground">New Assigned Vehicle</p>
                            <div className="flex items-baseline gap-1.5">
                              <span className="font-mono text-xl uppercase text-foreground">VH-0033</span>
                              <span className="font-mono text-xs uppercase text-muted-foreground">{alert.model}</span>
                            </div>
                            <p className="font-mono text-xs uppercase text-foreground">78% Charged</p>
                          </div>
                          <Badge className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">Available</Badge>
                        </div>
                        <button
                          onClick={handleAssign}
                          className="rounded-full bg-destructive px-6 py-3 font-mono text-xs uppercase tracking-widest text-destructive-foreground transition-opacity hover:opacity-80"
                        >
                          Reassign & Charge Vehicle
                        </button>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="rounded-xl border bg-muted/30 p-4">
                    <p className="font-mono text-base font-semibold uppercase text-warning">{alert.alertTitle}</p>
                    <p className="mt-1 font-mono text-xs uppercase text-warning opacity-80">
                      {WARNING_COPY[alert.alertTitle] ?? alert.alertDetail}
                    </p>
                  </div>
                )}

                {/* Route addresses */}
                <div className="relative flex rounded-xl border bg-muted/30 overflow-hidden">
                  <ArrowUpRight className="absolute top-3 right-3 h-4 w-4 text-muted-foreground" />
                  <div className="flex-1 min-w-0 p-4">
                    <p className="font-mono text-xs uppercase text-muted-foreground mb-2">Last Checkpoint</p>
                    <p className="text-sm leading-relaxed">
                      West LA Distribution Hub<br />
                      4821 Sepulveda Blvd<br />
                      Los Angeles, 90230 CA<br />
                      United States
                    </p>
                  </div>
                  <div className="w-px bg-border shrink-0" />
                  <div className="flex-1 min-w-0 p-4">
                    <p className="font-mono text-xs uppercase text-muted-foreground mb-2">Destination</p>
                    <p className="text-sm leading-relaxed">
                      {alert.driver.split(' ')[1] ?? alert.driver}<br />
                      1142 Wilshire Blvd<br />
                      Santa Monica, 90401 CA<br />
                      United States
                    </p>
                  </div>
                </div>

                {/* Nearest charger */}
                <div className="flex flex-col gap-2">
                  <SectionLabel>Nearest Available Charger</SectionLabel>
                  <InfoCard>
                    <div className="min-w-0">
                      <p className="text-base font-medium">Depot North Lot A</p>
                      <p className="mt-0.5 font-mono text-xs uppercase text-muted-foreground">2 of 4 stalls open</p>
                      <p className="font-mono text-xs uppercase text-muted-foreground">12 min · charge to dispatch ready</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-mono text-lg uppercase text-success-foreground">0.8mi</p>
                      <p className="font-mono text-xs uppercase text-muted-foreground">+4 min detour</p>
                    </div>
                  </InfoCard>
                </div>

                {/* Assignment */}
                <div className="flex flex-col gap-2">
                  <SectionLabel>Assignment</SectionLabel>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Route', value: '14-B', status: 'On Route' },
                      { label: 'Driver', value: alert.driver.split(' ')[0], status: 'Confirmed' },
                    ].map(({ label, value, status }) => (
                      <div key={label} className="flex flex-col gap-2 rounded-xl border bg-muted/30 px-4 py-3">
                        <Badge className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">{status}</Badge>
                        <div>
                          <p className="font-mono text-sm uppercase font-medium">{value}</p>
                          <p className="font-mono text-xs uppercase text-muted-foreground">{label}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Best reassignment — warning only */}
                {alert.severity === 'warning' && (
                  <div className="flex flex-col gap-2">
                    <SectionLabel>Best Reassignment</SectionLabel>
                    <div className="flex flex-col gap-2 rounded-xl border bg-muted/30 p-4">
                      <p className="text-base font-medium">Next dispatch after current ride completes</p>
                      <InfoCard>
                        <div>
                          <p className="font-mono text-base uppercase">VH-00033</p>
                          <p className="font-mono text-xs uppercase text-muted-foreground">Ford E-Transit · 78% Battery · 0.4mi Away</p>
                        </div>
                        <Badge className="bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300">Available Now</Badge>
                      </InfoCard>
                      <button className="mt-1 w-full rounded-lg border py-2.5 font-mono text-xs uppercase tracking-widest text-foreground transition-colors hover:bg-muted">
                        Assign VH-0033
                      </button>
                    </div>
                  </div>
                )}

                {/* Activity */}
                <div className="flex flex-col gap-2">
                  <SectionLabel>Activity</SectionLabel>
                  <div className="rounded-xl border bg-muted/30 p-4">
                    <div className="relative flex flex-col">
                      <div className="absolute left-1.25 bottom-2 top-2 w-px bg-border" />
                      {activity.map((item, i) => (
                        <div key={i} className="relative flex gap-4 pb-6 last:pb-0">
                          <div className={cn(
                            'relative z-10 mt-0.5 h-3 w-3 shrink-0 rounded-full border-2 border-card',
                            item.status === 'critical' ? 'bg-destructive' :
                            item.status === 'warning' ? 'bg-warning' : 'bg-muted-foreground',
                          )} />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline justify-between gap-2">
                              <p className="text-sm font-medium">{item.event}</p>
                              <span className="shrink-0 font-mono text-xs uppercase text-muted-foreground">{item.time}</span>
                            </div>
                            <p className="mt-0.5 font-mono text-xs uppercase text-muted-foreground">{item.detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Idle times */}
                <div className="flex flex-col gap-2">
                  <SectionLabel>Idle Times</SectionLabel>
                  <div className="rounded-xl border bg-muted/30 p-4 flex flex-col gap-4">
                    <div className="grid grid-cols-3 divide-x rounded-md border">
                      {[
                        { label: 'Total Idle', value: `${idleData.reduce((a, b) => a + b, 0)} min` },
                        { label: 'Peak Hour', value: SHIFT_HOURS[idleData.indexOf(Math.max(...idleData))] },
                        { label: 'Avg / Hr', value: `${Math.round(idleData.reduce((a, b) => a + b, 0) / idleData.length)} min` },
                      ].map(({ label, value }) => (
                        <div key={label} className="flex flex-col gap-0.5 px-4 py-3">
                          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
                          <p className="font-mono text-base tabular-nums">{value}</p>
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="text-sm font-medium">Idle time per hour</p>
                      <p className="font-mono text-xs uppercase text-muted-foreground">Today's shift · 5 AM – 3 PM</p>
                    </div>
                    <ResponsiveContainer width="100%" height={220}>
                      <LineChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: -16 }}>
                        <CartesianGrid stroke={borderColor} strokeDasharray="4 4" vertical={false} />
                        <XAxis
                          dataKey="hour"
                          tick={{ fontSize: 10, fill: mutedColor, fontFamily: 'NectoMono, monospace' }}
                          axisLine={false}
                          tickLine={false}
                        />
                        <YAxis
                          tick={{ fontSize: 10, fill: mutedColor, fontFamily: 'NectoMono, monospace' }}
                          axisLine={false}
                          tickLine={false}
                          tickFormatter={(v) => `${v}m`}
                        />
                        <Tooltip
                          contentStyle={{
                            background: fgColor,
                            border: 'none',
                            borderRadius: '0.5rem',
                            color: cardColor,
                            fontFamily: 'NectoMono, monospace',
                            fontSize: 11,
                          }}
                          itemStyle={{ color: cardColor }}
                          formatter={(v) => [`${v} min`, 'Idle']}
                          cursor={{ stroke: borderColor, strokeWidth: 1 }}
                        />
                        <Line
                          type="monotone"
                          dataKey="idle"
                          stroke={fgColor}
                          strokeWidth={2}
                          dot={{ r: 3, fill: fgColor, strokeWidth: 0 }}
                          activeDot={{ r: 5, fill: fgColor, strokeWidth: 2, stroke: cardColor }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>
              )}
            </div>

          </>
        )}
      </aside>
    </>
  )
}
