"""
Viva Agent using Hugging Face Inference API
Uses Zephyr-7b-beta for conversational technical interviews
"""
import os
from typing import Dict, List
from huggingface_hub import InferenceClient


class HuggingFaceVivaAgent:
    """
    Text-based technical interviewer using Hugging Face Inference API.
    Uses Zephyr-7b-beta model for chat/roleplay.
    """
    
    def __init__(self):
        """Initialize with Hugging Face Inference Client."""
        api_key = os.getenv("HUGGINGFACE_API_KEY")
        if not api_key:
            raise ValueError("HUGGINGFACE_API_KEY not found")
        
        self.client = InferenceClient(token=api_key)
        self.model = "HuggingFaceH4/zephyr-7b-beta"
    
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
                if role == "user":
                    context += f"Student: {content}\n"
                else:
                    context += f"Interviewer: {content}\n"
        
        # System prompt
        system_prompt = f"""You are a strict Technical Interviewer for a generic tech company.
Topic: {module_topic}

Your role:
1. Analyze the student's answer
2. If it's wrong, correct them briefly
3. Ask the NEXT relevant follow-up question
4. Keep it conversational (short sentences)
5. Do not use markdown or bullet points, as this will be spoken out loud

Be professional but friendly. Keep responses concise (2-3 sentences max)."""

        # User prompt
        user_prompt = f"""Previous conversation:
{context}

Student's latest answer: {user_text}

Provide your response as the interviewer. Give brief feedback on their answer, then ask the next question."""

        try:
            # Call Hugging Face Inference API
            response = self.client.text_generation(
                prompt=f"<|system|>\n{system_prompt}\n<|user|>\n{user_prompt}\n<|assistant|>\n",
                model=self.model,
                max_new_tokens=150,
                temperature=0.7,
                top_p=0.95,
                repetition_penalty=1.1,
                do_sample=True,
            )
            
            # Clean up response
            response_text = response.strip()
            
            # Remove any system tags if present
            response_text = response_text.replace("<|assistant|>", "").strip()
            response_text = response_text.replace("<|system|>", "").strip()
            response_text = response_text.replace("<|user|>", "").strip()
            
            # Evaluate the answer to get a score
            score = self.evaluate_answer(user_text, module_topic)
            
            # Split response into reply and next question
            # Try to find question mark to separate
            parts = response_text.split("?", 1)
            if len(parts) == 2:
                reply = parts[0].strip() + "?"
                next_question = parts[1].strip()
                if not next_question:
                    next_question = f"Can you tell me more about {module_topic}?"
            else:
                # If no question mark, treat whole response as reply
                reply = response_text
                next_question = f"Can you explain another aspect of {module_topic}?"
            
            return {
                "reply": reply,
                "next_question": next_question,
                "score": score
            }
            
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
        
        system_prompt = f"""You are a {persona} conducting a technical interview on {module_topic}.

Your role:
- Be warm and encouraging
- Start with a fundamental concept
- Keep it conversational (2-3 sentences)
- Make it open-ended
- Do not use markdown or bullet points"""

        user_prompt = "Generate a friendly greeting and first question for the interview."

        try:
            response = self.client.text_generation(
                prompt=f"<|system|>\n{system_prompt}\n<|user|>\n{user_prompt}\n<|assistant|>\n",
                model=self.model,
                max_new_tokens=100,
                temperature=0.8,
                top_p=0.95,
                do_sample=True,
            )
            
            # Clean up response
            response_text = response.strip()
            response_text = response_text.replace("<|assistant|>", "").strip()
            response_text = response_text.replace("<|system|>", "").strip()
            response_text = response_text.replace("<|user|>", "").strip()
            
            return response_text
            
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
        
        system_prompt = f"""You are concluding a technical interview on {module_topic}.

Final Score: {total_score}/100
Result: {result.upper()}

Your role:
- Provide brief, encouraging feedback (2-3 sentences)
- If passed: Congratulate and mention strengths
- If failed: Encourage and suggest what to review
- Keep it friendly and motivating
- Do not use markdown or bullet points"""

        user_prompt = "Provide the final feedback for this interview."

        try:
            response = self.client.text_generation(
                prompt=f"<|system|>\n{system_prompt}\n<|user|>\n{user_prompt}\n<|assistant|>\n",
                model=self.model,
                max_new_tokens=100,
                temperature=0.7,
                top_p=0.95,
                do_sample=True,
            )
            
            # Clean up response
            response_text = response.strip()
            response_text = response_text.replace("<|assistant|>", "").strip()
            response_text = response_text.replace("<|system|>", "").strip()
            response_text = response_text.replace("<|user|>", "").strip()
            
            return response_text
            
        except Exception as e:
            print(f"Error generating final feedback: {e}")
            if passed:
                return f"Great job! You scored {total_score}/100 on {module_topic}. Keep up the good work!"
            else:
                return f"You scored {total_score}/100. Review {module_topic} and try again. You've got this!"
    
    def evaluate_answer(self, user_text: str, module_topic: str) -> int:
        """
        Evaluate the user's answer and return a score.
        
        Args:
            user_text: User's answer
            module_topic: Topic being tested
            
        Returns:
            Score from 0-100
        """
        system_prompt = f"""You are evaluating a technical interview answer on {module_topic}.

Scoring Guide:
- Excellent, detailed answer: 80-100
- Good, correct answer: 60-79
- Partially correct: 40-59
- Incorrect but trying: 20-39
- Wrong or no answer: 0-19

Respond with ONLY a number between 0 and 100."""

        user_prompt = f"Evaluate this answer: {user_text}"

        try:
            response = self.client.text_generation(
                prompt=f"<|system|>\n{system_prompt}\n<|user|>\n{user_prompt}\n<|assistant|>\n",
                model=self.model,
                max_new_tokens=10,
                temperature=0.3,
                do_sample=False,
            )
            
            # Extract number from response
            score_text = response.strip()
            # Try to extract first number found
            import re
            numbers = re.findall(r'\d+', score_text)
            if numbers:
                score = int(numbers[0])
                return max(0, min(100, score))
            else:
                return 50  # Default middle score
                
        except Exception as e:
            print(f"Error evaluating answer: {e}")
            return 50  # Default middle score
