# Mock Viva System Guide

## Overview

The mock viva system provides a fully functional viva examination experience without requiring a backend server. It automatically activates when the backend is unavailable, allowing you to test and demonstrate the viva feature offline.

## Features

### Automatic Fallback
- Detects when backend is unavailable
- Seamlessly switches to mock data
- Shows "Demo Mode" notification
- No configuration required

### Intelligent Scoring System

The mock viva scores answers based on multiple factors:

1. **Answer Length** (up to 40 points)
   - Longer, more detailed answers score higher
   - Minimum: ~10 words for basic score
   - Optimal: 30+ words for maximum length score

2. **Keyword Matching** (up to 50 points)
   - Each expected topic mentioned adds 15 points
   - Topics are case-insensitive
   - Example: For "closures" question, mentioning "lexical scope", "inner function", "outer function" boosts score

3. **Randomness** (±10 points)
   - Adds realism to scoring
   - Prevents identical scores for similar answers
   - Simulates human evaluator variability

4. **Final Score Range**: 0-100
   - Pass threshold: 60%
   - Excellent: 80-100
   - Good: 60-79
   - Average: 40-59
   - Poor: 0-39

## Question Banks

### JavaScript Fundamentals
5 questions covering:
- What is JavaScript and its unique features
- Data types and examples
- var, let, const differences
- Closures and practical examples
- Synchronous vs asynchronous programming

Expected topics include: interpreted, dynamic typing, scope, hoisting, promises, async/await, etc.

### React Core Concepts
5 questions covering:
- What is React and why use it
- Props vs State
- React Hooks (useState, useEffect)
- Virtual DOM and performance
- Lifting state up

Expected topics include: component-based, virtual DOM, immutable, hooks, reconciliation, etc.

### Default (Other Modules)
5 generic questions:
- Main concepts of the module
- Practical applications
- Learning challenges
- Explaining to beginners
- Best practices

## Response Templates

### Excellent (80-100)
- "Excellent answer! You've demonstrated a strong understanding of the concept."
- "That's a very comprehensive explanation. Well done!"
- "Perfect! You've covered all the key points."
- "Outstanding! Your understanding is very clear."

### Good (60-79)
- "Good answer! You've covered the main points."
- "That's correct. You have a solid understanding."
- "Well explained! You're on the right track."
- "Nice work! You've grasped the core concepts."

### Average (40-59)
- "That's partially correct. Let me help you understand better."
- "You're on the right track, but there's more to consider."
- "Good start, but you could expand on that a bit more."
- "You've got some of it right. Let's dig deeper."

### Poor (0-39)
- "I see you're trying, but let's review this concept again."
- "That's not quite right. Let me clarify the concept for you."
- "You might want to review this topic. Here's what you should know..."
- "Let's go over this again to make sure you understand."

## Final Feedback

### Pass (≥60%)
- Congratulatory message
- Encouragement to continue learning
- Acknowledgment of solid understanding
- Permission to move to next module

### Fail (<60%)
- Supportive message
- Recommendation to review materials
- Specific areas to focus on
- Encouragement to try again

## Adding New Modules

To add questions for a new module:

```typescript
// In src/mocks/vivaData.ts

"Your Module Title": [
  {
    question: "Can you explain [core concept]?",
    expectedTopics: ["keyword1", "keyword2", "keyword3", "keyword4"],
    difficulty: "easy" // or "medium" or "hard"
  },
  {
    question: "What is the difference between [A] and [B]?",
    expectedTopics: ["comparison", "use cases", "advantages"],
    difficulty: "medium"
  },
  // ... 3 more questions for a total of 5
]
```

### Tips for Creating Questions

1. **Easy Questions** (1-2 per module)
   - Basic definitions
   - Simple explanations
   - 2-3 expected topics
   - Example: "What is X?"

2. **Medium Questions** (2-3 per module)
   - Comparisons
   - Use cases
   - 3-4 expected topics
   - Example: "When would you use X vs Y?"

3. **Hard Questions** (1-2 per module)
   - Deep understanding
   - Practical applications
   - 4-5 expected topics
   - Example: "How does X work internally?"

## Testing Tips

### To Get High Scores
- Give detailed, comprehensive answers
- Mention multiple expected keywords
- Explain concepts thoroughly
- Use technical terminology
- Provide examples when relevant

### Example High-Scoring Answer
Question: "What is a closure in JavaScript?"

Good Answer (80+ points):
"A closure is a function that has access to variables in its outer lexical scope, even after the outer function has returned. It's created when an inner function references variables from its outer function. Closures are useful for creating private variables and data encapsulation. For example, you can use closures to create factory functions that maintain state."

This answer mentions: lexical scope, inner function, outer function, private variables - all expected topics!

### Example Low-Scoring Answer
Poor Answer (20-30 points):
"It's a function thing in JavaScript."

This answer is too short and doesn't mention any expected topics.

## Limitations

1. **No Real AI**: Responses are template-based, not generated
2. **Simple Scoring**: Based on keywords and length, not semantic understanding
3. **Fixed Questions**: Same 5 questions each time for a module
4. **No Context**: Each answer scored independently
5. **Deterministic**: Same answer will get similar scores (±10 points)

## Benefits

1. **Offline Testing**: Works without backend
2. **Fast Development**: Test UI without waiting for backend
3. **Demonstrations**: Show viva feature to stakeholders
4. **Consistent**: Predictable behavior for testing
5. **Educational**: Shows expected answer structure

## Future Improvements

1. **More Questions**: Expand question banks
2. **Semantic Analysis**: Use NLP for better scoring
3. **Adaptive Difficulty**: Adjust questions based on performance
4. **Conversation Context**: Remember previous answers
5. **Hints System**: Provide hints for struggling users
6. **Practice Mode**: Allow retrying same questions
7. **Explanation Mode**: Show why answer scored certain way

## Usage in Code

```typescript
// Automatic fallback in Viva.tsx
try {
  // Try backend first
  const response = await fetch('http://localhost:8000/viva/start-simple');
  // ... use backend
} catch (error) {
  // Fallback to mock
  const mockSession = startMockVivaSession(moduleTitle);
  setUseMockData(true);
}

// In VivaRoom.tsx
if (useMockData) {
  data = processMockVivaAnswer(sessionId, userAnswer);
} else {
  // Use real backend
}
```

## Conclusion

The mock viva system provides a complete, functional viva experience for development and testing. While it doesn't have the sophistication of an AI-powered backend, it's perfect for:
- Frontend development
- UI/UX testing
- Demonstrations
- Offline work
- Learning the expected answer format

For production use, always prefer the real backend with AI-powered evaluation.
