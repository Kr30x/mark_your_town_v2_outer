import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import { Card, CardContent, CardHeader, CardFooter, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog"
import { Trash2, Square, MapPin } from 'lucide-react'
import { tasks } from '@/lib/tasks'
import { TaskResult } from '@/lib/storage'
import ErrorBoundary from '@/components/ErrorBoundary'

const DynamicTaskMapDisplay = dynamic(() => import('@/components/TaskMapDisplay').then(mod => mod.TaskMapDisplay), { 
  ssr: false,
  loading: () => <p>Loading map...</p>
})

interface Session {
  id: string
  createdAt: string
  results: TaskResult[]
}

interface SessionCardProps {
  session: Session
  onDelete: (id: string) => void
}

const SessionCard: React.FC<SessionCardProps> = ({ session, onDelete }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  
  const stats = getSessionStats(session.results)
  const sortedResults = [...session.results].sort((a, b) => a.taskId - b.taskId)

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="text-xl font-bold">
            Сессия от {formatDate(session.createdAt)}
          </CardTitle>
          <div className="text-sm text-muted-foreground mt-1">
            ID: {session.id}
          </div>
        </div>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="outline" size="icon">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Удалить сессию?</AlertDialogTitle>
              <AlertDialogDescription>
                Это действие нельзя отменить. Все сохраненные результаты этой сессии будут удалены.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Отмена</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(session.id)}>
                Удалить
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-6 mb-4">
          <div className="flex items-center gap-2">
            <Square className="h-4 w-4" />
            <span>{stats.polygons} полигонов</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            <span>{stats.popups} маркеров</span>
          </div>
        </div>
        <div className="w-full bg-secondary h-2 rounded-full">
          <div 
            className="bg-primary h-2 rounded-full transition-all" 
            style={{ width: `${stats.progress}%` }}
          />
        </div>
        <div className="text-sm text-muted-foreground mt-2">
          Выполнено {stats.completed} из {stats.total} заданий
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? 'Скрыть результаты' : 'Показать результаты'}
        </Button>
      </CardFooter>
      {isExpanded && (
        <div className="px-6 pb-6 space-y-6">
          {sortedResults.map((result) => (
            <div key={result.taskId} className="space-y-2">
              <h3 className="font-semibold">
                Задание {result.taskId}: {tasks[result.taskId - 1]?.instruction}
              </h3>
              <div className="text-sm text-muted-foreground mb-2">
                Тип: {result.type === 'polygon' ? 'Область' : 'Маркеры'}
              </div>
              <ErrorBoundary fallback={<div>Failed to load map. Please try again later.</div>}>
                <DynamicTaskMapDisplay result={result} />
              </ErrorBoundary>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

export default SessionCard

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getSessionStats(results: TaskResult[]) {
  const totalTasks = tasks.length
  const completedTasks = results.length
  const polygonTasks = results.filter(r => r.type === 'polygon').length
  const popupTasks = results.filter(r => r.type === 'popup').length
  
  return {
    progress: Math.round((completedTasks / totalTasks) * 100),
    completed: completedTasks,
    total: totalTasks,
    polygons: polygonTasks,
    popups: popupTasks
  }
}
