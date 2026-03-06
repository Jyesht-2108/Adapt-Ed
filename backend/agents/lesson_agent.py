import google.generativeai as genai
from models import Lesson
from tools import get_youtube_transcript
import os
import json


def generate_lesson(topic: str, user_preference: str) -> Lesson:
    """
    Generate a micro-lesson by fetching YouTube transcript and synthesizing it.
    
    Args:
        topic: The topic to generate a lesson about
        user_preference: Learning style preference (e.g., "visual learner", "text learner")
        
    Returns:
        Lesson: Synthesized lesson with summary, key points, and code snippets
    """
    # Configure Gemini
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    model = genai.GenerativeModel('gemini-2.5-flash')
    
    # Step 1: Generate search query
    search_query = _generate_search_query(model, topic)
    print(f"Generated search query: {search_query}")
    
    # Step 2: Get YouTube transcript
    transcript = get_youtube_transcript(search_query)
    print(f"Retrieved transcript (first 200 chars): {transcript[:200]}")
    
    # Check if transcript retrieval failed
    if transcript.startswith("Error:"):
        # Fallback: generate lesson without transcript
        print(f"Transcript retrieval failed: {transcript}")
        return _generate_lesson_without_transcript(model, topic, user_preference)
    
    # Step 3: Synthesize lesson from transcript
    lesson = _synthesize_lesson(model, topic, user_preference, transcript)
    
    return lesson


def _generate_search_query(model, topic: str) -> str:
    """
    Generate an optimized search query for finding relevant YouTube content.
    
    Args:
        model: Gemini model instance
        topic: The topic to search for
        
    Returns:
        Optimized search query string
    """
    prompt = f"""You are a search query optimizer. Generate a concise, effective YouTube search query 
that will find high-quality tutorial videos about the given topic.

Rules:
- Keep it short (3-6 words)
- Include relevant keywords like "tutorial", "explained", "guide"
- Focus on beginner-friendly content
- Return ONLY the search query, nothing else

Topic: {topic}"""
    
    response = model.generate_content(prompt)
    search_query = response.text.strip().strip('"').strip("'")
    
    return search_query


def _synthesize_lesson(model, topic: str, user_preference: str, transcript: str) -> Lesson:
    """
    Synthesize a structured lesson from a video transcript.
    
    Args:
        model: Gemini model instance
        topic: The lesson topic
        user_preference: Learning style preference
        transcript: Video transcript text
        
    Returns:
        Lesson object with structured content
    """
    # Customize prompt based on user preference
    preference_instruction = ""
    if "visual" in user_preference.lower():
        preference_instruction = """Since the user is a VISUAL LEARNER:
- Emphasize code blocks and provide detailed code examples
- Describe diagrams, visual concepts, and mental models
- Use analogies and visual metaphors
- Include more code snippets"""
    elif "text" in user_preference.lower():
        preference_instruction = """Since the user is a TEXT LEARNER:
- Emphasize clear bullet points and written explanations
- Focus on step-by-step textual instructions
- Provide detailed written descriptions
- Use concise, well-organized text"""
    else:
        preference_instruction = "Provide a balanced mix of text explanations and code examples."
    
    prompt = f"""You are an expert tutor specializing in creating micro-lessons from educational content.

Your task is to analyze the provided video transcript and create a structured, comprehensive lesson about: {topic}

{preference_instruction}

You MUST return a valid JSON object with this EXACT structure:
{{
  "topic": "{topic}",
  "summary": "A comprehensive 2-3 paragraph summary of the main concepts",
  "key_points": [
    "Key point 1 - clear and actionable",
    "Key point 2 - clear and actionable",
    "Key point 3 - clear and actionable",
    "Key point 4 - clear and actionable",
    "Key point 5 - clear and actionable"
  ],
  "code_snippets": [
    "code example 1",
    "code example 2",
    "code example 3"
  ]
}}

REQUIREMENTS:
- summary: 2-3 paragraphs explaining the core concepts
- key_points: 5-7 actionable takeaways from the lesson
- code_snippets: 2-5 relevant code examples (if applicable to the topic)
- If no code is relevant, provide empty array for code_snippets

Return ONLY the JSON object, no additional text.

Video Transcript:

{transcript}

Generate the structured lesson."""
    
    response = model.generate_content(prompt)
    
    # Parse the response
    try:
        content = response.text.strip()
        
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
        
        # Create Lesson object
        lesson = Lesson(**lesson_data)
        return lesson
        
    except Exception as e:
        print(f"Error parsing lesson response: {e}")
        print(f"Response content: {response.text}")
        raise ValueError(f"Failed to parse lesson from Gemini response: {str(e)}")


def _generate_lesson_without_transcript(model, topic: str, user_preference: str) -> Lesson:
    """
    Generate a lesson without a transcript (fallback method).
    
    Args:
        model: Gemini model instance
        topic: The lesson topic
        user_preference: Learning style preference
        
    Returns:
        Lesson object with structured content
    """
    preference_instruction = ""
    if "visual" in user_preference.lower():
        preference_instruction = "Focus on code examples and visual concepts."
    elif "text" in user_preference.lower():
        preference_instruction = "Focus on clear textual explanations and bullet points."
    
    prompt = f"""You are an expert tutor. Create a comprehensive micro-lesson about: {topic}

{preference_instruction}

You MUST return a valid JSON object with this EXACT structure:
{{
  "topic": "{topic}",
  "summary": "A comprehensive 2-3 paragraph summary of the main concepts",
  "key_points": [
    "Key point 1",
    "Key point 2",
    "Key point 3",
    "Key point 4",
    "Key point 5"
  ],
  "code_snippets": [
    "code example 1",
    "code example 2"
  ]
}}

Return ONLY the JSON object, no additional text.

Generate a structured lesson about this topic."""
    
    response = model.generate_content(prompt)
    
    try:
        content = response.text.strip()
        
        # Remove markdown code blocks
        if content.startswith("```json"):
            content = content[7:]
        if content.startswith("```"):
            content = content[3:]
        if content.endswith("```"):
            content = content[:-3]
        content = content.strip()
        
        lesson_data = json.loads(content)
        lesson = Lesson(**lesson_data)
        return lesson
        
    except Exception as e:
        print(f"Error parsing fallback lesson: {e}")
        raise ValueError(f"Failed to generate lesson: {str(e)}")
