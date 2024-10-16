"use client"
import React from "react"
import { useState, useMemo, useEffect, useRef, useCallback } from "react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Square, Columns2, X, ChevronDown, ChevronUp, Info, MessageCircleMore, Plus, ThumbsUp, ThumbsDown } from "lucide-react"
import { format, formatDistanceToNow, parseISO } from "date-fns"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { TimeRangeSelector, TimeRangeOption } from "@/components/time-range-selector"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import ReactMarkdown from 'react-markdown'
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import Link from 'next/link'
import { FilterControl, FilterConfig } from "@/components/filter-control"

// Get the current date and time
const now = new Date();

// Function to create a date relative to now
const relativeDate = (days: number, hours: number, minutes: number) => {
  const date = new Date(now);
  date.setDate(date.getDate() - days);
  date.setHours(date.getHours() - hours, date.getMinutes() - minutes);
  return date.toISOString();
};

// First, let's define an interface for the item
interface Item {
  id: number;
  scorecard: string;
  score: number;
  date: string;
  status: string;
  results: number;
  inferences: number;
  cost: string;
  scoreResults?: typeof sampleScoreResults;  // Make this optional
}

// Rename this to initialItems
const initialItems: Item[] = [
  { id: 30, scorecard: "CS3 Services v2", score: 80, date: relativeDate(0, 0, 5), status: "New", results: 0, inferences: 0, cost: "$0.000" },
  { id: 29, scorecard: "CS3 Audigy", score: 89, date: relativeDate(0, 0, 15), status: "New", results: 0, inferences: 0, cost: "$0.000" },
  { id: 28, scorecard: "AW IB Sales", score: 96, date: relativeDate(0, 0, 30), status: "New", results: 0, inferences: 0, cost: "$0.000" },
  { id: 27, scorecard: "CS3 Nexstar v1", score: 88, date: relativeDate(0, 1, 0), status: "Error", results: 2, inferences: 4, cost: "$0.005" },
  { id: 26, scorecard: "SelectQuote Term Life v1", score: 83, date: relativeDate(0, 1, 30), status: "Scoring", results: 6, inferences: 24, cost: "$0.031" },
  { id: 25, scorecard: "AW IB Sales", score: 94, date: relativeDate(0, 2, 0), status: "Done", results: 19, inferences: 152, cost: "$0.199" },
  { id: 24, scorecard: "CS3 Audigy", score: 86, date: relativeDate(0, 3, 0), status: "Done", results: 17, inferences: 68, cost: "$0.089" },
  { id: 23, scorecard: "CS3 Services v2", score: 79, date: relativeDate(0, 4, 0), status: "Done", results: 16, inferences: 32, cost: "$0.042" },
  { id: 22, scorecard: "CS3 Nexstar v1", score: 91, date: relativeDate(0, 5, 0), status: "Done", results: 17, inferences: 68, cost: "$0.089" },
  { id: 21, scorecard: "SelectQuote Term Life v1", score: 89, date: relativeDate(0, 6, 0), status: "Done", results: 13, inferences: 52, cost: "$0.068" },
  { id: 20, scorecard: "CS3 Services v2", score: 82, date: relativeDate(1, 0, 0), status: "Done", results: 15, inferences: 30, cost: "$0.039" },
  { id: 19, scorecard: "AW IB Sales", score: 93, date: relativeDate(1, 2, 0), status: "Done", results: 18, inferences: 144, cost: "$0.188" },
  { id: 18, scorecard: "CS3 Audigy", score: 87, date: relativeDate(1, 4, 0), status: "Done", results: 16, inferences: 64, cost: "$0.084" },
  { id: 17, scorecard: "SelectQuote Term Life v1", score: 85, date: relativeDate(1, 6, 0), status: "Done", results: 14, inferences: 56, cost: "$0.073" },
  { id: 16, scorecard: "CS3 Nexstar v1", score: 90, date: relativeDate(1, 8, 0), status: "Done", results: 18, inferences: 72, cost: "$0.094" },
  { id: 15, scorecard: "CS3 Services v2", score: 81, date: relativeDate(1, 10, 0), status: "Done", results: 17, inferences: 34, cost: "$0.044" },
  { id: 14, scorecard: "AW IB Sales", score: 95, date: relativeDate(1, 12, 0), status: "Done", results: 20, inferences: 160, cost: "$0.209" },
  { id: 13, scorecard: "CS3 Audigy", score: 88, date: relativeDate(1, 14, 0), status: "Done", results: 18, inferences: 72, cost: "$0.094" },
  { id: 12, scorecard: "SelectQuote Term Life v1", score: 84, date: relativeDate(1, 16, 0), status: "Done", results: 15, inferences: 60, cost: "$0.078" },
  { id: 11, scorecard: "CS3 Nexstar v1", score: 92, date: relativeDate(1, 18, 0), status: "Done", results: 19, inferences: 76, cost: "$0.099" },
  { id: 10, scorecard: "CS3 Services v2", score: 83, date: relativeDate(1, 20, 0), status: "Done", results: 18, inferences: 36, cost: "$0.047" },
  { id: 9, scorecard: "AW IB Sales", score: 97, date: relativeDate(1, 22, 0), status: "Done", results: 21, inferences: 168, cost: "$0.219" },
  { id: 8, scorecard: "CS3 Audigy", score: 89, date: relativeDate(2, 0, 0), status: "Done", results: 19, inferences: 76, cost: "$0.099" },
  { id: 7, scorecard: "SelectQuote Term Life v1", score: 86, date: relativeDate(2, 2, 0), status: "Done", results: 16, inferences: 64, cost: "$0.084" },
  { id: 6, scorecard: "CS3 Nexstar v1", score: 93, date: relativeDate(2, 4, 0), status: "Done", results: 20, inferences: 80, cost: "$0.104" },
  { id: 5, scorecard: "CS3 Services v2", score: 84, date: relativeDate(2, 6, 0), status: "Done", results: 19, inferences: 38, cost: "$0.050" },
  { id: 4, scorecard: "AW IB Sales", score: 98, date: relativeDate(2, 8, 0), status: "Done", results: 22, inferences: 176, cost: "$0.230" },
  { id: 3, scorecard: "CS3 Audigy", score: 90, date: relativeDate(2, 10, 0), status: "Done", results: 20, inferences: 80, cost: "$0.104" },
  { id: 2, scorecard: "SelectQuote Term Life v1", score: 87, date: relativeDate(2, 12, 0), status: "Done", results: 17, inferences: 68, cost: "$0.089" },
  { id: 1, scorecard: "CS3 Nexstar v1", score: 94, date: relativeDate(2, 14, 0), status: "Done", results: 21, inferences: 84, cost: "$0.110" },
];

// Sort items by date, newest first
initialItems.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

// Sample metadata and data for all items
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
  { speaker: "Agent", text: "Thank you. I'm checking our system now. It looks like there was a slight delay in processing your order due to an inventory issue. However, I can see that it has now been shipped and is on its way to you." },
  { speaker: "Caller", text: "Oh, I see. When can I expect to receive it?" },
  { speaker: "Agent", text: "Based on the shipping information, you should receive your order within the next 2-3 business days. I apologize again for the delay. Is there anything else I can help you with today?" },
  { speaker: "Caller", text: "No, that's all. Thank you for the information." },
  { speaker: "Agent", text: "You're welcome. I appreciate your patience and understanding. If you have any further questions or concerns, please don't hesitate to call us back. Have a great day!" },
  { speaker: "Caller", text: "You too, goodbye." },
  { speaker: "Agent", text: "Goodbye and thank you for choosing our service." },
  { speaker: "Agent", text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat." },
  { speaker: "Caller", text: "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum." },
  { speaker: "Agent", text: "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo." },
  { speaker: "Caller", text: "Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur magni dolores eos qui ratione voluptatem sequi nesciunt." },
  { speaker: "Agent", text: "Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit, sed quia non numquam eius modi tempora incidunt ut labore et dolore magnam aliquam quaerat voluptatem." },
  { speaker: "Caller", text: "Ut enim ad minima veniam, quis nostrum exercitationem ullam corporis suscipit laboriosam, nisi ut aliquid ex ea commodi consequatur?" },
  { speaker: "Agent", text: "Quis autem vel eum iure reprehenderit qui in ea voluptate velit esse quam nihil molestiae consequatur, vel illum qui dolorem eum fugiat quo voluptas nulla pariatur?" },
  { speaker: "Caller", text: "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident." },
  { speaker: "Agent", text: "Similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga. Et harum quidem rerum facilis est et expedita distinctio." },
  { speaker: "Caller", text: "Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus." },
  { speaker: "Agent", text: "Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae. Itaque earum rerum hic tenetur a sapiente delectus." },
  { speaker: "Caller", text: "Ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat." },
];

const ITEMS_TIME_RANGE_OPTIONS: TimeRangeOption[] = [
  { value: "recent", label: "Recent" },
  { value: "review", label: "With Feedback" },
  { value: "custom", label: "Custom" },
]

// Add this to the existing items array or create a new constant
const sampleScoreResults = [
  {
    section: "Technical",
    scores: [
      { name: "Scoreable Call", value: "Yes", explanation: "The call meets all criteria to be scored. This includes having clear audio, being of sufficient length, and containing relevant content for evaluation.", allowFeedback: true },
      { name: "Call Efficiency", value: "Yes", explanation: `The agent managed the call time effectively while still addressing the customer's needs:

**Proper Call Control:** The agent skillfully guided the conversation, keeping it on track without being abrupt or dismissive.

**Efficient Information Gathering:** The agent asked concise, relevant questions to quickly understand the customer's situation without unnecessary repetition.

**Timely Resolution:** The agent resolved the main issue within an appropriate timeframe, balancing thoroughness with efficiency.

**Effective Use of Tools:** The agent demonstrated proficiency with their systems, quickly accessing and updating information without causing undue delays.

**Appropriate Small Talk:** The agent maintained a friendly demeanor while keeping small talk brief and relevant, striking a good balance between building rapport and maintaining efficiency.`, allowFeedback: true },
    ]
  },
  {
    section: "Sales",
    scores: [
      { name: "Assumptive Close", value: "No", explanation: "The agent did not use an assumptive close technique. Instead, they used a more consultative approach, asking for the customer's decision rather than assuming it.", allowFeedback: true },
      { name: "Problem Resolution", value: "Yes", explanation: `The agent effectively resolved the customer's issue:

**Issue Identification:** The agent quickly and accurately identified the core problem by asking probing questions and actively listening to the customer's responses.

**Knowledge Application:** The agent demonstrated a thorough understanding of the product/service and company policies, applying this knowledge to address the customer's specific situation.

**Step-by-Step Solution:** The agent provided a clear, logical sequence of steps to resolve the issue, ensuring the customer understood each part of the process.

**Confirmation:** The agent verified that the solution met the customer's needs by asking for confirmation and addressing any lingering concerns.

**Future Prevention:** The agent offered advice on how to prevent similar issues in the future, adding value beyond just solving the immediate problem.`, allowFeedback: true },
    ]
  },
  {
    section: "Soft Skills",
    scores: [
      { name: "Rapport", value: "Yes", explanation: `The agent demonstrated excellent rapport-building skills throughout the call:

**Active Listening:** The agent consistently acknowledged the customer's statements and asked relevant follow-up questions, showing they were fully engaged in the conversation.

**Empathy:** The agent expressed understanding and validation of the customer's concerns, using phrases like "I understand how frustrating that must be" and "I can see why that would be important to you."

**Encouragement:** The agent provided positive reinforcement throughout the call, praising the customer's efforts and decisions with comments like "That's a great question" and "You're on the right track."

**Personalization:** The agent tailored their approach to the customer's specific situation, referencing previous interactions and using the customer's name naturally throughout the conversation.`, allowFeedback: true },
      { name: "Friendly Greeting", value: "Yes", explanation: "The agent provided a warm and professional greeting. They used a pleasant tone of voice, introduced themselves clearly, and made the customer feel welcome.", allowFeedback: true },
      { name: "Agent Offered Name", value: "Yes", explanation: "The agent clearly stated their name at the beginning of the call. This was done in a natural and friendly manner, helping to establish a personal connection with the customer.", allowFeedback: true },
      { name: "Temperature Check", value: "Yes", explanation: "The agent asked about the customer's satisfaction during the call. This was done at an appropriate time and in a way that invited honest feedback from the customer.", allowFeedback: true },
    ]
  },
  {
    section: "Compliance",
    scores: [
      { name: "DNC Requested", value: "No", explanation: "The customer did not request to be added to the Do Not Call list. The agent properly handled any questions about contact preferences without any DNC requests being made.", allowFeedback: true },
      { 
        name: "Profanity", 
        value: "No", 
        explanation: "No profanity was detected during the call. Both the agent and the customer maintained professional and respectful language throughout the entire conversation.",
        isAnnotated: true,
        annotations: [
          {
            value: "No",
            explanation: "No profanity was detected during the call. Both the agent and the customer maintained professional and respectful language throughout the entire conversation.",
            annotation: "The word 'dangit' is not profanity by our standards.",
            timestamp: relativeDate(0, 0, 5),
            user: {
              name: "Ryan Porter",
              initials: "RP"
            }
          },
          {
            value: "Yes",
            explanation: "Profanity was detected during the call. The agent used the word 'dangit!' which was flagged as potentially inappropriate language.",
            timestamp: relativeDate(0, 0, 10),
            isSystem: true
          }
        ],
        allowFeedback: true
      },
      { name: "Agent Offered Legal Advice", value: "No", explanation: "The agent did not offer any legal advice during the call, which is outside their scope of expertise and could potentially lead to compliance issues.", allowFeedback: true },
      { name: "Agent Offered Guarantees", value: "No", explanation: "The agent did not make any unauthorized guarantees or promises that could be construed as binding commitments by the company.", allowFeedback: true },
    ]
  },
  {
    section: "Computed Scores",
    scores: [
      { 
        name: "Compliance", 
        value: "94%", 
        explanation: "This score represents the overall compliance level of the interaction. It takes into account factors such as adherence to legal requirements, company policies, and industry regulations. A high score indicates that the agent successfully followed compliance guidelines throughout the call.",
        allowFeedback: false
      },
      { 
        name: "Soft Skills", 
        value: "87%", 
        explanation: "This score evaluates the agent's interpersonal abilities and communication effectiveness. It considers aspects such as empathy, active listening, rapport building, and problem-solving skills. A high score suggests that the agent demonstrated strong soft skills, enhancing the overall customer experience.",
        allowFeedback: false
      },
    ]
  },
];

// Define the User interface
interface User {
  name: string;
  initials: string;
}

// Define the Score type
interface Score {
  name: string;
  value: string;
  explanation: string;
  isAnnotated?: boolean;
  annotations?: any[]; // Keep this if you want to store multiple annotations
  annotation?: string; // Add this line if you want to keep a single annotation
  allowFeedback?: boolean;
  isSystem?: boolean;
  timestamp?: string;
  user?: User;
}

const renderRichText = (text: string) => {
  return (
    <ReactMarkdown
      components={{
        p: ({node, ...props}) => <p className="mb-2" {...props} />,
        strong: ({node, ...props}) => <strong className="font-semibold" {...props} />,
        ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-2" {...props} />,
        li: ({node, ...props}) => <li className="mb-1" {...props} />,
      }}
    >
      {text}
    </ReactMarkdown>
  )
}

export default function ItemsDashboard() {
  const [selectedItem, setSelectedItem] = useState<number | null>(null)
  const [isFullWidth, setIsFullWidth] = useState(false)
  const [selectedScorecard, setSelectedScorecard] = useState<string | null>(null)
  const [isNarrowViewport, setIsNarrowViewport] = useState(false)
  const [isMetadataExpanded, setIsMetadataExpanded] = useState(false)
  const [isDataExpanded, setIsDataExpanded] = useState(false)
  const [selectedScore, setSelectedScore] = useState<string | null>(null);
  const [expandedExplanations, setExpandedExplanations] = useState<string[]>([]);
  const [truncatedExplanations, setTruncatedExplanations] = useState<{[key: string]: string}>({});
  const explanationRefs = useRef<{[key: string]: HTMLDivElement | null}>({});
  const [expandedAnnotations, setExpandedAnnotations] = useState<string[]>([]);
  const [newAnnotation, setNewAnnotation] = useState<{ 
    value: string; 
    explanation: string; 
    annotation: string; 
    allowFeedback: boolean; // Include allowFeedback in the type definition
  }>({ value: "", explanation: "", annotation: "", allowFeedback: false });
  const [showNewAnnotationForm, setShowNewAnnotationForm] = useState<string | null>(null);
  const [isErrorExpanded, setIsErrorExpanded] = useState(true);
  const [filterConfig, setFilterConfig] = useState<FilterConfig>([])
  const [showExpandButton, setShowExpandButton] = useState<Record<string, boolean>>({})
  const textRef = useRef<Record<string, HTMLDivElement | null>>({})
  const [thumbedUpScores, setThumbedUpScores] = useState<Set<string>>(new Set());
  const [feedbackItems, setFeedbackItems] = useState<Record<string, any[]>>({});
  const [items, setItems] = useState<Item[]>(initialItems);

  useEffect(() => {
    const checkViewportWidth = () => {
      setIsNarrowViewport(window.innerWidth < 640)
    }

    checkViewportWidth()
    window.addEventListener('resize', checkViewportWidth)

    return () => window.removeEventListener('resize', checkViewportWidth)
  }, [])

  useEffect(() => {
    const truncateExplanations = () => {
      const newTruncatedExplanations: {[key: string]: string} = {};
      sampleScoreResults.forEach(section => {
        section.scores.forEach(score => {
          const element = explanationRefs.current[score.name];
          if (element) {
            const originalText = score.explanation;
            let truncatedText = originalText;
            element.textContent = truncatedText;
            
            while (element.scrollHeight > element.clientHeight && truncatedText.length > 0) {
              truncatedText = truncatedText.slice(0, -1);
              element.textContent = truncatedText + '...';
            }
            
            newTruncatedExplanations[score.name] = truncatedText + (truncatedText.length < originalText.length ? '...' : '');
          }
        });
      });
      setTruncatedExplanations(newTruncatedExplanations);
    };

    truncateExplanations();
    window.addEventListener('resize', truncateExplanations);
    return () => window.removeEventListener('resize', truncateExplanations);
  }, [sampleScoreResults]);

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
    return items.filter(item => {
      if (!selectedScorecard && filterConfig.length === 0) return true
      
      let scorecardMatch = !selectedScorecard || item.scorecard === selectedScorecard
      
      if (filterConfig.length === 0) return scorecardMatch

      return scorecardMatch && filterConfig.some(group => {
        return group.conditions.every(condition => {
          const itemValue = String(item[condition.field as keyof typeof item])
          switch (condition.operator) {
            case 'equals':
              return itemValue === condition.value
            case 'not_equals':
              return itemValue !== condition.value
            case 'contains':
              return itemValue.includes(condition.value)
            case 'not_contains':
              return !itemValue.includes(condition.value)
            case 'greater_than':
              return Number(itemValue) > Number(condition.value)
            case 'less_than':
              return Number(itemValue) < Number(condition.value)
            default:
              return true
          }
        })
      })
    })
  }, [selectedScorecard, filterConfig, items])

  const getRelativeTime = (dateString: string) => {
    const date = parseISO(dateString)
    return formatDistanceToNow(date, { addSuffix: true })
  }

  const handleItemClick = (itemId: number) => {
    setSelectedItem(itemId)
    if (isNarrowViewport) {
      setIsFullWidth(true)
    }
  }

  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'New':
      case 'Scoring...':
        return 'bg-neutral text-primary-foreground h-6';
      case 'Done':
        return 'bg-true text-primary-foreground h-6';
      case 'Error':
        return 'bg-destructive text-destructive-foreground dark:text-primary-foreground h-6';
      default:
        return 'bg-muted text-muted-foreground h-6';
    }
  };

  const handleTimeRangeChange = (range: string, customRange?: { from: Date | undefined; to: Date | undefined }) => {
    console.log("Time range changed:", range, customRange)
    // Implement the logic for handling "recent" and custom date ranges
    if (range === "recent") {
      // Fetch or filter items for the recent time period
    } else if (range === "custom" && customRange) {
      // Fetch or filter items for the custom date range
    }
  }

  const toggleExplanation = useCallback((scoreName: string) => {
    setExpandedExplanations(prev => 
      prev.includes(scoreName) 
        ? prev.filter(name => name !== scoreName)
        : [...prev, scoreName]
    );
  }, []);

  const toggleAnnotations = useCallback((scoreName: string) => {
    setExpandedAnnotations(prev => 
      prev.includes(scoreName) 
        ? prev.filter(name => name !== scoreName)
        : [...prev, scoreName]
    );
  }, []);

  const getValueBadgeClass = (value: string) => {
    return value.toLowerCase() === 'yes' 
      ? 'bg-true text-primary-foreground w-16 justify-center' 
      : 'bg-false text-primary-foreground w-16 justify-center';
  };

  const initializeNewAnnotation = (score: any) => {
    setNewAnnotation({ 
      value: score.value, 
      explanation: score.explanation, 
      annotation: "",
      allowFeedback: score.allowFeedback // Ensure this property is set correctly
    });
  };

  const cancelAnnotation = (scoreName: string) => {
    setShowNewAnnotationForm(null);
    setNewAnnotation({ value: "", explanation: "", annotation: "", allowFeedback: false });
  };

  const setExplanationRef = useCallback((element: HTMLDivElement | null, scoreName: string) => {
    if (element) {
      explanationRefs.current[scoreName] = element;
    }
  }, []);

  const renderScoreResult = (score: Score, isAnnotation = false) => (
    <div className={`py-2 ${isAnnotation ? 'pl-4 border-l-2 ' + (score.isSystem ? 'border-secondary' : 'border-primary') : 'border-b last:border-b-0'}`}>
      {isAnnotation ? (
        <>
          <div className="flex justify-end mb-2">
            <Badge className={getValueBadgeClass(score.value)}>{score.value}</Badge>
          </div>
          <div className="relative">
            <div 
              ref={(el) => {
                if (el) {
                  textRef.current[score.name] = el;
                }
              }}
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
              {renderRichText(score.explanation)}
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
        </>
      ) : (
        <>
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
            <div className="flex items-center space-x-2">
              {score.allowFeedback && (
                <>
                  {(score.isAnnotated || feedbackItems[score.name]?.length > 0) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleAnnotations(score.name)}
                      className={`text-xs bg-secondary text-secondary-foreground hover:bg-secondary hover:text-secondary-foreground`}
                    >
                      <MessageCircleMore className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleThumbsUp(score.name)}
                    className={`text-xs ${thumbedUpScores.has(score.name) ? 'bg-true text-primary-foreground hover:bg-true hover:text-primary-foreground' : 'hover:bg-muted hover:text-muted-foreground'}`}
                  >
                    <ThumbsUp className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleThumbsDown(score.name)}
                    className="text-xs hover:bg-muted hover:text-muted-foreground"
                  >
                    <ThumbsDown className="h-4 w-4" />
                  </Button>
                </>
              )}
              <Badge className={score.value.includes('%') ? 'bg-primary text-primary-foreground w-16 justify-center' : getValueBadgeClass(score.value)}>
                {score.value}
              </Badge>
            </div>
          </div>
          <div className="relative">
            <div 
              ref={(el) => {
                if (el) {
                  textRef.current[score.name] = el;
                }
              }}
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
              {renderRichText(score.explanation)}
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
        </>
      )}
      {isAnnotation && (
        <div className="flex justify-between items-center mt-2 text-xs text-muted-foreground">
          <span>
            {score.timestamp ? new Date(score.timestamp).toLocaleString() : 'Timestamp not available'}
          </span>
          {score.user && (
            <div className="flex items-center space-x-2">
              <span>{score.user.name}</span>
              <Avatar className="h-6 w-6 bg-muted">
                <AvatarFallback className="bg-muted">{score.user.initials}</AvatarFallback>
              </Avatar>
            </div>
          )}
        </div>
      )}
      {score.annotations && score.annotations.length > 0 && (
        <div className="mt-2 text-sm italic">
          {score.annotations.map((annotation, index) => (
            // Render specific properties of the annotation object
            <div key={index}>"{annotation.annotation}"</div>
          ))}
        </div>
      )}
      {!isAnnotation && (score.isAnnotated || feedbackItems[score.name]?.length > 0) && expandedAnnotations.includes(score.name) && (
        <div className="mt-2 space-y-2">
          <div className="flex justify-between items-center mb-2">
            <h6 className="text-sm font-medium">Feedback</h6>
            <Button
              variant="outline"
              size="sm"
              onClick={() => toggleNewAnnotationForm(score.name)}
              className="text-xs"
            >
              <Plus className="h-4 w-4 mr-1" />
              Create
            </Button>
          </div>
          {[...(score.annotations || []), ...(feedbackItems[score.name] || [])].map((annotation, annotationIndex) => (
            <div key={annotationIndex} className="relative">
              {renderScoreResult(annotation, true)}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const handleNewAnnotationSubmit = (scoreName: string) => {
    const newFeedbackItem = {
      ...newAnnotation,
      scoreName,
      timestamp: new Date().toISOString(),
      user: {
        name: "Current User", // Replace with actual user name
        initials: "CU" // Replace with actual user initials
      }
    };

    setFeedbackItems(prev => ({
      ...prev,
      [scoreName]: [...(prev[scoreName] || []), newFeedbackItem]
    }));

    // Find the selected item
    const selectedItemData = items.find(item => item.id === selectedItem);

    if (selectedItemData && selectedItemData.scoreResults) {
      // Update the score to show it's annotated
      const updatedScoreResults = selectedItemData.scoreResults.map(section => ({
        ...section,
        scores: section.scores.map(score => 
          score.name === scoreName 
            ? { ...score, isAnnotated: true, annotations: [...(score.annotations || []), newFeedbackItem] }
            : score
        )
      }));

      // Update the items with the new score results
      setItems(prev => prev.map(item => 
        item.id === selectedItem 
          ? { ...item, scoreResults: updatedScoreResults }
          : item
      ));
    } else {
      console.error('Selected item or scoreResults not found');
      // Optionally, you can add some user feedback here
    }

    // Close the form and reset the new annotation state
    setShowNewAnnotationForm(null);
    setNewAnnotation({ value: "", explanation: "", annotation: "", allowFeedback: false });
  };

  const toggleNewAnnotationForm = (scoreName: string) => {
    if (showNewAnnotationForm === scoreName) {
      setShowNewAnnotationForm(null);
    } else {
      setShowNewAnnotationForm(scoreName);
      initializeNewAnnotation(sampleScoreResults.flatMap(section => section.scores).find(score => score.name === scoreName));
    }
  };

  const handleThumbsUp = (scoreName: string) => {
    setThumbedUpScores(prev => {
      const newSet = new Set(prev);
      if (newSet.has(scoreName)) {
        newSet.delete(scoreName);
      } else {
        newSet.add(scoreName);
      }
      return newSet;
    });

    // Close the annotation form if it's open
    if (showNewAnnotationForm === scoreName) {
      setShowNewAnnotationForm(null);
    }

    // Reset the new annotation state
    setNewAnnotation({ value: "", explanation: "", annotation: "", allowFeedback: false });
  };

  const handleThumbsDown = (scoreName: string) => {
    setThumbedUpScores(prev => {
      const newSet = new Set(prev);
      newSet.delete(scoreName);
      return newSet;
    });
    toggleNewAnnotationForm(scoreName);
  };

  const handleFilterChange = (newFilters: FilterConfig) => {
    setFilterConfig(newFilters)
  }

  const availableFields = [
    { value: 'scorecard', label: 'Scorecard' },
    { value: 'score', label: 'Score' },
    { value: 'status', label: 'Status' },
    { value: 'results', label: 'Results' },
    { value: 'inferences', label: 'Inferences' },
    { value: 'cost', label: 'Cost' },
  ]

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <Select onValueChange={(value) => setSelectedScorecard(value === "all" ? null : value)}>
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
        </div>
        <div className="flex space-x-2">
          <FilterControl onFilterChange={handleFilterChange} availableFields={availableFields} />
          <TimeRangeSelector onTimeRangeChange={handleTimeRangeChange} options={ITEMS_TIME_RANGE_OPTIONS} />
        </div>
      </div>

      <div className="flex-grow flex flex-col overflow-hidden pb-2">
        {selectedItem && (isNarrowViewport || isFullWidth) ? (
          <div className="flex-grow overflow-hidden">
            {renderSelectedItem({
              items,
              selectedItem,
              isFullWidth,
              isNarrowViewport,
              setSelectedItem,
              setIsFullWidth,
              isMetadataExpanded,
              setIsMetadataExpanded,
              isDataExpanded,
              setIsDataExpanded,
              isErrorExpanded,
              setIsErrorExpanded,
              getBadgeVariant,
              getRelativeTime,
              renderScoreResult
            })}
          </div>
        ) : (
          <div className={`flex ${isNarrowViewport ? 'flex-col' : 'space-x-6'} h-full`}>
            <div className={`${isFullWidth ? 'hidden' : 'flex-1'} overflow-auto`}>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Item</TableHead>
                    <TableHead className="w-[15%] hidden sm:table-cell text-right">Inferences</TableHead>
                    <TableHead className="w-[15%] hidden sm:table-cell text-right">Results</TableHead>
                    <TableHead className="w-[15%] hidden sm:table-cell text-right">Cost</TableHead>
                    <TableHead className="w-[15%] hidden sm:table-cell text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow 
                      key={item.id} 
                      onClick={() => handleItemClick(item.id)} 
                      className="cursor-pointer transition-colors duration-200 hover:bg-muted"
                    >
                      <TableCell className="font-medium sm:pr-4">
                        <div className="sm:hidden">
                          <div className="flex justify-between items-start mb-2">
                            <div className="font-semibold">{item.scorecard}</div>
                            <Badge 
                              className={`w-24 justify-center ${getBadgeVariant(item.status)}`}
                            >
                              {item.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mb-2">{getRelativeTime(item.date)}</div>
                          <div className="flex justify-between items-end">
                            <div className="text-sm text-muted-foreground">
                              {item.inferences} inferences<br />
                              {item.results} results
                            </div>
                            <div className="font-semibold">{item.cost}</div>
                          </div>
                        </div>
                        <div className="hidden sm:block">
                          {item.scorecard}
                          <div className="text-sm text-muted-foreground">{getRelativeTime(item.date)}</div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-right">{item.inferences}</TableCell>
                      <TableCell className="hidden sm:table-cell text-right">{item.results}</TableCell>
                      <TableCell className="hidden sm:table-cell text-right">{item.cost}</TableCell>
                      <TableCell className="hidden sm:table-cell text-right">
                        <Badge 
                          className={`w-24 justify-center ${getBadgeVariant(item.status)}`}
                        >
                          {item.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {selectedItem && !isNarrowViewport && !isFullWidth && (
              <div className="flex-1 overflow-hidden">
                {renderSelectedItem({
                  items,
                  selectedItem,
                  isFullWidth,
                  isNarrowViewport,
                  setSelectedItem,
                  setIsFullWidth,
                  isMetadataExpanded,
                  setIsMetadataExpanded,
                  isDataExpanded,
                  setIsDataExpanded,
                  isErrorExpanded,
                  setIsErrorExpanded,
                  getBadgeVariant,
                  getRelativeTime,
                  renderScoreResult
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function renderSelectedItem({
  items,
  selectedItem,
  isFullWidth,
  isNarrowViewport,
  setSelectedItem,
  setIsFullWidth,
  isMetadataExpanded,
  setIsMetadataExpanded,
  isDataExpanded,
  setIsDataExpanded,
  isErrorExpanded,
  setIsErrorExpanded,
  getBadgeVariant,
  getRelativeTime,
  renderScoreResult
}: {
  items: Item[];
  selectedItem: number | null;
  isFullWidth: boolean;
  isNarrowViewport: boolean;
  setSelectedItem: (id: number | null) => void;
  setIsFullWidth: (isFullWidth: boolean) => void;
  isMetadataExpanded: boolean;
  setIsMetadataExpanded: (isExpanded: boolean) => void;
  isDataExpanded: boolean;
  setIsDataExpanded: (isExpanded: boolean) => void;
  isErrorExpanded: boolean;
  setIsErrorExpanded: (isExpanded: boolean) => void;
  getBadgeVariant: (status: string) => string;
  getRelativeTime: (date: string) => string;
  renderScoreResult: (score: Score) => JSX.Element;
}) {
  const selectedItemData = items.find(item => item.id === selectedItem);
  const isErrorStatus = selectedItemData?.status === 'error';

  if (!selectedItemData) return null;

  return (
    <Card className="rounded-none sm:rounded-lg h-full flex flex-col bg-card-light border-none">
      <CardHeader className="flex-shrink-0 flex flex-row items-center justify-between py-4 px-4 sm:px-6 space-y-0">
        <div>
          <h2 className="text-xl font-semibold">{selectedItemData?.scorecard}</h2>
          <p className="text-sm text-muted-foreground">
            {getRelativeTime(selectedItemData?.date || '')}
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
          <div className={`${isFullWidth ? 'flex gap-16' : ''}`}>
            <div className={`${isFullWidth ? 'w-1/2' : ''}`}>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm font-medium">Inferences</p>
                  <p>{selectedItemData?.inferences}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">Status</p>
                  <Badge 
                    className={`w-24 justify-center ${getBadgeVariant(selectedItemData?.status || '')}`}
                  >
                    {selectedItemData?.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm font-medium">Results</p>
                  <p>{selectedItemData?.results}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">Cost</p>
                  <p>{selectedItemData?.cost}</p>
                </div>
              </div>
              
              {isErrorStatus && (
                <div className="-mx-4 sm:-mx-6 mb-4">
                  <div
                    className="relative group hover:bg-destructive hover:text-primary-foreground cursor-pointer"
                    onClick={() => setIsErrorExpanded(!isErrorExpanded)}
                  >
                    <div className="flex justify-between items-center px-4 sm:px-6 py-2 bg-destructive text-primary-foreground">
                      <span className="text-md font-semibold">
                        Error
                      </span>
                      {isErrorExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </div>
                  {isErrorExpanded && (
                    <div className="mt-2 px-4 sm:px-6">
                      <Table>
                        <TableBody>
                          <TableRow>
                            <TableCell className="pl-0 pr-0">Response from OpenAI: 429 - You exceeded your current quota, please check your plan and billing details</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </div>
              )}
              
              <div className="-mx-4 sm:-mx-6 mb-4">
                <div
                  className="relative group bg-card hover:bg-accent hover:text-accent-foreground cursor-pointer"
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
              
              <div className="-mx-4 sm:-mx-6 mt-4">
                <div
                  className="relative group bg-card hover:bg-accent hover:text-accent-foreground cursor-pointer"
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
                <div className={`mt-2 ${isFullWidth ? 'pr-4' : 'px-4 sm:px-6'}`}>
                  {sampleTranscript.map((line, index) => (
                    <p key={index} className="text-sm">
                      <span className="font-semibold">{line.speaker}: </span>
                      {line.text}
                    </p>
                  ))}
                </div>
              )}
            </div>

            <div className={`${isFullWidth ? 'w-1/2' : 'mt-4'}`}>
              <div className="-mx-4 sm:-mx-6 mb-4">
                <div className="px-4 sm:px-6 py-2 bg-card">
                  <h4 className="text-md font-semibold">Score Results</h4>
                </div>
              </div>
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
                        {renderScoreResult(score)}
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