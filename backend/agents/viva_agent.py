"""
Viva Agent using Google Gemini 1.5 Flash with JSON output
Fixes cut-off and scoring issues with structured responses
"""
import os
import json
import google.generativeai as genai

# Setup Model configuration with JSON output
generation_config = {
    "temperature": 0.7,
    "max_output_tokens": 500,
    "top_p": 0.95,
    "top_k": 40,
    "response_mime_type": "application/json",
}

# Model instance (lazy initialization)
_model = None

def _get_model():
    """Lazy initialization of the Gemini model with API key configuration."""
    global _model
    if _model is None:
        # Configure API key
        api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GOOGLE_API_KEY or GEMINI_API_KEY environment variable is required")
        
        genai.configure(api_key=api_key)
        _model = genai.GenerativeModel('gemini-2.5-flash', generation_config=generation_config)
    
    return _model


def get_interviewer_response(history, user_input, module_topic, target_role="Senior Tech Lead"):
    """
    Generates a response with feedback and next question using JSON output.
    
    Args:
        history: List of previous messages [{'role': 'user', 'content': '...'}, ...]
        user_input: The candidate's latest answer
        module_topic: The topic being tested (e.g., "Git Basics")
        target_role: The interviewer persona (default: "Senior Tech Lead")
        
    Returns:
        tuple: (combined_response_text, score_update)
            - combined_response_text: "feedback next_question" for speech
            - score_update: int (0-100) or -1 if no grading
    """
    # Build the system prompt
    system_prompt = f"""ACT AS: {target_role} conducting a viva exam.
TOPIC: {module_topic}.

INPUT: User's latest voice text.

TASK:
1. Analyze the input.
2. If the input is just 'Continue', 'Next', 'Start', or similar non-answer, DO NOT GRADE IT. Just ask the next question.
3. If it's an actual answer, grade it (0-100).
4. Generate a 'feedback' sentence (brief, 1 sentence).
5. Generate the 'next_question' (1 sentence).

OUTPUT JSON SCHEMA:
{{
  "feedback": "string - Brief feedback on the answer. If no answer, say 'Let's continue.'",
  "next_question": "string - The next technical question to ask",
  "score_update": number - Score 0-100 for the answer. Return -1 if no grading occurred (skip/continue/start)
}}

RULES:
- Keep feedback under 15 words
- Keep next_question under 20 words
- NO markdown, NO bullet points
- Be direct and technical
- ALWAYS include a next_question
- If user says "continue" or "next", set score_update to -1

EXAMPLES:

Input: "Git is a version control system"
Output: {{"feedback": "Correct.", "next_question": "What is the difference between git add and git commit?", "score_update": 85}}

Input: "I don't know"
Output: {{"feedback": "That's okay.", "next_question": "Let me ask differently. What does git init do?", "score_update": 20}}

Input: "Continue"
Output: {{"feedback": "Let's continue.", "next_question": "What is a git branch?", "score_update": -1}}

Input: "A commit saves changes to the remote repository"
Output: {{"feedback": "Not quite. Commit saves to local repo, not remote.", "next_question": "What command pushes to remote?", "score_update": 40}}
"""

    # Build context with conversation history
    context_text = system_prompt + "\n\nCONVERSATION HISTORY:\n"
    
    # Add last 3 turns for context
    for msg in history[-3:]:
        role_label = "Candidate" if msg['role'] == 'user' else "Interviewer"
        content = msg.get('content', '') or msg.get('parts', [''])[0] if isinstance(msg.get('parts'), list) else ''
        context_text += f"{role_label}: {content}\n"
    
    context_text += f"\nCURRENT INPUT: {user_input}\n\nGenerate JSON response:"

    # Generate response
    model = _get_model()
    response = model.generate_content(context_text)
    
    # Parse JSON response
    try:
        result = json.loads(response.text)
        feedback = result.get("feedback", "Let's continue.")
        next_question = result.get("next_question", "What's your understanding of this topic?")
        score_update = result.get("score_update", -1)
        
        # Combine for speech output
        combined_text = f"{feedback} {next_question}"
        
        return combined_text, score_update
        
    except json.JSONDecodeError as e:
        print(f"JSON parsing error: {e}")
        print(f"Raw response: {response.text}")
        # Fallback response
        return "Let's continue. Can you explain that in more detail?", -1


def generate_initial_question(module_topic, user_goal=None):
    """
    Generate the opening question using JSON output.
    
    Args:
        module_topic: Topic to test (e.g., "Git Basics")
        user_goal: User's learning goal (optional)
        
    Returns:
        str: Opening question
    """
    target_role = "Senior Tech Lead"
    if user_goal:
        goal_lower = user_goal.lower()
        if "backend" in goal_lower:
            target_role = "Senior Backend Engineer"
        elif "frontend" in goal_lower:
            target_role = "Senior Frontend Engineer"
        elif "full stack" in goal_lower:
            target_role = "Full Stack Architect"
    
    prompt = f"""You are a {target_role} conducting a technical viva voce exam on {module_topic}.

Generate a direct opening question. Jump straight to the technical question.

OUTPUT JSON SCHEMA:
{{
  "question": "string - A direct technical question about {module_topic}"
}}

RULES:
- NO greetings like "Hello" or "Welcome"
- Keep it under 20 words
- Make it fundamental/basic to start
- NO markdown

EXAMPLE:
{{"question": "What is the core purpose of {module_topic}?"}}

Generate JSON:"""

    # Generate
    model = _get_model()
    response = model.generate_content(prompt)
    
    try:
        result = json.loads(response.text)
        return result.get("question", f"What is {module_topic}?")
    except json.JSONDecodeError:
        # Fallback
        return f"What is the main purpose of {module_topic}?"


def generate_final_feedback(total_score, module_topic):
    """
    Generate final feedback using JSON output.
    
    Args:
        total_score: Average score (0-100)
        module_topic: Topic that was tested
        
    Returns:
        str: Final feedback
    """
    passed = total_score >= 60
    result = "PASSED" if passed else "FAILED"
    
    prompt = f"""You are concluding a technical viva voce exam on {module_topic}.

Final Score: {total_score}/100
Result: {result}

OUTPUT JSON SCHEMA:
{{
  "feedback": "string - Brief final feedback (2 sentences max)"
}}

RULES:
- If PASSED: Acknowledge competence
- If FAILED: State what needs improvement
- NO markdown
- Keep it under 30 words
- Be direct and professional

EXAMPLE (PASSED):
{{"feedback": "You demonstrated solid understanding of {module_topic}. Keep practicing to master advanced concepts."}}

EXAMPLE (FAILED):
{{"feedback": "You need to review the fundamentals of {module_topic}. Focus on core concepts and try again."}}

Generate JSON:"""

    # Generate
    model = _get_model()
    response = model.generate_content(prompt)
    
    try:
        result = json.loads(response.text)
        return result.get("feedback", f"Your final score is {total_score}/100.")
    except json.JSONDecodeError:
        # Fallback
        if passed:
            return f"You passed with {total_score}/100. Well done!"
        else:
            return f"You scored {total_score}/100. Review the material and try again."


def evaluate_answer(user_text, module_topic):
    """
    Evaluate answer and return score using JSON output.
    
    Args:
        user_text: User's answer
        module_topic: Topic being tested
        
    Returns:
        int: Score from 0-100
    """
    prompt = f"""You are evaluating a technical answer on {module_topic}.

Answer: "{user_text}"

OUTPUT JSON SCHEMA:
{{
  "score": number - Integer between 0 and 100
}}

SCORING GUIDE:
- 80-100: Excellent, detailed, accurate
- 60-79: Good, correct
- 40-59: Partially correct
- 20-39: Incorrect but shows effort
- 0-19: Wrong or no answer

EXAMPLES:
Answer: "Git is a distributed version control system"
Output: {{"score": 90}}

Answer: "I don't know"
Output: {{"score": 0}}

Answer: "Git saves files"
Output: {{"score": 45}}

Generate JSON with score only:"""

    # Generate
    model = _get_model()
    response = model.generate_content(prompt)
    
    try:
        result = json.loads(response.text)
        score = result.get("score", 50)
        return max(0, min(100, int(score)))
    except (json.JSONDecodeError, ValueError):
        # Fallback
        return 50
