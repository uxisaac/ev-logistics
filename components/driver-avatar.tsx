function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w.replace(/\./g, '').charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

const PALETTE = [
  'bg-blue-500/20 text-blue-700',
  'bg-violet-500/20 text-violet-700',
  'bg-emerald-500/20 text-emerald-700',
  'bg-warning/20 text-warning',
  'bg-pink-500/20 text-pink-700',
  'bg-cyan-500/20 text-cyan-700',
]

function colorFor(name: string) {
  let hash = 0
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
  return PALETTE[Math.abs(hash) % PALETTE.length]
}

interface DriverAvatarProps {
  name: string
  size?: 'sm' | 'md'
}

export function DriverAvatar({ name, size = 'sm' }: DriverAvatarProps) {
  const dim = size === 'sm' ? 'h-6 w-6 text-xs' : 'h-9 w-9 text-sm'
  return (
    <div className={`${dim} ${colorFor(name)} flex shrink-0 items-center justify-center rounded-full font-mono font-medium`}>
      {initials(name)}
    </div>
  )
}
