import google.generativeai as genai
from models import LessonContent, Source
from tools import ContentResult
import os
import json
from typing import List, Dict


class ContentRefineryAgent:
    """
    AI-powered content refinery that transforms raw educational content 
    into structured, high-quality micro-lessons with multi-source attribution.
    """
    
    def __init__(self):
        """Initialize the Gemini model for content synthesis."""
        genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
        self.model = genai.GenerativeModel('gemini-2.5-flash')
    
    async def synthesize_lesson(
        self, 
        topic: str, 
        content_results: List[ContentResult], 
        user_preference: str
    ) -> LessonContent:
        """
        Synthesize a structured lesson from multiple content sources.
        
        Args:
            topic: The topic of the lesson
            content_results: List of ContentResult objects from various sources
            user_preference: Learning style ("visual" or "text")
            
        Returns:
            LessonContent: Structured lesson with multi-source attribution
        """
        # Fallback mode: Generate lesson from internal knowledge if no sources
        if not content_results or len(content_results) == 0:
            return await self._generate_fallback_lesson(topic, user_preference)
        
        # Normal mode: Synthesize from multiple sources
        return await self._synthesize_from_multiple_sources(
            topic, 
            content_results, 
            user_preference
        )
    
    async def _synthesize_from_multiple_sources(
        self, 
        topic: str, 
        content_results: List[ContentResult], 
        user_preference: str
    ) -> LessonContent:
        """
        Convert multiple content sources into a structured lesson with attribution.
        
        Args:
            topic: The topic of the lesson
            content_results: List of content sources
            user_preference: Learning style preference
            
        Returns:
            LessonContent: Structured lesson with sources
        """
        # Build source context for the prompt
        source_context = self._build_source_context(content_results)
        
        # Build sources list for JSON output
        sources_json = self._build_sources_json(content_results)
        
        # Determine style adaptation based on user preference
        style_instruction = self._get_style_instruction(user_preference)
        
        # Create the system prompt with Perplexity-style attribution
        system_prompt = f"""You are an expert technical educator specializing in creating structured learning content with proper source attribution.

ROLE: Synthesize educational content from multiple sources into a professional, structured guide.

TOPIC: {topic}

SOURCE MATERIALS PROVIDED:
{source_context}

TASK:
1. Synthesize information from ALL provided sources into a comprehensive lesson
2. Remove conversational filler and redundancy
3. Be concise and professional
4. Focus on teaching the core concepts effectively

{style_instruction}

CRITICAL ATTRIBUTION REQUIREMENTS (Perplexity-Style):
1. Every time you explain a key concept, attribute it to one of the sources
2. Use the source index (0, 1, 2, etc.) to reference sources
3. In the `citation_map`, map key concepts to their source indices
4. Do NOT hallucinate or invent new URLs
5. ONLY use the sources provided in the context above

OUTPUT FORMAT:
You MUST return a valid JSON object with this EXACT structure:
{{
  "title": "Clear, descriptive title for the lesson",
  "summary": "A concise 2-sentence summary of what this lesson covers",
  "key_concepts": [
    "First core concept or principle",
    "Second core concept or principle",
    "Third core concept or principle",
    "Fourth core concept (if applicable)",
    "Fifth core concept (if applicable)"
  ],
  "main_content": "# Main Title\\n\\nDetailed educational content in **Markdown** format. Use headers (##), bold text for emphasis, code blocks with ```language```, and clear paragraphs. Make it comprehensive but concise (300-500 words).",
  "code_snippets": [
    {{"language": "python", "code": "# Example code here\\nprint('Hello')"}},
    {{"language": "bash", "code": "docker run -it ubuntu"}}
  ],
  "quiz_question": "A conceptual multiple-choice question to test understanding. Format: 'Question text? A) Option 1 B) Option 2 C) Option 3 D) Option 4'",
  "sources": {sources_json},
  "citation_map": {{
    "First key concept": 0,
    "Second key concept": 1,
    "Third key concept": 0
  }}
}}

IMPORTANT RULES:
- Return ONLY the JSON object, no additional text
- Ensure all JSON is properly escaped
- Include 3-5 key concepts
- Include 2-5 code snippets (if applicable to the topic)
- If no code is relevant, use empty array []
- Main content should be 300-500 words in Markdown format
- Quiz question must be multiple choice with 4 options
- Sources array MUST match the provided sources exactly
- Citation map should link at least 3 key concepts to sources

Generate the structured lesson with proper attribution:"""
        
        # Generate content
        response = self.model.generate_content(system_prompt)
        
        # Parse and validate response
        return self._parse_lesson_response(response.text, topic, content_results)
    
    def _build_source_context(self, content_results: List[ContentResult]) -> str:
        """
        Build formatted source context for the prompt.
        
        Args:
            content_results: List of content sources
            
        Returns:
            Formatted string with all sources
        """
        context_parts = []
        
        for idx, result in enumerate(content_results):
            source_type = result.source_type.capitalize()
            context_parts.append(
                f"[Source {idx}] ({source_type}): {result.title}\n"
                f"URL: {result.url}\n"
                f"Content: {result.text[:3000]}...\n"  # Limit each source to 3000 chars
            )
        
        return "\n".join(context_parts)
    
    def _build_sources_json(self, content_results: List[ContentResult]) -> str:
        """
        Build JSON array string for sources.
        
        Args:
            content_results: List of content sources
            
        Returns:
            JSON string representation of sources array
        """
        sources = []
        for result in content_results:
            source_dict = {
                "title": result.title,
                "url": result.url,
                "type": result.source_type
            }
            
            # Add metadata if available
            if result.metadata:
                source_dict["metadata"] = result.metadata
            
            sources.append(source_dict)
        
        return json.dumps(sources)
    
    async def _generate_fallback_lesson(
        self, 
        topic: str, 
        user_preference: str
    ) -> LessonContent:
        """
        Generate a lesson from internal knowledge when no sources are available.
        
        Args:
            topic: The topic to teach
            user_preference: Learning style preference
            
        Returns:
            LessonContent: Generated lesson
        """
        style_instruction = self._get_style_instruction(user_preference)
        
        prompt = f"""You are an expert technical educator. Create a comprehensive lesson about: {topic}

{style_instruction}

You MUST return a valid JSON object with this EXACT structure:
{{
  "title": "Clear, descriptive title for the lesson",
  "summary": "A concise 2-sentence summary of what this lesson covers",
  "key_concepts": [
    "First core concept",
    "Second core concept",
    "Third core concept",
    "Fourth core concept",
    "Fifth core concept"
  ],
  "main_content": "# Main Title\\n\\nDetailed educational content in **Markdown** format. Use headers (##), bold text, code blocks, and clear paragraphs. Make it comprehensive (300-500 words).",
  "code_snippets": [
    {{"language": "python", "code": "# Example code"}},
    {{"language": "bash", "code": "# Command example"}}
  ],
  "quiz_question": "A conceptual multiple-choice question. Format: 'Question? A) Option 1 B) Option 2 C) Option 3 D) Option 4'",
  "sources": [
    {{
      "title": "AI Generated Content",
      "url": "Generated from AI knowledge",
      "type": "documentation"
    }}
  ],
  "citation_map": null
}}

REQUIREMENTS:
- Return ONLY the JSON object
- Include 3-5 key concepts
- Include 2-5 code snippets (if applicable)
- Main content should be 300-500 words in Markdown
- Quiz must have 4 multiple choice options

Generate the lesson:"""
        
        response = self.model.generate_content(prompt)
        return self._parse_lesson_response(response.text, topic, [])
    
    def _get_style_instruction(self, user_preference: str) -> str:
        """
        Get style instructions based on user learning preference.
        
        Args:
            user_preference: Learning style ("visual", "text", or other)
            
        Returns:
            Style instruction string
        """
        if "visual" in user_preference.lower():
            return """STYLE ADAPTATION (Visual Learner):
- Emphasize descriptions of diagrams, charts, and visual concepts
- Use analogies and visual metaphors to explain abstract concepts
- Include more code examples with inline comments
- Describe what things "look like" or how they "flow"
- Use formatting to create visual hierarchy (headers, bold, lists)"""
        
        elif "text" in user_preference.lower():
            return """STYLE ADAPTATION (Text Learner):
- Emphasize precise definitions and terminology
- Focus on step-by-step textual instructions
- Provide detailed written explanations
- Use clear, logical structure with numbered steps
- Include syntax explanations and technical details"""
        
        else:
            return """STYLE ADAPTATION:
- Provide a balanced mix of visual and textual explanations
- Include both code examples and written descriptions
- Use clear structure with headers and bullet points"""
    
    def _parse_lesson_response(
        self, 
        response_text: str, 
        topic: str,
        content_results: List[ContentResult]
    ) -> LessonContent:
        """
        Parse and validate the AI response into a LessonContent object.
        
        Args:
            response_text: Raw response from AI
            topic: Lesson topic (for fallback)
            content_results: Original content sources (for fallback)
            
        Returns:
            LessonContent: Validated lesson object
            
        Raises:
            ValueError: If parsing fails
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
            lesson_data = json.loads(content)
            
            # Create and validate LessonContent object
            lesson = LessonContent(**lesson_data)
            
            return lesson
            
        except json.JSONDecodeError as e:
            print(f"JSON parsing error: {e}")
            print(f"Response text: {response_text[:500]}")
            
            # Return a minimal fallback lesson
            return self._create_fallback_lesson(topic, content_results)
            
        except Exception as e:
            print(f"Error creating LessonContent: {e}")
            print(f"Response text: {response_text[:500]}")
            
            # Return a minimal fallback lesson
            return self._create_fallback_lesson(topic, content_results)
    
    def _create_fallback_lesson(
        self, 
        topic: str, 
        content_results: List[ContentResult]
    ) -> LessonContent:
        """
        Create a minimal fallback lesson when parsing fails.
        
        Args:
            topic: Lesson topic
            content_results: Original content sources
            
        Returns:
            LessonContent: Minimal valid lesson
        """
        # Build sources from content_results
        sources = []
        if content_results:
            for result in content_results:
                sources.append(Source(
                    title=result.title,
                    url=result.url,
                    type=result.source_type,
                    metadata=result.metadata
                ))
        else:
            sources.append(Source(
                title="AI Generated Content",
                url="Generated from AI knowledge",
                type="documentation",
                metadata=None
            ))
        
        return LessonContent(
            title=f"Introduction to {topic}",
            summary=f"This lesson covers the fundamentals of {topic}. Learn the core concepts and practical applications.",
            key_concepts=[
                f"Understanding {topic} basics",
                f"Key principles of {topic}",
                f"Practical applications of {topic}"
            ],
            main_content=f"# Introduction to {topic}\n\nThis is a foundational lesson on **{topic}**. "
                        f"We'll explore the core concepts and how to apply them in practice.\n\n"
                        f"## Key Topics\n\n- Fundamentals\n- Best practices\n- Common use cases",
            code_snippets=[],
            quiz_question=f"What is the primary purpose of {topic}? A) Option 1 B) Option 2 C) Option 3 D) Option 4",
            sources=sources,
            citation_map=None
        )

