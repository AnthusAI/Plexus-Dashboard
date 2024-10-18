import React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export interface BaseTaskProps {
  variant: 'grid' | 'detail'
  task: {
    id: number
    type: string
    scorecard: string
    score: string
    time: string
    summary: string
    description?: string
    data?: {
      eta?: string
      numberComplete?: number
      numberTrue?: number
      numberFalse?: number
      numberTotal?: number
      accuracy?: number
      progress?: number
      elapsedTime?: string
    }
  }
  onClick?: () => void
  customSummary?: React.ReactNode
  controlButtons?: React.ReactNode
}

const Task: React.FC<BaseTaskProps & { children?: React.ReactNode }> = ({ 
  variant, 
  task, 
  children, 
  onClick, 
  controlButtons 
}) => {
  return (
    <Card 
      className="bg-card shadow-none border-none rounded-lg cursor-pointer transition-colors duration-200 hover:bg-muted flex flex-col h-full"
      onClick={onClick}
    >
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { task, variant, controlButtons })
        }
        return child
      })}
    </Card>
  )
}

const TaskHeader: React.FC<{ 
  task: BaseTaskProps['task'], 
  variant: BaseTaskProps['variant'], 
  children?: React.ReactNode,
  controlButtons?: React.ReactNode
}> = ({ task, variant, children, controlButtons }) => (
  <CardHeader className="space-y-1.5 p-6 pr-4 flex flex-col items-start">
    <div className="flex justify-between items-start w-full">
      <div className="flex flex-col">
        <div className="text-lg font-bold">{task.type}</div>
        <div className="text-xs text-muted-foreground">{task.scorecard}</div>
        <div className="text-xs text-muted-foreground">{task.score}</div>
        {variant === 'detail' && (
          <div className="text-xs text-muted-foreground mt-1">{task.time}</div>
        )}
      </div>
      <div className="flex flex-col items-end">
        {variant === 'grid' ? children : controlButtons}
        {variant === 'grid' && (
          <div className="text-xs text-muted-foreground flex items-center mt-1">
            {task.time}
          </div>
        )}
      </div>
    </div>
  </CardHeader>
)

const TaskContent: React.FC<{ 
  task: BaseTaskProps['task'], 
  variant: BaseTaskProps['variant'], 
  children?: React.ReactNode,
  visualization?: React.ReactNode,
  customSummary?: React.ReactNode
}> = ({ task, variant, children, visualization, customSummary }) => (
  <CardContent className="p-6 pt-0 pb-4 flex flex-col flex-grow">
    <div className="flex flex-col xs:flex-row justify-between items-start w-full">
      <div className="space-y-1 flex-grow w-full xs:w-auto">
        <div className="text-lg font-bold">
          {task.description && (
            <div className="text-sm text-muted-foreground">
              {task.description}
            </div>
          )}
          {customSummary ? customSummary : <div>{task.summary}</div>}
        </div>
      </div>
      {visualization && (
        <div className="flex-shrink-0 xs:ml-4 w-full xs:w-auto">{visualization}</div>
      )}
    </div>
    <div className="mt-auto">
      {children}
    </div>
  </CardContent>
)

export { Task, TaskHeader, TaskContent }
