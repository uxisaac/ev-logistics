'use client'

import { useState, useRef, useCallback } from 'react'
import dynamic from 'next/dynamic'
import { NavBar } from '@/components/nav-bar'
import { DriverAvatar } from '@/components/driver-avatar'
import { AlertDrawer } from '@/components/alert-drawer'
import { Badge } from '@/components/ui/badge'
import { SegmentTabs } from '@/components/segment-tabs'
import { cn } from '@/lib/utils'
import { Search } from 'lucide-react'
import { ALERTS } from '@/lib/fleet-data'
import type { MapCanvasProps } from './map-canvas'

const MapCanvas = dynamic<MapCanvasProps>(
  () => import('./map-canvas').then(m => ({ default: m.MapCanvas })),
  { ssr: false, loading: () => <div className="h-full w-full animate-pulse bg-muted/30" /> },
)

type FilterTab = 'all' | 'critical' | 'warning'

function BatteryBar({ pct }: { pct: number }) {
  const color = pct < 15 ? 'bg-destructive' : pct < 30 ? 'bg-warning' : 'bg-foreground'
  return (
    <div className="flex items-center gap-2">
      <div className="h-1 w-24 overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full rounded-full', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className={cn('font-mono text-sm tabular-nums', pct < 15 ? 'text-destructive' : 'text-muted-foreground')}>
        {pct}%
      </span>
    </div>
  )
}

export default function LiveMapPage() {
  const cardRefs = useRef<Map<string, HTMLButtonElement>>(new Map())
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [drawerAlert, setDrawerAlert] = useState<(typeof ALERTS)[0] | null>(null)
  const [filter, setFilter] = useState<FilterTab>('all')
  const [search, setSearch] = useState('')

  const criticalCount = ALERTS.filter(a => a.severity === 'critical').length
  const warningCount = ALERTS.filter(a => a.severity === 'warning').length

  const filterTabs = [
    { label: 'All', value: 'all' as const, count: ALERTS.length },
    { label: 'Crit', value: 'critical' as const, count: criticalCount },
    { label: 'Warn', value: 'warning' as const, count: warningCount },
  ]

  const filteredAlerts = ALERTS.filter(a => {
    if (filter !== 'all' && a.severity !== filter) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        a.vehicleId.toLowerCase().includes(q) ||
        a.driver.toLowerCase().includes(q) ||
        a.model.toLowerCase().includes(q)
      )
    }
    return true
  })

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id)
    cardRefs.current.get(id)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [])

  return (
    <div className="flex h-screen flex-col">
      <NavBar activeNav="LIVE MAP" onNavChange={() => {}} />
      <AlertDrawer
        alert={drawerAlert}
        onClose={() => setDrawerAlert(null)}
        showBackdrop={false}
        showLocationTab={false}
      />

      <div className="flex flex-1 overflow-hidden pt-16">
        {/* Sidebar */}
        <aside className="flex w-80 flex-none flex-col border-r border-sidebar-border bg-sidebar">
          {/* Search */}
          <div className="border-b border-sidebar-border px-3 py-2">
            <div className="flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2">
              <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search vehicles or drivers…"
                className="flex-1 bg-transparent text-base text-foreground placeholder:text-muted-foreground focus:outline-none"
              />
            </div>
          </div>

          {/* Filter tabs */}
          <div className="border-b border-sidebar-border px-3 py-2">
            <SegmentTabs tabs={filterTabs} active={filter} onChange={setFilter} />
          </div>

          {/* Vehicle list */}
          <div className="flex-1 overflow-y-auto">
            {filteredAlerts.map(alert => (
              <button
                key={alert.id}
                ref={el => {
                  if (el) cardRefs.current.set(alert.id, el)
                  else cardRefs.current.delete(alert.id)
                }}
                onClick={() => { handleSelect(alert.id); setDrawerAlert(alert) }}
                className={cn(
                  'w-full border-b border-sidebar-border px-4 py-3 text-left transition-colors hover:bg-muted/40',
                  selectedId === alert.id && 'bg-muted',
                )}
              >
                {/* Vehicle ID + badge */}
                <div className="mb-1.5 flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-sm font-bold">{alert.vehicleId}</span>
                    <span className="ml-1.5 text-sm text-muted-foreground">{alert.model}</span>
                  </div>
                  {alert.severity === 'critical' ? (
                    <Badge className="shrink-0 bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300">Critical</Badge>
                  ) : (
                    <Badge className="shrink-0 bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300">Warning</Badge>
                  )}
                </div>

                {/* Driver */}
                <div className="mb-2 flex items-center gap-2">
                  <DriverAvatar name={alert.driver} />
                  <span className="text-base text-foreground">{alert.driver}</span>
                </div>

                {/* Battery */}
                <BatteryBar pct={alert.batteryPct} />

                {/* Alert summary */}
                <p className="mt-1.5 truncate text-sm text-muted-foreground">{alert.alertTitle}</p>
              </button>
            ))}
          </div>
        </aside>

        {/* Map */}
        <div className="relative flex-1">
          <MapCanvas
            selectedId={selectedId}
            drawerOpen={!!drawerAlert}
            onMapClick={() => setDrawerAlert(null)}
            onSelect={(id) => {
              setFilter('all')
              handleSelect(id)
              const alert = ALERTS.find(a => a.id === id)
              if (alert) setDrawerAlert(alert)
            }}
          />
        </div>
      </div>
    </div>
  )
}
