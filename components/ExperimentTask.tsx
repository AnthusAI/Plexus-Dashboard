import React, { useRef, useState, useEffect, useMemo } from 'react'
import { Task, TaskHeader, TaskContent, BaseTaskProps } from '@/components/Task'
import { FlaskConical, Square, X, Split } from 'lucide-react'
import MetricsGauges from '@/components/MetricsGauges'
import { ProgressBar } from "@/components/ui/progress-bar"
import { ConfusionMatrix } from '@/components/confusion-matrix'
import { CardButton } from '@/components/CardButton'
import ClassDistributionVisualizer from '@/components/ClassDistributionVisualizer'
import PredictedClassDistributionVisualizer from '@/components/PredictedClassDistributionVisualizer'
import { ExperimentTaskScoreResult } from '@/components/ExperimentTaskScoreResult'
import type { Schema } from "@/amplify/data/resource"
import MetricsGaugesExplanation from '@/components/MetricsGaugesExplanation'
import { ExperimentTaskScoreResults } from '@/components/ExperimentTaskScoreResults'

export interface ExperimentMetric {
  name: string
  value: number
  unit?: string
  maximum?: number
  priority: boolean
}

export interface ExperimentTaskData {
  accuracy: number | null
  metrics: ExperimentMetric[]
  metricsExplanation?: string | null
  processedItems: number
  totalItems: number
  progress: number
  inferences: number
  cost: number | null
  status: string
  elapsedSeconds: number | null
  estimatedRemainingSeconds: number | null
  startedAt?: string | null
  errorMessage?: string | null
  errorDetails?: any | null
  confusionMatrix?: {
    matrix: number[][] | null
    labels: string[] | null
  } | null
  scoreGoal?: string | null
  datasetClassDistribution?: { label: string, count: number }[]
  isDatasetClassDistributionBalanced?: boolean | null
  predictedClassDistribution?: { label: string, count: number }[]
  isPredictedClassDistributionBalanced?: boolean | null
  scoreResults?: Schema['ScoreResult']['type'][]
}

export interface ExperimentTaskProps {
  variant?: 'grid' | 'detail'
  task: {
    id: string
    type: string
    scorecard: string
    score: string
    time: string
    summary?: string
    description?: string
    data: ExperimentTaskData
  }
  onClick?: () => void
  controlButtons?: React.ReactNode
  isFullWidth?: boolean
  onToggleFullWidth?: () => void
  onClose?: () => void
}

function computeExperimentType(data: ExperimentTaskData): string {
  if (data.errorMessage || data.errorDetails) {
    return "Error in experiment"
  }
  
  if (data.progress === 100) {
    return "Experiment done"
  }
  
  if (data.progress >= 90) {
    return "Experiment finishing"
  }
  
  if (data.progress >= 10) {
    return "Experiment running"
  }
  
  if (data.progress > 0) {
    return "Experiment started"
  }
  
  return "Experiment pending"
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${remainingSeconds}s`
  }
  if (minutes > 0) {
    return `${minutes}m ${remainingSeconds}s`
  }
  return `${remainingSeconds}s`
}

function computeIsBalanced(distribution: { label: string, count: number }[] | null | undefined): boolean | null {
  if (!distribution || distribution.length <= 1) return null
  
  const total = distribution.reduce((sum, item) => sum + item.count, 0)
  const expectedCount = total / distribution.length
  const tolerance = 0.2 // 20% tolerance
  
  return distribution.every(item => 
    Math.abs(item.count - expectedCount) <= expectedCount * tolerance
  )
}

const GridContent = React.memo(({ data }: { data: ExperimentTaskData }) => (
  <div className="mt-4">
    <ProgressBar 
      progress={data.progress}
      elapsedTime={data.elapsedSeconds !== null ? 
        formatDuration(data.elapsedSeconds) : undefined}
      processedItems={data.processedItems}
      totalItems={data.totalItems}
      estimatedTimeRemaining={data.estimatedRemainingSeconds !== null ? 
        formatDuration(data.estimatedRemainingSeconds) : undefined}
      color="secondary"
      isFocused={false}
    />
  </div>
))

const DetailContent = React.memo(({ 
  data, 
  isFullWidth,
  metrics,
  metricsVariant,
}: { 
  data: ExperimentTaskData
  isFullWidth: boolean
  metrics: any[]
  metricsVariant: 'grid' | 'detail'
}) => (
  <div className={`w-full ${isFullWidth ? 'grid grid-cols-2 gap-8' : ''}`}>
    <div className="w-full">
      <div className="mb-4">
        <ProgressBar 
          progress={data.progress}
          elapsedTime={data.elapsedSeconds !== null ? 
            formatDuration(data.elapsedSeconds) : undefined}
          processedItems={data.processedItems}
          totalItems={data.totalItems}
          estimatedTimeRemaining={data.estimatedRemainingSeconds !== null ? 
            formatDuration(data.estimatedRemainingSeconds) : undefined}
          color="secondary"
          isFocused={true}
        />
      </div>

      <div className="mb-4">
        <ClassDistributionVisualizer
          data={data.datasetClassDistribution}
          isBalanced={data.isDatasetClassDistributionBalanced}
        />
      </div>

      <div className="mb-4">
        <PredictedClassDistributionVisualizer
          data={data.predictedClassDistribution}
        />
      </div>

      <MetricsGaugesExplanation
        explanation={data.metricsExplanation}
        goal={data.scoreGoal}
      />

      <MetricsGauges 
        gauges={metrics} 
        variant="detail"
      />

      {data.confusionMatrix?.matrix && 
       data.confusionMatrix.matrix.length > 0 && 
       data.confusionMatrix.labels && (
        <div className="">
          <ConfusionMatrix 
            data={{
              matrix: data.confusionMatrix.matrix,
              labels: data.confusionMatrix.labels
            }} 
          />
        </div>
      )}
    </div>

    {data.scoreResults && data.scoreResults.length > 0 && (
      <div className={isFullWidth ? 'w-full' : 'mt-8'}>
        <ExperimentTaskScoreResults 
          results={data.scoreResults} 
          accuracy={data.accuracy ?? 0}
        />
      </div>
    )}
  </div>
))

export default function ExperimentTask({ 
  variant = 'grid',
  task,
  onClick,
  controlButtons,
  isFullWidth,
  onToggleFullWidth,
  onClose
}: ExperimentTaskProps) {
  const data = task.data ?? {} as ExperimentTaskData
  const computedType = computeExperimentType(data)

  const metrics = useMemo(() => 
    variant === 'detail' ? 
      (data.metrics ?? []).map(metric => ({
        value: metric.value,
        label: metric.name,
        information: getMetricInformation(metric.name),
        maximum: metric.maximum ?? 100,
        unit: metric.unit ?? '%',
        priority: metric.priority
      }))
      : [
        {
          value: data.accuracy ?? undefined,
          label: 'Accuracy',
          backgroundColor: 'var(--gauge-background)',
          priority: true
        }
      ]
  , [variant, data.metrics, data.accuracy])

  const headerContent = useMemo(() => (
    <div className="flex justify-end w-full">
      {variant === 'detail' ? (
        <div className="flex items-center space-x-2">
          {typeof onToggleFullWidth === 'function' && (
            <CardButton
              icon={Square}
              onClick={onToggleFullWidth}
            />
          )}
          {typeof onClose === 'function' && (
            <CardButton
              icon={X}
              onClick={onClose}
            />
          )}
        </div>
      ) : (
        <FlaskConical className="h-6 w-6" />
      )}
    </div>
  ), [variant, onToggleFullWidth, onClose])

  return (
    <Task
      variant={variant}
      task={{
        ...task,
        type: computedType,
        summary: variant === 'detail' ? undefined : task.summary
      }}
      onClick={onClick}
      controlButtons={controlButtons}
      isFullWidth={isFullWidth}
      onToggleFullWidth={onToggleFullWidth}
      onClose={onClose}
      renderHeader={(props) => (
        <TaskHeader {...props}>
          {headerContent}
        </TaskHeader>
      )}
      renderContent={(props) => (
        <TaskContent {...props}>
          {variant === 'grid' ? (
            <GridContent data={data} />
          ) : (
            <DetailContent 
              data={data}
              isFullWidth={isFullWidth ?? false}
              metrics={metrics}
              metricsVariant="detail"
            />
          )}
        </TaskContent>
      )}
    />
  )
}

function getMetricInformation(metricName: string): string {
  const descriptions: Record<string, string> = {
    "Accuracy": "Accuracy measures the overall correctness of predictions, showing the " +
      "percentage of all cases (both positive and negative) that were " +
      "correctly classified.\n\n" +
      "While accuracy is a good general metric, it can be misleading when classes " +
      "are imbalanced. For example, if only 1% of cases are positive, a model " +
      "that always predicts negative would have 99% accuracy but be useless for " +
      "detecting positive cases.",
    "Precision": "Precision measures the accuracy of positive predictions, showing " +
      "the percentage of predicted positive cases that were actually positive.\n\n" +
      "High precision is crucial when false positives are costly - for example, " +
      "when flagging content that will be removed or when identifying cases that " +
      "will trigger penalties. In these cases, we want to be very confident in " +
      "our positive predictions.",
    "Sensitivity": "Sensitivity (also called Recall) measures the ability to correctly " +
      "identify positive cases, showing the percentage of actual positive " +
      "cases that were correctly identified.\n\n" +
      "High sensitivity is essential when missing positive cases is costly - for " +
      "example, when detecting regulated content that must be caught, or when " +
      "screening for high-risk conditions. In these cases, we prefer false " +
      "positives over missing actual positives.",
    "Specificity": "Specificity measures the ability to correctly identify negative " +
      "cases, showing the percentage of actual negative cases that were " +
      "correctly identified.\n\n" +
      "High specificity indicates the model is good at ruling out false " +
      "positives. This is important in scenarios where we want to avoid " +
      "overwhelming review systems with false alarms, or when we need to " +
      "confidently clear cases as negative."
  }
  return descriptions[metricName] || ""
}
