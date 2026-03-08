"""
Roadmap Generation Agent using AWS Bedrock (Claude 3)
Generates personalized learning roadmaps based on user profiles
"""
import json
import os
from models import UserProfile, Roadmap
from aws_config import get_bedrock_client, BEDROCK_MODEL_ID


def generate_roadmap(profile: UserProfile) -> Roadmap:
    """
    Generate a personalized learning roadmap using AWS Bedrock (Claude 3).
    
    Args:
        profile: UserProfile containing user's learning goals and preferences
        
    Returns:
        Roadmap: AI-generated learning roadmap with modules
    """
    # Initialize AWS Bedrock client
    bedrock_client = get_bedrock_client()
    
    # Extract profile data with defaults
    age = profile.age or "Not specified"
    expertise_level = profile.expertise_level or "Intermediate"
    primary_goal = profile.goal
    additional_context = profile.additional_context or "No additional context provided"
    
    # System prompt for intelligent curriculum design
    prompt = f"""You are the core intelligence of AdaptEd, an adaptive learning platform powered by AWS.

Your task is to generate a personalized learning roadmap based on the user's profile.

USER PROFILE:
- Age: {age}
- Expertise Level: {expertise_level}
- Main Goal: {primary_goal}
- Additional Context: {additional_context}

YOUR INSTRUCTIONS:
1. Analyze the User Profile carefully.

2. If their goal requires a programming language (e.g., Web Dev, AI, Backend Development) but they didn't specify one or said "I don't know" or "Decide for me", YOU must select the most industry-standard, beginner-friendly language for their specific goal and build the roadmap around it.
   - For Web Development: JavaScript
   - For AI/ML/Data Science: Python
   - For Backend/DevOps: Python or Go
   - For Mobile Development: JavaScript (React Native) or Kotlin
   - For Systems Programming: Rust or C++

3. If their goal does NOT require a programming language (e.g., Linux System Administration, basic networking, cloud architecture), completely ignore programming languages and focus purely on the core tools (bash, OS concepts, cloud platforms, etc.).

4. Tailor the tone and depth of the generated modules to their age and expertise level:
   - For young beginners (age < 20, Complete Beginner): Use simple analogies, start with absolute fundamentals, include more hands-on projects
   - For adult beginners (age 20-40, Complete Beginner): Professional tone, practical examples, career-focused
   - For intermediate learners: Skip basics, focus on advanced concepts and real-world applications
   - For advanced learners: Deep technical content, best practices, architecture patterns, optimization

5. Parse the Additional Context for:
   - Time constraints (e.g., "2 hours per day" → adjust module pacing)
   - Specific technologies mentioned (e.g., "interested in Docker" → include Docker module)
   - Learning preferences (e.g., "prefer hands-on" → emphasize projects)
   - Career goals (e.g., "want to get a job" → include interview prep)

6. Create 8-12 learning modules spanning multiple weeks, progressively building skills.

7. Include 3-5 relevant, high-quality resources per module (courses, documentation, tutorials).

OUTPUT FORMAT:
You MUST return a valid JSON object that matches this exact structure:
{{
  "user_id": "{profile.uid}",
  "modules": [
    {{
      "title": "Module Title (e.g., 'Python Fundamentals' or 'Linux Command Line Basics')",
      "description": "Detailed description tailored to their expertise level. For beginners, use simple language. For advanced, use technical terminology.",
      "week": 1,
      "status": "active",
      "resources": [
        "Resource 1 (e.g., 'Python.org Official Tutorial')",
        "Resource 2 (e.g., 'Automate the Boring Stuff with Python')",
        "Resource 3"
      ]
    }},
    {{
      "title": "Next Module Title",
      "description": "Description",
      "week": 2,
      "status": "pending",
      "resources": ["Resource 1", "Resource 2", "Resource 3"]
    }}
  ]
}}

CRITICAL REQUIREMENTS:
- "week" MUST be a single integer (1, 2, 3, etc.), NOT a string or range
- Use sequential week numbers: 1, 2, 3, 4, 5, etc.
- "status" must be exactly one of: "active", "pending", or "completed"
- The first module should always be "active"
- All other modules should be "pending"
- Return ONLY the JSON object, no additional text or explanation
- Adapt the content complexity to match the user's expertise level
- If they said "Decide for me", make intelligent choices and mention them in module descriptions

Generate a personalized learning roadmap for this profile."""
    
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
        response = bedrock_client.invoke_model(
            modelId=BEDROCK_MODEL_ID,
            body=json.dumps(request_body)
        )
        
        # Parse response
        response_body = json.loads(response['body'].read())
        content = response_body['content'][0]['text'].strip()
        
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
        
        # Ensure user_id is set correctly
        roadmap_data['user_id'] = profile.uid
        
        # Create Roadmap object
        roadmap = Roadmap(**roadmap_data)
        
        print(f"[Roadmap Agent - AWS Bedrock] Generated {len(roadmap.modules)} modules for {expertise_level} learner")
        print(f"[Roadmap Agent - AWS Bedrock] Goal: {primary_goal}")
        
        return roadmap
        
    except Exception as e:
        print(f"Error calling AWS Bedrock: {e}")
        print(f"Model ID: {BEDROCK_MODEL_ID}")
        raise ValueError(f"Failed to generate roadmap via AWS Bedrock: {str(e)}")
