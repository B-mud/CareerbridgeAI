"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Clock, RotateCcw } from "lucide-react"
import { motion } from "framer-motion"

/**
 * Mock Test System Component
 * Comprehensive test-taking interface with scoring and result tracking
 */

export interface TestQuestion {
  id: number
  question: string
  options: string[]
  correctAnswer: number
  difficulty: "easy" | "medium" | "hard"
  topic: string
}

export interface TestResult {
  totalQuestions: number
  correctAnswers: number
  timeSpent: number
  score: number
  timestamp: Date
}

const SAMPLE_QUESTIONS: TestQuestion[] = [
  {
    id: 1,
    question: "What does the 'map' function do in JavaScript?",
    options: [
      "Creates a new array with results of calling a function on every element",
      "Calculates the sum of array elements",
      "Filters array elements",
      "Removes duplicates from array",
    ],
    correctAnswer: 0,
    difficulty: "easy",
    topic: "JavaScript",
  },
  {
    id: 2,
    question: "What is the time complexity of binary search?",
    options: ["O(n)", "O(log n)", "O(n²)", "O(1)"],
    correctAnswer: 1,
    difficulty: "medium",
    topic: "Data Structures",
  },
  {
    id: 3,
    question: "Which design pattern is used for managing state in large React applications?",
    options: ["Factory Pattern", "Redux/Context API", "Singleton Pattern", "Observer Pattern"],
    correctAnswer: 1,
    difficulty: "medium",
    topic: "React",
  },
  {
    id: 4,
    question: "What is the purpose of middleware in Express.js?",
    options: [
      "To store data",
      "To handle requests and responses",
      "To define routes",
      "To authenticate users only",
    ],
    correctAnswer: 1,
    difficulty: "easy",
    topic: "Backend",
  },
  {
    id: 5,
    question: "How does async/await improve asynchronous code in JavaScript?",
    options: [
      "It makes code synchronous",
      "It allows writing asynchronous code in a more synchronous-like manner",
      "It eliminates the need for promises",
      "It speeds up execution automatically",
    ],
    correctAnswer: 1,
    difficulty: "hard",
    topic: "JavaScript",
  },
]

export function MockTestComponent() {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<(number | null)[]>(new Array(SAMPLE_QUESTIONS.length).fill(null))
  const [showResults, setShowResults] = useState(false)
  const [startTime] = useState(Date.now())
  const [testStarted, setTestStarted] = useState(false)

  const handleAnswerSelect = (optionIndex: number) => {
    const newAnswers = [...answers]
    newAnswers[currentQuestion] = optionIndex
    setAnswers(newAnswers)
  }

  const handleNextQuestion = () => {
    if (currentQuestion < SAMPLE_QUESTIONS.length - 1) {
      setCurrentQuestion(currentQuestion + 1)
    }
  }

  const handlePrevQuestion = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1)
    }
  }

  const handleSubmitTest = () => {
    setShowResults(true)
  }

  const handleRestartTest = () => {
    setCurrentQuestion(0)
    setAnswers(new Array(SAMPLE_QUESTIONS.length).fill(null))
    setShowResults(false)
    setTestStarted(false)
  }

  const calculateScore = () => {
    const correctCount = answers.reduce((acc: number, answer, index) => {
      return answer === SAMPLE_QUESTIONS[index].correctAnswer ? acc + 1 : acc
    }, 0)
    return Math.round((correctCount / SAMPLE_QUESTIONS.length) * 100)
  }

  const correctCount = answers.reduce((acc: number, answer, index) => {
    return answer === SAMPLE_QUESTIONS[index].correctAnswer ? acc + 1 : acc
  }, 0)

  const timeSpent = Math.round((Date.now() - startTime) / 1000)

  if (!testStarted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-6"
      >
        <Card role="region" aria-label="Mock test introduction">
          <CardHeader>
            <CardTitle>Mock Test - Web Development Fundamentals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 text-sm text-muted-foreground">
              <p className="flex items-center gap-2">
                <Clock className="h-4 w-4" aria-hidden="true" />
                <span>Duration: Approximately 15-20 minutes</span>
              </p>
              <p className="flex items-center gap-2">
                <span aria-hidden="true">📝</span>
                <span>Total Questions: {SAMPLE_QUESTIONS.length}</span>
              </p>
              <p className="flex items-center gap-2">
                <span aria-hidden="true">📊</span>
                <span>Difficulty: Mixed (Easy, Medium, Hard)</span>
              </p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">Instructions:</h3>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-disc list-inside">
                <li>Answer all {SAMPLE_QUESTIONS.length} questions</li>
                <li>You can navigate between questions</li>
                <li>You cannot change answers once submitted</li>
                <li>Your score is calculated at the end</li>
              </ul>
            </div>
            <Button
              onClick={() => setTestStarted(true)}
              className="w-full"
              size="lg"
              aria-label="Start mock test"
            >
              Start Test
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  if (showResults) {
    const score = calculateScore()
    const passed = score >= 70

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-6"
      >
        <Card role="region" aria-label="Test results">
          <CardHeader className="text-center">
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Score Display */}
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
                className={`inline-flex items-center justify-center w-32 h-32 rounded-full ${
                  passed
                    ? "bg-green-100 dark:bg-green-900"
                    : "bg-red-100 dark:bg-red-900"
                }`}
              >
                {passed ? (
                  <CheckCircle className="w-16 h-16 text-green-600" aria-hidden="true" />
                ) : (
                  <XCircle className="w-16 h-16 text-red-600" aria-hidden="true" />
                )}
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-4"
              >
                <p className={`text-4xl font-bold ${passed ? "text-green-600" : "text-red-600"}`}>
                  {score}%
                </p>
                <p className={`text-lg font-semibold ${passed ? "text-green-700" : "text-red-700"}`}>
                  {passed ? "Test Passed! 🎉" : "Test Failed"}
                </p>
              </motion.div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-primary">{correctCount}</p>
                <p className="text-xs text-muted-foreground mt-1">Correct Answers</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-orange-600">{SAMPLE_QUESTIONS.length - correctCount}</p>
                <p className="text-xs text-muted-foreground mt-1">Incorrect Answers</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{Math.floor(timeSpent / 60)}m {timeSpent % 60}s</p>
                <p className="text-xs text-muted-foreground mt-1">Time Spent</p>
              </div>
            </div>

            {/* Answer Review */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              <h3 className="font-semibold">Answer Review</h3>
              {SAMPLE_QUESTIONS.map((q, index) => {
                const isCorrect = answers[index] === q.correctAnswer
                return (
                  <div
                    key={q.id}
                    className={`p-3 rounded-lg border ${
                      isCorrect
                        ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
                        : "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
                    }`}
                    role="listitem"
                  >
                    <div className="flex items-start gap-2">
                      {isCorrect ? (
                        <CheckCircle className="h-4 w-4 text-green-600 mt-1 flex-shrink-0" aria-hidden="true" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-600 mt-1 flex-shrink-0" aria-hidden="true" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm font-medium">Q{index + 1}: {q.question}</p>
                        <p className="text-xs mt-1">
                          Your answer: <span className="font-semibold">{q.options[answers[index] || 0]}</span>
                        </p>
                        {!isCorrect && (
                          <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                            Correct answer: <span className="font-semibold">{q.options[q.correctAnswer]}</span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Recommendation */}
            {!passed && (
              <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-sm text-yellow-800 dark:text-yellow-200">
                  💡 <strong>Tip:</strong> Review the topics where you struggled and try again. Practice makes perfect!
                </p>
              </div>
            )}

            <Button
              onClick={handleRestartTest}
              className="w-full"
              size="lg"
              aria-label="Restart test"
            >
              <RotateCcw className="h-4 w-4 mr-2" aria-hidden="true" />
              Retake Test
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  const question = SAMPLE_QUESTIONS[currentQuestion]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Progress */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="flex justify-between text-sm mb-2">
            <span className="font-medium">Question {currentQuestion + 1} of {SAMPLE_QUESTIONS.length}</span>
            <span className="text-muted-foreground">{Math.round(((currentQuestion + 1) / SAMPLE_QUESTIONS.length) * 100)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2">
            <motion.div
              className="bg-primary h-2 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((currentQuestion + 1) / SAMPLE_QUESTIONS.length) * 100}%` }}
              transition={{ duration: 0.3 }}
              aria-hidden="true"
            />
          </div>
        </div>
        <Clock className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
        <span className="text-sm font-medium w-16">
          {Math.floor(timeSpent / 60)}:{(timeSpent % 60).toString().padStart(2, "0")}
        </span>
      </div>

      {/* Question Card */}
      <Card role="region" aria-label={`Question ${currentQuestion + 1}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">{question.question}</CardTitle>
            <span className={`text-xs px-2 py-1 rounded-full ${
              question.difficulty === "easy"
                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                : question.difficulty === "medium"
                ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
            }`}>
              {question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1)}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3" role="radiogroup" aria-label="Answer options">
            {question.options.map((option, index) => (
              <motion.button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  answers[currentQuestion] === index
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
                role="radio"
                aria-checked={answers[currentQuestion] === index}
                aria-label={`Option ${index + 1}: ${option}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    answers[currentQuestion] === index
                      ? "border-primary bg-primary"
                      : "border-border"
                  }`}>
                    {answers[currentQuestion] === index && (
                      <div className="w-2 h-2 bg-white rounded-full" aria-hidden="true" />
                    )}
                  </div>
                  <span>{option}</span>
                </div>
              </motion.button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex gap-3 justify-between">
        <Button
          onClick={handlePrevQuestion}
          disabled={currentQuestion === 0}
          variant="outline"
          aria-label="Previous question"
        >
          ← Previous
        </Button>

        <div className="flex gap-1 flex-wrap justify-center">
          {SAMPLE_QUESTIONS.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentQuestion(index)}
              className={`w-8 h-8 rounded-lg text-xs font-semibold transition-all ${
                index === currentQuestion
                  ? "bg-primary text-white"
                  : answers[index] !== null
                  ? "bg-green-500 text-white"
                  : "bg-muted hover:bg-muted-foreground/20"
              }`}
              aria-label={`Go to question ${index + 1}${answers[index] !== null ? " (answered)" : ""}`}
              aria-current={index === currentQuestion}
            >
              {index + 1}
            </button>
          ))}
        </div>

        {currentQuestion === SAMPLE_QUESTIONS.length - 1 ? (
          <Button
            onClick={handleSubmitTest}
            disabled={answers.includes(null)}
            aria-label="Submit test"
          >
            Submit Test →
          </Button>
        ) : (
          <Button
            onClick={handleNextQuestion}
            aria-label="Next question"
          >
            Next →
          </Button>
        )}
      </div>

      {answers.includes(null) && currentQuestion === SAMPLE_QUESTIONS.length - 1 && (
        <p className="text-sm text-orange-600 dark:text-orange-400 text-center">
          ⚠️ Please answer all questions before submitting
        </p>
      )}
    </motion.div>
  )
}
