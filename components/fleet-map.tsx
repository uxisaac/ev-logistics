'use client'

import { useEffect, useRef } from 'react'
import Map, { Marker, NavigationControl, AttributionControl, type MapRef } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { useTheme } from 'next-themes'
import { cn } from '@/lib/utils'
import type { Vehicle } from '@/lib/vehicles'

const MAP_STYLE_LIGHT = 'https://tiles.openfreemap.org/styles/positron'
const MAP_STYLE_DARK = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'

interface FleetMapProps {
  vehicles: Vehicle[]
  selectedId: string | null
  onSelectVehicle: (id: string) => void
}

export function FleetMap({ vehicles, selectedId, onSelectVehicle }: FleetMapProps) {
  const mapRef = useRef<MapRef>(null)
  const { resolvedTheme } = useTheme()
  const mapStyle = resolvedTheme === 'dark' ? MAP_STYLE_DARK : MAP_STYLE_LIGHT

  useEffect(() => {
    if (!selectedId || !mapRef.current) return
    const vehicle = vehicles.find((v) => v.id === selectedId)
    if (!vehicle) return
    mapRef.current.flyTo({
      center: vehicle.coordinates,
      zoom: 13,
      duration: 800,
      essential: true,
    })
  }, [selectedId, vehicles])

  return (
    <div className="h-full w-full">
      <Map
        ref={mapRef}
        initialViewState={{ longitude: -122.42, latitude: 37.77, zoom: 10.5 }}
        style={{ width: '100%', height: '100%' }}
        mapStyle={mapStyle}
        onLoad={() => mapRef.current?.resize()}
        attributionControl={false}
      >
        <NavigationControl position="top-right" showCompass={false} />
        <AttributionControl compact position="bottom-right" />

        {vehicles.map((vehicle) => (
          <Marker
            key={vehicle.id}
            longitude={vehicle.coordinates[0]}
            latitude={vehicle.coordinates[1]}
            anchor="bottom"
            onClick={(e) => {
              e.originalEvent.stopPropagation()
              onSelectVehicle(vehicle.id)
            }}
          >
            <div className="flex cursor-pointer flex-col items-center gap-0.5">
              <div
                className={cn(
                  'rounded-md border px-2 py-0.5 text-xs font-medium shadow-sm transition-all select-none',
                  selectedId === vehicle.id
                    ? 'border-blue-700 bg-blue-600 text-white shadow-md'
                    : 'border-gray-200 bg-white text-gray-800 hover:shadow',
                )}
              >
                {vehicle.name}
              </div>
              <div
                className={cn(
                  'h-1.5 w-1.5 rounded-full',
                  selectedId === vehicle.id ? 'bg-blue-600' : 'bg-gray-400',
                )}
              />
            </div>
          </Marker>
        ))}
      </Map>
    </div>
  )
}
