'use client'

import { useState } from 'react'
import { NavBar } from '@/components/nav-bar'
import { Card, CardContent } from '@/components/ui/card'
import {
  Bus, BatteryCharging, Users, Route, Bell, Plug, Shield, Building2,
  ChevronLeft, ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ── Primitives ────────────────────────────────────────────────────────────────

function Toggle({ defaultEnabled = false }: { defaultEnabled?: boolean }) {
  const [on, setOn] = useState(defaultEnabled)
  return (
    <button
      type="button"
      onClick={() => setOn(!on)}
      className={cn(
        'relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200',
        on ? 'bg-primary' : 'bg-muted-foreground/30',
      )}
    >
      <span className={cn(
        'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200',
        on ? 'translate-x-4' : 'translate-x-0',
      )} />
    </button>
  )
}

function StyledSelect({ options, defaultValue }: { options: string[]; defaultValue?: string }) {
  return (
    <select
      defaultValue={defaultValue ?? options[0]}
      className="rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
    >
      {options.map(o => <option key={o}>{o}</option>)}
    </select>
  )
}

function StyledInput({ placeholder, defaultValue, type = 'text' }: {
  placeholder?: string; defaultValue?: string; type?: string
}) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      defaultValue={defaultValue}
      className="w-44 rounded-md border border-input bg-background px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
    />
  )
}

function SettingRow({ label, description, control }: {
  label: string; description?: string; control: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-8 border-b border-border py-4 last:border-0">
      <div>
        <p className="text-lg font-medium">{label}</p>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  )
}

function SettingGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <h3 className="mb-3 font-mono text-xs uppercase tracking-widest text-muted-foreground">{title}</h3>
      <div className="rounded-xl border border-border bg-card px-4">{children}</div>
    </div>
  )
}

// ── Hub data ──────────────────────────────────────────────────────────────────

type HubSection = {
  id: string
  label: string
  description: string
  icon: React.ElementType
  subs: string[]
}

const HUB_SECTIONS: HubSection[] = [
  {
    id: 'fleet',
    label: 'Fleet Config',
    description: 'Vehicle types, depot locations, and capacity limits',
    icon: Bus,
    subs: ['Vehicle Types', 'Depots', 'Capacity'],
  },
  {
    id: 'charging',
    label: 'Charging',
    description: 'Charging schedules, battery thresholds, and station assignments',
    icon: BatteryCharging,
    subs: ['Schedule', 'Thresholds', 'Stations'],
  },
  {
    id: 'drivers',
    label: 'Drivers',
    description: 'Driver profiles, certifications, and shift settings',
    icon: Users,
    subs: ['Assignments', 'Certifications', 'Shifts'],
  },
  {
    id: 'routes',
    label: 'Routes',
    description: 'Route policies, geofencing, and speed limits',
    icon: Route,
    subs: ['Policies', 'Geofencing', 'Speed'],
  },
  {
    id: 'notifications',
    label: 'Notifications',
    description: 'Alert thresholds, notification channels, and escalations',
    icon: Bell,
    subs: ['Alerts', 'Channels', 'Escalations'],
  },
  {
    id: 'integrations',
    label: 'Integrations',
    description: 'API keys, webhooks, and third-party connections',
    icon: Plug,
    subs: ['API Keys', 'Webhooks', 'Third-party'],
  },
  {
    id: 'team',
    label: 'Team',
    description: 'Members, roles, and access permissions',
    icon: Shield,
    subs: ['Members', 'Roles', 'Permissions'],
  },
  {
    id: 'account',
    label: 'Account',
    description: 'Company information, billing, and your profile',
    icon: Building2,
    subs: ['Company', 'Billing', 'Profile'],
  },
]

// ── Section content ───────────────────────────────────────────────────────────

function FleetContent({ sub }: { sub: string }) {
  if (sub === 'Vehicle Types') return (
    <>
      <SettingGroup title="Defaults">
        <SettingRow label="Default vehicle type" description="Applied when adding new vehicles without a specified type" control={<StyledSelect options={['eBus-12', 'E-Transit', 'eSprinter', 'EDV']} defaultValue="eBus-12" />} />
        <SettingRow label="Show retired vehicles" description="Display decommissioned vehicles in the fleet list" control={<Toggle />} />
        <SettingRow label="Auto-detect vehicle model" description="Use VIN to automatically identify model on registration" control={<Toggle defaultEnabled />} />
      </SettingGroup>
      <SettingGroup title="Display">
        <SettingRow label="Group vehicles by type" description="Organize the vehicle list by model category" control={<Toggle defaultEnabled />} />
        <SettingRow label="Show battery percentage" description="Display live battery % next to each vehicle" control={<Toggle defaultEnabled />} />
      </SettingGroup>
    </>
  )
  if (sub === 'Depots') return (
    <>
      <SettingGroup title="Locations">
        <SettingRow label="Primary depot" description="Main base of operations" control={<StyledInput defaultValue="Oakland Terminal A" />} />
        <SettingRow label="Secondary depot" description="Backup or overflow depot" control={<StyledInput defaultValue="Richmond Yard B" />} />
        <SettingRow label="Home depot radius" description="Distance threshold for 'at depot' status" control={
          <div className="flex items-center gap-2">
            <StyledInput defaultValue="200" type="number" />
            <span className="text-xs text-muted-foreground">m</span>
          </div>
        } />
      </SettingGroup>
      <SettingGroup title="Behavior">
        <SettingRow label="Auto-return to depot" description="Flag vehicles that haven't returned after shift end" control={<Toggle defaultEnabled />} />
        <SettingRow label="Depot arrival notifications" description="Alert when a vehicle reaches the depot" control={<Toggle />} />
      </SettingGroup>
    </>
  )
  return (
    <SettingGroup title="Limits">
      <SettingRow label="Max passenger capacity" description="Default max passengers across the fleet" control={
        <div className="flex items-center gap-2">
          <StyledInput defaultValue="40" type="number" />
          <span className="text-xs text-muted-foreground">seats</span>
        </div>
      } />
      <SettingRow label="Cargo weight limit" description="Maximum cargo per vehicle" control={
        <div className="flex items-center gap-2">
          <StyledInput defaultValue="1500" type="number" />
          <span className="text-xs text-muted-foreground">kg</span>
        </div>
      } />
      <SettingRow label="Enforce capacity limits" description="Block route assignments over vehicle capacity" control={<Toggle defaultEnabled />} />
    </SettingGroup>
  )
}

function ChargingContent({ sub }: { sub: string }) {
  if (sub === 'Schedule') return (
    <>
      <SettingGroup title="Charging Windows">
        <SettingRow label="Prefer off-peak charging" description="Prioritize charging during lower-cost overnight hours" control={<Toggle defaultEnabled />} />
        <SettingRow label="Peak hours start" description="Start of high-rate electricity period" control={<StyledSelect options={['6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM']} defaultValue="7:00 AM" />} />
        <SettingRow label="Peak hours end" description="End of high-rate electricity period" control={<StyledSelect options={['4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM']} defaultValue="6:00 PM" />} />
      </SettingGroup>
      <SettingGroup title="Automation">
        <SettingRow label="Auto-start on plug-in" description="Begin charging immediately when a vehicle is connected" control={<Toggle defaultEnabled />} />
        <SettingRow label="Smart charging queue" description="Prioritize vehicles with the lowest battery or earliest route" control={<Toggle defaultEnabled />} />
        <SettingRow label="Stop at target SOC" description="Stop charging once the target state of charge is reached" control={<Toggle defaultEnabled />} />
      </SettingGroup>
    </>
  )
  if (sub === 'Thresholds') return (
    <>
      <SettingGroup title="Battery Alerts">
        <SettingRow label="Low battery warning" description="Trigger a warning alert below this charge level" control={
          <div className="flex items-center gap-2">
            <StyledInput defaultValue="25" type="number" />
            <span className="text-xs text-muted-foreground">%</span>
          </div>
        } />
        <SettingRow label="Critical battery alert" description="Trigger a critical alert and auto-reroute below this level" control={
          <div className="flex items-center gap-2">
            <StyledInput defaultValue="10" type="number" />
            <span className="text-xs text-muted-foreground">%</span>
          </div>
        } />
        <SettingRow label="Charge target (SOC)" description="Stop charging when this level is reached" control={
          <div className="flex items-center gap-2">
            <StyledInput defaultValue="90" type="number" />
            <span className="text-xs text-muted-foreground">%</span>
          </div>
        } />
      </SettingGroup>
      <SettingGroup title="Health">
        <SettingRow label="Degradation alert threshold" description="Alert when battery capacity drops below this level" control={
          <div className="flex items-center gap-2">
            <StyledInput defaultValue="80" type="number" />
            <span className="text-xs text-muted-foreground">%</span>
          </div>
        } />
        <SettingRow label="Track charge cycles" description="Log charge cycles per vehicle for battery health monitoring" control={<Toggle defaultEnabled />} />
      </SettingGroup>
    </>
  )
  return (
    <>
      <SettingGroup title="Assignment">
        <SettingRow label="Auto-assign nearest station" description="Automatically route vehicles to the closest available charger" control={<Toggle defaultEnabled />} />
        <SettingRow label="Preferred station" description="Default station when multiple are available" control={<StyledSelect options={['Station A — Bay 1', 'Station B — Bay 3', 'Station C — Bay 2']} />} />
        <SettingRow label="Reserve station on low battery" description="Lock a charging bay when a vehicle hits the critical threshold" control={<Toggle defaultEnabled />} />
      </SettingGroup>
      <SettingGroup title="Reporting">
        <SettingRow label="Log energy consumption" description="Record kWh per session for cost and emissions reporting" control={<Toggle defaultEnabled />} />
        <SettingRow label="CO₂ savings reporting" description="Calculate and display emissions offset per charge session" control={<Toggle defaultEnabled />} />
      </SettingGroup>
    </>
  )
}

function NotificationsContent({ sub }: { sub: string }) {
  if (sub === 'Alerts') return (
    <>
      <SettingGroup title="Vehicle Alerts">
        <SettingRow label="Low battery" description="Alert when a vehicle drops below the warning threshold" control={<Toggle defaultEnabled />} />
        <SettingRow label="Critical battery" description="Urgent alert when a vehicle nears depletion" control={<Toggle defaultEnabled />} />
        <SettingRow label="Vehicle offline" description="Alert when a vehicle stops reporting telemetry" control={<Toggle defaultEnabled />} />
        <SettingRow label="Charging complete" description="Notify when a vehicle reaches its charge target" control={<Toggle />} />
      </SettingGroup>
      <SettingGroup title="Route Alerts">
        <SettingRow label="Route deviation" description="Alert when a vehicle goes off its assigned route" control={<Toggle defaultEnabled />} />
        <SettingRow label="Delayed arrival" description="Alert when estimated arrival exceeds schedule by 10+ min" control={<Toggle defaultEnabled />} />
        <SettingRow label="Geofence breach" description="Alert when a vehicle exits a designated zone" control={<Toggle />} />
      </SettingGroup>
    </>
  )
  if (sub === 'Channels') return (
    <>
      <SettingGroup title="Delivery Methods">
        <SettingRow label="In-app notifications" description="Show alerts in the dashboard notification center" control={<Toggle defaultEnabled />} />
        <SettingRow label="Email notifications" description="Send alert emails to your account address" control={<Toggle defaultEnabled />} />
        <SettingRow label="SMS notifications" description="Send text alerts to your registered phone number" control={<Toggle />} />
        <SettingRow label="Push notifications" description="Browser push alerts when the dashboard is not open" control={<Toggle />} />
      </SettingGroup>
      <SettingGroup title="Email">
        <SettingRow label="Notification email" description="Address to receive all alert emails" control={<StyledInput defaultValue="dispatch@fleetco.io" type="email" />} />
        <SettingRow label="CC managers on critical alerts" description="Also send critical alerts to all managers on the team" control={<Toggle defaultEnabled />} />
      </SettingGroup>
    </>
  )
  return (
    <>
      <SettingGroup title="Escalation Rules">
        <SettingRow label="Auto-escalate unacknowledged alerts" description="Escalate to a manager if an alert isn't acknowledged within the delay period" control={<Toggle defaultEnabled />} />
        <SettingRow label="Escalation delay" description="How long before an unacknowledged alert is escalated" control={<StyledSelect options={['5 minutes', '10 minutes', '15 minutes', '30 minutes']} defaultValue="10 minutes" />} />
        <SettingRow label="Escalation target" description="Who receives escalated alerts" control={<StyledSelect options={['Fleet Manager', 'Operations Lead', 'On-call Supervisor']} />} />
      </SettingGroup>
      <SettingGroup title="Quiet Hours">
        <SettingRow label="Enable quiet hours" description="Suppress non-critical alerts during specified hours" control={<Toggle />} />
        <SettingRow label="Quiet hours start" control={<StyledSelect options={['9:00 PM', '10:00 PM', '11:00 PM']} />} />
        <SettingRow label="Quiet hours end" control={<StyledSelect options={['6:00 AM', '7:00 AM', '8:00 AM']} />} />
      </SettingGroup>
    </>
  )
}

function AccountContent({ sub }: { sub: string }) {
  if (sub === 'Company') return (
    <>
      <SettingGroup title="Organization">
        <SettingRow label="Company name" control={<StyledInput defaultValue="FleetCo EV Logistics" />} />
        <SettingRow label="Industry" control={<StyledSelect options={['EV Logistics', 'Public Transit', 'Last-mile Delivery', 'Ride Share']} />} />
        <SettingRow label="Fleet size" control={<StyledSelect options={['1–25 vehicles', '26–100 vehicles', '101–500 vehicles', '500+ vehicles']} defaultValue="26–100 vehicles" />} />
      </SettingGroup>
      <SettingGroup title="Locale">
        <SettingRow label="Timezone" control={<StyledSelect options={['UTC−8 Pacific', 'UTC−7 Mountain', 'UTC−6 Central', 'UTC−5 Eastern']} defaultValue="UTC−8 Pacific" />} />
        <SettingRow label="Distance unit" control={<StyledSelect options={['Miles', 'Kilometers']} />} />
        <SettingRow label="Energy unit" control={<StyledSelect options={['kWh', 'MWh']} />} />
      </SettingGroup>
    </>
  )
  if (sub === 'Billing') return (
    <>
      <SettingGroup title="Plan">
        <SettingRow label="Current plan" description="Your active subscription tier" control={
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 font-mono text-xs uppercase tracking-widest text-primary">Pro</span>
            <button className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors">Upgrade</button>
          </div>
        } />
        <SettingRow label="Billing cycle" control={<StyledSelect options={['Monthly', 'Annual (save 20%)']} defaultValue="Annual (save 20%)" />} />
        <SettingRow label="Next billing date" description="Your subscription renews automatically" control={<span className="text-sm text-muted-foreground">Jun 1, 2026</span>} />
      </SettingGroup>
      <SettingGroup title="Payment">
        <SettingRow label="Payment method" description="Visa ending in 4242" control={<button className="text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors">Update</button>} />
        <SettingRow label="Billing email" control={<StyledInput defaultValue="billing@fleetco.io" type="email" />} />
      </SettingGroup>
    </>
  )
  return (
    <>
      <SettingGroup title="Personal Info">
        <SettingRow label="Full name" control={<StyledInput defaultValue="Alex Chen" />} />
        <SettingRow label="Email" control={<StyledInput defaultValue="alex@fleetco.io" type="email" />} />
        <SettingRow label="Role" control={<span className="text-sm text-muted-foreground">Fleet Dispatcher</span>} />
      </SettingGroup>
      <SettingGroup title="Security">
        <SettingRow label="Password" description="Last changed 3 months ago" control={<button className="rounded-md border border-input bg-background px-3 py-1.5 text-xs hover:bg-muted transition-colors">Change password</button>} />
        <SettingRow label="Two-factor authentication" description="Add an extra layer of security to your account" control={<Toggle />} />
        <SettingRow label="Session timeout" description="Automatically log out after inactivity" control={<StyledSelect options={['30 minutes', '1 hour', '4 hours', '8 hours']} defaultValue="4 hours" />} />
      </SettingGroup>
      <SettingGroup title="Danger Zone">
        <SettingRow label="Delete account" description="Permanently remove your account and all data" control={<button className="rounded-md border border-destructive/30 px-3 py-1.5 text-xs text-destructive hover:bg-destructive/5 transition-colors">Delete account</button>} />
      </SettingGroup>
    </>
  )
}

function PlaceholderContent({ sectionLabel, sub }: { sectionLabel: string; sub: string }) {
  return (
    <SettingGroup title={sub}>
      <SettingRow
        label={`${sectionLabel} › ${sub}`}
        description="Settings for this section will appear here."
        control={<span className="font-mono text-xs text-muted-foreground">—</span>}
      />
    </SettingGroup>
  )
}

function SectionContent({ section, sub }: { section: HubSection; sub: string }) {
  if (section.id === 'fleet') return <FleetContent sub={sub} />
  if (section.id === 'charging') return <ChargingContent sub={sub} />
  if (section.id === 'notifications') return <NotificationsContent sub={sub} />
  if (section.id === 'account') return <AccountContent sub={sub} />
  return <PlaceholderContent sectionLabel={section.label} sub={sub} />
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<HubSection | null>(null)
  const [activeSub, setActiveSub] = useState('')

  function openSection(s: HubSection) {
    setActiveSection(s)
    setActiveSub(s.subs[0])
  }

  const SectionIcon = activeSection?.icon

  return (
    <div className="flex min-h-screen flex-col bg-background pt-16">
      <NavBar activeNav="SETTINGS" onNavChange={() => {}} />

      <main className="flex flex-1 flex-col">
        {!activeSection ? (
          <div key="hub" className="mx-auto w-full max-w-5xl px-6 py-12 animate-in fade-in duration-300">
            <div className="mb-10">
              <h1 className="text-2xl font-medium">Settings</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Manage your fleet configuration, alerts, and account preferences.
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {HUB_SECTIONS.map((s) => {
                const Icon = s.icon
                return (
                  <button key={s.id} onClick={() => openSection(s)} className="group text-left">
                    <Card className="h-full transition-all duration-150 hover:ring-primary/40 group-hover:bg-muted/30">
                      <CardContent className="flex flex-col gap-3 pt-2">
                        <div className="flex items-center justify-between">
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
                            <Icon className="h-4 w-4" />
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground/50 transition-transform group-hover:translate-x-0.5" />
                        </div>
                        <div>
                          <p className="text-lg font-medium">{s.label}</p>
                          <p className="mt-0.5 text-base leading-relaxed text-muted-foreground">{s.description}</p>
                        </div>
                      </CardContent>
                    </Card>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <div key="section" className="mx-auto w-full max-w-5xl px-6 py-10 animate-in fade-in duration-300">
            <button
              onClick={() => setActiveSection(null)}
              className="mb-8 flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              <span className="font-mono uppercase tracking-widest">Settings</span>
            </button>

            <div className="flex gap-12">
              <aside className="w-44 shrink-0">
                <div className="mb-6 flex items-center gap-2.5">
                  {SectionIcon && <SectionIcon className="h-4 w-4 text-muted-foreground" />}
                  <h2 className="text-base font-medium">{activeSection.label}</h2>
                </div>
                <nav className="flex flex-col gap-0.5">
                  {activeSection.subs.map(sub => (
                    <button
                      key={sub}
                      onClick={() => setActiveSub(sub)}
                      className={cn(
                        'rounded-md px-3 py-2 text-left text-sm transition-colors',
                        activeSub === sub
                          ? 'bg-muted font-medium text-foreground text-base'
                          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground text-base',
                      )}
                    >
                      {sub}
                    </button>
                  ))}
                </nav>
              </aside>

              <div className="min-w-0 flex-1">
                <h2 className="mb-6 text-2xl font-medium">{activeSub}</h2>
                <SectionContent section={activeSection} sub={activeSub} />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
