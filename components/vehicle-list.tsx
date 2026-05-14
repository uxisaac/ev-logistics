'use client'

import {
  Lock,
  LockOpen,
  Video,
  VideoOff,
  ChevronRight,
  Wrench,
  ArrowUp,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Vehicle } from '@/lib/vehicles'

function SocCell({ vehicle }: { vehicle: Vehicle }) {
  const critical = vehicle.soc < 15
  const low = vehicle.soc < 25
  const color = critical ? 'text-red-500' : low ? 'text-amber-500' : 'text-foreground'
  const subColor = critical
    ? 'text-red-400'
    : low
      ? 'text-amber-400'
      : 'text-muted-foreground'

  return (
    <div className={cn('text-sm', color)}>
      <div className="font-medium">{vehicle.soc}%</div>
      <div className={cn('text-xs', subColor)}>
        {vehicle.range} {vehicle.rangeUnit}
      </div>
    </div>
  )
}

function SecurityCell({ vehicle }: { vehicle: Vehicle }) {
  return (
    <div className="flex items-center gap-1.5">
      {vehicle.lockStatus === 'unlocked' ? (
        <LockOpen className="h-4 w-4 text-red-500" />
      ) : (
        <Lock className="h-4 w-4 text-gray-400" />
      )}
      {vehicle.cameraStatus === 'alert' ? (
        <Video className="h-4 w-4 text-red-500" />
      ) : (
        <VideoOff className="h-4 w-4 text-gray-300" />
      )}
    </div>
  )
}

function StatusCell({ vehicle }: { vehicle: Vehicle }) {
  if (vehicle.inService) {
    return (
      <div className="text-sm">
        <div className="flex items-center gap-1 text-muted-foreground">
          <Wrench className="h-3 w-3 shrink-0" />
          <span>In Tesla Service</span>
        </div>
        <div className="text-xs text-muted-foreground">{vehicle.statusLine2}</div>
      </div>
    )
  }

  if (vehicle.alertCount > 0) {
    return (
      <div className="text-sm">
        <div className="text-xs font-medium text-orange-500">
          {vehicle.alertCount} active service alert{vehicle.alertCount !== 1 ? 's' : ''}
        </div>
        <div className="text-foreground">{vehicle.statusLine1}</div>
        <div className="text-xs text-muted-foreground">{vehicle.statusLine2}</div>
      </div>
    )
  }

  return (
    <div className="text-sm">
      <div className="text-foreground">{vehicle.statusLine1}</div>
      <div className="text-xs text-muted-foreground">{vehicle.statusLine2}</div>
    </div>
  )
}

interface VehicleListProps {
  vehicles: Vehicle[]
  selectedId: string | null
  onSelectVehicle: (id: string) => void
}

const COLS = 'grid-cols-[minmax(180px,2fr)_80px_80px_80px_minmax(160px,2fr)_28px]'

export function VehicleList({ vehicles, selectedId, onSelectVehicle }: VehicleListProps) {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div
        className={cn(
          'sticky top-0 z-10 grid items-center border-b bg-background px-4 py-2.5',
          COLS,
        )}
      >
        <span className="font-mono text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Vehicle
        </span>
        <span className="font-mono text-xs font-medium uppercase tracking-wide text-muted-foreground">
          SOC
        </span>
        <span className="font-mono text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Security
        </span>
        <span className="font-mono text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Last Seen
        </span>
        <span className="font-mono flex items-center gap-0.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Status
          <ArrowUp className="h-3 w-3" />
        </span>
        <span />
      </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto">
        {vehicles.map((vehicle) => (
          <div
            key={vehicle.id}
            onClick={() => onSelectVehicle(vehicle.id)}
            className={cn(
              'group grid cursor-pointer items-center border-b px-4 py-3 transition-colors',
              COLS,
              selectedId === vehicle.id ? 'bg-muted/50' : 'hover:bg-muted/50',
            )}
          >
            {/* Vehicle */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="min-w-0">
                <div className="truncate text-base font-semibold">{vehicle.name}</div>
                <div className="truncate font-mono text-xs text-muted-foreground tracking-wide">
                  {vehicle.vin}
                </div>
              </div>
            </div>

            <SocCell vehicle={vehicle} />
            <SecurityCell vehicle={vehicle} />

            {/* Last Seen */}
            <div
              className={cn(
                'text-sm',
                vehicle.lastSeenAlert
                  ? 'font-medium text-orange-500'
                  : 'text-muted-foreground',
              )}
            >
              {vehicle.lastSeen}
            </div>

            <StatusCell vehicle={vehicle} />

            <ChevronRight
              className={cn(
                'h-4 w-4 shrink-0 transition-colors',
                selectedId === vehicle.id
                  ? 'text-muted-foreground'
                  : 'text-border group-hover:text-muted-foreground',
              )}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
