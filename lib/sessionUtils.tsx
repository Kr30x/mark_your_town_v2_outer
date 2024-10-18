export function getOrCreateSessionId(): string {
  let sessionId = localStorage.getItem('currentSessionId')
  if (!sessionId) {
    sessionId = Math.random().toString(36).substr(2, 9)
    localStorage.setItem('currentSessionId', sessionId)
  }
  return sessionId
}

export function clearSessionId(): void {
  localStorage.removeItem('currentSessionId')
}