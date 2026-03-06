// Mock Viva Session Data
export interface VivaQuestion {
  question: string;
  expectedTopics: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface VivaSession {
  sessionId: string;
  moduleTitle: string;
  questions: VivaQuestion[];
  currentQuestionIndex: number;
  scores: number[];
  isComplete: boolean;
}

// Mock questions for different modules
const mockQuestions: Record<string, VivaQuestion[]> = {
  "JavaScript Fundamentals": [
    {
      question: "Can you explain what JavaScript is and what makes it different from other programming languages?",
      expectedTopics: ["interpreted", "dynamic typing", "prototype-based", "first-class functions"],
      difficulty: "easy"
    },
    {
      question: "What are the different data types in JavaScript? Can you give examples of each?",
      expectedTopics: ["string", "number", "boolean", "undefined", "null", "object", "symbol"],
      difficulty: "easy"
    },
    {
      question: "Explain the difference between var, let, and const. When would you use each one?",
      expectedTopics: ["scope", "hoisting", "reassignment", "block scope", "function scope"],
      difficulty: "medium"
    },
    {
      question: "What is a closure in JavaScript? Can you provide a practical example?",
      expectedTopics: ["lexical scope", "inner function", "outer function", "private variables"],
      difficulty: "hard"
    },
    {
      question: "Explain the difference between synchronous and asynchronous JavaScript. How do promises help?",
      expectedTopics: ["callback", "promise", "async/await", "event loop", "non-blocking"],
      difficulty: "medium"
    }
  ],
  "React Core Concepts": [
    {
      question: "What is React and why would you use it over vanilla JavaScript?",
      expectedTopics: ["component-based", "virtual DOM", "declarative", "reusable"],
      difficulty: "easy"
    },
    {
      question: "Explain the difference between props and state in React.",
      expectedTopics: ["immutable", "parent to child", "internal", "mutable", "re-render"],
      difficulty: "easy"
    },
    {
      question: "What are React hooks? Can you explain useState and useEffect?",
      expectedTopics: ["functional components", "state management", "side effects", "lifecycle"],
      difficulty: "medium"
    },
    {
      question: "What is the virtual DOM and how does React use it for performance?",
      expectedTopics: ["reconciliation", "diffing", "batch updates", "real DOM"],
      difficulty: "hard"
    },
    {
      question: "Explain the concept of lifting state up in React. When and why would you do this?",
      expectedTopics: ["shared state", "parent component", "props", "single source of truth"],
      difficulty: "medium"
    }
  ],
  "default": [
    {
      question: "Can you explain the main concepts of this module?",
      expectedTopics: ["fundamentals", "core concepts", "best practices"],
      difficulty: "easy"
    },
    {
      question: "What are some practical applications of what you've learned?",
      expectedTopics: ["real-world", "use cases", "implementation"],
      difficulty: "medium"
    },
    {
      question: "What challenges did you face while learning this topic?",
      expectedTopics: ["difficulties", "solutions", "understanding"],
      difficulty: "medium"
    },
    {
      question: "How would you explain this topic to someone who's never heard of it?",
      expectedTopics: ["simple terms", "analogy", "basics"],
      difficulty: "hard"
    },
    {
      question: "What are the best practices you should follow when working with this technology?",
      expectedTopics: ["standards", "conventions", "optimization"],
      difficulty: "medium"
    }
  ]
};

// Mock responses based on answer quality
const mockResponses = {
  excellent: [
    "Excellent answer! You've demonstrated a strong understanding of the concept.",
    "That's a very comprehensive explanation. Well done!",
    "Perfect! You've covered all the key points.",
    "Outstanding! Your understanding is very clear."
  ],
  good: [
    "Good answer! You've covered the main points.",
    "That's correct. You have a solid understanding.",
    "Well explained! You're on the right track.",
    "Nice work! You've grasped the core concepts."
  ],
  average: [
    "That's partially correct. Let me help you understand better.",
    "You're on the right track, but there's more to consider.",
    "Good start, but you could expand on that a bit more.",
    "You've got some of it right. Let's dig deeper."
  ],
  poor: [
    "I see you're trying, but let's review this concept again.",
    "That's not quite right. Let me clarify the concept for you.",
    "You might want to review this topic. Here's what you should know...",
    "Let's go over this again to make sure you understand."
  ]
};

const mockFeedback = {
  pass: [
    "Congratulations! You've demonstrated a solid understanding of the material. Your answers showed good comprehension of the key concepts. Keep up the excellent work!",
    "Well done! You've successfully completed this viva. Your explanations were clear and showed good knowledge of the subject matter. Continue learning!",
    "Great job! You've passed the examination with a good understanding of the core concepts. Your performance indicates you're ready to move forward."
  ],
  fail: [
    "You've made a good effort, but there are some areas that need more review. I recommend going through the module materials again, especially focusing on the core concepts. Don't be discouraged - learning takes time!",
    "While you showed some understanding, there are key concepts that need more attention. Please review the module content and try again. Focus on understanding the fundamentals.",
    "You're on the learning path, but this module needs more study. Take your time to review the materials, practice the concepts, and come back when you feel more confident."
  ]
};

// Simulate scoring based on answer length and keywords
export function scoreAnswer(answer: string, expectedTopics: string[]): number {
  const answerLower = answer.toLowerCase();
  const wordCount = answer.split(' ').length;
  
  // Base score on answer length
  let score = Math.min(wordCount * 2, 40);
  
  // Add points for mentioning expected topics
  let topicScore = 0;
  expectedTopics.forEach(topic => {
    if (answerLower.includes(topic.toLowerCase())) {
      topicScore += 15;
    }
  });
  
  // Cap topic score
  topicScore = Math.min(topicScore, 50);
  
  // Add randomness for realism (±10 points)
  const randomness = Math.floor(Math.random() * 21) - 10;
  
  const finalScore = Math.max(0, Math.min(100, score + topicScore + randomness));
  return finalScore;
}

export function getResponseForScore(score: number): string {
  if (score >= 80) {
    return mockResponses.excellent[Math.floor(Math.random() * mockResponses.excellent.length)];
  } else if (score >= 60) {
    return mockResponses.good[Math.floor(Math.random() * mockResponses.good.length)];
  } else if (score >= 40) {
    return mockResponses.average[Math.floor(Math.random() * mockResponses.average.length)];
  } else {
    return mockResponses.poor[Math.floor(Math.random() * mockResponses.poor.length)];
  }
}

export function getFinalFeedback(averageScore: number): string {
  if (averageScore >= 60) {
    return mockFeedback.pass[Math.floor(Math.random() * mockFeedback.pass.length)];
  } else {
    return mockFeedback.fail[Math.floor(Math.random() * mockFeedback.fail.length)];
  }
}

export function getQuestionsForModule(moduleTitle: string): VivaQuestion[] {
  return mockQuestions[moduleTitle] || mockQuestions.default;
}

// Create a mock viva session
export function createMockVivaSession(moduleTitle: string): VivaSession {
  const questions = getQuestionsForModule(moduleTitle);
  
  return {
    sessionId: `mock-session-${Date.now()}`,
    moduleTitle,
    questions,
    currentQuestionIndex: 0,
    scores: [],
    isComplete: false
  };
}

// Store active sessions in memory (would be in backend in real app)
const activeSessions = new Map<string, VivaSession>();

export function startMockVivaSession(moduleTitle: string): { sessionId: string; firstQuestion: string } {
  const session = createMockVivaSession(moduleTitle);
  activeSessions.set(session.sessionId, session);
  
  return {
    sessionId: session.sessionId,
    firstQuestion: session.questions[0].question
  };
}

export function processMockVivaAnswer(
  sessionId: string,
  userAnswer: string
): {
  reply: string;
  next_question: string;
  score: number;
  cumulative_score: number;
  question_count: number;
  is_complete: boolean;
  final_feedback: string | null;
} {
  const session = activeSessions.get(sessionId);
  
  if (!session) {
    throw new Error('Session not found');
  }
  
  // Score the current answer
  const currentQuestion = session.questions[session.currentQuestionIndex];
  const score = scoreAnswer(userAnswer, currentQuestion.expectedTopics);
  session.scores.push(score);
  
  // Get response
  const reply = getResponseForScore(score);
  
  // Move to next question
  session.currentQuestionIndex++;
  const questionCount = session.currentQuestionIndex;
  
  // Calculate cumulative score
  const cumulativeScore = Math.round(
    session.scores.reduce((a, b) => a + b, 0) / session.scores.length
  );
  
  // Check if complete
  const isComplete = session.currentQuestionIndex >= session.questions.length;
  session.isComplete = isComplete;
  
  let nextQuestion = '';
  let finalFeedback = null;
  
  if (isComplete) {
    finalFeedback = getFinalFeedback(cumulativeScore);
    nextQuestion = cumulativeScore >= 60 
      ? "You've completed the viva successfully!" 
      : "Please review the material and try again.";
  } else {
    nextQuestion = session.questions[session.currentQuestionIndex].question;
  }
  
  return {
    reply,
    next_question: nextQuestion,
    score,
    cumulative_score: cumulativeScore,
    question_count: questionCount,
    is_complete: isComplete,
    final_feedback: finalFeedback
  };
}

export function clearMockVivaSession(sessionId: string): void {
  activeSessions.delete(sessionId);
}
