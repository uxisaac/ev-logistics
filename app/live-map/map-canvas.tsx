'use client'

import { useRef, useEffect } from 'react'
import Map, { Marker, NavigationControl, AttributionControl, type MapRef } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import { ALERTS } from '@/lib/fleet-data'

const MAP_STYLE_LIGHT = 'https://tiles.openfreemap.org/styles/positron'
const MAP_STYLE_DARK = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'

export interface MapCanvasProps {
  selectedId: string | null
  onSelect: (id: string) => void
  onMapClick?: () => void
  drawerOpen?: boolean
}

export function MapCanvas({ selectedId, onSelect, onMapClick, drawerOpen = false }: MapCanvasProps) {
  const mapRef = useRef<MapRef>(null)
  const { resolvedTheme } = useTheme()
  const mapStyle = resolvedTheme === 'dark' ? MAP_STYLE_DARK : MAP_STYLE_LIGHT

  useEffect(() => {
    if (!selectedId || !mapRef.current) return
    const alert = ALERTS.find(a => a.id === selectedId)
    if (!alert) return
    mapRef.current.flyTo({
      center: alert.coordinates,
      zoom: 13,
      duration: 800,
      padding: drawerOpen
        ? { top: 0, bottom: 0, left: 0, right: 544 }
        : { top: 0, bottom: 0, left: 0, right: 0 },
    })
  }, [selectedId, drawerOpen])

  return (
    <Map
      ref={mapRef}
      initialViewState={{ longitude: -122.33, latitude: 37.75, zoom: 10 }}
      style={{ width: '100%', height: '100%' }}
      mapStyle={mapStyle}
      attributionControl={false}
      onClick={onMapClick}
    >
      <NavigationControl position="top-right" showCompass={false} />
      <AttributionControl compact position="bottom-right" />

      {ALERTS.map(alert => (
        <Marker
          key={alert.id}
          longitude={alert.coordinates[0]}
          latitude={alert.coordinates[1]}
          anchor="bottom"
          onClick={e => {
            e.originalEvent.stopPropagation()
            onSelect(alert.id)
          }}
        >
          <div className="flex cursor-pointer flex-col items-center gap-0.5">
            <div className={cn(
              'select-none rounded-md px-2 py-0.5 font-mono text-xs font-bold text-white shadow-sm transition-all',
              selectedId === alert.id && 'scale-110 ring-2 ring-white ring-offset-1',
              alert.severity === 'critical' ? 'bg-red-600' : 'bg-orange-500',
            )}>
              {alert.vehicleId}
            </div>
            <div className={cn(
              'h-2 w-2 rounded-full',
              alert.severity === 'critical' ? 'bg-red-600' : 'bg-orange-500',
            )} />
          </div>
        </Marker>
      ))}
    </Map>
  )
}
