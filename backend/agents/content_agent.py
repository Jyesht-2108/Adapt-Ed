"""
Content Refinery Agent using AWS Bedrock (Claude 3)
Synthesizes educational content from multiple sources with attribution
"""
import json
from models import LessonContent, Source, CodeSnippet
from tools import ContentResult
from typing import List
from aws_config import get_bedrock_client, BEDROCK_MODEL_ID


class ContentRefineryAgent:
    """
    AI-powered content refinery using AWS Bedrock (Claude 3) that transforms 
    raw educational content into structured, high-quality micro-lessons with 
    multi-source attribution.
    """
    
    def __init__(self):
        """Initialize the AWS Bedrock client for content synthesis."""
        self.bedrock_client = get_bedrock_client()
        self.model_id = BEDROCK_MODEL_ID
    
    async def synthesize_lesson(
        self, 
        topic: str, 
        content_results: List[ContentResult], 
        user_preference: str
    ) -> LessonContent:
        """
        Synthesize a structured lesson from multiple content sources using AWS Bedrock.
        
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
        Convert multiple content sources into a strution.
        
        Args:
            topi lesson
            content_results: List of content sources
           ence
            
        Returns:
        
        """
        # Build source context for the prompt
        )
        
        # Build sources list for JSON output
        
        
        # Determine style adaptation based on user preference

        
ion
        prompttion.

ROLE: Synthesize education

topic}

SOURCE MATERIALS PROVIDED:
{source_context}

TASK:
n
2. Remove conversatncy
nal
4. Focus on teaching the core concepts effectively

{style_instruction}

CRITICAL ATTRIBUTION REQUIREMENTS (PerplStyle):
1. Every time you explain a key concept, attribute it
ces
3. In the `citindices
4. Do NOT hallucinate or invent new URLs
5.ove

OUTPUT FORMAT:
You MUST return a vure:
{{
  "title": "Clear, descriptive title fo",
  "summary": "A concise 2-sentence sum",
  "key_concepts": [
    "First core concept or principle",
    ,
    "Third core concept or principle",
    "Fourth core con
    "Fifth core concept (if applicable)"
  ],
  "m
  "code_snippets": [
    {{"language": "python", ')"}},
    {{"language": "b
  ],
  "quiz_question": "A concep",
  "sources": {sources_json},
  "c
  t": 0,

    "Third key c: 0
  }}
}}

IMPORTANT RULES:
- Return ONLY the JSON object, no additional
- Ensure all JSON is properly escaped
- Include 3-5 key concepts
- Include 2-5 code snippets (if applicable to the topic)
- If no code is relevant, use empty array []
at
- Quiz question must be multiple choice with 4 options
- Source
- Citation map should linkces

Generate
        
        # Prepare request for Claude 3 via AWS Bedrock
    _body = {
            "anthropic_version": "bedrock-2023-05-31",
           00,
            "temperature": 0.7,
        
              {
                    "role": "user",
            ompt
                
            ]
        }
        
        y:
            # Call AWS Bedrock
            response = self.bedrock_client.invoke_model(
                modelId=self.mode_id,
                body=json.dumps(request_body)
            )
            
            #ponse
        ))
            content = response_body['co()
         
            # Parse and validate response
           
            
        s e:
            ps: {e}")
            return self._create_fallback_lesson(topilts)
    
    def _build_s str:
        """Build formatted source context for the promp"
        conarts = []
        
        for idx, result in enumerate(clts):
            source_type = rlize()
            context_parts.append(
                f"[Source {idx}] (}\n"
                f"URL: {result.url}\n"
             
            )
        
        return "\n".join(contexparts)
    
    def _bui
        """Build JSON array string for "
        rces = []
        for result in content_resu:
     = {
                "title": result.title,
              
                "typce_type
            }
            
           ta:
                source_dict["metadata"] = result.metadata
           
            s
        
        return json.dumps(sources)
    
    async def _g
        self, 
        top 
        user_preference: str
    ) ->:
        """Generate a lesson from internal knowledge when no sources are available."""
ce)
        
ic}

{s

You MUST return a valid JSON object with this EXACT structure:
{{
  "title": "Clear, descrisson",
  "summary": "A concise 2-
  "key_concepts": [
    "First core concept",
    "Second core concept
    ",
    "Fourth core concept",
    "Fifth core conct"
  ],
  "main_content": "# Main Title\\n\\nDetailed education).",
  "c": [
    {{"language": "python", "code": "# Example code"}},
    {{"languag"}}
  ],
  "quiz_question": "A conceptual multi",
  "sources": [
    {{
      
    drock",
      "type": "documen"
  }
  ],
  "citation_mull
}}

REQUIREMENTS:
- Return ONLY the JSON object
- Include 3-5 key concepts

- Main content should bkdown
- Quiz mions

Generate the lesson:"""
      
        request_body = {
           ,
            "max_tokens": 4000,
         0.7,
            "": [: "# Command example"}}
  ],
  "quiz_question": "A conceptual multiple-choice question. Format: 'Question? A) Option 1 B) Option 2 C) Option 3 D) Option 4'",
  "sources": [
    {{
      "title": "AI Generated Content via AWS Bedrock",
      "url": "Generated from Claude 3 knowledge",
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
        
        # Prepare request for Claude 3 via AWS Bedrock
        request_body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 4000,
            "temperature": 0.7,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        }
        
        try:
            # Call AWS Bedrock
            response = self.bedrock_client.invoke_model(
                modelId=self.model_id,
                body=json.dumps(request_body)
            )
            
            # Parse response
            response_body = json.loads(response['body'].read())
            content = response_body['content'][0]['text'].strip()
            
            return self._parse_lesson_response(content, topic, [])
            
        except Exception as e:
            print(f"Error generating fallback lesson via AWS Bedrock: {e}")
            return self._create_fallback_lesson(topic, [])
    
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
                title="AI Generated Content via AWS Bedrock",
                url="Generated from Claude 3 knowledge",
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
