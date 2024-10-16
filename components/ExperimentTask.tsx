import React from 'react'
import { Task, TaskHeader, TaskContent, TaskComponentProps } from './Task'
import { Progress } from "@/components/ui/progress"
import { FlaskConical } from 'lucide-react'
import { PieChart, Pie, ResponsiveContainer } from 'recharts'

interface ExperimentTaskData {
  accuracy?: number
  progress?: number
  elapsedTime?: string
  numberComplete?: number
  numberTotal?: number
  eta?: string
  processedItems: number
  totalItems: number
  estimatedTimeRemaining: string
}

const ExperimentTask: React.FC<Omit<TaskComponentProps, 'renderHeader' | 'renderContent'>> = ({ variant, task, onClick, controlButtons }) => {
  const data = task.data as ExperimentTaskData

  const innerPieData = [
    { name: 'Positive', value: data?.accuracy || 0, fill: 'var(--true)' },
    { name: 'Negative', value: 100 - (data?.accuracy || 0), fill: 'var(--false)' }
  ]

  const outerPieData = [
    { name: 'Positive', value: 50, fill: 'var(--true)' },
    { name: 'Negative', value: 50, fill: 'var(--false)' }
  ]

  const visualization = (
    <div className="h-[120px] w-[120px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={innerPieData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={40}
            fill="#8884d8"
            strokeWidth={0}
          />
          <Pie
            data={outerPieData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={45}
            outerRadius={55}
            fill="#82ca9d"
            strokeWidth={0}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )

  return (
    <Task 
      variant={variant} 
      task={task} 
      onClick={onClick} 
      controlButtons={controlButtons}
      renderHeader={(props) => (
        <TaskHeader {...props}>
          <div className="flex justify-end w-full">
            <FlaskConical className="h-5 w-5" />
          </div>
        </TaskHeader>
      )}
      renderContent={(props) => (
        <TaskContent {...props} visualization={visualization}>
          {data && (
            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1">
                <div className="font-semibold">Progress: {data.progress}%</div>
                <div>{data.elapsedTime}</div>
              </div>
              <Progress value={data.progress} className="w-full h-4" />
              <div className="flex justify-between text-xs mt-1">
                <div>{data.processedItems}/{data.totalItems}</div>
                <div>ETA: {data.estimatedTimeRemaining}</div>
              </div>
            </div>
          )}
        </TaskContent>
      )}
    />
  )
}

export default ExperimentTask
