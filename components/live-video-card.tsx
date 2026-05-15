'use client'

import { useState, useEffect } from 'react'
import { Wifi } from 'lucide-react'

export function LiveVideoCard() {
  const [time, setTime] = useState('')

  useEffect(() => {
    function tick() {
      const now = new Date()
      const y  = now.getFullYear()
      const mo = String(now.getMonth() + 1).padStart(2, '0')
      const d  = String(now.getDate()).padStart(2, '0')
      const h  = now.getHours()
      const mi = String(now.getMinutes()).padStart(2, '0')
      const s  = String(now.getSeconds()).padStart(2, '0')
      const ampm = h >= 12 ? 'PM' : 'AM'
      const h12  = String(h % 12 || 12).padStart(2, '0')
      setTime(`${y}-${mo}-${d} ${h12}:${mi}:${s} ${ampm}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="rounded-3xl overflow-hidden border bg-zinc-950">
      {/* Camera feed */}
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: '16/9' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/live-footage-placeholder.webp"
          alt="Live camera feed"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Scan lines */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.06) 3px, rgba(0,0,0,0.06) 4px)',
        }} />

        {/* Vignette */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.5) 100%)',
        }} />

        {/* Ring logo */}
        <div className="absolute top-3 left-4 font-bold text-white text-lg tracking-wide" style={{ fontFamily: 'sans-serif', letterSpacing: '0.05em' }}>
          ring
        </div>

        {/* Timestamp */}
        <div className="absolute top-3 right-4 font-mono text-white text-xs opacity-90 tabular-nums">
          {time}
        </div>

        {/* LIVE badge */}
        <div className="absolute bottom-3 left-4 flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
          </span>
          <span className="font-mono text-xs text-white font-semibold tracking-widest">LIVE</span>
        </div>

        {/* Signal strength */}
        <div className="absolute bottom-3 right-4 flex items-center gap-1 text-white/60">
          <Wifi className="h-3 w-3" />
          <span className="font-mono text-[10px]">HD</span>
        </div>
      </div>

      {/* Info bar */}
      <div className="bg-zinc-900 px-5 py-4 flex items-start gap-6">
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-semibold">Depot North · Lot A Overhead</p>
          <p className="font-mono text-xs text-zinc-400 mt-0.5">CAM-03 · West LA 01 · Fixed wide-angle</p>
        </div>
      </div>
    </div>
  )
}
