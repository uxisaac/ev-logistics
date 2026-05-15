'use client'

import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { useCSSColor } from '@/lib/use-css-color'

const USAGE_DATA = [
  { hour: '12AM', pct: 47 },
  { hour: '1AM',  pct: 53 },
  { hour: '2AM',  pct: 68 },
  { hour: '3AM',  pct: 74 },
  { hour: '4AM',  pct: 79 },
  { hour: '5AM',  pct: 72 },
  { hour: '6AM',  pct: 58 },
  { hour: '7AM',  pct: 37 },
  { hour: '8AM',  pct: 21 },
  { hour: '9AM',  pct: 16 },
  { hour: '10AM', pct: 19 },
  { hour: '11AM', pct: 22 },
  { hour: '12PM', pct: 31 },
  { hour: '1PM',  pct: 38 },
  { hour: '2PM',  pct: 53 },
]

const peak    = USAGE_DATA.reduce((a, b) => (a.pct > b.pct ? a : b))
const avg     = Math.round(USAGE_DATA.reduce((sum, d) => sum + d.pct, 0) / USAGE_DATA.length)
const current = USAGE_DATA[USAGE_DATA.length - 1].pct

export function StationUsageChart() {
  const fgColor     = useCSSColor('--foreground',       'rgb(24, 24, 27)')
  const mutedColor  = useCSSColor('--muted-foreground', 'rgb(136, 136, 136)')
  const cardColor   = useCSSColor('--card',             'rgb(255, 255, 255)')
  const borderColor = useCSSColor('--border',           'rgb(229, 231, 235)')

  return (
    <div className="rounded-3xl border bg-card overflow-hidden">
      <div className="flex items-start justify-between border-b px-6 py-3">
        <div>
          <p className="text-2xl font-normal">Station Utilization</p>
          <p className="font-mono text-xs uppercase text-muted-foreground">Active charging sessions as % of total stalls · Today</p>
        </div>

        <div className="flex items-center divide-x rounded-md border">
          {[
            { label: 'Current', value: `${current}%` },
            { label: 'Avg / Hr', value: `${avg}%`    },
            { label: 'Peak',    value: peak.hour      },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col gap-0.5 px-4 py-2">
              <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
              <p className="font-mono text-sm tabular-nums">{value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="px-2 py-4">
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={USAGE_DATA} margin={{ top: 8, right: 24, bottom: 0, left: -8 }}>
            <defs>
              <linearGradient id="stationUsageGradient" x1="0" y1="0" x2="0" y2="1">
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
              formatter={(v) => [`${v}%`, 'Station utilization']}
              cursor={{ stroke: borderColor, strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="pct"
              stroke={fgColor}
              strokeWidth={2}
              fill="url(#stationUsageGradient)"
              dot={{ r: 3, fill: fgColor, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: fgColor, strokeWidth: 2, stroke: cardColor }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
