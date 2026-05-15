'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

function useCountUp(target: number, duration = 1000) {
  const [count, setCount] = useState(0)
  const raf = useRef<number | null>(null)

  useEffect(() => {
    const start = performance.now()
    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1)
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.round(eased * target))
      if (progress < 1) raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => { if (raf.current !== null) cancelAnimationFrame(raf.current) }
  }, [target, duration])

  return count
}

interface StatCardProps {
  label: string
  value: number | string
  note: string
  icon: ReactNode
  critical?: boolean
}

export function StatCard({ label, value, note, icon, critical }: StatCardProps) {
  const count = useCountUp(typeof value === 'number' ? value : 0)
  const display = typeof value === 'number' ? count : value

  return (
    <div className="flex flex-1 min-w-0 flex-col gap-3 overflow-hidden rounded-3xl border bg-card p-4">
      <div className="flex w-full items-start gap-2.5">
        <div className="flex flex-1 min-w-0 flex-col gap-2.25">
          <p className="text-base leading-normal tracking-[0.01em] opacity-70 text-card-foreground">
            {label}
          </p>
          <p className={cn(
            'font-mono text-3xl leading-none tabular-nums',
            critical ? 'text-destructive' : 'text-card-foreground',
          )}>
            {display}
          </p>
        </div>
        <div className="flex shrink-0 items-center rounded-full border-[0.5px] border-border p-2.5 text-card-foreground">
          {icon}
        </div>
      </div>
      <p className="font-mono text-xs uppercase leading-normal tracking-[0.06em] opacity-60 text-card-foreground">
        {note}
      </p>
    </div>
  )
}
