'use client'

import { useState } from 'react'
import { NavBar } from '@/components/nav-bar'
import { SegmentTabs, type SegmentTab } from '@/components/segment-tabs'
import { cn } from '@/lib/utils'
import { Camera, Lock, LockOpen, AlertTriangle, Plus, BatteryCharging } from 'lucide-react'
import { vehicles, type VehicleStatus } from '@/lib/vehicles'

type Tab = VehicleStatus

function BatteryBar({ pct, unit, range }: { pct: number; unit: string; range: number }) {
  const color = pct < 15 ? 'bg-destructive' : pct < 30 ? 'bg-warning' : 'bg-foreground'
  return (
    <div className="flex items-center gap-2.5">
      <div className="h-1.5 w-28 overflow-hidden rounded-full bg-muted">
        <div className={cn('h-full rounded-full', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className={cn('font-mono text-sm tabular-nums', pct < 15 ? 'text-destructive' : 'text-muted-foreground')}>
        {pct}% · {range} {unit}
      </span>
    </div>
  )
}

export default function VehiclesPage() {
  const [activeTab, setActiveTab] = useState<Tab>('in-service')

  const tabs: SegmentTab<Tab>[] = [
    { label: 'In Service', value: 'in-service', count: vehicles.filter(v => v.vehicleStatus === 'in-service').length },
    { label: 'Charging', value: 'charging', count: vehicles.filter(v => v.vehicleStatus === 'charging').length },
    { label: 'Charged', value: 'charged', count: vehicles.filter(v => v.vehicleStatus === 'charged').length },
  ]

  const filtered = vehicles.filter(v => v.vehicleStatus === activeTab)

  return (
    <div className="flex min-h-screen flex-col bg-background pt-16">
      <NavBar activeNav="VEHICLES" onNavChange={() => {}} />

      <main className="flex-1 px-6 py-6">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-medium tracking-tight">Vehicles</h1>
          <button className="flex items-center gap-2 rounded-xl bg-foreground px-4 py-2.5 text-base font-medium text-background transition-opacity hover:opacity-80">
            <Plus className="h-4 w-4" />
            New Vehicle
          </button>
        </div>

        {/* Segment control */}
        <SegmentTabs tabs={tabs} active={activeTab} onChange={setActiveTab} className="mb-6 w-auto" />

        {/* Vehicle list */}
        <div className="rounded-3xl border bg-card overflow-hidden">
          {filtered.length === 0 ? (
            <div className="flex items-center justify-center py-16">
              <p className="font-mono text-sm uppercase tracking-widest text-muted-foreground">No vehicles</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map(vehicle => (
                <div
                  key={vehicle.id}
                  className="flex items-center gap-6 px-6 py-5 transition-colors hover:bg-muted/30 cursor-pointer"
                >
                  {/* Name + VIN */}
                  <div className="w-48 shrink-0">
                    <p className="text-base font-semibold">{vehicle.name}</p>
                    <p className="font-mono text-xs text-muted-foreground">{vehicle.vin}</p>
                  </div>

                  {/* Location */}
                  <div className="min-w-0 flex-1">
                    <p className="text-base text-foreground truncate">{vehicle.statusLine1}</p>
                    <p className="text-sm text-muted-foreground">{vehicle.statusLine2}</p>
                  </div>

                  {/* Battery */}
                  <div className="shrink-0">
                    <BatteryBar pct={vehicle.soc} unit={vehicle.rangeUnit} range={vehicle.range} />
                    {vehicle.vehicleStatus === 'charging' && (
                      <div className="mt-1 flex items-center gap-1 font-mono text-xs text-blue-500">
                        <BatteryCharging className="h-3 w-3" />
                        Charging
                      </div>
                    )}
                  </div>

                  {/* Status chips */}
                  <div className="flex shrink-0 items-center gap-2">
                    {/* Camera */}
                    <div className={cn(
                      'flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-xs',
                      vehicle.cameraStatus === 'active'
                        ? 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300'
                        : vehicle.cameraStatus === 'alert'
                          ? 'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300'
                          : 'bg-muted text-muted-foreground',
                    )}>
                      <Camera className="h-3 w-3" />
                      {vehicle.cameraStatus}
                    </div>

                    {/* Lock */}
                    <div className={cn(
                      'flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-xs',
                      vehicle.lockStatus === 'locked'
                        ? 'bg-muted text-muted-foreground'
                        : 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
                    )}>
                      {vehicle.lockStatus === 'locked'
                        ? <Lock className="h-3 w-3" />
                        : <LockOpen className="h-3 w-3" />}
                      {vehicle.lockStatus}
                    </div>

                    {/* Alert count */}
                    {vehicle.alertCount > 0 && (
                      <div className="flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 font-mono text-xs text-red-700 dark:bg-red-950 dark:text-red-300">
                        <AlertTriangle className="h-3 w-3" />
                        {vehicle.alertCount}
                      </div>
                    )}
                  </div>

                  {/* Last seen */}
                  <div className="w-20 shrink-0 text-right">
                    <span className={cn(
                      'font-mono text-sm',
                      vehicle.lastSeenAlert ? 'text-destructive' : 'text-muted-foreground',
                    )}>
                      {vehicle.lastSeen}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
