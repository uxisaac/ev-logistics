'use client'

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useCSSColor } from '@/lib/use-css-color'

const SHIFT_DATA = [
  { hour: '5AM',  avg: 91 },
  { hour: '6AM',  avg: 83 },
  { hour: '7AM',  avg: 74 },
  { hour: '8AM',  avg: 67 },
  { hour: '9AM',  avg: 59 },
  { hour: '10AM', avg: 52 },
  { hour: '11AM', avg: 61 },
  { hour: '12PM', avg: 57 },
  { hour: '1PM',  avg: 49 },
  { hour: '2PM',  avg: 43 },
  { hour: '3PM',  avg: 38 },
]

const lowest = SHIFT_DATA.reduce((a, b) => (a.avg < b.avg ? a : b))
const avg = Math.round(SHIFT_DATA.reduce((sum, d) => sum + d.avg, 0) / SHIFT_DATA.length)
const current = SHIFT_DATA[SHIFT_DATA.length - 1].avg

export function FleetIdleChart() {
  const fgColor     = useCSSColor('--foreground',       'rgb(24, 24, 27)')
  const mutedColor  = useCSSColor('--muted-foreground', 'rgb(136, 136, 136)')
  const cardColor   = useCSSColor('--card',             'rgb(255, 255, 255)')
  const borderColor = useCSSColor('--border',           'rgb(229, 231, 235)')

  return (
    <div className="rounded-3xl border bg-card overflow-hidden">
      {/* Header */}
      <div className="flex items-start justify-between border-b px-6 py-3">
        <div>
          <p className="text-2xl font-normal">Fleet Charge Level</p>
          <p className="font-mono text-xs uppercase text-muted-foreground">Average battery across all vehicles · Today's shift</p>
        </div>

        {/* Summary stats */}
        <div className="flex items-center divide-x rounded-md border">
          {[
            { label: 'Current',   value: `${current}%` },
            { label: 'Avg / Hr',  value: `${avg}%` },
            { label: 'Low Hour',  value: lowest.hour },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-0.5 px-4 py-2">
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
              <p className="font-mono text-sm tabular-nums">{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Chart */}
      <div className="px-2 py-4">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={SHIFT_DATA} margin={{ top: 8, right: 24, bottom: 0, left: -8 }}>
            <defs>
              <linearGradient id="fleetChargeGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={fgColor} stopOpacity={0.12} />
                <stop offset="100%" stopColor={fgColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={borderColor} strokeDasharray="4 4" vertical={false} />
            <XAxis
              dataKey="hour"
              tick={{ fontSize: 10, fill: mutedColor, fontFamily: 'NectoMono, monospace' }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: mutedColor, fontFamily: 'NectoMono, monospace' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
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
              formatter={(v: number) => [`${v}%`, 'Fleet avg charge']}
              cursor={{ stroke: borderColor, strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="avg"
              stroke={fgColor}
              strokeWidth={2}
              fill="url(#fleetChargeGradient)"
              dot={{ r: 3, fill: fgColor, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: fgColor, strokeWidth: 2, stroke: cardColor }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
