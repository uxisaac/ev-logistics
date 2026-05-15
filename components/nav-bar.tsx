'use client'

import { useEffect, useRef, useState } from 'react'
import { Search, Bus, BatteryCharging, Map as MapIcon, Route, Settings, LayoutDashboard, Zap, Sun, Moon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useRouter, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'

const NAV_ITEMS = [
  'DASHBOARD',
  'CHARGING',
  'LIVE MAP',
  'ROUTES',
  'VEHICLES',
  'SETTINGS',
] as const

const NAV_ROUTES: Partial<Record<NavItem, string>> = {
  'DASHBOARD': '/',
  'LIVE MAP':  '/live-map',
  'ROUTES':    '/routes',
  'CHARGING':  '/charging',
  'VEHICLES':  '/vehicles',
  'SETTINGS':  '/settings',
}

export type NavItem = (typeof NAV_ITEMS)[number]

interface NavBarProps {
  activeNav: NavItem
  onNavChange: (item: NavItem) => void
  onSelectVehicle?: (vehicleId: string) => void
}

const NAV_ICONS: Record<NavItem, React.ReactNode> = {
  'DASHBOARD': <LayoutDashboard className="h-4 w-4" />,
  'LIVE MAP': <MapIcon className="h-4 w-4" />,
  'ROUTES': <Route className="h-4 w-4" />,
  'CHARGING': <BatteryCharging className="h-4 w-4" />,
  'VEHICLES': <Bus className="h-4 w-4" />,
  'SETTINGS': <Settings className="h-4 w-4" />,
}

const QUICK_VEHICLES = [
  { id: 'VH-0041', model: 'Ford E-Transit', status: 'Critical' },
  { id: 'VH-0089', model: 'BYD eBus-12', status: 'Critical' },
  { id: 'VH-0023', model: 'Mercedes eSprinter', status: 'Warning' },
  { id: 'VH-0067', model: 'Rivian EDV', status: 'Warning' },
]

export function NavBar({ activeNav, onNavChange, onSelectVehicle }: NavBarProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const router = useRouter()
  const pathname = usePathname()

  const activeFromPath: NavItem =
    pathname === '/'         ? 'DASHBOARD' :
    pathname === '/charging' ? 'CHARGING'  :
    pathname === '/live-map' ? 'LIVE MAP'  :
    pathname === '/routes'   ? 'ROUTES'    :
    pathname === '/vehicles' ? 'VEHICLES'  :
    pathname === '/settings' ? 'SETTINGS'  :
    activeNav
  const navRef = useRef<HTMLDivElement>(null)
  const buttonRefs = useRef<Map<NavItem, HTMLButtonElement>>(new Map())
  const [pill, setPill] = useState<{ right: number; width: number } | null>(null)
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    function measure() {
      const btn = buttonRefs.current.get(activeFromPath)
      const nav = navRef.current
      if (!btn || !nav) return
      const navRight = nav.getBoundingClientRect().right
      const btnRect = btn.getBoundingClientRect()
      setPill({ right: navRight - btnRect.right, width: btnRect.width })
    }
    measure()
    const observer = new ResizeObserver(measure)
    if (navRef.current) observer.observe(navRef.current)
    return () => observer.disconnect()
  }, [activeFromPath])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setOpen(prev => !prev)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 flex h-16 shrink-0 items-stretch border-b border-sidebar-border bg-sidebar">
        {/* Logo box */}
        <button onClick={() => router.push('/')} className="flex w-16 shrink-0 items-center justify-center border-r border-sidebar-border hover:bg-muted/40 transition-colors">
          <svg width="19" height="30" viewBox="0 0 19 30" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-foreground">
            <path d="M0.347333 6.65715H0V12.2723H6.83081C7.46758 12.2723 7.69913 13.1406 7.12025 13.4301L5.78883 14.0669C3.99429 14.9352 2.19976 15.3983 0.347333 15.3983H0V21.0134H6.65715C7.29392 21.0134 7.52548 21.8818 6.94659 22.1712L5.55728 22.808C3.87852 23.6184 2.08398 24.0236 0.347333 24.0236H0V29.6388H6.65715L7.40969 28.7126C10.6514 24.9499 14.4142 22.9817 18.3506 22.9817H18.64V17.3665H11.9829C11.3461 17.3665 11.1145 16.4982 11.6934 16.2087L13.0828 15.572C14.7615 14.7615 16.5561 14.3563 18.2927 14.3563H18.5821V8.74113H11.8092C11.1724 8.74113 10.9409 7.87281 11.5198 7.58337L12.8512 6.94659C14.6457 6.07827 16.4403 5.61517 18.2927 5.61517H18.5821V0H11.925L11.1724 0.926216C8.04646 4.68895 4.22585 6.65715 0.347333 6.65715Z" fill="currentColor" />
          </svg>
        </button>

        {/* Search box */}
        <button
          onClick={() => setOpen(true)}
          className="flex w-72 shrink-0 items-center gap-3 border-r border-sidebar-border px-4 text-left hover:bg-muted/40 transition-colors"
        >
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
          <span className="flex-1 font-mono text-xs uppercase tracking-widest text-muted-foreground">Search</span>
          <kbd className="hidden sm:flex items-center gap-0.5 rounded border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">
            <span>⌘</span><span>K</span>
          </kbd>
        </button>

        {/* Nav pills */}
        <nav ref={navRef} className="relative flex flex-1 items-center justify-end gap-4 px-4 pr-4">
          <span
            className="pointer-events-none absolute top-1/2 -translate-y-1/2 rounded-full bg-sidebar-primary"
            style={{
              right: pill?.right ?? 0,
              width: pill?.width ?? 0,
              height: 32,
              opacity: pill ? 1 : 0,
              transition: 'opacity 200ms ease',
            }}
          />
          {NAV_ITEMS.map((item) => (
            <button
              key={item}
              ref={(el) => {
                if (el) buttonRefs.current.set(item, el)
                else buttonRefs.current.delete(item)
              }}
              onClick={() => {
                const route = NAV_ROUTES[item]
                if (route) router.push(route)
                else onNavChange(item)
              }}
              className={cn(
                'relative z-10 rounded-full px-3.5 py-2 font-mono text-xs uppercase whitespace-nowrap transition-colors duration-200',
                activeFromPath === item
                  ? 'text-primary-foreground'
                  : 'text-sidebar-foreground hover:text-foreground',
              )}
            >
              {item}
            </button>
          ))}
        </nav>

        {/* Theme toggle */}
        <div className="flex w-16 shrink-0 items-center justify-center border-l border-sidebar-border">
          <button
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {mounted && resolvedTheme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>

        {/* Profile */}
        <div className="flex w-16 shrink-0 items-center justify-center border-l border-sidebar-border">
          <div className="h-8 w-8 overflow-hidden rounded-full bg-muted">
            <img
              src="https://i.pravatar.cc/64?u=dispatcher"
              alt="Profile"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </header>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command>
        <CommandInput placeholder="Search vehicles, routes, alerts…" />
        <CommandList>
          <CommandEmpty>No results found.</CommandEmpty>
          <CommandGroup heading="Navigation">
            {NAV_ITEMS.map((item) => (
              <CommandItem
                key={item}
                onSelect={() => {
                  const route = NAV_ROUTES[item]
                  if (route) router.push(route)
                  else onNavChange(item)
                  setOpen(false)
                }}
              >
                {NAV_ICONS[item]}
                <span className="font-mono text-xs uppercase tracking-widest">{item}</span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Vehicles with Alerts">
            {QUICK_VEHICLES.map((v) => (
              <CommandItem key={v.id} onSelect={() => { onSelectVehicle?.(v.id); setOpen(false) }}>
                <Bus className="h-4 w-4" />
                <span className="font-medium">{v.id}</span>
                <span className="text-muted-foreground">{v.model}</span>
                <span className={cn(
                  'ml-auto font-mono text-xs uppercase',
                  v.status === 'Critical' ? 'text-destructive' : 'text-warning',
                )}>
                  {v.status}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Quick Actions">
            <CommandItem onSelect={() => setOpen(false)}>
              <Zap className="h-4 w-4" />
              <span>Assign nearest charger</span>
            </CommandItem>
            <CommandItem onSelect={() => setOpen(false)}>
              <BatteryCharging className="h-4 w-4" />
              <span>View charging queue</span>
            </CommandItem>
          </CommandGroup>
        </CommandList>
        </Command>
      </CommandDialog>
    </>
  )
}
