import React, { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, FeatureGroup, Polygon, Popup, useMap, useMapEvents, Marker } from 'react-leaflet'
import { EditControl } from 'react-leaflet-draw'
import 'leaflet/dist/leaflet.css'
import 'leaflet-draw/dist/leaflet.draw.css'
import 'leaflet-draw'
import L, { polygon } from 'leaflet'
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from 'next/navigation'
import { saveTaskResult } from '@/lib/storage'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.3.1/images/marker-shadow.png',
})

interface LeafletMapProps {
  onPolygonsDrawn?: (polygons: L.LatLngExpression[][]) => Promise<void>
  onPopupsPlaced?: (popups: Array<{ position: L.LatLngExpression, content: string }>) => Promise<void>
  taskId: number
  totalTasks: number
  readOnly?: boolean
  initialPolygons?: L.LatLngExpression[][]
  initialPopups?: Array<{ position: L.LatLngExpression, content: string }>
  taskType: 'polygon' | 'popup'
}

function MapUpdater({ readOnly, initialPolygons, initialPopups }: { readOnly?: boolean, initialPolygons?: L.LatLngExpression[][], initialPopups?: Array<{ position: L.LatLngExpression, content: string }> }) {
  const map = useMap()

  useEffect(() => {
    if (readOnly) {
      if (initialPolygons && initialPolygons.length > 0) {
        const bounds = L.latLngBounds(initialPolygons[0] as L.LatLngExpression[])
        map.fitBounds(bounds)
      } else if (initialPopups && initialPopups.length > 0) {
        const bounds = L.latLngBounds(initialPopups.map(popup => popup.position) as L.LatLngExpression[])
        map.fitBounds(bounds)
      } else {
        map.setView([55.8214, 37.3388], 12) // Krasnogorsk coordinates
      }
    } else {
      map.setView([55.8214, 37.3388], 12) // Krasnogorsk coordinates
    }
  }, [map, readOnly, initialPolygons, initialPopups])

  return null
}

function PopupPlacer({ onPopupPlaced, isPlacingPopup }: { onPopupPlaced: (popup: { position: L.LatLngExpression, content: string }) => void, isPlacingPopup: boolean }) {
  const map = useMapEvents({
    click(e) {
      if (isPlacingPopup) {
        const content = window.prompt("Введите содержимое попапа:")
        if (content) {
          onPopupPlaced({ position: e.latlng, content })
        }
      }
    },
  })

  return null
}

export default function LeafletMap({ onPolygonsDrawn, onPopupsPlaced, taskId, totalTasks, readOnly = false, initialPolygons, initialPopups, taskType }: LeafletMapProps): JSX.Element {
  const [drawnItems, setDrawnItems] = useState<L.FeatureGroup | null>(null)
  const [popups, setPopups] = useState<Array<{ position: L.LatLngExpression, content: string }>>(initialPopups || [])
  const [isPlacingPopup, setIsPlacingPopup] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    setDrawnItems(new L.FeatureGroup())
  }, [])

  const handleCreated = async (e: L.LeafletEvent): Promise<void> => {
    if (e.type === 'draw:created' && 'layer' in e) {
      const layer = e.layer as L.Layer
      if (drawnItems) {
        drawnItems.addLayer(layer)
        const polygons = drawnItems.getLayers()
          .filter(layer => layer instanceof L.Polygon)
          .map((layer) => (layer as L.Polygon).getLatLngs()[0].map((latLng: L.LatLng) => [latLng.lat, latLng.lng]))
        await onPolygonsDrawn?.(polygons)
      }
    }
  }

  const handlePopupPlaced = async (popup: { position: L.LatLngExpression, content: string }) => {
    const newPopups = [...popups, popup];
    setPopups(newPopups)
    await onPopupsPlaced?.(newPopups)
    setIsPlacingPopup(false)
  }

  const handleSubmit = async (): Promise<void> => {
    if (taskType === 'polygon' && (!drawnItems || drawnItems.getLayers().length === 0)) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, нарисуйте хотя бы одну область на карте перед отправкой.",
        variant: "destructive",
      })
      return
    }

    if (taskType === 'popup' && popups.length === 0) {
      toast({
        title: "Ошибка",
        description: "Пожалуйста, разместите хотя бы один попап на карте перед отправкой.",
        variant: "destructive",
      })
      return
    }

    let result
    if (taskType === 'polygon') {
      result = drawnItems!.getLayers()
        .filter(layer => layer instanceof L.Polygon)
        .map((layer) => (layer as L.Polygon).getLatLngs()[0].map((latLng: L.LatLng) => [latLng.lat, latLng.lng]))
    } else {
      result = popups
    }

    try {
      if (taskType === 'polygon') {
        await onPolygonsDrawn?.(result)
      } else {
        await onPopupsPlaced?.(result)
      }

      toast({
        title: "Успех",
        description: taskType === 'polygon' ? "Ваш рисунок был сохранен." : "Ваши попапы были сохранены.",
      })

      if (taskId < totalTasks) {
        router.push(`/task/${taskId + 1}`)
      } else {
        router.push('/final')
      }
    } catch (error) {
      console.error('Error saving result:', error)
      toast({
        title: "Ошибка",
        description: "Произошла ошибка при сохранении результата. Пожалуйста, попробуйте еще раз.",
        variant: "destructive",
      })
    }
  }

  const do_print = (): boolean => {
    return true;
  }

  return (
    <div className="flex flex-col items-center justify-center w-full space-y-4">
      <div className="w-full h-[500px] bg-white rounded-lg shadow-lg overflow-hidden">
        {drawnItems && (
          <MapContainer
            center={[55.8214, 37.3388]} // Krasnogorsk coordinates
            zoom={13}
            style={{ height: '100%', width: '100%' }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            <FeatureGroup ref={setDrawnItems}>
              {do_print() && !readOnly && taskType === 'polygon' && (
                <EditControl
                  position="topright"
                  onCreated={handleCreated}
                  draw={{
                    rectangle: false,
                    circle: false,
                    circlemarker: false,
                    marker: false,
                    polygon: true,
                    polyline: false,
                  }}
                />
              )}
              {readOnly && initialPolygons && initialPolygons.map((polygon, index) => (
                <Polygon key={index} positions={polygon} />
              ))}
            </FeatureGroup>
            <PopupPlacer onPopupPlaced={handlePopupPlaced} isPlacingPopup={isPlacingPopup} />
            {popups.map((popup, index) => (
              <Marker key={index} position={popup.position}>
                <Popup>
                  {popup.content}
                </Popup>
              </Marker>
            ))}
            <MapUpdater readOnly={readOnly} initialPolygons={initialPolygons} initialPopups={initialPopups} />
          </MapContainer>
        )}
      </div>
      {!readOnly && (
        <div className="flex space-x-4">
          {taskType === 'popup' && (
            <Button 
              onClick={() => setIsPlacingPopup(!isPlacingPopup)} 
              className="w-1/2"
              variant={isPlacingPopup ? "secondary" : "default"}
            >
              {isPlacingPopup ? 'Отменить размещение' : 'Разместить попап'}
            </Button>
          )}
          <Button onClick={handleSubmit} className={taskType === 'popup' ? "w-1/2" : "w-full"}>
            {taskType === 'polygon' ? 'Отправить рисунок' : 'Отправить попапы'}
          </Button>
        </div>
      )}
    </div>
  )
}
