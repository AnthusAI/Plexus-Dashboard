"use client"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus, X, Square, RectangleVertical, ChevronUp, ChevronDown, Pencil } from "lucide-react"
import { amplifyClient } from "@/utils/amplify-client"
import { generateClient as generateGraphQLClient } from '@aws-amplify/api'
import type { Schema } from "@/amplify/data/resource"
import { EditableField } from "@/components/ui/editable-field"
import { ScoreItem } from "../score-item"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { CardButton } from '@/components/CardButton'

const graphqlClient = generateGraphQLClient()

interface ScorecardFormProps {
  scorecard: Schema['Scorecard']['type'] | null
  accountId: string
  onSave: () => void
  onCancel: () => void
  isFullWidth?: boolean
  onToggleWidth?: () => void
  isNarrowViewport?: boolean
}

interface FormData {
  id?: string
  name: string
  key: string
  description: string
  accountId: string
  externalId: string
  sections: Array<{
    id?: string
    name: string
    order: number
    scores: Array<{
      id: string
      name: string
      type: string
      order: number
      accuracy: number
      version: string
      timestamp: Date
      aiProvider?: string
      aiModel?: string
      isFineTuned?: boolean
      configuration?: any
      distribution: Array<{ category: string; value: number }>
      versionHistory: Array<{
        version: string
        parent: string | null
        timestamp: Date
        accuracy: number
        distribution: Array<{ category: string; value: number }>
      }>
    }>
  }>
}

interface DistributionItem {
  category: string
  value: number
}

interface VersionHistoryItem {
  version: string
  parent: string | null
  timestamp: Date | string
  accuracy: number
  distribution: DistributionItem[]
}

export function ScorecardForm({ 
  scorecard, 
  accountId, 
  onSave, 
  onCancel,
  isFullWidth = false,
  onToggleWidth,
  isNarrowViewport = false
}: ScorecardFormProps) {
  const [formData, setFormData] = useState<FormData>(() => initializeFormData(scorecard, accountId))
  const [sectionToDelete, setSectionToDelete] = useState<number | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (scorecard) {
      setFormData(initializeFormData(scorecard, accountId))
    }
  }, [scorecard, accountId])

  useEffect(() => {
    async function loadSections() {
      if (scorecard) {
        console.log('ScorecardForm received scorecard:', scorecard)
        const sectionsResult = await scorecard.sections()
        console.log('Loaded sections:', sectionsResult)
        
        if (sectionsResult.data) {
          // Load sections with their scores
          const sectionsWithScores = await Promise.all(
            sectionsResult.data.map(async section => {
              const scoresResult = await section.scores()
              console.log(`Loaded scores for section ${section.id}:`, scoresResult)
              
              return {
                id: section.id,
                name: section.name,
                order: section.order,
                scores: scoresResult.data?.map(score => ({
                  id: score.id,
                  name: score.name,
                  type: score.type,
                  order: score.order,
                  accuracy: score.accuracy ?? 0,
                  version: score.version ?? Date.now().toString(),
                  timestamp: new Date(score.createdAt ?? Date.now()),
                  aiProvider: score.aiProvider ?? undefined,
                  aiModel: score.aiModel ?? undefined,
                  isFineTuned: score.isFineTuned ?? false,
                  configuration: score.configuration ?? {},
                  distribution: Array.isArray(score.distribution) 
                    ? score.distribution.map((d: DistributionItem) => ({
                        category: String(d.category),
                        value: Number(d.value)
                      }))
                    : [],
                  versionHistory: Array.isArray(score.versionHistory)
                    ? score.versionHistory.map((v: VersionHistoryItem) => ({
                        version: String(v.version),
                        parent: v.parent ? String(v.parent) : null,
                        timestamp: new Date(v.timestamp),
                        accuracy: Number(v.accuracy),
                        distribution: Array.isArray(v.distribution)
                          ? v.distribution.map((d: DistributionItem) => ({
                              category: String(d.category),
                              value: Number(d.value)
                            }))
                          : []
                      }))
                    : []
                })) ?? []
              }
            })
          )
          
          // Update formData with sections and their scores
          setFormData(prevData => ({
            ...prevData,
            sections: sectionsWithScores
          }))
        }
      }
    }
    
    loadSections()
  }, [scorecard])

  function initializeFormData(scorecard: Schema['Scorecard']['type'] | null, accountId: string): FormData {
    console.log('Initializing form data with scorecard:', scorecard)
    
    const defaultData: FormData = {
      name: "",
      key: "",
      description: "",
      accountId,
      externalId: "",
      sections: []
    }

    if (!scorecard) return defaultData

    return {
      id: scorecard.id,
      name: scorecard.name,
      key: scorecard.key,
      description: scorecard.description ?? "",
      externalId: scorecard.externalId,
      accountId,
      sections: []  // We'll load sections through the useEffect
    }
  }

  async function handleSave() {
    if (!formData || !accountId) {
      console.log('Missing formData or accountId:', { formData, accountId })
      return
    }
    
    try {
      setIsSaving(true)
      console.log('Starting save with formData:', formData)
      let scorecardId: string
      
      if (!formData.id) {
        console.log('Creating new scorecard...')
        const scorecardResult = await amplifyClient.Scorecard.create({
          name: formData.name,
          key: formData.key,
          externalId: formData.externalId,
          description: formData.description,
          accountId: formData.accountId
        })
        
        if (!scorecardResult.data) {
          throw new Error('Failed to create scorecard')
        }
        scorecardId = scorecardResult.data.id
        
        // Create sections and their scores
        for (const section of formData.sections) {
          const sectionResult = await amplifyClient.ScorecardSection.create({
            name: section.name,
            order: section.order,
            scorecardId: scorecardId
          })
          
          if (!sectionResult.data) {
            throw new Error('Failed to create section')
          }
          
          // Create scores for this section
          for (const score of section.scores) {
            await amplifyClient.Score.create({
              name: score.name,
              type: score.type,
              order: score.order,
              sectionId: sectionResult.data.id,
              accuracy: score.accuracy,
              version: score.version,
              aiProvider: score.aiProvider,
              aiModel: score.aiModel,
              isFineTuned: score.isFineTuned,
              configuration: score.configuration ?? {},
              distribution: score.distribution ?? [],
              versionHistory: score.versionHistory ?? []
            })
          }
        }
      } else {
        console.log('Updating existing scorecard:', formData.id)
        scorecardId = formData.id
        
        const updateResult = await amplifyClient.Scorecard.update({
          id: scorecardId,
          name: formData.name,
          key: formData.key,
          externalId: formData.externalId,
          description: formData.description
        })
        console.log('Scorecard update result:', updateResult)
        
        // Get existing sections and their scores to handle deletions
        const existingSections = await amplifyClient.ScorecardSection.list({
          filter: { scorecardId: { eq: scorecardId } }
        })
        
        // Create Set of current section IDs for easy lookup
        const currentSectionIds = new Set(formData.sections.map(s => s.id))
        
        // Delete sections that are no longer in formData
        for (const section of existingSections.data) {
          if (!currentSectionIds.has(section.id)) {
            console.log('Deleting section:', section.id)
            // First delete all scores in this section
            const sectionScores = await amplifyClient.Score.list({
              filter: { sectionId: { eq: section.id } }
            })
            for (const score of sectionScores.data) {
              await amplifyClient.Score.delete({
                id: score.id
              })
            }
            // Then delete the section
            await amplifyClient.ScorecardSection.delete({
              id: section.id
            })
          } else {
            // For sections we're keeping, check for deleted scores
            const existingScores = await amplifyClient.Score.list({
              filter: { sectionId: { eq: section.id } }
            })
            
            const formSection = formData.sections.find(s => s.id === section.id)
            const currentScoreIds = new Set(formSection?.scores.map(s => s.id) ?? [])
            
            // Delete scores that are no longer in the form
            for (const score of existingScores.data) {
              if (!currentScoreIds.has(score.id)) {
                console.log('Deleting score:', score.id)
                await amplifyClient.Score.delete({
                  id: score.id
                })
              }
            }
          }
        }
        
        // Handle sections and scores updates
        console.log('Processing sections:', formData.sections)
        for (const section of formData.sections) {
          let sectionId: string
          
          if (section.id) {
            // Update existing section
            const updateResult = await amplifyClient.ScorecardSection.update({
              id: section.id,
              name: section.name,
              order: section.order
            })
            sectionId = section.id
          } else {
            // Create new section
            const sectionResult = await amplifyClient.ScorecardSection.create({
              name: section.name,
              order: section.order,
              scorecardId: scorecardId
            })
            if (!sectionResult.data) {
              throw new Error('Failed to create section')
            }
            sectionId = sectionResult.data.id
          }
          
          // Handle scores for this section
          console.log('Processing scores for section:', sectionId, section.scores)
          for (const score of section.scores) {
            if (score.id && !score.id.startsWith('temp_')) {
              console.log('Updating existing score:', score.id)
              const updateResult = await amplifyClient.Score.update({
                id: score.id,
                name: score.name,
                type: score.type,
                order: score.order,
                sectionId: sectionId,
                accuracy: score.accuracy,
                version: score.version,
                aiProvider: score.aiProvider,
                aiModel: score.aiModel,
                isFineTuned: score.isFineTuned,
                configuration: score.configuration ? JSON.parse(JSON.stringify(score.configuration)) : {},
                distribution: score.distribution ? JSON.parse(JSON.stringify(score.distribution)) : [],
                versionHistory: score.versionHistory ? JSON.parse(JSON.stringify(score.versionHistory)) : []
              })
              console.log('Score update result:', updateResult)
            } else {
              console.log('Creating new score for section:', sectionId)
              try {
                // Start with just the required fields
                const basicScoreData = {
                  name: score.name || 'New Score',
                  type: score.type || 'Boolean',
                  order: Math.floor(Number(score.order) || 0),
                  sectionId
                }

                console.log('Attempting score creation with basic data:', JSON.stringify(basicScoreData, null, 2))

                try {
                  // First try with just required fields
                  const createResult = await amplifyClient.Score.create(basicScoreData)
                  
                  if (!createResult.data) {
                    console.error('Basic score creation failed:', createResult)
                    throw new Error('Failed to create score with basic data')
                  }

                  // If basic creation succeeds, update with additional fields
                  const scoreId = createResult.data.id
                  console.log('Basic score created with ID:', scoreId)

                  const updateData = {
                    id: scoreId,
                    name: score.name || 'New Score',
                    type: score.type || 'Boolean',
                    order: Math.floor(Number(score.order) || 0),
                    sectionId,
                    ...(typeof score.accuracy === 'number' && { accuracy: score.accuracy }),
                    ...(score.version && { version: String(score.version) }),
                    ...(score.aiProvider && { aiProvider: String(score.aiProvider) }),
                    ...(score.aiModel && { aiModel: String(score.aiModel) }),
                    ...(typeof score.isFineTuned === 'boolean' && { isFineTuned: score.isFineTuned }),
                    ...(Object.keys(score.configuration || {}).length > 0 && { 
                      configuration: score.configuration 
                    }),
                    ...(score.distribution?.length > 0 && { 
                      distribution: score.distribution.map(d => ({
                        category: String(d.category),
                        value: Number(d.value)
                      }))
                    }),
                    ...(score.versionHistory?.length > 0 && { 
                      versionHistory: score.versionHistory.map(v => ({
                        version: String(v.version),
                        parent: v.parent ? String(v.parent) : null,
                        timestamp: new Date(v.timestamp).toISOString(),
                        accuracy: Number(v.accuracy),
                        distribution: v.distribution?.map(d => ({
                          category: String(d.category),
                          value: Number(d.value)
                        })) || []
                      }))
                    })
                  }

                  console.log('Updating score with additional data:', JSON.stringify(updateData, null, 2))
                  
                  const updateResult = await amplifyClient.Score.update(updateData)
                  console.log('Score update result:', updateResult)

                  if (!updateResult.data) {
                    console.error('Score update failed:', updateResult)
                    throw new Error('Failed to update score with additional data')
                  }

                  // Update formData with the real ID
                  const sectionIndex = formData.sections.findIndex(s => s.id === sectionId)
                  if (sectionIndex !== -1) {
                    const scoreIndex = formData.sections[sectionIndex].scores.findIndex(
                      s => s.id === score.id
                    )
                    if (scoreIndex !== -1) {
                      formData.sections[sectionIndex].scores[scoreIndex].id = scoreId
                    }
                  }

                } catch (error) {
                  // Log the full error details
                  console.error('Score creation error details:', {
                    error,
                    message: error instanceof Error ? error.message : 'Unknown error',
                    stack: error instanceof Error ? error.stack : undefined,
                    // @ts-ignore - checking for GraphQL error structure
                    errors: error.errors ? error.errors : undefined
                  })
                  throw error
                }
              } catch (error) {
                console.error('Error in score creation block:', error)
                if (error instanceof Error) {
                  throw new Error(`Failed to create score: ${error.message}`)
                }
                throw error
              }
            }
          }
        }
      }
      
      // Wait for all updates to complete and data to sync
      await new Promise(resolve => setTimeout(resolve, 500))
      console.log('Save completed successfully')
      onSave()
    } catch (error: unknown) {
      console.error('Error saving scorecard:', error)
      if (error && typeof error === 'object' && 'errors' in error) {
        console.error('Validation errors:', (error as { errors: unknown[] }).errors)
      }
      throw error
    } finally {
      setIsSaving(false)
    }
  }

  const handleAddSection = () => {
    const maxOrder = Math.max(0, ...formData.sections.map(s => s.order))
    const newSection = {
      name: "New section",
      order: maxOrder + 1,
      scores: []
    }
    setFormData({
      ...formData,
      sections: [...formData.sections, newSection]
    })
  }

  const handleAddScore = (sectionIndex: number) => {
    const baseAccuracy = Math.floor(Math.random() * 30) + 60
    const section = formData.sections[sectionIndex]
    const maxOrder = Math.max(0, ...section.scores.map(s => s.order))
    const now = new Date()
    
    const newScore = {
      id: `temp_${Date.now()}`,
      name: "New Score",
      type: "Boolean",
      order: maxOrder + 1,
      accuracy: baseAccuracy,
      version: Date.now().toString(),
      timestamp: now,
      aiProvider: "OpenAI",
      aiModel: "gpt-4-turbo",
      isFineTuned: false,
      configuration: {},
      distribution: [
        { category: "Positive", value: baseAccuracy },
        { category: "Negative", value: 100 - baseAccuracy }
      ],
      versionHistory: [{
        version: Date.now().toString(),
        parent: null,
        timestamp: now,
        accuracy: baseAccuracy,
        distribution: [
          { category: "Positive", value: baseAccuracy },
          { category: "Negative", value: 100 - baseAccuracy }
        ]
      }]
    }
    const updatedScoreDetails = [...formData.sections]
    updatedScoreDetails[sectionIndex].scores.push(newScore)
    setFormData({
      ...formData,
      sections: updatedScoreDetails
    })
  }

  // Add this function to test direct GraphQL update
  async function testGraphQLUpdate() {
    if (!scorecard?.id) return;
    
    try {
      const updateMutation = `
        mutation UpdateScorecard($input: UpdateScorecardInput!) {
          updateScorecard(input: $input) {
            id
            foreignId
          }
        }
      `;

      const variables = {
        input: {
          id: scorecard.id,
          foreignId: "test123"
        }
      };

      console.log('Testing GraphQL update:', variables);
      const response = await graphqlClient.graphql({ 
        query: updateMutation,
        variables 
      });
      console.log('GraphQL response:', response);
    } catch (error) {
      console.error('GraphQL update failed:', error);
    }
  }

  const handleMoveSection = (index: number, direction: 'up' | 'down') => {
    const newSections = [...formData.sections]
    const newIndex = direction === 'up' ? index - 1 : index + 1
    
    // Swap sections
    const temp = newSections[index]
    newSections[index] = newSections[newIndex]
    newSections[newIndex] = temp
    
    // Update order values
    newSections[index].order = index
    newSections[newIndex].order = newIndex
    
    setFormData({
      ...formData,
      sections: newSections
    })
  }

  const handleDeleteSection = (sectionIndex: number) => {
    const updatedSections = [...formData.sections]
    updatedSections.splice(sectionIndex, 1)
    // Update order values for remaining sections
    updatedSections.forEach((section, index) => {
      section.order = index
    })
    setFormData({
      ...formData,
      sections: updatedSections
    })
    setSectionToDelete(null)
  }

  return (
    <div className="border text-card-foreground shadow rounded-lg h-full flex flex-col bg-card-light border-none">
      {/* Header */}
      <div className="flex-shrink-0 bg-card rounded-t-lg">
        <div className="px-6 py-4 flex items-center justify-between">
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="text-3xl font-semibold bg-background border-0 px-2 h-auto 
                       focus-visible:ring-0 focus-visible:ring-offset-0 
                       placeholder:text-muted-foreground rounded-md flex-1 mr-4"
            placeholder="Scorecard Name"
          />
          <div className="flex items-center space-x-2">
            {!isNarrowViewport && onToggleWidth && (
              <CardButton
                icon={isFullWidth ? RectangleVertical : Square}
                onClick={onToggleWidth}
              />
            )}
            <CardButton
              icon={X}
              onClick={onCancel}
            />
          </div>
        </div>
        <div className="px-6 pb-6">
          <div className="flex gap-4">
            <Input
              value={formData.externalId ?? ''}
              onChange={(e) => setFormData({ ...formData, externalId: e.target.value })}
              className="font-mono bg-background border-0 px-2 h-auto 
                         focus-visible:ring-0 focus-visible:ring-offset-0 
                         placeholder:text-muted-foreground rounded-md"
              placeholder="External ID"
            />
            <Input
              value={formData.key}
              onChange={(e) => setFormData({ ...formData, key: e.target.value })}
              className="font-mono bg-background border-0 px-2 h-auto 
                         focus-visible:ring-0 focus-visible:ring-offset-0 
                         placeholder:text-muted-foreground rounded-md"
              placeholder="scorecard-key"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
        <div className="space-y-8">
          {/* Sections list */}
          <div className="space-y-8">
            {formData.sections.map((section, sectionIndex) => (
              <div key={sectionIndex}>
                <div className="flex justify-between items-center mb-2">
                  <EditableField
                    value={section.name}
                    onChange={(value: string) => {
                      const updatedScoreDetails = [...formData.sections]
                      updatedScoreDetails[sectionIndex] = { ...section, name: value }
                      setFormData({ ...formData, sections: updatedScoreDetails })
                    }}
                    className="text-2xl font-semibold"
                  />
                  <div className="flex items-center gap-2">
                    <CardButton
                      icon={X}
                      onClick={() => setSectionToDelete(sectionIndex)}
                    />
                    <CardButton
                      icon={ChevronUp}
                      onClick={() => handleMoveSection(sectionIndex, 'up')}
                    />
                    <CardButton
                      icon={ChevronDown}
                      onClick={() => handleMoveSection(sectionIndex, 'down')}
                    />
                    <CardButton
                      icon={Plus}
                      label="Create Score"
                      onClick={() => handleAddScore(sectionIndex)}
                    />
                  </div>
                </div>
                <hr className="mb-4" />
                <div>
                  {section.scores.map((score, scoreIndex) => (
                    <ScoreItem
                      key={scoreIndex}
                      score={score}
                      scorecardId={formData.id!}
                      onEdit={(updatedScore) => {
                        const updatedScoreDetails = [...formData.sections]
                        updatedScoreDetails[sectionIndex].scores[scoreIndex] = {
                          ...score,
                          ...updatedScore
                        }
                        setFormData({ ...formData, sections: updatedScoreDetails })
                      }}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Create Section button at bottom */}
          <div className="flex justify-end">
            <CardButton
              icon={Plus}
              label="Create Section"
              onClick={handleAddSection}
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex-shrink-0 p-6 bg-card rounded-b-lg">
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={handleSave}>Save Scorecard</Button>
        </div>
      </div>

      <AlertDialog 
        open={sectionToDelete !== null} 
        onOpenChange={() => setSectionToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Section</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this section? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                if (sectionToDelete !== null) {
                  handleDeleteSection(sectionToDelete)
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}