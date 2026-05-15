'use client'

import { NavBar } from '@/components/nav-bar'

export default function LiveMapPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background pt-16">
      <NavBar activeNav="LIVE MAP" onNavChange={() => {}} />
      <main className="flex flex-1 items-center justify-center">
        <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">This page is empty</p>
      </main>
    </div>
  )
}
