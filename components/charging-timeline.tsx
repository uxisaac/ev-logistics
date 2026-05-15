'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type SessionStatus = 'charging' | 'queued' | 'complete' | 'fault'

interface StallSession {
  id: string
  stall: string
  vehicleId: string
  status: SessionStatus
  startAt: Date
  endAt: Date
}

const BADGE_VARIANT: Record<SessionStatus, 'default' | 'secondary' | 'outline' | 'destructive'> = {
  charging: 'default',
  queued:   'secondary',
  complete: 'outline',
  fault:    'destructive',
}

const STATUS_LABEL: Record<SessionStatus, string> = {
  charging: 'Charging',
  queued:   'Waiting',
  complete: 'Done',
  fault:    'Fault',
}

const BAR_CLASS: Record<SessionStatus, string> = {
  charging: 'bg-green-500',
  queued:   'bg-blue-400/80',
  complete: 'bg-sky-400/70',
  fault:    'bg-destructive',
}

const DAY_START = new Date(2026, 4, 14, 0, 0, 0).getTime()
const DAY_MS    = 24 * 60 * 60 * 1000
const NOW_TS    = new Date(2026, 4, 14, 14, 45).getTime()
const eod       = new Date(2026, 4, 14, 23, 59)

const SESSIONS: StallSession[] = [
  { id: 'a01', stall: 'A-01', vehicleId: 'VH-0012', status: 'charging', startAt: new Date(2026, 4, 14, 14, 41), endAt: new Date(2026, 4, 14, 17, 0)  },
  { id: 'a02', stall: 'A-02', vehicleId: 'VH-0028', status: 'charging', startAt: new Date(2026, 4, 14, 14, 15), endAt: new Date(2026, 4, 14, 15, 5)  },
  { id: 'a03', stall: 'A-03', vehicleId: 'VH-0083', status: 'charging', startAt: new Date(2026, 4, 14, 14, 22), endAt: new Date(2026, 4, 14, 15, 22) },
  { id: 'b01', stall: 'B-01', vehicleId: 'VH-0061', status: 'queued',   startAt: new Date(2026, 4, 14, 14, 30), endAt: eod                            },
  { id: 'b02', stall: 'B-02', vehicleId: 'VH-0103', status: 'fault',    startAt: new Date(2026, 4, 14, 14, 31), endAt: eod                            },
  { id: 'b03', stall: 'B-03', vehicleId: 'VH-0047', status: 'charging', startAt: new Date(2026, 4, 14, 14, 18), endAt: new Date(2026, 4, 14, 14, 58) },
  { id: 'c02', stall: 'C-02', vehicleId: 'VH-0091', status: 'queued',   startAt: new Date(2026, 4, 14, 14, 24), endAt: eod                            },
  { id: 'c04', stall: 'C-04', vehicleId: 'VH-0074', status: 'complete', startAt: new Date(2026, 4, 14, 13, 0),  endAt: new Date(2026, 4, 14, 14, 38) },
]

const MARKERS = [
  { id: 'm1', date: new Date(2026, 4, 14, 14, 38), label: 'L. Davis · done'       },
  { id: 'm2', date: new Date(2026, 4, 14, 14, 35), label: 'J. Martinez · en route' },
  { id: 'm3', date: new Date(2026, 4, 14, 14,  9), label: 'P. Johnson · en route'  },
]

const GROUPS = [
  { name: 'Depot North · Lot A', ids: ['a01', 'a02', 'a03'] },
  { name: 'Depot South · Lot B', ids: ['b01', 'b02', 'b03'] },
  { name: 'West Hub · Lot C',    ids: ['c02', 'c04']        },
]

const byId = Object.fromEntries(SESSIONS.map(s => [s.id, s]))

const HOUR_TICKS = [0, 3, 6, 9, 12, 15, 18, 21]

function toPct(ts: number): number {
  return ((ts - DAY_START) / DAY_MS) * 100
}

function fmtHour(h: number): string {
  if (h === 0) return '12 AM'
  if (h < 12) return `${h} AM`
  if (h === 12) return '12 PM'
  return `${h - 12} PM`
}

export function ChargingTimeline() {
  const nowPct = toPct(NOW_TS)

  return (
    <Card className="rounded-3xl overflow-hidden">
      <CardHeader className="px-6 py-5 border-b">
        <CardTitle className="font-mono text-xs uppercase tracking-widest text-muted-foreground font-normal">
          Charging Timeline · May 14
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0 overflow-hidden">
        <div className="flex">

          {/* Sidebar */}
          <div className="w-36 shrink-0 border-r">
            <div className="h-8 border-b" />
            {GROUPS.map(group => (
              <div key={group.name}>
                <div className="h-7 flex items-center border-b bg-muted/40 px-3">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground truncate">
                    {group.name.split('·')[1]?.trim() ?? group.name}
                  </p>
                </div>
                {group.ids.map(id => {
                  const s = byId[id]
                  return (
                    <div key={id} className="h-10 flex items-center border-b px-3 gap-2">
                      <span className="font-mono text-xs text-foreground shrink-0">{s.stall}</span>
                      <Badge variant={BADGE_VARIANT[s.status]} className="text-[9px] px-1.5 py-0 h-4">
                        {STATUS_LABEL[s.status]}
                      </Badge>
                    </div>
                  )
                })}
              </div>
            ))}
          </div>

          {/* Timeline */}
          <div className="flex-1 min-w-0 relative">

            {/* Hour header */}
            <div className="relative h-8 border-b">
              {HOUR_TICKS.map(h => (
                <div
                  key={h}
                  className="absolute top-0 h-full flex items-end pb-1.5"
                  style={{ left: `${(h / 24) * 100}%` }}
                >
                  <span className="font-mono text-[10px] text-muted-foreground pl-1.5">{fmtHour(h)}</span>
                </div>
              ))}
            </div>

            {/* Body */}
            <div className="relative">

              {/* Vertical grid lines */}
              {HOUR_TICKS.map(h => (
                <div
                  key={h}
                  className="absolute top-0 bottom-0 w-px bg-border/60"
                  style={{ left: `${(h / 24) * 100}%` }}
                />
              ))}

              {/* Marker lines */}
              {MARKERS.map(m => (
                <div
                  key={m.id}
                  className="absolute top-0 bottom-0 z-10"
                  style={{ left: `${toPct(m.date.getTime())}%` }}
                >
                  <div className="absolute top-0 bottom-0 w-px border-l border-dashed border-muted-foreground/40" />
                  <span
                    className="absolute top-1 font-mono text-[9px] text-muted-foreground whitespace-nowrap"
                    style={{ transform: 'rotate(-90deg) translateX(-100%)', transformOrigin: '0 0', left: -2 }}
                  >
                    {m.label}
                  </span>
                </div>
              ))}

              {/* Now line */}
              <div
                className="absolute top-0 bottom-0 z-20"
                style={{ left: `${nowPct}%` }}
              >
                <div className="absolute top-0 bottom-0 w-px bg-foreground/80" />
                <div className="absolute top-0 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-foreground" />
              </div>

              {/* Session rows */}
              {GROUPS.map(group => (
                <div key={group.name}>
                  <div className="h-7 bg-muted/40 border-b" />
                  {group.ids.map(id => {
                    const s = byId[id]
                    const leftPct  = toPct(s.startAt.getTime())
                    const widthPct = toPct(s.endAt.getTime()) - leftPct
                    return (
                      <div key={id} className="relative h-10 border-b flex items-center">
                        <div
                          className={cn(
                            'absolute h-5 rounded-full flex items-center px-2 overflow-hidden',
                            BAR_CLASS[s.status],
                          )}
                          style={{ left: `${leftPct}%`, width: `max(6px, ${widthPct}%)` }}
                        >
                          {widthPct > 2 && (
                            <span className="font-mono text-[10px] text-white/90 truncate leading-none select-none">
                              {s.vehicleId}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
