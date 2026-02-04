'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/app/components/ui/button'

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Play, Send, RotateCcw, Check, X, Clock, Award } from 'lucide-react'
import axios from 'axios'
import { useParams } from 'next/navigation'

// const problems = [
//   {
//     id: 1,
//     title: 'Divide Two Integers',
//     difficulty: 'Medium',
//     topic: 'Math, Bit Manipulation',
//     description: 'Given two integers dividend and divisor, divide two integers without using multiplication, division, and mod operator.\n\nThe integer division should truncate toward zero, which means losing its fractional part. For example, 8.345 would be truncated to 8, and -2.7335 would be truncated to -2.\n\nReturn the quotient after dividing dividend by divisor.\n\nNote: Assume we are dealing with an environment that could only store integers within the 32-bit signed integer range: [−2³¹, 2³¹ − 1]. For this problem, if the quotient is strictly greater than 2³¹ - 1, then return 2³¹ - 1, and if the quotient is strictly less than -2³¹, then return -2³¹.',
//     examples: [
//       {
//         input: 'dividend = 10, divisor = 3',
//         output: '3',
//         explanation: '10/3 = 3.33333.. which is truncated to 3.',
//       },
//       {
//         input: 'dividend = 7, divisor = -3',
//         output: '-2',
//         explanation: '7/-3 = -2.33333.. which is truncated to -2.',
//       },
//     ],
//     constraints: [
//       '-2³¹ <= dividend, divisor <= 2³¹ - 1',
//       'divisor != 0',
//     ],
//     codeSnippets: {
//       python3:
//         'class Solution:\n    def divide(self, dividend: int, divisor: int) -> int:\n        # Your code here',
//       javascript:
//         '/**\n * @param {number} dividend\n * @param {number} divisor\n * @return {number}\n */\nvar divide = function(dividend, divisor) {\n    // Your code here\n};',
//       java: 'class Solution {\n    public int divide(int dividend, int divisor) {\n        // Your code here\n    }\n}',
//       cpp: 'class Solution {\npublic:\n    int divide(int dividend, int divisor) {\n        // Your code here\n    }\n};',
//       typescript:
//         'function divide(dividend: number, divisor: number): number {\n    // Your code here\n}',
//       go: 'func divide(dividend int, divisor int) int {\n    // Your code here\n}',
//     },
//   },
//   {
//     id: 2,
//     title: 'Unique Binary Search Trees II',
//     difficulty: 'Medium',
//     topic: 'Dynamic Programming, Backtracking, Tree',
//     description: "Given an integer n, return all the structurally unique BST's (binary search trees), which has exactly n nodes of unique values from 1 to n. Return the answer in any order.",
//     examples: [
//       {
//         input: 'n = 3',
//         output: '[[1,null,2,null,3],[1,null,3,2],[2,1,3],[3,1,null,null,2],[3,2,null,1]]',
//         explanation: 'Shows 5 structurally unique BSTs with 3 nodes.',
//       },
//       {
//         input: 'n = 1',
//         output: '[[1]]',
//         explanation: 'Only one BST possible with single node.',
//       },
//     ],
//     constraints: ['1 <= n <= 8'],
//     codeSnippets: {
//       python3:
//         '# Definition for a binary tree node.\n# class TreeNode:\n#     def __init__(self, val=0, left=None, right=None):\n#         self.val = val\n#         self.left = left\n#         self.right = right\nclass Solution:\n    def generateTrees(self, n: int) -> List[Optional[TreeNode]]:\n        # Your code here',
//       javascript:
//         '/**\n * Definition for a binary tree node.\n * function TreeNode(val, left, right) {\n *     this.val = (val===undefined ? 0 : val)\n *     this.left = (left===undefined ? null : left)\n *     this.right = (right===undefined ? null : right)\n * }\n */\nvar generateTrees = function(n) {\n    // Your code here\n};',
//       java: 'class Solution {\n    public List<TreeNode> generateTrees(int n) {\n        // Your code here\n    }\n}',
//       cpp: 'class Solution {\npublic:\n    vector<TreeNode*> generateTrees(int n) {\n        // Your code here\n    }\n};',
//       typescript:
//         'function generateTrees(n: number): Array<TreeNode | null> {\n    // Your code here\n}',
//       go: 'func generateTrees(n int) []*TreeNode {\n    // Your code here\n}',
//     },
//   },
// ]

const LANGUAGES = ['python3', 'javascript', 'java', 'cpp', 'typescript', 'go'] as const

type Language = (typeof LANGUAGES)[number]

type Example = {
  input: string
  output: string
  explanation: string
}

type CodeSnippets = {
  python3: string
  javascript: string
  java: string
  cpp: string
  typescript: string
  go: string
}

export type Problem = {
  id: number
  title: string
  difficulty: "Easy" | "Medium" | "Hard"
  topic: string
  description: string
  examples: Example[]
  constraints: string[]
  codeSnippets: CodeSnippets
}


interface TestResult {
  passed: number
  total: number
  status: 'idle' | 'running' | 'passed' | 'failed'
}

export default function CodeEditor() {
  const [currentProblemId, setCurrentProblemId] = useState(0)
  const [selectedLanguage, setSelectedLanguage] = useState<Language>('python3')
  const [output, setOutput] = useState('')
  const [timeLeft, setTimeLeft] = useState(3600)
  const [testResult, setTestResult] = useState<TestResult>({ passed: 0, total: 0, status: 'idle' })
  const [problemTab, setProblemTab] = useState('description')
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const params = useParams<{ sessionId: string }>();
const [problems, setproblems] = useState<Problem[]>([])
const [code, setCode] = useState('')

  const currentProblem = problems[currentProblemId]
  const sessionId = params.sessionId;


  const normalizeProblem = (q: any): Problem => ({
  id: Number(q.fronetendId ?? q.problemId),
  title: q.title,
  difficulty: q.difficulty,
  topic: q.topic,
  description: q.statement, // 🔥 map statement → description
  examples: q.examples
    ? q.examples.split('\n\n').map((block: string) => {
        const lines = block.split('\n')
        return {
          input: lines[0]?.replace('Input: ', '') ?? '',
          output: lines[1]?.replace('Output: ', '') ?? '',
          explanation: lines[2]?.replace('Explanation: ', '') ?? '',
        }
      })
    : [],
constraints: q.constraints
  ? q.constraints
      .replace(/−/g, '-')
      .replace(/³/g, '3')
      .split('\n')
  : [],
    codeSnippets: {
    python3: q.codeSnippets.python3 ?? '',
    javascript: q.codeSnippets.javascript ?? '',
    java: q.codeSnippets.java ?? '',
    cpp: q.codeSnippets.cpp ?? '',
    typescript: q.codeSnippets.typescript ?? '',
    go: q.codeSnippets.golang ?? '',
  },
})


  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
  if (problems.length > 0) {
    setCode(problems[currentProblemId].codeSnippets[selectedLanguage])
  }
}, [problems, currentProblemId, selectedLanguage])


  useEffect(()=>{

    console.log("inside the useffect for calling or fetching the questions related to the curresnt assessment ")

    const fetchAssessmentQuestions = async ()=>{
      console.log("inside the fetchquestions")
      try {
const res = await axios.get(
  `/api/coding-assessments/session/${sessionId}`
)
        const normalized = res.data.questions.map(normalizeProblem)
          setproblems(normalized)
        console.log("response" , res)


      } catch (error) {
        console.log('error coming in fetching the assesssment problems')
        console.error(error)
      }
    }
    fetchAssessmentQuestions();
    
  },[sessionId])


  const handleProblemChange = (index: number) => {
    setCurrentProblemId(index)
    setSelectedLanguage('python3')
    setCode(problems[index].codeSnippets.python3)
    setOutput('')
    setTestResult({ passed: 0, total: 0, status: 'idle' })
  }

  const handleLanguageChange = (lang: Language) => {
    setSelectedLanguage(lang)
setCode(currentProblem.codeSnippets[lang] ?? '')
  }

  // const handleRunCode = () => {

  //   setTestResult({ passed: 0, total: 2, status: 'running' })
  //   setOutput('Running code...')
  //   setTimeout(() => {
  //     setTestResult({ passed: 2, total: 2, status: 'passed' })
  //     setOutput('✓ Test case 1 passed (0.05s, 42.5MB)\n✓ Test case 2 passed (0.03s, 40.2MB)\n\nAll tests passed!')
  //   }, 1500)
  // }

  const handleRunCode = async () => {
    if (!code.trim()) {
      setOutput('Please write some code before running.')
      return
    }

    setTestResult({ passed: 0, total: 1, status: 'running' })
    setOutput('Preparing execution environment...')

    try {
      // Use the first example's input if available as default test input
      const defaultInput = currentProblem?.examples[0]?.input || ''
      
      const res = await axios.post('/api/coding-assessments/code/run', {
        code,
        language: selectedLanguage,
        input: defaultInput,
      })

      if (res.data.status === 'SUCCESS') {
        setOutput(res.data.output || 'Code executed successfully with no output.')
        setTestResult({ passed: 1, total: 1, status: 'passed' })
      } else {
        setOutput(res.data.output || 'An error occurred during execution.')
        setTestResult({ passed: 0, total: 1, status: 'failed' })
      }
    } catch (error: any) {
      console.error('Run code error:', error)
      const errorMsg = error.response?.data?.output || error.message || 'Failed to connect to execution server'
      setOutput(`Error: ${errorMsg}`)
      setTestResult({ passed: 0, total: 1, status: 'failed' })
    }
  }

 



  const handleSubmitCode = () => {
    setTestResult({ passed: 0, total: 15, status: 'running' })
    setOutput('Submitting solution...')
    setTimeout(() => {
      setTestResult({ passed: 15, total: 15, status: 'passed' })
      setOutput('Accepted!\nRuntime: 28ms (faster than 87.3% of submissions)\nMemory: 41.2MB (less than 65.4% of submissions)\n\nCongratulations! You have solved this problem!')
    }, 2000)
  }

  const handleResetCode = () => {
    setCode(currentProblem.codeSnippets[selectedLanguage])
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'text-green-600 bg-green-100'
      case 'Medium':
        return 'text-amber-600 bg-amber-100'
      case 'Hard':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'text-green-400'
      case 'Medium':
        return 'text-amber-400'
      case 'Hard':
        return 'text-red-400'
      default:
        return 'text-gray-400'
    }
  }

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const getLanguageLabel = (lang: Language) => {
    const labels: Record<Language, string> = {
      python3: 'Python3',
      javascript: 'JavaScript',
      java: 'Java',
      cpp: 'C++',
      typescript: 'TypeScript',
      go: 'Go',
    }
    return labels[lang]
  }
  if (!currentProblem) {
  return (
    <div className="min-h-screen flex items-center justify-center text-slate-300">
      Loading problems...
    </div>
  )
}

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-700 bg-slate-900 sticky top-0 z-50 shadow-lg">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Award className="w-6 h-6 text-blue-400" />
              <h1 className="text-2xl font-bold text-slate-100">Code Contest</h1>
            </div>
            <div className="flex items-center gap-2 text-sm text-slate-400">
              <span>Problem {currentProblemId + 1}</span>
              <span className="text-slate-600">•</span>
              <span>{currentProblem.title}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-lg font-mono font-semibold text-blue-400">
              <Clock className="w-5 h-5" />
              {formatTime(timeLeft)}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-0 h-[calc(100vh-80px)]">
        {/* Problem Panel - Left */}
        <div className="w-1/2 flex flex-col bg-slate-900 border-r border-slate-700 overflow-hidden">
          {/* Problem Tabs */}
          <div className="border-b border-slate-700 bg-slate-800 px-4">
            <Tabs value={problemTab} onValueChange={setProblemTab} className="w-full">
              <TabsList className="bg-transparent border-b border-slate-700 rounded-none h-auto p-0 gap-0">
                <TabsTrigger 
                  value="description"
                  className="color-white rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-blue-400 data-[state=active]:bg-slate-900"
                >
                  Description
                </TabsTrigger>
                <TabsTrigger 
                  value="examples"
                  className=" color-gray-100 rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-blue-400 data-[state=active]:bg-slate-900"
                >
                  Examples
                </TabsTrigger>
                <TabsTrigger 
                  value="constraints"
                  className="color-white rounded-none border-b-2 border-transparent px-4 py-3 data-[state=active]:border-blue-400 data-[state=active]:bg-slate-900"
                >
                  Constraints
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Problem Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {/* Problem Header */}
            <div className="pb-4 border-b border-slate-700">
              <h2 className="text-3xl font-bold text-slate-100 mb-3">{currentProblem.title}</h2>
              <div className="flex items-center gap-3 flex-wrap">
                <span className={`px-4 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(currentProblem.difficulty)}`}>
                  {currentProblem.difficulty}
                </span>
                <span className="text-xs text-slate-400 bg-slate-800 px-3 py-1 rounded">{currentProblem.topic}</span>
              </div>
            </div>

            {/* Description Tab */}
            {problemTab === 'description' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-slate-100 mb-3">Description</h3>
                  <p className="text-slate-300 whitespace-pre-wrap leading-relaxed text-sm">
                      {String(currentProblem.description)}
                  </p>
                </div>
              </div>
            )}

            {/* Examples Tab */}
            {problemTab === 'examples' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-100">Examples</h3>
                {currentProblem.examples.map((example, idx) => (
                  <div key={idx} className="bg-slate-800 rounded-lg p-4 border border-slate-700 space-y-3">
                    <div>
                      <span className="text-slate-400 text-xs font-semibold uppercase tracking-wide">Example {idx + 1}</span>
                    </div>
                    <div>
                      <span className="text-slate-300 text-sm font-medium">Input:</span>
                      <p className="text-slate-100 font-mono mt-1 bg-slate-900 p-2 rounded text-sm border border-slate-700">{example.input}</p>
                    </div>
                    <div>
                      <span className="text-slate-300 text-sm font-medium">Output:</span>
                      <p className="text-slate-100 font-mono mt-1 bg-slate-900 p-2 rounded text-sm border border-slate-700">{example.output}</p>
                    </div>
                    <div>
                      <span className="text-slate-300 text-sm font-medium">Explanation:</span>
                      <p className="text-slate-400 mt-1 text-sm">{example.explanation}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Constraints Tab */}
            {problemTab === 'constraints' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-100">Constraints</h3>
                <ul className="space-y-2 bg-slate-800 rounded-lg p-4 border border-slate-700">
                  {currentProblem.constraints.map((constraint, idx) => (
                    <li key={idx} className="text-slate-300 text-sm flex items-start gap-3">
                      <span className="text-blue-400 font-bold">•</span>
                      {constraint}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Problem Navigation */}
          <div className="border-t border-slate-700 bg-slate-800 p-4 flex gap-2">
            {problems.map((problem, idx) => (
              <button
                key={problem.id}
                onClick={() => handleProblemChange(idx)}
                className={`px-4 py-2 rounded text-sm font-medium transition-all ${
                  currentProblemId === idx
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                Q{problem.id}
              </button>
            ))}
          </div>
        </div>

        {/* Code Editor Panel - Right */}
        <div className="w-1/2 flex flex-col bg-slate-950 overflow-hidden">
          {/* Editor Header */}
          <div className="border-b border-slate-700 bg-slate-900 p-4 space-y-3">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-slate-300">Language:</label>
                <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
                  <SelectTrigger className="w-40 bg-slate-800 border-slate-700 text-slate-100 focus:ring-blue-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-800 border-slate-700">
                    {LANGUAGES.map((lang) => (
                      <SelectItem key={lang} value={lang} className="text-slate-100">
                        {getLanguageLabel(lang)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleResetCode}
                  variant="outline"
                  size="sm"
                  className="gap-2 bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reset
                </Button>
                <Button
                  onClick={handleRunCode}
                  size="sm"
                  className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                >
                  <Play className="w-4 h-4" />
                  Run Code
                </Button>
                <Button
                  onClick={handleSubmitCode}
                  size="sm"
                  className="gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium"
                >
                  <Send className="w-4 h-4" />
                  Submit
                </Button>
              </div>
            </div>

            {/* Test Result */}
            {testResult.status !== 'idle' && (
              <div className={`p-3 rounded-lg flex items-center gap-2 text-sm font-medium ${
                testResult.status === 'running' ? 'bg-blue-900 text-blue-100' :
                testResult.status === 'passed' ? 'bg-emerald-900 text-emerald-100' :
                'bg-red-900 text-red-100'
              }`}>
                {testResult.status === 'running' && <Clock className="w-4 h-4 animate-spin" />}
                {testResult.status === 'passed' && <Check className="w-4 h-4" />}
                {testResult.status === 'failed' && <X className="w-4 h-4" />}
                <span>
                  {testResult.status === 'running' ? 'Running tests...' : `${testResult.passed}/${testResult.total} test cases passed`}
                </span>
              </div>
            )}
          </div>

          {/* Code Editor */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-hidden">
              <textarea
                ref={editorRef}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full h-full p-4 bg-slate-950 text-slate-100 font-mono text-sm resize-none focus:outline-none border-none"
                spellCheck="false"
                placeholder="Write your code here..."
              />
            </div>

            {/* Output Panel */}
            <div className={`border-t ${output ? 'border-slate-700 bg-slate-900' : 'border-slate-800'} transition-colors`}>
              {output && (
                <div className="max-h-64 overflow-y-auto">
                  <div className="p-4 space-y-2">
                    <h3 className="font-semibold text-sm text-slate-300 mb-2">Output:</h3>
                    <pre className={`font-mono text-xs whitespace-pre-wrap break-words ${
                      testResult.status === 'passed' ? 'text-emerald-400' : 'text-slate-300'
                    }`}>
                      {output}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
