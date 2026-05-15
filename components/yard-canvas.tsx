'use client'

import { useEffect, useRef, useState } from 'react'
import { Stage, Layer, Rect, Text, Group, Circle } from 'react-konva'
import type Konva from 'konva'
import { useCSSColor } from '@/lib/use-css-color'

const M = 24       // margin
const LW = 30      // row-label column width
const SW = 72      // stall width
const SH = 100     // stall height
const SG = 6       // stall gap
const RG = 48      // row gap (driveway)

const ROW_CONFIG = [
  { id: 'A', count: 4 },
  { id: 'B', count: 5 },
  { id: 'C', count: 10 },
]

const TOTAL_W = M + LW + 10 * (SW + SG) - SG + M
const TOTAL_H = M + 3 * SH + 2 * RG + M

export type StallStatus = 'charging' | 'queued' | 'complete' | 'fault' | 'empty' | 'assigned'

export interface Stall {
  id: string
  vehicleId?: string
  status: StallStatus
  batteryCurrent?: number
  rateKw?: number
  eta?: string
  assignedTime?: string
}

function stallPos(id: string): { x: number; y: number } {
  const [rowId, numStr] = id.split('-')
  const num = parseInt(numStr, 10) - 1
  const ri = ROW_CONFIG.findIndex(r => r.id === rowId)
  return { x: M + LW + num * (SW + SG), y: M + ri * (SH + RG) }
}

const INDICATOR: Record<StallStatus, [string, string]> = {
  charging: ['#16a34a', '#4ade80'],
  queued:   ['#2563eb', '#60a5fa'],
  complete: ['#0284c7', '#38bdf8'],
  fault:    ['#dc2626', '#f87171'],
  empty:    ['#d1d5db', '#3f3f46'],
  assigned: ['#f59e0b', '#fbbf24'],
}

const FILL: Record<StallStatus, [string, string]> = {
  charging: ['#f0fdf4', '#052e16'],
  queued:   ['#eff6ff', '#0c1445'],
  complete: ['#f0f9ff', '#082f49'],
  fault:    ['#fff1f2', '#450a0a'],
  empty:    ['#f9fafb', '#18181b'],
  assigned: ['#fffbeb', '#1c1407'],
}

function statusLine(s: Stall): string {
  if (s.status === 'charging') return `${s.batteryCurrent ?? '—'}% · ${s.rateKw ?? '—'}kW`
  if (s.status === 'queued')   return 'WAITING'
  if (s.status === 'complete') return 'DONE'
  if (s.status === 'fault')    return 'FAULT'
  return ''
}

export interface YardCanvasProps {
  stalls: Stall[]
  selectedStallId: string | null
  onSelectStall: (id: string | null) => void
  onClickEmptyStall?: (id: string) => void
  isDark: boolean
}

export function YardCanvas({ stalls, selectedStallId, onSelectStall, onClickEmptyStall, isDark }: YardCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<Konva.Stage | null>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })
  const fitted = useRef(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      setSize({ width: el.clientWidth, height: el.clientHeight })
    })
    ro.observe(el)
    setSize({ width: el.clientWidth, height: el.clientHeight })
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const stage = stageRef.current
    if (!stage || size.width === 0 || fitted.current) return
    fitted.current = true
    const s = Math.min(size.width / TOTAL_W, size.height / TOTAL_H) * 0.9
    stage.scale({ x: s, y: s })
    stage.position({ x: (size.width - TOTAL_W * s) / 2, y: (size.height - TOTAL_H * s) / 2 })
  }, [size])


  const cardColor = useCSSColor('--card', isDark ? '#0f0f14' : '#ffffff')

  const stallMap = new Map(stalls.map(s => [s.id, s]))
  const m = isDark ? 1 : 0

  const bg        = cardColor
  const roadFill  = isDark ? '#17171c' : '#e9eaec'
  const labelFill = isDark ? '#52525b' : '#a1a1aa'
  const textMain  = isDark ? '#fafafa' : '#09090b'
  const textSub   = isDark ? '#71717a' : '#71717a'
  const strokeDef = isDark ? '#27272a' : '#e4e4e7'
  const strokeSel = isDark ? '#fafafa' : '#09090b'

  return (
    <div ref={containerRef} className="h-full w-full">
      {size.width > 0 && (
        <Stage
          ref={stageRef}
          width={size.width}
          height={size.height}
          onClick={(e) => { if (e.target === e.target.getStage()) onSelectStall(null) }}
        >
          <Layer>
            {/* Background */}
            <Rect x={-9999} y={-9999} width={19998} height={19998} fill={bg} />

            {/* Driveways */}
            {[0, 1].map(i => (
              <Rect
                key={i}
                x={M + LW} y={M + (i + 1) * SH + i * RG}
                width={TOTAL_W - 2 * M - LW} height={RG}
                fill={roadFill}
              />
            ))}

            {/* Row labels */}
            {ROW_CONFIG.map((row, ri) => (
              <Text
                key={row.id}
                x={M} y={M + ri * (SH + RG) + SH / 2 - 8}
                text={row.id}
                fontSize={14} fontStyle="bold"
                fontFamily="NectoMono, monospace"
                fill={textMain}
              />
            ))}

            {/* Stalls */}
            {ROW_CONFIG.flatMap((row) =>
              Array.from({ length: row.count }, (_, si) => {
                const id = `${row.id}-${String(si + 1).padStart(2, '0')}`
                const stall = stallMap.get(id)
                const status = stall?.status ?? 'empty'
                const { x, y } = stallPos(id)
                const sel = selectedStallId === id
                const ind = INDICATOR[status][m]
                const fill = FILL[status][m]
                const sl = stall ? statusLine(stall) : ''
                const etaLine = (status === 'charging' && stall?.eta) ? `ETA ${stall.eta}` : ''

                return (
                  <Group
                    key={id}
                    onClick={(e) => {
                      e.cancelBubble = true
                      if (status === 'empty') onClickEmptyStall?.(id)
                      else onSelectStall(sel ? null : id)
                    }}
                    onMouseEnter={(e) => { const s = e.target.getStage(); if (s) s.container().style.cursor = 'pointer' }}
                    onMouseLeave={(e) => { const s = e.target.getStage(); if (s) s.container().style.cursor = 'default' }}
                  >
                    <Rect
                      x={x} y={y} width={SW} height={SH}
                      fill={fill}
                      stroke={sel ? strokeSel : strokeDef}
                      strokeWidth={sel ? 2 : 1}
                      cornerRadius={6}
                      shadowEnabled={sel}
                      shadowColor={isDark ? '#ffffff' : '#000000'}
                      shadowOpacity={0.12} shadowBlur={10} shadowOffsetY={2}
                    />
                    {/* Status bar */}
                    <Rect x={x} y={y} width={SW} height={5} fill={ind} cornerRadius={[6, 6, 0, 0]} />
                    {/* Status dot */}
                    <Circle x={x + SW - 12} y={y + 15} radius={4} fill={ind} />
                    {/* Stall ID */}
                    <Text x={x + 8} y={y + 11} text={id} fontSize={9} fontFamily="NectoMono, monospace" fill={textMain} letterSpacing={0.3} />
                    {/* Vehicle ID */}
                    {stall?.vehicleId && (
                      <Text x={x + 8} y={y + 27} text={stall.vehicleId} fontSize={11} fontStyle="bold" fontFamily="NectoMono, monospace" fill={textMain} />
                    )}
                    {/* Status line */}
                    {sl && (
                      <Text x={x + 8} y={y + 47} text={sl} fontSize={9} fontFamily="NectoMono, monospace" fill={textMain} letterSpacing={0.3} />
                    )}
                    {/* ETA */}
                    {etaLine && (
                      <Text x={x + 8} y={y + 63} text={etaLine} fontSize={9} fontFamily="NectoMono, monospace" fill={textMain} />
                    )}
                    {/* Assigned time */}
                    {status === 'assigned' && stall?.assignedTime && (
                      <Text x={x + 8} y={y + 47} text={`⏱ ${stall.assignedTime}`} fontSize={9} fontFamily="NectoMono, monospace" fill={textSub} letterSpacing={0.3} width={SW - 10} />
                    )}
                  </Group>
                )
              })
            )}
          </Layer>
        </Stage>
      )}
    </div>
  )
}
