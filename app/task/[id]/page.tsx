'use client'

import React, { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent } from '@/components/ui/card'
import ErrorBoundary from '@/components/ErrorBoundary'
import { tasks } from '@/lib/tasks'
import { saveTaskResult, getTaskResults } from '@/lib/storage'
import { getOrCreateSessionId } from '@/lib/sessionUtils'
import L from 'leaflet'

const DynamicLeafletMap = dynamic(() => import('@/components/LeafletMap'), {
  ssr: false,
  loading: () => <p>Loading map...</p>
})

export default function TaskPage({ params }: { params: { id: string } }) {
  const taskId = parseInt(params.id)
  const task = tasks[taskId - 1]

  const [drawnPolygons, setDrawnPolygons] = useState<L.LatLngExpression[][] | null>(null)
  const [placedPopups, setPlacedPopups] = useState<Array<{ position: L.LatLngExpression, content: string }>>([])
  const [sessionId, setSessionId] = useState<string | null>(null)

  useEffect(() => {
    const initSession = async () => {
      const sid = await getOrCreateSessionId()
      setSessionId(sid)
      if (sid) {
        const existingResult = await getTaskResults(sid, taskId)
        if (existingResult) {
          if (existingResult.type === 'polygon' && existingResult.polygons) {
            try {
              const parsedPolygons = JSON.parse(existingResult.polygons)
              setDrawnPolygons(parsedPolygons)
            } catch (error) {
              console.error('Error parsing polygons:', error)
              setDrawnPolygons(null)
            }
          } else if (existingResult.type === 'popup' && existingResult.popups) {
            try {
              const parsedPopups = JSON.parse(existingResult.popups)
              setPlacedPopups(parsedPopups)
            } catch (error) {
              console.error('Error parsing popups:', error)
              setPlacedPopups([])
            }
          }
        }
      }
    }
    initSession()
  }, [taskId])

  if (!task || !sessionId) {
    return null
  }

  const handlePolygonsDrawn = async (polygons: L.LatLngExpression[][]) => {
    setDrawnPolygons(polygons)
    await saveTaskResult(sessionId, taskId, polygons, 'polygon')
  }

  const handlePopupsPlaced = async (popups: Array<{ position: L.LatLngExpression, content: string }>) => {
    setPlacedPopups(popups)
    await saveTaskResult(sessionId, taskId, popups, 'popup')
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Задание {taskId}</h1>
      <div className="flex flex-col lg:flex-row gap-6">
        <Card className="w-full lg:w-1/3">
          <CardContent className="pt-6">
            <p className="mb-4">{task.instruction}</p>
            <p className="text-sm text-muted-foreground">
              Тип задания: {task.type === 'polygon' ? 'Рисование области' : 'Размещение маркеров'}
            </p>
          </CardContent>
        </Card>
        <Card className="w-full lg:w-2/3">
          <CardContent className="p-6">
            <ErrorBoundary fallback={<div>Failed to load map. Please try again later.</div>}>
              <DynamicLeafletMap 
                onPolygonsDrawn={handlePolygonsDrawn}
                onPopupsPlaced={handlePopupsPlaced}
                taskId={taskId} 
                totalTasks={tasks.length}
                taskType={task.type}
                readOnly={false}
                initialPolygons={drawnPolygons || undefined}
                initialPopups={placedPopups}
              />
            </ErrorBoundary>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
