import L from 'leaflet'
import { getOrCreateSessionId } from './sessionUtils'

export interface TaskResult {
  taskId: number
  polygon?: L.LatLngExpression[]
  popups?: Array<{ position: L.LatLngExpression, content: string }>
  type: 'polygon' | 'popup'
}

interface Session {
  id: string
  createdAt: string
  results: TaskResult[]
}

export function saveTaskResult(
  taskId: number, 
  data: L.LatLngExpression[] | Array<{ position: L.LatLngExpression, content: string }>,
  type: 'polygon' | 'popup'
) {
  const sessions = getAllSessions()
  const currentSessionId = getOrCreateSessionId()
  
  let session = sessions.find(s => s.id === currentSessionId)
  if (!session) {
    session = { 
      id: currentSessionId, 
      createdAt: new Date().toISOString(),
      results: [] 
    }
    sessions.push(session)
  }

  const result: TaskResult = {
    taskId,
    type,
    ...(type === 'polygon' ? { polygon: data as L.LatLngExpression[] } : { popups: data as Array<{ position: L.LatLngExpression, content: string }> })
  }

  const existingResultIndex = session.results.findIndex(r => r.taskId === taskId)
  if (existingResultIndex !== -1) {
    session.results[existingResultIndex] = result
  } else {
    session.results.push(result)
  }

  localStorage.setItem('sessions', JSON.stringify(sessions))
  localStorage.setItem('currentSessionId', currentSessionId)
}

export function getTaskResults(taskId: number): TaskResult | null {
  const sessions = getAllSessions()
  const currentSessionId = localStorage.getItem('currentSessionId')
  const session = sessions.find(s => s.id === currentSessionId)
  return session?.results.find(r => r.taskId === taskId) || null
}

export function getAllSessions(): Session[] {
  try {
    const sessions = localStorage.getItem('sessions')
    if (!sessions) return []
    const parsed = JSON.parse(sessions)
    return parsed.map((session: Session) => ({
      ...session,
      createdAt: session.createdAt || new Date().toISOString()
    }))
  } catch (error) {
    console.error('Error parsing sessions:', error)
    return []
  }
}

export function deleteSession(sessionId: string) {
  let sessions = getAllSessions()
  sessions = sessions.filter(s => s.id !== sessionId)
  localStorage.setItem('sessions', JSON.stringify(sessions))
}