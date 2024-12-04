"use client"

import React, { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { dataClient, listFromModel, getFromModel } from '@/utils/data-operations'
import type { Schema } from "@/amplify/data/resource"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
  Activity,
  MoreHorizontal,
  PlayCircle,
  StopCircle,
  AlertCircle
} from "lucide-react"
import { CardButton } from "@/components/CardButton"
import { format, formatDistanceToNow } from "date-fns"
import { observeQueryFromModel } from "@/utils/amplify-helpers"
import { useMediaQuery } from "../hooks/use-media-query"
import BatchJobTask from "@/components/BatchJobTask"
import { Subscription } from 'rxjs'
import { ProgressBar } from "@/components/ui/progress-bar"
import { Badge } from "@/components/ui/badge"
import { SegmentedProgressBar } from "@/components/ui/segmented-progress-bar"
import { BatchJobProgressBar, BatchJobStatus } from "@/components/ui/batch-job-progress-bar"

const ACCOUNT_KEY = 'call-criteria'

interface SimpleResponse<T> {
  data: T | null
}

interface SimpleAccount {
  id: string
  name: string
  key: string
}

interface SimpleBatchJob {
  id: string
  type: string
  status: string
  startedAt: string | null
  estimatedEndAt: string | null
  completedAt: string | null
  completedRequests: number | null
  failedRequests: number | null
  errorMessage: string | null
  errorDetails: Record<string, unknown>
  accountId: string
  scorecardId: string | null
  scoreId: string | null
  modelProvider: string
  modelName: string
  scoringJobCountCache: number | null
  createdAt: string
  updatedAt: string
}

async function listAccounts(): Promise<SimpleResponse<SimpleAccount[]>> {
  try {
    const result = await listFromModel<Schema['Account']['type']>('Account', {
      key: { eq: ACCOUNT_KEY }
    });
    return { 
      data: result.data?.map(account => ({
        id: account.id,
        name: account.name,
        key: account.key
      })) || null 
    };
  } catch (error) {
    console.error('Error listing accounts:', error);
    return { data: null };
  }
}

async function listBatchJobs(accountId: string): Promise<SimpleResponse<SimpleBatchJob[]>> {
  try {
    const result = await listFromModel<Schema['BatchJob']['type']>('BatchJob', {
      accountId: { eq: accountId }
    });
    return { 
      data: result.data?.map(job => ({
        ...job,
        startedAt: job.startedAt || null,
        estimatedEndAt: job.estimatedEndAt || null,
        completedAt: job.completedAt || null,
        errorMessage: job.errorMessage || null,
        errorDetails: typeof job.errorDetails === 'object' && job.errorDetails !== null 
          ? job.errorDetails 
          : {},
        completedRequests: job.completedRequests || 0,
        failedRequests: job.failedRequests || null,
        scorecardId: job.scorecardId || null,
        scoreId: job.scoreId || null,
        scoringJobCountCache: job.scoringJobCountCache || null
      })) || null 
    };
  } catch (error) {
    console.error('Error listing batch jobs:', error);
    return { data: null };
  }
}

interface SimpleScorecardType {
  id: string
  name: string
  key: string
  accountId: string
}

interface SimpleScoreType {
  id: string
  name: string
  type: string
  sectionId: string
}

async function getScorecard(id: string): Promise<SimpleResponse<SimpleScorecardType>> {
  try {
    const result = await getFromModel<Schema['Scorecard']['type']>('Scorecard', id);
    if (!result.data) return { data: null };
    
    return { 
      data: {
        id: result.data.id,
        name: result.data.name,
        key: result.data.key,
        accountId: result.data.accountId
      }
    };
  } catch (error) {
    console.error('Error getting scorecard:', error);
    return { data: null };
  }
}

async function getScore(id: string): Promise<SimpleResponse<SimpleScoreType>> {
  try {
    const result = await getFromModel<Schema['Score']['type']>('Score', id);
    if (!result.data) return { data: null };
    
    return { 
      data: {
        id: result.data.id,
        name: result.data.name,
        type: result.data.type,
        sectionId: result.data.sectionId
      }
    };
  } catch (error) {
    console.error('Error getting score:', error);
    return { data: null };
  }
}

interface SimpleScoringJob {
  id: string
  status: string
  startedAt: string | null
  completedAt: string | null
  errorMessage: string | null
  itemId: string
  accountId: string
  scorecardId: string
  evaluationId: string | null
  scoreId: string | null
}

interface BatchJobWithCount {
  id: string
  type: string
  status: string
  startedAt: string | null
  estimatedEndAt: string | null
  completedAt: string | null
  completedRequests: number
  failedRequests: number | null
  errorMessage: string | null
  errorDetails: Record<string, unknown>
  accountId: string
  scorecardId: string | null
  scoreId: string | null
  modelProvider: string
  modelName: string
  scoringJobCountCache: number | null
  createdAt: string
  updatedAt: string
  scorecard: SimpleScorecardType | null
  score: SimpleScoreType | null
  scoringJobsCount: number
  scoringJobs: SimpleScoringJob[]
  account: Record<string, unknown>
  batchId: string
}

interface BatchJobListResponse {
  data: SimpleBatchJob[];
}

interface ScoringJobListResponse {
  data: SimpleScoringJob[];
}

function getProgressPercentage(job: BatchJobWithCount): number {
  const total = typeof job.scoringJobCountCache === 'number' ? job.scoringJobCountCache : 0;
  const completed = typeof job.completedRequests === 'number' ? job.completedRequests : 0;
  if (!total) return 0;
  return Math.round((completed / total) * 100);
}

type BatchStatus = 'RUNNING' | 'COMPLETED' | 'FAILED' | 'PENDING'

function getStatusIcon(status: string): JSX.Element {
  const normalizedStatus = (status?.toUpperCase() || 'PENDING') as BatchStatus;
  switch (normalizedStatus) {
    case 'RUNNING':
      return <PlayCircle className="h-4 w-4 text-primary animate-pulse" />;
    case 'COMPLETED':
      return <StopCircle className="h-4 w-4 text-success" />;
    case 'FAILED':
      return <AlertCircle className="h-4 w-4 text-destructive" />;
    default:
      return <Activity className="h-4 w-4 text-muted-foreground" />;
  }
}

function formatTimeAgo(dateStr?: string | null): string {
  if (!dateStr) return 'Not started';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Invalid date';
    return formatDistanceToNow(date, { addSuffix: true });
  } catch {
    return 'Invalid date';
  }
}

const mapBatchJob = async (job: SimpleBatchJob): Promise<BatchJobWithCount> => {
  let scorecardData: SimpleScorecardType | null = null;
  let scoreData: SimpleScoreType | null = null;

  if (job.scorecardId) {
    try {
      const scorecardResult = await getScorecard(job.scorecardId);
      if (scorecardResult?.data) {
        scorecardData = {
          id: scorecardResult.data.id,
          name: scorecardResult.data.name,
          key: scorecardResult.data.key,
          accountId: scorecardResult.data.accountId
        };
      }
    } catch (err) {
      console.error('Error fetching scorecard:', err);
    }
  }

  if (job.scoreId) {
    try {
      const scoreResult = await getScore(job.scoreId);
      if (scoreResult?.data) {
        scoreData = {
          id: scoreResult.data.id,
          name: scoreResult.data.name,
          type: scoreResult.data.type,
          sectionId: scoreResult.data.sectionId
        };
      }
    } catch (err) {
      console.error('Error fetching score:', err);
    }
  }

  return {
    ...job,
    scorecard: scorecardData,
    score: scoreData,
    scoringJobsCount: job.scoringJobCountCache || 0,
    scoringJobs: [],
    account: {},
    batchId: job.id,
    completedRequests: job.completedRequests || 0
  };
};

const BATCH_JOB_SUBSCRIPTION = `
  subscription OnBatchJobChange($accountId: String!) {
    onBatchJobChange(accountId: $accountId) {
      id
      type
      status
      startedAt
      estimatedEndAt
      completedAt
      totalRequests
      completedRequests
      failedRequests
      errorMessage
      errorDetails
      accountId
      scorecardId
      scoreId
      modelProvider
      modelName
      scoringJobCountCache
      createdAt
      updatedAt
    }
  }
`;

interface SubscriptionResponse {
  items: Schema['BatchJob']['type'][];
}

interface BatchJobWithRelatedData extends BatchJobWithCount {
  scoringJobs: SimpleScoringJob[];
}

async function loadRelatedData(batchJobs: SimpleBatchJob[]): Promise<BatchJobWithRelatedData[]> {
  const scorecardIds = [...new Set(batchJobs
    .filter(j => j.scorecardId)
    .map(j => j.scorecardId as string))]
  const scoreIds = [...new Set(batchJobs
    .filter(j => j.scoreId)
    .map(j => j.scoreId as string))]

  console.log('Loading related data:', {
    batchJobCount: batchJobs.length,
    scorecardIds,
    scoreIds
  });

  const [scorecards, scores] = await Promise.all([
    Promise.all(scorecardIds.map(id => getFromModel<Schema['Scorecard']['type']>('Scorecard', id))),
    Promise.all(scoreIds.map(id => getFromModel<Schema['Score']['type']>('Score', id)))
  ])

  console.log('Loaded related data:', {
    scorecards: scorecards.map(s => ({ id: s.data?.id, name: s.data?.name })),
    scores: scores.map(s => ({ id: s.data?.id, name: s.data?.name }))
  });

  const scorecardMap = new Map(
    scorecards.map(result => [result.data?.id, result.data])
  )
  const scoreMap = new Map(
    scores.map(result => [result.data?.id, result.data])
  )

  return batchJobs.map(job => ({
    ...job,
    scorecard: job.scorecardId ? {
      id: job.scorecardId,
      name: scorecardMap.get(job.scorecardId)?.name || 'Unknown Scorecard',
      key: scorecardMap.get(job.scorecardId)?.key || '',
      accountId: scorecardMap.get(job.scorecardId)?.accountId || ''
    } : null,
    score: job.scoreId ? {
      id: job.scoreId,
      name: scoreMap.get(job.scoreId)?.name || 'Unknown Score',
      type: scoreMap.get(job.scoreId)?.type || '',
      sectionId: scoreMap.get(job.scoreId)?.sectionId || ''
    } : null,
    scoringJobsCount: job.scoringJobCountCache || 0,
    scoringJobs: [],
    account: {},
    batchId: job.id,
    completedRequests: job.completedRequests || 0
  }));
}

function getStatusDisplay(status: string): { text: string; variant: string } {
  const normalizedStatus = status?.toUpperCase() || 'PENDING'
  const statusMap: Record<string, { text: string; variant: string }> = {
    PENDING: { text: 'Pending', variant: 'secondary' },
    RUNNING: { text: 'Running', variant: 'default' },
    COMPLETED: { text: 'Completed', variant: 'success' },
    FAILED: { text: 'Failed', variant: 'destructive' },
    CANCELED: { text: 'Canceled', variant: 'warning' },
  }
  return statusMap[normalizedStatus] || { text: status, variant: 'default' }
}

export default function BatchesDashboard() {
  const [batchJobs, setBatchJobs] = useState<BatchJobWithCount[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [accountId, setAccountId] = useState<string | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [selectedBatchJob, setSelectedBatchJob] = useState<BatchJobWithCount | null>(null)
  const [isFullWidth, setIsFullWidth] = useState(false)
  const [leftPanelWidth, setLeftPanelWidth] = useState(50)
  const isNarrowViewport = useMediaQuery('(max-width: 768px)')
  const [subscription, setSubscription] = useState<{ unsubscribe: () => void } | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const dragStateRef = useRef<{
    isDragging: boolean
    startX: number
    startWidth: number
  }>({
    isDragging: false,
    startX: 0,
    startWidth: 50
  })
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  const handleDragStart = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    dragStateRef.current = {
      isDragging: true,
      startX: e.clientX,
      startWidth: leftPanelWidth
    }
    document.addEventListener('mousemove', handleDragMove)
    document.addEventListener('mouseup', handleDragEnd)
  }, [leftPanelWidth])

  const handleDragMove = useCallback((e: MouseEvent) => {
    if (!dragStateRef.current.isDragging || !containerRef.current) return

    const element = containerRef.current
    const containerWidth = element.getBoundingClientRect().width
    const deltaX = e.clientX - dragStateRef.current.startX
    const newWidthPercent = (dragStateRef.current.startWidth * 
      containerWidth / 100 + deltaX) / containerWidth * 100

    const constrainedWidth = Math.min(Math.max(newWidthPercent, 20), 80)
    setLeftPanelWidth(constrainedWidth)
  }, [])

  const handleDragEnd = useCallback(() => {
    dragStateRef.current.isDragging = false
    document.removeEventListener('mousemove', handleDragMove)
    document.removeEventListener('mouseup', handleDragEnd)
  }, [])

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (selectedBatchJob && event.key === 'Escape') {
      setSelectedBatchJob(null)
      setIsFullWidth(false)
    }
  }, [selectedBatchJob])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  const handleActionClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
  }

  useEffect(() => {
    if (!accountId) return;

    const subscriptions: { unsubscribe: () => void }[] = [];

    try {
      if (dataClient.models.BatchJob) {
        const handleBatchUpdate = async (data: Schema['BatchJob']['type']) => {
          if (!accountId) return;
          
          const { data: updatedBatchJobs } = await listBatchJobs(accountId);
          if (!updatedBatchJobs) return;

          const transformedBatchJobs = updatedBatchJobs.map(job => ({
            ...job,
            completedRequests: job.completedRequests ?? 0
          }));
          
          const transformedJobs = await loadRelatedData(transformedBatchJobs);
          setBatchJobs(transformedJobs);
        };

        const handleError = (error: unknown) => {
          console.error('Error:', error);
          setError(error instanceof Error ? error : new Error(String(error)));
        };

        const createSub = dataClient.models.BatchJob.onCreate().subscribe({
          next: (value) => handleBatchUpdate(value as Schema['BatchJob']['type']),
          error: handleError
        });

        const updateSub = dataClient.models.BatchJob.onUpdate().subscribe({
          next: (value) => handleBatchUpdate(value as Schema['BatchJob']['type']),
          error: handleError
        });

        subscriptions.push(createSub, updateSub);
      }
    } catch (error) {
      handleError(error);
    }

    return () => {
      subscriptions.forEach(sub => sub.unsubscribe());
    };
  }, [accountId]);

  const handleBatchJobClick = (job: BatchJobWithCount) => {
    setSelectedBatchJob(job)
  }

  const handleBatchJobClose = () => {
    setSelectedBatchJob(null)
    setIsFullWidth(false)
  }

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const { data: accounts } = await listAccounts();
        if (!accounts?.length) {
          setIsLoading(false);
          return;
        }

        const foundAccountId = accounts[0].id;
        setAccountId(foundAccountId);

        const { data: batchJobs } = await listBatchJobs(foundAccountId);
        if (!batchJobs) {
          setIsLoading(false);
          return;
        }

        const transformedBatchJobs = batchJobs.map(job => ({
          ...job,
          completedRequests: typeof job.completedRequests === 'number' ? 
            job.completedRequests : 0
        }));

        const transformedJobs = await loadRelatedData(transformedBatchJobs);
        setBatchJobs(transformedJobs);
        setIsLoading(false);

      } catch (error) {
        console.error('Error loading initial data:', error);
        setError(error instanceof Error ? error : new Error('Failed to load initial data'));
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, []); // Run once on mount

  if (isLoading) {
    return <div>Loading...</div>
  }

  if (error) {
    return <div>Error: {error.message}</div>
  }

  return (
    <div className="h-full flex flex-col" ref={containerRef}>
      <div className={`flex ${isNarrowViewport ? 'flex-col' : ''} flex-1 h-full w-full`}>
        <div 
          className={`
            flex flex-col
            ${isFullWidth ? 'hidden' : ''} 
            ${(!selectedBatchJob || !isNarrowViewport) ? 'flex h-full' : 'hidden'}
            ${(!selectedBatchJob || isNarrowViewport) ? 'w-full' : ''}
          `}
          style={!isNarrowViewport && selectedBatchJob && !isFullWidth ? {
            width: `${leftPanelWidth}%`
          } : undefined}
        >
          <div className="p-2">
            <div className="space-y-4">
              <div className="@container">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40%]">Batch</TableHead>
                      <TableHead className="w-[30%] hidden @[800px]:table-cell">Type</TableHead>
                      <TableHead className="w-[30%] hidden @[500px]:table-cell">Progress</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {batchJobs.map((job) => (
                      <TableRow 
                        key={job.id}
                        onClick={() => handleBatchJobClick(job)}
                        className={`cursor-pointer transition-colors duration-200 
                          ${job.id === selectedBatchJob?.id ? 'bg-muted' : 'hover:bg-muted'}`}
                      >
                        <TableCell>
                          {/* Mobile variant - visible when container is narrow */}
                          <div className="block @[500px]:hidden">
                            <div className="flex flex-col space-y-2">
                              <div className="space-y-0.5">
                                <div className="font-semibold truncate">
                                  <span className={job.id === selectedBatchJob?.id ? 'text-focus' : ''}>
                                    {job.scorecard?.name || 'Unknown Scorecard'}
                                  </span>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {job.score?.name || 'Unknown Score'}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {formatTimeAgo(job.createdAt)}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  <div>{job.type}</div>
                                  <div>{job.modelProvider}</div>
                                  <div>{job.modelName}</div>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <BatchJobProgressBar 
                                  status={job.status as BatchJobStatus}
                                />
                                <ProgressBar 
                                  progress={getProgressPercentage(job)}
                                  processedItems={job.completedRequests ?? 0}
                                  totalItems={job.scoringJobCountCache ?? 0}
                                  color="secondary"
                                  isFocused={job.id === selectedBatchJob?.id}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Tablet variant - visible at medium container widths */}
                          <div className="hidden @[500px]:block @[800px]:hidden">
                            <div className="font-semibold">
                              <span className={job.id === selectedBatchJob?.id ? 'text-focus' : ''}>
                                {job.scorecard?.name || 'Unknown Scorecard'}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {job.score?.name || 'Unknown Score'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatTimeAgo(job.createdAt)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <div>{job.type}</div>
                              <div>{job.modelProvider}</div>
                              <div>{job.modelName}</div>
                            </div>
                          </div>

                          {/* Desktop variant - visible at wide container widths */}
                          <div className="hidden @[800px]:block">
                            <div className="font-semibold">
                              <span className={job.id === selectedBatchJob?.id ? 'text-focus' : ''}>
                                {job.scorecard?.name || 'Unknown Scorecard'}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {job.score?.name || 'Unknown Score'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {formatTimeAgo(job.createdAt)}
                            </div>
                          </div>
                        </TableCell>

                        {/* Type column - visible at wide container widths */}
                        <TableCell className="hidden @[800px]:table-cell">
                          <div className="flex flex-col text-sm text-muted-foreground">
                            <div>{job.type}</div>
                            <div>{job.modelProvider}</div>
                            <div>{job.modelName}</div>
                          </div>
                        </TableCell>

                        {/* Progress column - visible at medium and wide container widths */}
                        <TableCell className="hidden @[500px]:table-cell">
                          <div className="space-y-2">
                            <BatchJobProgressBar 
                              status={job.status as BatchJobStatus}
                            />
                            <ProgressBar 
                              progress={getProgressPercentage(job)}
                              processedItems={job.completedRequests ?? 0}
                              totalItems={job.scoringJobCountCache ?? 0}
                              color="secondary"
                              isFocused={job.id === selectedBatchJob?.id}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>

        {selectedBatchJob && !isNarrowViewport && !isFullWidth && (
          <div
            className="w-2 relative cursor-col-resize flex-shrink-0 group"
            onMouseDown={handleDragStart}
          >
            <div className="absolute inset-0 rounded-full transition-colors duration-150 
              group-hover:bg-accent" />
          </div>
        )}

        {selectedBatchJob && (
          <div className={`
            flex flex-col flex-1 
            ${isNarrowViewport || isFullWidth ? 'w-full' : ''}
            h-full
          `}
          style={!isNarrowViewport && !isFullWidth ? {
            width: `${100 - leftPanelWidth}%`
          } : undefined}>
            <BatchJobTask
              variant="detail"
              task={{
                id: selectedBatchJob.id,
                type: selectedBatchJob.type,
                scorecard: '',
                score: '',
                time: selectedBatchJob.completedAt || selectedBatchJob.startedAt || new Date().toISOString(),
                summary: `${getProgressPercentage(selectedBatchJob)}% complete`,
                description: selectedBatchJob.errorMessage || undefined,
                data: {
                  id: selectedBatchJob.id,
                  type: selectedBatchJob.type,
                  status: selectedBatchJob.status,
                  totalRequests: selectedBatchJob.scoringJobCountCache || 0,
                  completedRequests: selectedBatchJob.completedRequests || 0,
                  failedRequests: selectedBatchJob.failedRequests || 0,
                  startedAt: selectedBatchJob.startedAt || null,
                  estimatedEndAt: selectedBatchJob.estimatedEndAt || null,
                  completedAt: selectedBatchJob.completedAt || null,
                  errorMessage: selectedBatchJob.errorMessage || null,
                  errorDetails: selectedBatchJob.errorDetails || {},
                  modelProvider: selectedBatchJob.modelProvider,
                  modelName: selectedBatchJob.modelName,
                  scoringJobs: []
                }
              }}
              isFullWidth={isFullWidth}
              onToggleFullWidth={() => setIsFullWidth(!isFullWidth)}
              onClose={handleBatchJobClose}
            />
          </div>
        )}
      </div>
    </div>
  )
} 