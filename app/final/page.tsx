"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useToast } from "@/hooks/use-toast"
import { getOrCreateSessionId } from '@/lib/sessionUtils'

export default function FinalPage() {
  const [sessionId, setSessionId] = useState<string | null>(null)
  const { toast } = useToast()

  useEffect(() => {
    const fetchSessionId = async () => {
      const sid = await getOrCreateSessionId()
      setSessionId(sid)
    }
    fetchSessionId()
  }, [])

  const handleCopy = () => {
    if (sessionId) {
      navigator.clipboard.writeText(sessionId)
      toast({
        title: "Скопировано!",
        description: "ID сессии скопирован в буфер обмена.",
      })
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-6">Спасибо за участие!</h1>
      <Card>
        <CardContent className="pt-6">
          <p className="mb-4">
            Вы успешно завершили все задания. Ваш ID сессии:
          </p>
          <div className="flex items-center space-x-2 mb-4">
            <code className="bg-muted p-2 rounded">{sessionId || 'Загрузка...'}</code>
            <Button onClick={handleCopy} disabled={!sessionId}>Копировать</Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Сохраните этот ID, если хотите вернуться к своим результатам позже.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
