'use client'

import React from 'react'
import dynamic from 'next/dynamic'
import type { TaskResult } from '@/lib/storage'

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
  return (
    <div className="h-[300px] rounded-lg overflow-hidden">
      <LeafletMap
        taskId={result.taskId}
        totalTasks={1}
        readOnly={true}
        taskType={result.type}
        initialPolygon={result.type === 'polygon' ? result.polygon : undefined}
        initialPopups={result.type === 'popup' ? result.popups : undefined}
      />
    </div>
  )
}