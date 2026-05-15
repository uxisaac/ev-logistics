'use client'

import { ScrollArea } from '@/components/ui/scroll-area'
import { CheckCircle, Zap, AlertTriangle, Clock, BatteryCharging, LogIn } from 'lucide-react'
import { cn } from '@/lib/utils'

type ActivityType = 'confirmed' | 'charging' | 'complete' | 'fault' | 'queued' | 'arrived'

interface Activity {
  id: string
  time: string
  type: ActivityType
  vehicleId?: string
  stall?: string
  driver: string
  detail: string
}

const ACTIVITIES: Activity[] = [
  { id: '1',  time: '2:41 PM',  type: 'charging',  vehicleId: 'VH-0012', stall: 'A-01', driver: 'A. Reyes',    detail: 'Charging started · 50 kW' },
  { id: '2',  time: '2:38 PM',  type: 'complete',  vehicleId: 'VH-0074', stall: 'C-04', driver: 'L. Davis',    detail: 'Charging complete · 100%' },
  { id: '3',  time: '2:35 PM',  type: 'confirmed', vehicleId: 'VH-0055', stall: null!,  driver: 'J. Martinez', detail: 'Driver confirmed · Heading to charger after dropoff' },
  { id: '4',  time: '2:31 PM',  type: 'fault',     vehicleId: 'VH-0103', stall: 'B-02', driver: 'S. Hall',     detail: 'Fault detected · Station error code E04' },
  { id: '5',  time: '2:28 PM',  type: 'charging',  vehicleId: 'VH-0083', stall: 'A-03', driver: 'R. Kim',      detail: 'Charging started · 60 kW' },
  { id: '6',  time: '2:24 PM',  type: 'queued',    vehicleId: 'VH-0091', stall: 'C-02', driver: 'N. Lopez',    detail: 'Vehicle queued · Waiting for open stall' },
  { id: '7',  time: '2:19 PM',  type: 'arrived',   vehicleId: 'VH-0028', stall: 'A-02', driver: 'C. Park',     detail: 'Arrived at depot · Assigned stall A-02' },
  { id: '8',  time: '2:14 PM',  type: 'charging',  vehicleId: 'VH-0047', stall: 'B-03', driver: 'M. Singh',    detail: 'Charging started · 50 kW' },
  { id: '9',  time: '2:09 PM',  type: 'confirmed', vehicleId: 'VH-0034', stall: null!,  driver: 'P. Johnson',  detail: 'Driver confirmed · Heading to charger after dropoff' },
  { id: '10', time: '2:03 PM',  type: 'queued',    vehicleId: 'VH-0061', stall: 'B-01', driver: 'T. Brown',    detail: 'Vehicle queued · Charger occupied' },
]

const ACTIVITY_ICON: Record<ActivityType, React.ReactNode> = {
  confirmed: <CheckCircle className="h-3.5 w-3.5" />,
  charging:  <Zap className="h-3.5 w-3.5" />,
  complete:  <BatteryCharging className="h-3.5 w-3.5" />,
  fault:     <AlertTriangle className="h-3.5 w-3.5" />,
  queued:    <Clock className="h-3.5 w-3.5" />,
  arrived:   <LogIn className="h-3.5 w-3.5" />,
}

const ACTIVITY_COLOR: Record<ActivityType, string> = {
  confirmed: 'text-green-600 dark:text-green-400',
  charging:  'text-green-600 dark:text-green-400',
  complete:  'text-sky-600 dark:text-sky-400',
  fault:     'text-red-600 dark:text-red-400',
  queued:    'text-blue-600 dark:text-blue-400',
  arrived:   'text-muted-foreground',
}

const ACTIVITY_DOT: Record<ActivityType, string> = {
  confirmed: 'bg-green-500',
  charging:  'bg-green-500',
  complete:  'bg-sky-500',
  fault:     'bg-red-500',
  queued:    'bg-blue-500',
  arrived:   'bg-muted-foreground',
}

export function RecentActivity() {
  return (
    <div className="rounded-3xl border bg-card overflow-hidden flex flex-col h-full">
      <div className="shrink-0 px-5 py-4 border-b">
        <p className="text-base leading-normal tracking-[0.01em] opacity-70 text-card-foreground">Recent Activity</p>
      </div>
      <ScrollArea className="flex-1">
        <div className="relative px-5 py-4">
          <div className="absolute left-7.25 top-4 bottom-4 w-px bg-border" />
          <div className="flex flex-col gap-5">
            {ACTIVITIES.map((activity) => (
              <div key={activity.id} className="flex gap-3 min-w-0">
                <div className="relative z-10 flex h-5 w-5 shrink-0 items-center justify-center">
                  <div className={cn('h-2 w-2 rounded-full', ACTIVITY_DOT[activity.type])} />
                </div>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5 pt-0.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={cn('flex items-center gap-1 shrink-0 text-base leading-normal tracking-[0.01em] opacity-70 text-card-foreground', ACTIVITY_COLOR[activity.type])}>
                      {ACTIVITY_ICON[activity.type]}
                      {activity.driver}
                    </span>
                    {activity.vehicleId && (
                      <span className="text-base leading-normal tracking-[0.01em] opacity-70 text-card-foreground truncate">
                        {activity.vehicleId}{activity.stall ? ` · ${activity.stall}` : ''}
                      </span>
                    )}
                  </div>
                  <p className="text-base leading-normal tracking-[0.01em] opacity-70 text-card-foreground">{activity.detail}</p>
                  <p className="text-base leading-normal tracking-[0.01em] opacity-70 text-card-foreground mt-0.5">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </ScrollArea>
    </div>
  )
}
