import google.generativeai as genai
from models import UserProfile, Roadmap
import os
import json


def generate_roadmap(profile: UserProfile) -> Roadmap:
    """
    Generate a personalized learning roadmap using Google Gemini.
    
    Args:
        profile: UserProfile containing user's learning goals and preferences
        
    Returns:
        Roadmap: AI-generated learning roadmap with modules
    """
    # Configure Gemini
    genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
    model = genai.GenerativeModel('gemini-2.5-flash')
    
    # System prompt for curriculum design
    prompt = f"""You are an Expert Curriculum Designer specializing in creating personalized learning roadmaps.

Your task is to analyze the user's learning profile and generate a comprehensive, week-by-week learning roadmap.

ANALYSIS REQUIREMENTS:
1. Carefully analyze the user's goal: {profile.goal}
2. Consider their preferred programming language: {profile.preferred_language}
3. Review their current skills: {", ".join(profile.current_skills) if profile.current_skills else "None"}
4. Account for their time commitment: {profile.time_commitment}

ROADMAP GENERATION RULES:
1. Create 8-12 learning modules spanning multiple weeks
2. Each module should build upon previous ones progressively
3. If a skill is already listed in current_skills, mark that module as "completed"
4. Mark the first uncompleted module as "active"
5. All other modules should be "pending"
6. Include 3-5 relevant, high-quality resources per module (courses, documentation, books, tutorials)
7. Tailor the difficulty and pace based on time_commitment
8. Focus content on the preferred_language when applicable

OUTPUT FORMAT:
You MUST return a valid JSON object that matches this exact structure:
{{
  "user_id": "generated_user_id",
  "modules": [
    {{
      "title": "Module Title",
      "description": "Detailed description of what will be learned",
      "week": 1,
      "status": "active",
      "resources": ["Resource 1 URL or name", "Resource 2", "Resource 3"]
    }},
    {{
      "title": "Another Module",
      "description": "Description",
      "week": 2,
      "status": "pending",
      "resources": ["Resource 1", "Resource 2"]
    }}
  ]
}}

CRITICAL REQUIREMENTS:
- "week" MUST be a single integer (1, 2, 3, etc.), NOT a string or range like "1-2"
- Use sequential week numbers: 1, 2, 3, 4, 5, etc.
- "status" must be exactly one of: "active", "pending", or "completed"
- Return ONLY the JSON object, no additional text or explanation

Generate a personalized learning roadmap for this profile."""
    
    # Generate the roadmap
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
        roadmap_data = json.loads(content)
        
        # Create Roadmap object
        roadmap = Roadmap(**roadmap_data)
        return roadmap
        
    except Exception as e:
        print(f"Error parsing Gemini response: {e}")
        print(f"Response content: {response.text}")
        raise ValueError(f"Failed to parse roadmap from Gemini response: {str(e)}")
