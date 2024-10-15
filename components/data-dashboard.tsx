"use client"

import React from "react"
import { useState, useMemo, useEffect, useRef } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { MoreHorizontal, Sparkles, MessageCircleMore, X, Square, Columns2, ChevronDown, ChevronUp, Info, SmileIcon, FrownIcon, FlaskConical } from "lucide-react"
import { format, formatDistanceToNow, parseISO, subMinutes, subHours, subDays } from "date-fns"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TimeRangeSelector } from "@/components/time-range-selector"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import ReactMarkdown from 'react-markdown'
import Link from 'next/link'

// Function to create a date relative to now
const relativeDate = (days: number, hours: number, minutes: number) => {
  const now = new Date();
  return subMinutes(subHours(subDays(now, days), hours), minutes).toISOString();
};

// Function to generate random results
const generateRandomResult = () => {
  const answer = Math.random() < 0.5 ? "Yes" : "No"
  const isCorrect = Math.random() < 0.7 // 70% chance of being correct
  return { answer, isCorrect }
}

// Generate initial items with sample data
const generateInitialItems = () => {
  return [
    { id: "40000001", scorecard: "CS3 Services v2", score: 80, date: relativeDate(0, 0, 5), status: "new", results: 0, inferences: 0, cost: "$0.000", result: generateRandomResult() },
    { id: "40000002", scorecard: "CS3 Audigy", score: 89, date: relativeDate(0, 0, 15), status: "new", results: 0, inferences: 0, cost: "$0.000", result: generateRandomResult() },
    { id: "40000003", scorecard: "AW IB Sales", score: 96, date: relativeDate(0, 0, 30), status: "new", results: 0, inferences: 0, cost: "$0.000", result: generateRandomResult() },
    { id: "40000004", scorecard: "CS3 Nexstar v1", score: 88, date: relativeDate(0, 1, 0), status: "error", results: 2, inferences: 4, cost: "$0.005", result: generateRandomResult() },
    { id: "40000005", scorecard: "SelectQuote Term Life v1", score: 83, date: relativeDate(0, 1, 30), status: "scoring...", results: 6, inferences: 24, cost: "$0.031", result: generateRandomResult() },
    { id: "40000006", scorecard: "AW IB Sales", score: 94, date: relativeDate(0, 2, 0), status: "scored", results: 19, inferences: 152, cost: "$0.199", result: generateRandomResult() },
    { id: "40000007", scorecard: "CS3 Audigy", score: 86, date: relativeDate(0, 3, 0), status: "scored", results: 17, inferences: 68, cost: "$0.089", result: generateRandomResult() },
    { id: "40000008", scorecard: "CS3 Services v2", score: 79, date: relativeDate(0, 4, 0), status: "scored", results: 16, inferences: 32, cost: "$0.042", result: generateRandomResult() },
    { id: "40000009", scorecard: "CS3 Nexstar v1", score: 91, date: relativeDate(0, 5, 0), status: "scored", results: 17, inferences: 68, cost: "$0.089", result: generateRandomResult() },
    { id: "40000010", scorecard: "SelectQuote Term Life v1", score: 89, date: relativeDate(0, 6, 0), status: "scored", results: 13, inferences: 52, cost: "$0.068", result: generateRandomResult() },
    { id: "40000011", scorecard: "CS3 Services v2", score: 82, date: relativeDate(1, 0, 0), status: "scored", results: 15, inferences: 30, cost: "$0.039", result: generateRandomResult() },
    { id: "40000012", scorecard: "AW IB Sales", score: 93, date: relativeDate(1, 2, 0), status: "scored", results: 18, inferences: 144, cost: "$0.188", result: generateRandomResult() },
    { id: "40000013", scorecard: "CS3 Audigy", score: 87, date: relativeDate(1, 4, 0), status: "scored", results: 16, inferences: 64, cost: "$0.084", result: generateRandomResult() },
    { id: "40000014", scorecard: "SelectQuote Term Life v1", score: 85, date: relativeDate(1, 6, 0), status: "scored", results: 14, inferences: 56, cost: "$0.073", result: generateRandomResult() },
    { id: "40000015", scorecard: "CS3 Nexstar v1", score: 90, date: relativeDate(1, 8, 0), status: "scored", results: 18, inferences: 72, cost: "$0.094", result: generateRandomResult() },
    { id: "40000016", scorecard: "CS3 Services v2", score: 81, date: relativeDate(1, 10, 0), status: "scored", results: 17, inferences: 34, cost: "$0.044", result: generateRandomResult() },
    { id: "40000017", scorecard: "AW IB Sales", score: 95, date: relativeDate(1, 12, 0), status: "scored", results: 20, inferences: 160, cost: "$0.209", result: generateRandomResult() },
    { id: "40000018", scorecard: "CS3 Audigy", score: 88, date: relativeDate(1, 14, 0), status: "scored", results: 18, inferences: 72, cost: "$0.094", result: generateRandomResult() },
    { id: "40000019", scorecard: "SelectQuote Term Life v1", score: 84, date: relativeDate(1, 16, 0), status: "scored", results: 15, inferences: 60, cost: "$0.078", result: generateRandomResult() },
    { id: "40000020", scorecard: "CS3 Nexstar v1", score: 92, date: relativeDate(1, 18, 0), status: "scored", results: 19, inferences: 76, cost: "$0.099", result: generateRandomResult() },
    { id: "40000021", scorecard: "CS3 Services v2", score: 83, date: relativeDate(1, 20, 0), status: "scored", results: 18, inferences: 36, cost: "$0.047", result: generateRandomResult() },
    { id: "40000022", scorecard: "AW IB Sales", score: 97, date: relativeDate(1, 22, 0), status: "scored", results: 21, inferences: 168, cost: "$0.219", result: generateRandomResult() },
    { id: "40000023", scorecard: "CS3 Audigy", score: 89, date: relativeDate(2, 0, 0), status: "scored", results: 19, inferences: 76, cost: "$0.099", result: generateRandomResult() },
    { id: "40000024", scorecard: "SelectQuote Term Life v1", score: 86, date: relativeDate(2, 2, 0), status: "scored", results: 16, inferences: 64, cost: "$0.084", result: generateRandomResult() },
    { id: "40000025", scorecard: "CS3 Nexstar v1", score: 93, date: relativeDate(2, 4, 0), status: "scored", results: 20, inferences: 80, cost: "$0.104", result: generateRandomResult() },
    { id: "40000026", scorecard: "CS3 Services v2", score: 84, date: relativeDate(2, 6, 0), status: "scored", results: 19, inferences: 38, cost: "$0.050", result: generateRandomResult() },
    { id: "40000027", scorecard: "AW IB Sales", score: 98, date: relativeDate(2, 8, 0), status: "scored", results: 22, inferences: 176, cost: "$0.230", result: generateRandomResult() },
    { id: "40000028", scorecard: "CS3 Audigy", score: 90, date: relativeDate(2, 10, 0), status: "scored", results: 20, inferences: 80, cost: "$0.104", result: generateRandomResult() },
    { id: "40000029", scorecard: "SelectQuote Term Life v1", score: 87, date: relativeDate(2, 12, 0), status: "scored", results: 17, inferences: 68, cost: "$0.089", result: generateRandomResult() },
    { id: "40000030", scorecard: "CS3 Nexstar v1", score: 94, date: relativeDate(2, 14, 0), status: "scored", results: 21, inferences: 84, cost: "$0.110", result: generateRandomResult() },
    { id: "40000031", scorecard: "CS3 Services v2", score: 85, date: relativeDate(2, 16, 0), status: "scored", results: 20, inferences: 40, cost: "$0.052", result: generateRandomResult() },
    { id: "40000032", scorecard: "AW IB Sales", score: 99, date: relativeDate(2, 18, 0), status: "scored", results: 23, inferences: 184, cost: "$0.240", result: generateRandomResult() },
    { id: "40000033", scorecard: "CS3 Audigy", score: 91, date: relativeDate(2, 20, 0), status: "scored", results: 21, inferences: 84, cost: "$0.110", result: generateRandomResult() },
    { id: "40000034", scorecard: "SelectQuote Term Life v1", score: 88, date: relativeDate(2, 22, 0), status: "scored", results: 18, inferences: 72, cost: "$0.094", result: generateRandomResult() },
    { id: "40000035", scorecard: "CS3 Nexstar v1", score: 95, date: relativeDate(3, 0, 0), status: "scored", results: 22, inferences: 88, cost: "$0.115", result: generateRandomResult() },
    { id: "40000036", scorecard: "CS3 Services v2", score: 86, date: relativeDate(3, 2, 0), status: "scored", results: 21, inferences: 42, cost: "$0.055", result: generateRandomResult() },
    { id: "40000037", scorecard: "AW IB Sales", score: 100, date: relativeDate(3, 4, 0), status: "scored", results: 24, inferences: 192, cost: "$0.251", result: generateRandomResult() },
    { id: "40000038", scorecard: "CS3 Audigy", score: 92, date: relativeDate(3, 6, 0), status: "scored", results: 22, inferences: 88, cost: "$0.115", result: generateRandomResult() },
    { id: "40000039", scorecard: "SelectQuote Term Life v1", score: 89, date: relativeDate(3, 8, 0), status: "scored", results: 19, inferences: 76, cost: "$0.099", result: generateRandomResult() },
    { id: "40000040", scorecard: "CS3 Nexstar v1", score: 96, date: relativeDate(3, 10, 0), status: "scored", results: 23, inferences: 92, cost: "$0.120", result: generateRandomResult() },
  ]
}

const sampleMetadata = [
  { key: "Duration", value: "1022" },
  { key: "Dual Channel", value: "true" },
  { key: "Agent Name", value: "Johnny Appleseed" },
  { key: "Customer ID", value: "CUS-12345" },
  { key: "Call Type", value: "Inbound" },
  { key: "Department", value: "Customer Service" },
  { key: "Language", value: "English" },
  { key: "Recording ID", value: "REC-67890" },
];

const sampleTranscript = [
  { speaker: "Agent", text: "Thank you for calling our customer service. My name is Johnny. How may I assist you today?" },
  { speaker: "Caller", text: "Hi Johnny, I'm calling about an issue with my recent order. It hasn't arrived yet and it's been over a week." },
  { speaker: "Agent", text: "I apologize for the inconvenience. I'd be happy to look into that for you. May I have your order number, please?" },
  { speaker: "Caller", text: "Sure, it's ORDER123456." },
  // ... (add more transcript lines as needed)
];

const sampleScoreResults = [
  {
    section: "Technical",
    scores: [
      { name: "Scoreable Call", value: "Yes", explanation: "The call meets all criteria to be scored. This includes having clear audio, being of sufficient length, and containing relevant content for evaluation." },
      { name: "Call Efficiency", value: "Yes", explanation: `The agent managed the call time effectively while still addressing the customer's needs:

**Proper Call Control:** The agent skillfully guided the conversation, keeping it on track without being abrupt or dismissive.

**Efficient Information Gathering:** The agent asked concise, relevant questions to quickly understand the customer's situation without unnecessary repetition.

**Timely Resolution:** The agent resolved the main issue within an appropriate timeframe, balancing thoroughness with efficiency.

**Effective Use of Tools:** The agent demonstrated proficiency with their systems, quickly accessing and updating information without causing undue delays.

**Appropriate Small Talk:** The agent maintained a friendly demeanor while keeping small talk brief and relevant, striking a good balance between building rapport and maintaining efficiency.` },
    ]
  },
  {
    section: "Sales",
    scores: [
      { name: "Assumptive Close", value: "No", explanation: "The agent did not use an assumptive close technique. Instead, they used a more consultative approach, asking for the customer's decision rather than assuming it." },
      { name: "Problem Resolution", value: "Yes", explanation: `The agent effectively resolved the customer's issue:

**Issue Identification:** The agent quickly and accurately identified the core problem by asking probing questions and actively listening to the customer's responses.

**Knowledge Application:** The agent demonstrated a thorough understanding of the product/service and company policies, applying this knowledge to address the customer's specific situation.

**Step-by-Step Solution:** The agent provided a clear, logical sequence of steps to resolve the issue, ensuring the customer understood each part of the process.

**Confirmation:** The agent verified that the solution met the customer's needs by asking for confirmation and addressing any lingering concerns.

**Future Prevention:** The agent offered advice on how to prevent similar issues in the future, adding value beyond just solving the immediate problem.` },
    ]
  },
  {
    section: "Soft Skills",
    scores: [
      { name: "Rapport", value: "Yes", explanation: `The agent demonstrated excellent rapport-building skills throughout the call:

**Active Listening:** The agent consistently acknowledged the customer's statements and asked relevant follow-up questions, showing they were fully engaged in the conversation.

**Empathy:** The agent expressed understanding and validation of the customer's concerns, using phrases like "I understand how frustrating that must be" and "I can see why that would be important to you."

**Encouragement:** The agent provided positive reinforcement throughout the call, praising the customer's efforts and decisions with comments like "That's a great question" and "You're on the right track."

**Personalization:** The agent tailored their approach to the customer's specific situation, referencing previous interactions and using the customer's name naturally throughout the conversation.` },
      { name: "Friendly Greeting", value: "Yes", explanation: "The agent provided a warm and professional greeting. They used a pleasant tone of voice, introduced themselves clearly, and made the customer feel welcome." },
      { name: "Agent Offered Name", value: "Yes", explanation: "The agent clearly stated their name at the beginning of the call. This was done in a natural and friendly manner, helping to establish a personal connection with the customer." },
      { name: "Temperature Check", value: "Yes", explanation: "The agent asked about the customer's satisfaction during the call. This was done at an appropriate time and in a way that invited honest feedback from the customer." },
    ]
  },
  {
    section: "Compliance",
    scores: [
      { name: "DNC Requested", value: "No", explanation: "The customer did not request to be added to the Do Not Call list. The agent properly handled any questions about contact preferences without any DNC requests being made." },
      { name: "Profanity", value: "No", explanation: "No profanity was detected during the call. Both the agent and the customer maintained professional and respectful language throughout the entire conversation." },
      { name: "Agent Offered Legal Advice", value: "No", explanation: "The agent did not offer any legal advice during the call, which is outside their scope of expertise and could potentially lead to compliance issues." },
      { name: "Agent Offered Guarantees", value: "No", explanation: "The agent did not make any unauthorized guarantees or promises that could be construed as binding commitments by the company." },
    ]
  }
];

const ITEMS_TIME_RANGE_OPTIONS = [
  { value: "recent", label: "Recent" },
  { value: "review", label: "With Feedback" },
  { value: "custom", label: "Custom" },
]

export default function DataDashboard() {
  const [items, setItems] = useState(generateInitialItems)
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const [isFullWidth, setIsFullWidth] = useState(false)
  const [selectedScorecard, setSelectedScorecard] = useState<string | null>(null)
  const [selectedScore, setSelectedScore] = useState<string | null>(null)
  const [isNarrowViewport, setIsNarrowViewport] = useState(false)
  const [isMetadataExpanded, setIsMetadataExpanded] = useState(false)
  const [isDataExpanded, setIsDataExpanded] = useState(false)
  const [expandedExplanations, setExpandedExplanations] = useState<string[]>([])
  const [truncatedExplanations, setTruncatedExplanations] = useState<Record<string, string>>({})
  const [showExpandButton, setShowExpandButton] = useState<Record<string, boolean>>({})
  const textRef = useRef<Record<string, HTMLDivElement | null>>({})

  useEffect(() => {
    const checkViewportWidth = () => {
      setIsNarrowViewport(window.innerWidth < 640)
    }

    checkViewportWidth()
    window.addEventListener('resize', checkViewportWidth)

    return () => window.removeEventListener('resize', checkViewportWidth)
  }, [])

  useEffect(() => {
    const measureHeight = () => {
      const newShowExpandButton: Record<string, boolean> = {}
      Object.keys(textRef.current).forEach((scoreName) => {
        const element = textRef.current[scoreName]
        if (element) {
          const lineHeight = parseInt(window.getComputedStyle(element).lineHeight)
          newShowExpandButton[scoreName] = element.scrollHeight > lineHeight * 2
        }
      })
      setShowExpandButton(newShowExpandButton)
    }

    measureHeight()
    window.addEventListener('resize', measureHeight)
    return () => window.removeEventListener('resize', measureHeight)
  }, [])

  const filteredItems = useMemo(() => {
    return items.filter(item => 
      !selectedScorecard || item.scorecard === selectedScorecard
    )
  }, [selectedScorecard])

  const getRelativeTime = (dateString: string) => {
    const date = parseISO(dateString)
    return formatDistanceToNow(date, { addSuffix: true })
  }

  const handleItemClick = (itemId: string) => {
    setSelectedItem(itemId)
    if (isNarrowViewport) {
      setIsFullWidth(true)
    }
  }

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'new':
      case 'scoring...':
        return 'bg-neutral text-primary-foreground h-6';
      case 'scored':
        return 'bg-true text-primary-foreground h-6';
      case 'error':
        return 'bg-destructive text-primary-foreground dark:text-destructive-foreground h-6';
      default:
        return 'bg-muted text-muted-foreground h-6';
    }
  };

  const handleTimeRangeChange = (range: string, customRange?: { from: Date | undefined; to: Date | undefined }) => {
    console.log("Time range changed:", range, customRange)
    // Implement the logic for handling time range changes
  }

  const handleScorecardChange = (value: string) => {
    const newScorecardValue = value === "all" ? null : value
    setSelectedScorecard(newScorecardValue)
    setSelectedScore(null) // Always reset score selection when scorecard changes
  }

  const toggleExplanation = (scoreName: string) => {
    setExpandedExplanations(prev => 
      prev.includes(scoreName) 
        ? prev.filter(name => name !== scoreName)
        : [...prev, scoreName]
    )
  }

  const renderItemsList = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[35%]">Item</TableHead>
          <TableHead className="w-[20%]">ID</TableHead>
          <TableHead className="w-[15%]">Status</TableHead>
          {selectedScore && <TableHead className="w-[15%]">{selectedScore}</TableHead>}
          <TableHead className={`${selectedScore ? 'w-[15%]' : 'w-[30%]'} text-right`}>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredItems.map((item) => (
          <TableRow 
            key={item.id} 
            onClick={() => handleItemClick(item.id)} 
            className="cursor-pointer transition-colors duration-200 hover:bg-muted"
          >
            <TableCell>
              <div>{item.scorecard}</div>
              <div className="text-sm text-muted-foreground">{getRelativeTime(item.date)}</div>
            </TableCell>
            <TableCell>{item.id}</TableCell>
            <TableCell>
              <Badge className={`${getBadgeVariant(item.status)} w-24 justify-center`}>
                {item.status}
              </Badge>
            </TableCell>
            {selectedScore && (
              <TableCell>
                {item.status === "scored" ? (
                  <div className="flex items-center space-x-2">
                    <Badge 
                      className={`${item.result.isCorrect ? 'bg-true' : 'bg-false'} text-primary-foreground w-16 justify-center h-6`}
                    >
                      {item.result.answer}
                    </Badge>
                    {item.result.isCorrect ? (
                      <SmileIcon className="h-4 w-4 text-true" />
                    ) : (
                      <FrownIcon className="h-4 w-4 text-false" />
                    )}
                  </div>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
            )}
            <TableCell className="text-right">
              <div className="flex justify-end space-x-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <FlaskConical className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Run Experiment</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Sparkles className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Analyze</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MessageCircleMore className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Feedback</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>More</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )

  function renderSelectedItem() {
    const selectedItemData = items.find(item => item.id === selectedItem);
    if (!selectedItemData) return null;

    return (
      <Card className="rounded-none sm:rounded-lg h-full flex flex-col">
        <CardHeader className="flex-shrink-0 flex flex-row items-center justify-between py-4 px-4 sm:px-6 space-y-0">
          <div>
            <h2 className="text-xl font-semibold">{selectedItemData.scorecard}</h2>
            <p className="text-sm text-muted-foreground">
              {getRelativeTime(selectedItemData.date)}
            </p>
          </div>
          <div className="flex ml-2">
            {!isNarrowViewport && (
              <Button variant="outline" size="icon" onClick={() => setIsFullWidth(!isFullWidth)}>
                {isFullWidth ? <Columns2 className="h-4 w-4" /> : <Square className="h-4 w-4" />}
              </Button>
            )}
            <Button variant="outline" size="icon" onClick={() => {
              setSelectedItem(null)
              setIsFullWidth(false)
            }} className="ml-2">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-grow overflow-auto px-4 sm:px-6 pb-4">
          {selectedItem && (
            <div className="space-y-4">
              {/* Metadata Section */}
              <div className="-mx-4 sm:-mx-6">
                <div
                  className="relative group bg-muted hover:bg-accent hover:text-accent-foreground cursor-pointer"
                  onClick={() => setIsMetadataExpanded(!isMetadataExpanded)}
                >
                  <div className="flex justify-between items-center px-4 sm:px-6 py-2">
                    <span className="text-md font-semibold">
                      Metadata
                    </span>
                    {isMetadataExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </div>
              </div>
              {isMetadataExpanded && (
                <div className="mt-2">
                  <Table>
                    <TableBody>
                      {sampleMetadata.map((meta, index) => (
                        <TableRow key={index}>
                          <TableCell className="font-medium pl-0">{meta.key}</TableCell>
                          <TableCell className="text-right pr-0">{meta.value}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
              
              {/* Data Section */}
              <div className="-mx-4 sm:-mx-6">
                <div
                  className="relative group bg-muted hover:bg-accent hover:text-accent-foreground cursor-pointer"
                  onClick={() => setIsDataExpanded(!isDataExpanded)}
                >
                  <div className="flex justify-between items-center px-4 sm:px-6 py-2">
                    <span className="text-md font-semibold">
                      Data
                    </span>
                    {isDataExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </div>
              </div>
              {isDataExpanded && (
                <div className="mt-2">
                  {sampleTranscript.map((line, index) => (
                    <p key={index} className="text-sm">
                      <span className="font-semibold">{line.speaker}: </span>
                      {line.text}
                    </p>
                  ))}
                </div>
              )}
              
              {/* Score Results Section */}
              <div className="-mx-4 sm:-mx-6 mb-4">
                <div className="px-4 sm:px-6 py-2 bg-muted">
                  <h4 className="text-md font-semibold">Score Results</h4>
                </div>
              </div>
              <div>
                {sampleScoreResults.map((section, sectionIndex) => (
                  <div key={sectionIndex} className="mb-6">
                    <div className="-mx-4 sm:-mx-6 mb-4">
                      <div className="px-4 sm:px-6 py-2">
                        <h4 className="text-md font-semibold">{section.section}</h4>
                      </div>
                      <hr className="border-t border-border" />
                    </div>
                    <div>
                      {section.scores.map((score, scoreIndex) => (
                        <React.Fragment key={scoreIndex}>
                          <div className="py-2 border-b last:border-b-0">
                            <div className="flex justify-between items-center mb-1">
                              <div className="flex items-center">
                                <h5 className="text-sm font-medium">{score.name}</h5>
                                <div className="inline-flex items-center ml-1">
                                  <Link href={`/scorecards?score=${encodeURIComponent(score.name)}`} passHref>
                                    <Button variant="ghost" size="sm" className="p-0 h-auto translate-y-[2px]" title={`More info about ${score.name}`}>
                                      <Info className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                  </Link>
                                </div>
                              </div>
                              <Badge className={score.value.toLowerCase() === 'yes' 
                                ? 'bg-true text-primary-foreground w-16 justify-center' 
                                : 'bg-false text-primary-foreground w-16 justify-center'}>
                                {score.value}
                              </Badge>
                            </div>
                            <div className="relative">
                              <div 
                                ref={(el) => textRef.current[score.name] = el}
                                className="text-sm text-muted-foreground overflow-hidden cursor-pointer"
                                style={{ 
                                  display: '-webkit-box',
                                  WebkitLineClamp: '2',
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  ...(expandedExplanations.includes(score.name) ? { WebkitLineClamp: 'unset', display: 'block' } : {})
                                }}
                                onClick={() => toggleExplanation(score.name)}
                              >
                                <ReactMarkdown>{score.explanation}</ReactMarkdown>
                              </div>
                              {showExpandButton[score.name] && (
                                <Button 
                                  variant="link" 
                                  size="sm" 
                                  onClick={() => toggleExplanation(score.name)}
                                  className="absolute bottom-0 right-0 px-0 py-1 h-auto bg-white dark:bg-gray-800"
                                >
                                  {expandedExplanations.includes(score.name) 
                                    ? <ChevronUp className="h-3 w-3 inline ml-1" />
                                    : <ChevronDown className="h-3 w-3 inline ml-1" />
                                  }
                                </Button>
                              )}
                            </div>
                          </div>
                        </React.Fragment>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  const renderActionButtons = () => {
    if (!selectedScore) return null;

    const itemCount = filteredItems.length;

    return (
      <div className="flex justify-between items-center mt-4">
        <h2 className="text-2xl font-semibold pl-2">{itemCount} {itemCount === 1 ? 'Item' : 'Items'}</h2>
        <div className="flex space-x-2">
          <Button onClick={() => console.log("Experiment clicked")}>
            <FlaskConical className="h-4 w-4 mr-2" />
            Run Experiment
          </Button>
          <Button onClick={() => console.log("Analyze clicked")}>
            <Sparkles className="h-4 w-4 mr-2" />
            Analyze
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <Select onValueChange={handleScorecardChange}>
            <SelectTrigger className="w-full sm:w-[280px] border border-secondary">
              <SelectValue placeholder="Scorecard" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Scorecards</SelectItem>
              <SelectItem value="SelectQuote Term Life v1">SelectQuote Term Life v1</SelectItem>
              <SelectItem value="CS3 Nexstar v1">CS3 Nexstar v1</SelectItem>
              <SelectItem value="CS3 Services v2">CS3 Services v2</SelectItem>
              <SelectItem value="CS3 Audigy">CS3 Audigy</SelectItem>
              <SelectItem value="AW IB Sales">AW IB Sales</SelectItem>
            </SelectContent>
          </Select>
          <Select 
            onValueChange={(value) => setSelectedScore(value === "all" ? null : value)}
            disabled={!selectedScorecard}
            value={selectedScore || "all"} // Add this line to control the select value
          >
            <SelectTrigger className="w-full sm:w-[280px] border border-secondary">
              <SelectValue placeholder="Score" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Scores</SelectItem>
              {selectedScorecard && (
                <>
                  <SelectItem value="Good Call">Good Call</SelectItem>
                  <SelectItem value="Agent Branding">Agent Branding</SelectItem>
                  <SelectItem value="Temperature Check">Temperature Check</SelectItem>
                  <SelectItem value="Assumptive Close">Assumptive Close</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>
        <TimeRangeSelector onTimeRangeChange={handleTimeRangeChange} options={ITEMS_TIME_RANGE_OPTIONS} />
      </div>

      {renderActionButtons()}

      <div className="flex-grow flex flex-col overflow-hidden pb-2">
        {selectedItem && (isNarrowViewport || isFullWidth) ? (
          <div className="flex-grow overflow-hidden">
            {renderSelectedItem()}
          </div>
        ) : (
          <div className={`flex ${isNarrowViewport ? 'flex-col' : 'space-x-6'} h-full`}>
            <div className={`${isFullWidth ? 'hidden' : 'flex-1'} overflow-auto`}>
              {renderItemsList()}
            </div>

            {selectedItem && !isNarrowViewport && !isFullWidth && (
              <div className="flex-1 overflow-hidden">
                {renderSelectedItem()}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}