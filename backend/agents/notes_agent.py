import google.generativeai as genai
from models import LessonContent, StudyNotes, Source
import os
import json


class NotesGeneratorAgent:
    """
    AI-powered agent that transforms lesson content into comprehensive study notes.
    """
    
    def __init__(self):
        """Initialize the Gemini model for notes generation."""
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        self.model = genai.GenerativeModel('gemini-2.5-flash')
    
    async def generate_study_notes(self, lesson: LessonContent) -> StudyNotes:
        """
        Generate comprehensive study notes from lesson content.
        
        Args:
            lesson: The original lesson content
            
        Returns:
            StudyNotes: Detailed study notes optimized for learning and review
        """
        # Build the prompt
        prompt = f"""You are an expert educational content creator specializing in creating comprehensive study notes.

Your task is to transform the following lesson into detailed, well-structured study notes that a student can use for learning and review.

ORIGINAL LESSON:
Title: {lesson.title}
Summary: {lesson.summary}

Key Concepts:
{chr(10).join(f"- {concept}" for concept in lesson.key_concepts)}

Main Content:
{lesson.main_content}

Code Examples:
{chr(10).join(f"```{snippet.language}{chr(10)}{snippet.code}{chr(10)}```" for snippet in lesson.code_snippets)}

INSTRUCTIONS:
1. Create comprehensive study notes that EXPAND on the lesson content
2. Add more detailed explanations and context
3. Include practical examples and use cases
4. Organize information in a clear, hierarchical structure
5. Add mnemonics, tips, or memory aids where helpful
6. Include step-by-step breakdowns for complex concepts
7. Make the notes self-contained and easy to review

OUTPUT FORMAT:
You MUST return a valid JSON object with this EXACT structure:
{{
  "title": "{lesson.title} - Study Notes",
  "overview": "A comprehensive 2-3 sentence overview of what these notes cover",
  "detailed_notes": "# Main Study Notes\\n\\nComprehensive notes in Markdown format. Use:\\n- ## for main sections\\n- ### for subsections\\n- **bold** for important terms\\n- `code` for technical terms\\n- > blockquotes for important notes\\n- Bullet points and numbered lists\\n- Tables where appropriate\\n\\nMake this 500-800 words with detailed explanations.",
  "key_takeaways": [
    "First key takeaway - make it actionable",
    "Second key takeaway",
    "Third key takeaway",
    "Fourth key takeaway",
    "Fifth key takeaway",
    "Sixth key takeaway (optional)",
    "Seventh key takeaway (optional)"
  ],
  "practice_exercises": [
    "Practice exercise 1 - hands-on task",
    "Practice exercise 2 - conceptual question",
    "Practice exercise 3 - real-world scenario",
    "Practice exercise 4 (optional)",
    "Practice exercise 5 (optional)"
  ],
  "additional_resources": [
    "Topic 1 to explore further",
    "Topic 2 to explore further",
    "Topic 3 to explore further",
    "Related concept to study"
  ],
  "sources": {json.dumps([{"title": s.title, "url": s.url, "type": s.type} for s in lesson.sources])}
}}

CRITICAL REQUIREMENTS:
- Return ONLY the JSON object, no additional text
- Ensure all JSON is properly escaped
- detailed_notes should be 500-800 words in Markdown format
- Include 5-7 key takeaways
- Include 3-5 practice exercises
- Include 3-4 additional resources
- Make the notes MORE detailed than the original lesson
- Add explanations, examples, and context not in the original

Generate the comprehensive study notes:"""
        
        # Generate notes
        response = self.model.generate_content(prompt)
        
        # Parse and validate response
        return self._parse_notes_response(response.text, lesson)
    
    def _parse_notes_response(self, response_text: str, lesson: LessonContent) -> StudyNotes:
        """
        Parse and validate the AI response into a StudyNotes object.
        
        Args:
            response_text: Raw response from AI
            lesson: Original lesson (for fallback)
            
        Returns:
            StudyNotes: Validated notes object
        """
        try:
            content = response_text.strip()
            
            # Remove markdown code blocks if present
            if content.startswith("```json"):
                content = content[7:]
            if content.startswith("```"):
                content = content[3:]
            if content.endswith("```"):
                content = content[:-3]
            content = content.strip()
            
            # Parse JSON
            notes_data = json.loads(content)
            
            # Create and validate StudyNotes object
            notes = StudyNotes(**notes_data)
            
            return notes
            
        except json.JSONDecodeError as e:
            print(f"JSON parsing error: {e}")
            print(f"Response text: {response_text[:500]}")
            
            # Return a basic fallback
            return self._create_fallback_notes(lesson)
            
        except Exception as e:
            print(f"Error creating StudyNotes: {e}")
            print(f"Response text: {response_text[:500]}")
            
            # Return a basic fallback
            return self._create_fallback_notes(lesson)
    
    def _create_fallback_notes(self, lesson: LessonContent) -> StudyNotes:
        """
        Create basic fallback notes when AI generation fails.
        
        Args:
            lesson: Original lesson content
            
        Returns:
            StudyNotes: Basic notes from lesson content
        """
        return StudyNotes(
            title=f"{lesson.title} - Study Notes",
            overview=lesson.summary,
            detailed_notes=lesson.main_content,
            key_takeaways=lesson.key_concepts,
            practice_exercises=[
                "Review the key concepts above",
                "Try implementing the code examples",
                "Answer the quiz question from the lesson"
            ],
            additional_resources=[
                "Explore the sources listed below",
                "Practice with real-world examples",
                "Review related documentation"
            ],
            sources=lesson.sources
        )
