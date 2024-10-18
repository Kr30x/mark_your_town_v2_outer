"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToast } from "@/hooks/use-toast"
import { getOrCreateSessionId } from '@/lib/sessionUtils'

export default function FinalPage() {
  const [sessionId, setSessionId] = useState<string>('')
  const { toast } = useToast()
  const router = useRouter()

  useEffect(() => {
    setSessionId(getOrCreateSessionId())
  }, [])

  const handleCopy = () => {
    navigator.clipboard.writeText(sessionId)
    toast({
      title: "Скопировано!",
      description: "ID сессии был скопирован в буфер обмена.",
    })
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Поздравляем!</CardTitle>
        <CardDescription>Вы выполнили все задания.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p>Ваш ID сессии:</p>
        <div className="flex space-x-2">
          <Input value={sessionId} readOnly />
          <Button onClick={handleCopy}>Копировать</Button>
        </div>
      </CardContent>
    </Card>
  )
}