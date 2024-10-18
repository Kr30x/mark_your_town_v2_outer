'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import LeafletMap from '@/components/LeafletMap'
import { tasks } from '@/lib/tasks'
import { saveTaskResult, getTaskResults } from '@/lib/storage'

export default function TaskPage({ params }: { params: { id: string } }) {
  const taskId = parseInt(params.id)
  const task = tasks[taskId - 1]

  const [drawnPolygon, setDrawnPolygon] = useState<L.LatLngExpression[] | null>(null)
  const [placedPopups, setPlacedPopups] = useState<Array<{ position: L.LatLngExpression, content: string }>>([])

  useEffect(() => {
    const existingResult = getTaskResults(taskId)
    if (existingResult) {
      if (existingResult.type === 'polygon' && existingResult.polygon) {
        setDrawnPolygon(existingResult.polygon)
      } else if (existingResult.type === 'popup' && existingResult.popups) {
        setPlacedPopups(existingResult.popups)
      }
    }
  }, [taskId])

  if (!task) {
    return null
  }

  const handlePolygonDrawn = (polygon: L.LatLngExpression[]) => {
    setDrawnPolygon(polygon)
    saveTaskResult(taskId, polygon, 'polygon')
  }

  const handlePopupsPlaced = (popups: Array<{ position: L.LatLngExpression, content: string }>) => {
    setPlacedPopups(popups)
    saveTaskResult(taskId, popups, 'popup')
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
            <LeafletMap 
              onPolygonDrawn={handlePolygonDrawn}
              onPopupsPlaced={handlePopupsPlaced}
              taskId={taskId} 
              totalTasks={tasks.length}
              taskType={task.type}
              readOnly={false}
              initialPolygon={drawnPolygon || undefined}
              initialPopups={placedPopups}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}