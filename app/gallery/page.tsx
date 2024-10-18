"use client"

import React from 'react'
import { useEffect, useState } from 'react'
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Trash2, Search, MapPin, Square } from 'lucide-react'
import { tasks } from '@/lib/tasks'
import { TaskMapDisplay } from '@/components/TaskMapDisplay'

interface TaskResult {
  taskId: number
  type: 'polygon' | 'popup'
  polygon?: L.LatLngExpression[]
  popups?: Array<{ position: L.LatLngExpression, content: string }>
}

interface Session {
  id: string
  createdAt: string
  results: TaskResult[]
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getSessionStats = (results: TaskResult[]) => {
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

const SessionCard: React.FC<{
  session: Session
  onDelete: (id: string) => void
}> = ({ session, onDelete }) => {
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
              <TaskMapDisplay result={result} />
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

export default function GalleryPage() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let storage: { getAllSessions: () => Session[], deleteSession: (id: string) => void }
    let isSubscribed = true

    const initializeStorage = async () => {
      try {
        storage = await import('@/lib/storage')
        if (isSubscribed) {
          loadSessions()
        }
      } catch (error) {
        console.error('Error initializing storage:', error)
        setIsLoading(false)
      }
    }

    const loadSessions = () => {
      try {
        const loadedSessions = storage.getAllSessions()
        if (isSubscribed) {
          setSessions(loadedSessions)
        }
      } catch (error) {
        console.error('Error loading sessions:', error)
      }
      if (isSubscribed) {
        setIsLoading(false)
      }
    }

    initializeStorage()

    // Only add event listener if window is defined (client-side)
    if (typeof window !== 'undefined') {
      const handleStorageChange = () => {
        if (storage) {
          loadSessions()
        }
      }

      window.addEventListener('storage', handleStorageChange)
      
      return () => {
        isSubscribed = false
        window.removeEventListener('storage', handleStorageChange)
      }
    }

    return () => {
      isSubscribed = false
    }
  }, [])

  const handleDeleteSession = async (sessionId: string) => {
    const { deleteSession } = await import('@/lib/storage')
    try {
      deleteSession(sessionId)
      setSessions(prev => prev.filter(s => s.id !== sessionId))
    } catch (error) {
      console.error('Error deleting session:', error)
    }
  }

  const filteredSessions = sessions
    .filter(session => 
      session.id.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  if (isLoading) {
    return (
      <div className="w-full h-[50vh] flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">
          Загрузка сессий...
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-6">
          Галерея сохраненных результатов
        </h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            className="pl-10"
            placeholder="Поиск по ID сессии..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {filteredSessions.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="text-4xl mb-4">🗺️</div>
            <h3 className="text-lg font-semibold mb-2">
              {searchTerm ? 'Ничего не найдено' : 'Нет сохраненных сессий'}
            </h3>
            <p className="text-muted-foreground text-center max-w-md">
              {searchTerm 
                ? 'Попробуйте изменить параметры поиска'
                : 'Начните выполнять задания, чтобы увидеть их результаты здесь'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredSessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              onDelete={handleDeleteSession}
            />
          ))}
        </div>
      )}
    </div>
  )
}