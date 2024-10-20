import React from 'react'
import { Task, TaskHeader, TaskContent, TaskComponentProps } from './Task'
import { ListTodo, MoveUpRight } from 'lucide-react'
import BeforeAfterPieCharts from './BeforeAfterPieCharts'

interface ScoreUpdatedTaskData {
  before?: {
    innerRing: Array<{ value: number }>
  }
  after?: {
    innerRing: Array<{ value: number }>
  }
}

const ScoreUpdatedTask: React.FC<Omit<TaskComponentProps, 'renderHeader' | 'renderContent'>> = ({ variant, task, onClick, controlButtons }) => {
  const data = task.data as ScoreUpdatedTaskData

  const visualization = React.useMemo(() => (
    <BeforeAfterPieCharts
      before={data.before || { innerRing: [{ value: 0 }] }}
      after={data.after || { innerRing: [{ value: 0 }] }}
    />
  ), [data.before, data.after])

  const customSummary = (
    <div className="flex items-center">
      <span>{data?.before?.innerRing[0]?.value ?? 0}%</span>
      <MoveUpRight className="h-6 w-6 mx-1" />
      <span>{data?.after?.innerRing[0]?.value ?? 0}%</span>
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
            <ListTodo className="h-6 w-6" />
          </div>
        </TaskHeader>
      )}
      renderContent={(props) => (
        <TaskContent 
          {...props} 
          visualization={visualization}
          customSummary={customSummary}
        />
      )}
    />
  )
}

export default ScoreUpdatedTask
