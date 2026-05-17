'use client'

import { cn } from '@/lib/utils'

export interface SegmentTab<T extends string = string> {
  label: string
  value: T
  count?: number
}

interface SegmentTabsProps<T extends string = string> {
  tabs: SegmentTab<T>[]
  active: T
  onChange: (value: T) => void
  className?: string
}

export function SegmentTabs<T extends string = string>({
  tabs,
  active,
  onChange,
  className,
}: SegmentTabsProps<T>) {
  return (
    <div className={cn('flex gap-1 rounded-full bg-muted p-1 w-full', className)}>
      {tabs.map(tab => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={cn(
            'flex-1 rounded-full px-4 py-1.5 font-mono text-xs uppercase tracking-widest whitespace-nowrap transition-colors',
            active === tab.value
              ? 'bg-card text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {tab.count !== undefined ? `${tab.label} ${tab.count}` : tab.label}
        </button>
      ))}
    </div>
  )
}
