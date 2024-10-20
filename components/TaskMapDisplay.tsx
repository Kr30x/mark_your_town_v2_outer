'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import type { TaskResult } from '@/lib/storage'
import L from 'leaflet'

// Dynamically import LeafletMap with ssr disabled
const LeafletMap = dynamic(
  () => import('@/components/LeafletMap'),
  { 
    ssr: false,
    loading: () => (
      <div className="h-[300px] rounded-lg overflow-hidden bg-secondary flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">
          Загрузка карты...
        </div>
      </div>
    )
  }
)

interface TaskMapDisplayProps {
  result: TaskResult
}

export function TaskMapDisplay({ result }: TaskMapDisplayProps) {
  const [isClient, setIsClient] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    setIsClient(true)
  }, [])

  const parsePolygons = (polygonsString: string | undefined): L.LatLngExpression[][] | undefined => {
    if (!polygonsString) return undefined;
    try {
      return JSON.parse(polygonsString);
    } catch (error) {
      console.error('Error parsing polygons:', error);
      setError('Failed to parse polygon data')
      return undefined;
    }
  }

  const parsePopups = (popupsString: string | undefined): Array<{ position: L.LatLngExpression, content: string }> | undefined => {
    if (!popupsString) return undefined;
    try {
      return JSON.parse(popupsString);
    } catch (error) {
      console.error('Error parsing popups:', error);
      setError('Failed to parse popup data')
      return undefined;
    }
  }

  if (!isClient) {
    return <div className="h-[300px] rounded-lg overflow-hidden bg-secondary flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">
        Загрузка карты...
      </div>
    </div>
  }

  if (error) {
    return <div className="h-[300px] rounded-lg overflow-hidden bg-red-100 flex items-center justify-center">
      <div className="text-red-500">{error}</div>
    </div>
  }

  return (
    <div className="h-[300px] rounded-lg overflow-hidden">
      <LeafletMap
        taskId={result.taskId}
        totalTasks={1}
        readOnly={true}
        taskType={result.type}
        initialPolygons={result.type === 'polygon' ? parsePolygons(result.polygons) : undefined}
        initialPopups={result.type === 'popup' ? parsePopups(result.popups) : undefined}
      />
    </div>
  )
}
