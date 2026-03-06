"""
Simplified Viva Agent - Text-only conversation
Uses Gemini for intelligent technical interviews
"""
import json
import google.generativeai as genai
import os
from typing import Dict, List


class SimpleVivaAgent:
    """
    Text-based technical interviewer using Gemini.
    Simple, fast, and reliable.
    """
    
    def __init__(self):
        """Initialize with Gemini."""
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY not found")
        
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel('gemini-2.5-flash')
    
    def get_interviewer_response(
        self, 
        user_text: str, 
        module_topic: str, 
        history: List[Dict[str, str]] = None
    ) -> Dict:
        """
        Get interviewer's response to user's answer.
        
        Args:
            user_text: User's answer
            module_topic: Topic being tested (e.g., "Git Basics")
            history: Previous conversation history
            
        Returns:
            Dict with: reply, next_question, score
        """
        # Build conversation context
        context = ""
        if history:
            for msg in history[-4:]:  # Last 4 messages
                role = msg.get("role", "user")
                content = msg.get("content", "")
                context += f"{role}: {content}\n"
        
        prompt = f"""You are a Senior DevOps Engineer conducting a technical interview on {module_topic}.

Current Context:
{context}

The user just said: "{user_text}"

Your Task:
1. Evaluate their answer (correct/incorrect/partial)
2. Provide brief feedback (1-2 sentences, conversational)
3. Ask the next relevant question

Output ONLY valid JSON in this format:
{{
    "reply": "Your brief feedback on their answer",
    "next_question": "Your next technical question",
    "score": <number 0-100 for THIS answer only>
}}

Scoring Guide:
- Excellent, detailed answer: 80-100
- Good, correct answer: 60-79
- Partially correct: 40-59
- Incorrect but trying: 20-39
- Wrong or no answer: 0-19

Keep it conversational and encouraging. Output ONLY the JSON, nothing else."""

        try:
            response = self.model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    temperature=0.7,
                    max_output_tokens=300,
                )
            )
            
            content = response.text.strip()
            
            # Clean markdown if present
            if content.startswith("```json"):
                content = content.replace("```json", "").replace("```", "").strip()
            elif content.startswith("```"):
                content = content.replace("```", "").strip()
            
            # Parse JSON
            result = json.loads(content)
            
            # Validate required fields
            if not all(k in result for k in ["reply", "next_question", "score"]):
                raise ValueError("Missing required fields in response")
            
            # Ensure score is in valid range
            result["score"] = max(0, min(100, int(result["score"])))
            
            return result
            
        except Exception as e:
            print(f"Error in get_interviewer_response: {e}")
            # Fallback response
            return {
                "reply": "I see. Let's continue.",
                "next_question": f"Can you explain another key concept of {module_topic}?",
                "score": 50
            }
    
    def generate_initial_question(self, module_topic: str, user_goal: str = None) -> str:
        """
        Generate the first question for the viva.
        
        Args:
            module_topic: Topic to test (e.g., "Git Basics")
            user_goal: User's learning goal (e.g., "Full Stack Developer")
            
        Returns:
            Initial question as string
        """
        persona = "Senior DevOps Engineer"
        if user_goal:
            goal_lower = user_goal.lower()
            if "backend" in goal_lower:
                persona = "Senior Backend Engineer"
            elif "frontend" in goal_lower:
                persona = "Senior Frontend Engineer"
            elif "full stack" in goal_lower:
                persona = "Full Stack Architect"
        
        prompt = f"""You are a {persona} conducting a technical interview on {module_topic}.

Generate a friendly greeting and first question.

Guidelines:
- Be warm and encouraging
- Start with a fundamental concept
- Keep it conversational (2-3 sentences)
- Make it open-ended

Output ONLY the greeting and question as plain text."""

        try:
            response = self.model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    temperature=0.8,
                    max_output_tokens=150,
                )
            )
            
            return response.text.strip()
            
        except Exception as e:
            print(f"Error generating initial question: {e}")
            return f"Hey! Ready to chat about {module_topic}? Let's start with the basics - what is {module_topic} and why is it important?"
    
    def generate_final_feedback(self, total_score: int, module_topic: str) -> str:
        """
        Generate final feedback based on total score.
        
        Args:
            total_score: Average score across all answers
            module_topic: Topic that was tested
            
        Returns:
            Final feedback message
        """
        passed = total_score >= 60
        result = "passed" if passed else "failed"
        
        prompt = f"""You are concluding a technical interview on {module_topic}.

Final Score: {total_score}/100
Result: {result.upper()}

Provide brief, encouraging feedback (2-3 sentences):
- If passed: Congratulate and mention strengths
- If failed: Encourage and suggest what to review

Keep it friendly and motivating. Output ONLY the feedback text."""

        try:
            response = self.model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    temperature=0.7,
                    max_output_tokens=150,
                )
            )
            
            return response.text.strip()
            
        except Exception as e:
            print(f"Error generating final feedback: {e}")
            if passed:
                return f"Great job! You scored {total_score}/100 on {module_topic}. Keep up the good work!"
            else:
                return f"You scored {total_score}/100. Review {module_topic} and try again. You've got this!"
