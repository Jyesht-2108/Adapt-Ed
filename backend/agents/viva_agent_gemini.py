"""
Viva Voce Agent - Hybrid Implementation
Uses Gemini for conversation logic (FREE) and OpenAI for voice (Whisper + TTS)
"""
import json
import os
from typing import List, Dict, Tuple
from openai import OpenAI
import google.generativeai as genai
from datetime import datetime


class VivaAgent:
    """
    AI-powered technical interviewer for Viva Voce examinations.
    Hybrid approach: Gemini for conversation, OpenAI for voice.
    """
    
    def __init__(self):
        """Initialize the Viva Agent with Gemini and OpenAI clients."""
        # Gemini for conversation logic (FREE)
        gemini_api_key = os.getenv("GEMINI_API_KEY")
        if not gemini_api_key:
            raise ValueError("GEMINI_API_KEY not found in environment variables")
        
        genai.configure(api_key=gemini_api_key)
        self.gemini_model = genai.GenerativeModel('gemini-2.0-flash-exp')
        
        # OpenAI for voice only (Whisper + TTS)
        openai_api_key = os.getenv("OPENAI_API_KEY")
        if not openai_api_key:
            raise ValueError("OPENAI_API_KEY not found in environment variables")
        
        self.openai_client = OpenAI(api_key=openai_api_key)
    
    def generate_initial_question(
        self, 
        module_title: str, 
        module_description: str = None,
        user_goal: str = None
    ) -> str:
        """
        Generate the first question to start the viva using Gemini.
        
        Args:
            module_title: Title of the module being tested
            module_description: Optional description for context
            user_goal: User's learning goal (e.g., "Full Stack Developer")
            
        Returns:
            Initial greeting and question
        """
        context = f"Module: {module_title}"
        if module_description:
            context += f"\nDescription: {module_description}"
        
        # Determine interviewer persona based on user goal
        persona = "Senior Software Engineer"
        if user_goal:
            goal_lower = user_goal.lower()
            if "backend" in goal_lower:
                persona = "Senior Backend Engineer"
            elif "frontend" in goal_lower or "react" in goal_lower:
                persona = "Senior Frontend Engineer"
            elif "full stack" in goal_lower or "fullstack" in goal_lower:
                persona = "Full Stack Architect"
            elif "devops" in goal_lower or "cloud" in goal_lower:
                persona = "DevOps Evangelist"
            elif "data" in goal_lower or "ml" in goal_lower or "ai" in goal_lower:
                persona = "Senior Data Engineer"
            elif "mobile" in goal_lower:
                persona = "Senior Mobile Developer"
        
        prompt = f"""You are a {persona} conducting a friendly but professional technical interview (Viva Voce).

{context}

Your personality:
- Warm and approachable, like a senior colleague mentoring a junior
- Professional but conversational - talk like you're having coffee with a friend
- Encouraging and supportive, but still thorough
- Use casual language occasionally ("Hey", "Alright", "Cool", "Got it")
- Show genuine interest in their answers

Your task: Greet them warmly and ask the FIRST question.

Guidelines:
- Start with a friendly greeting (e.g., "Hey! Ready to dive into {module_title}?")
- Introduce yourself briefly as a {persona}
- Ask ONE fundamental question to start
- Keep it conversational (3-4 sentences max)
- Make it open-ended to gauge their understanding

Example tone: "Hey there! I'm Alex, a {persona}. I'm excited to chat with you about {module_title} today. Let's start with something fundamental - can you walk me through..."

Output ONLY the greeting and first question as plain text. Do NOT use markdown or formatting."""

        try:
            response = self.gemini_model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    temperature=0.8,
                    max_output_tokens=250,
                )
            )
            
            return response.text.strip()
            
        except Exception as e:
            print(f"Error generating initial question: {e}")
            return f"Hey there! I'm excited to chat with you about {module_title} today. Let's start with the basics - can you walk me through what this module is all about and why it's important?"
    
    def generate_viva_response(
        self,
        history: List[Dict[str, str]],
        user_input: str,
        module_context: str
    ) -> Tuple[str, int]:
        """
        Generate interviewer's response and score update using Gemini.
        
        Args:
            history: List of previous messages [{"role": "user/interviewer", "content": "..."}]
            user_input: User's latest answer
            module_context: Context about the module being tested
            
        Returns:
            Tuple of (response_text, score_update)
        """
        # Build conversation history
        conversation_text = ""
        for msg in history[-6:]:  # Last 6 messages for context
            role = "Interviewer" if msg["role"] == "interviewer" else "Candidate"
            conversation_text += f"{role}: {msg['content']}\n\n"
        
        conversation_text += f"Candidate: {user_input}\n\n"
        
        prompt = f"""You are a friendly, conversational Technical Interviewer conducting a Viva Voce examination.

Module Context: {module_context}

Conversation so far:
{conversation_text}

Your personality:
- Talk like a supportive senior colleague, not a strict examiner
- Use conversational language ("Nice!", "I see what you mean", "That's a good point", "Hmm, interesting")
- Show genuine interest in their answers
- Be encouraging even when correcting mistakes
- Keep the vibe professional but relaxed - like a technical discussion over coffee

Your responsibilities:
1. React naturally to their answer (acknowledge it first)
2. Evaluate the answer fairly
3. Ask ONE follow-up question or move to the next concept
4. If vague: "That's a start! Can you dive deeper into X?"
5. If wrong: "I see where you're going, but actually... [brief correction]. Let's move on to..."
6. Keep responses conversational and concise (2-4 sentences)
7. Vary your responses - don't sound robotic

CRITICAL: You MUST respond with VALID JSON in this exact format:
{{
    "response_text": "Your spoken reply to the candidate (conversational tone)",
    "score_update": <number between -10 and +10>
}}

Score Guidelines:
- Excellent answer with depth: +8 to +10
- Good answer, correct: +5 to +7
- Partially correct: +2 to +4
- Vague but on track: 0 to +1
- Incorrect but trying: -2 to 0
- Completely wrong: -5 to -2
- No answer/off-topic: -8 to -5

Remember: Output ONLY valid JSON, nothing else. Keep the tone friendly and conversational."""

        try:
            response = self.gemini_model.generate_content(
                prompt,
                generation_config=genai.GenerationConfig(
                    temperature=0.8,
                    max_output_tokens=300,
                    response_mime_type="application/json"
                )
            )
            
            content = response.text.strip()
            
            # Parse JSON response
            try:
                # Remove markdown code blocks if present
                if content.startswith("```json"):
                    content = content.replace("```json", "").replace("```", "").strip()
                elif content.startswith("```"):
                    content = content.replace("```", "").strip()
                
                result = json.loads(content)
                response_text = result.get("response_text", "")
                score_update = int(result.get("score_update", 0))
                
                # Clamp score update to valid range
                score_update = max(-10, min(10, score_update))
                
                return response_text, score_update
                
            except json.JSONDecodeError as e:
                print(f"JSON parse error: {e}")
                print(f"Raw content: {content}")
                # Fallback response
                return "I see. Let me ask you another question to better assess your understanding.", 0
                
        except Exception as e:
            print(f"Error generating viva response: {e}")
            # Fallback response
            return "Thank you for your answer. Let's continue with the next question.", 0
    
    def generate_final_feedback(
        self,
        score: int,
        passed: bool,
        module_title: str,
        transcript: List[Dict[str, str]]
    ) -> str:
        """
        Generate final feedback using Gemini.
        
        Args:
            score: Final score (0-100)
            passed: Whether the candidate passed
            module_title: Module title
            transcript: Full conversation history
            
        Returns:
            Final feedback message
        """
        result = "passed" if passed else "failed"
        
        prompt = f"""You are a Technical Interviewer concluding a Viva Voce examination.

Module: {module_title}
Final Score: {score}/100
Result: {result.upper()}

Provide brief, constructive feedback (2-3 sentences):
- If passed: Congratulate them warmly and mention 1-2 strengths
- If failed: Be encouraging, mention what to improve, stay positive

Keep it professional, motivating, and conversational. Output ONLY the feedback text, no formatting."""

        try:
            response = self.gemini_model.generate_content(
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
                return f"Congratulations! You've passed the viva with a score of {score}/100. Well done!"
            else:
                return f"You scored {score}/100. Keep studying and you'll do better next time!"
    
    def transcribe_audio(self, audio_file) -> str:
        """
        Transcribe audio to text using OpenAI Whisper.
        
        Args:
            audio_file: Audio file object
            
        Returns:
            Transcribed text
        """
        try:
            transcript = self.openai_client.audio.transcriptions.create(
                model="whisper-1",
                file=audio_file,
                language="en"
            )
            return transcript.text
            
        except Exception as e:
            print(f"Error transcribing audio: {e}")
            raise
    
    def text_to_speech(self, text: str) -> bytes:
        """
        Convert text to speech using OpenAI TTS.
        
        Args:
            text: Text to convert
            
        Returns:
            Audio bytes
        """
        try:
            response = self.openai_client.audio.speech.create(
                model="tts-1",
                voice="alloy",  # Professional, neutral voice
                input=text,
                speed=1.0
            )
            
            return response.content
            
        except Exception as e:
            print(f"Error generating speech: {e}")
            raise

