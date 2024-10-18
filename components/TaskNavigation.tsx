import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface TaskNavigationProps {
  currentTask: number
  totalTasks: number
}

export default function TaskNavigation({ currentTask, totalTasks }: TaskNavigationProps) {
  return (
    <div className="flex justify-between mt-4">
      {currentTask > 1 && (
        <Link href={`/task/${currentTask - 1}`}>
          <Button variant="outline">Предыдущее задание</Button>
        </Link>
      )}
      {currentTask < totalTasks && (
        <Link href={`/task/${currentTask + 1}`} className="ml-auto">
          <Button variant="outline">Следующее задание</Button>
        </Link>
      )}
    </div>
  )
}
