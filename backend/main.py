from fastapi import FastAPI, HTTPException, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from models import (
    UserProfile, Roadmap, LessonRequest, LessonRequestWithTranscript, Lesson, LessonContent, StudyNotes, UserStatus,
    VivaSession, VivaStartRequest, VivaStartResponse, VivaInteractRequest, VivaInteractResponse,
    VivaStatus, VivaMessage, VivaInteraction, VivaResponse, VivaCompleteRequest, VivaCompleteResponse
)
from agents import generate_roadmap as generate_ai_roadmap, generate_lesson as generate_ai_lesson, ContentRefineryAgent
from agents.notes_agent import NotesGeneratorAgent
from agents.viva_agent import get_interviewer_response, generate_initial_question, generate_final_feedback, evaluate_answer
from agents.viva_agent_simple import SimpleVivaAgent
from agents.viva_agent_hf import HuggingFaceVivaAgent
from tools import search_youtube_video, get_video_transcript, get_video_content, search_web_docs
from tools.tts_tool import generate_audio_bytes
# from database import save_user_profile, get_user, check_user_status, update_user_roadmap
# Uncomment the line below and comment the line above to use MongoDB
from mongodb_database import save_user_profile, get_user, check_user_status, update_user_roadmap
from viva_database import create_session, get_session, update_session
from dotenv import load_dotenv
import os
import sys
import uuid
import base64
from pathlib import Path
from datetime import datetime
from typing import Optional

# Load environment variables from .env file in the same directory
env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)

# Set API key directly if not found (temporary workaround)
if not os.getenv("GEMINI_API_KEY"):
    # Read from .env file manually
    if env_path.exists():
        with open(env_path, 'r') as f:
            for line in f:
                if line.startswith('GEMINI_API_KEY='):
                    api_key_value = line.strip().split('=', 1)[1]
                    os.environ['GEMINI_API_KEY'] = api_key_value
                    print(f"✓ Manually loaded GEMINI_API_KEY from .env", file=sys.stderr)
                    break

# Verify API key is loaded
api_key = os.getenv("GEMINI_API_KEY")
youtube_api_key = os.getenv("YOUTUBE_API_KEY")
openai_api_key = os.getenv("OPENAI_API_KEY")
huggingface_api_key = os.getenv("HUGGINGFACE_API_KEY")

if not api_key:
    print("ERROR: GEMINI_API_KEY not found in environment!", file=sys.stderr)
    print(f"Tried loading from: {env_path}", file=sys.stderr)
    print(f"File exists: {env_path.exists()}", file=sys.stderr)
else:
    print(f"✓ GEMINI_API_KEY loaded successfully (length: {len(api_key)})", file=sys.stderr)

if youtube_api_key:
    print(f"✓ YOUTUBE_API_KEY loaded successfully (length: {len(youtube_api_key)})", file=sys.stderr)
else:
    print("⚠ YOUTUBE_API_KEY not found - will use DuckDuckGo fallback for video search", file=sys.stderr)

if openai_api_key:
    print(f"✓ OPENAI_API_KEY loaded successfully (length: {len(openai_api_key)})", file=sys.stderr)
else:
    print("⚠ OPENAI_API_KEY not found - Viva Engine will not work", file=sys.stderr)

if huggingface_api_key:
    print(f"✓ HUGGINGFACE_API_KEY loaded successfully (length: {len(huggingface_api_key)})", file=sys.stderr)
    print("  → Viva will use Hugging Face Zephyr-7b-beta model", file=sys.stderr)
else:
    print("⚠ HUGGINGFACE_API_KEY not found - Viva will use Gemini as fallback", file=sys.stderr)

app = FastAPI(title="AdaptEd API", version="1.0.0")

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def read_root():
    return {"message": "Welcome to AdaptEd API"}


@app.get("/health")
def health_check():
    """Check if API is running and API key is loaded"""
    api_key = os.getenv("GEMINI_API_KEY")
    return {
        "status": "healthy",
        "api_key_loaded": bool(api_key),
        "api_key_length": len(api_key) if api_key else 0
    }


@app.get("/users/{uid}/status")
def get_user_status(uid: str):
    """
    Check if user has completed onboarding.
    
    Args:
        uid: Firebase user ID
        
    Returns:
        UserStatus with onboarding_completed flag
    """
    try:
        status = check_user_status(uid)
        return status
    except Exception as e:
        print(f"Error checking user status: {e}", file=sys.stderr, flush=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to check user status: {str(e)}"
        )


@app.post("/users/profile")
def save_profile(profile: UserProfile):
    """
    Save user profile after onboarding.
    
    This endpoint saves the user's profile to the database.
    The roadmap should be saved separately using the /generate-roadmap endpoint.
    
    Args:
        profile: UserProfile with uid and all onboarding data
        
    Returns:
        Saved user data
    """
    try:
        print(f"Saving profile for user: {profile.uid}", file=sys.stderr, flush=True)
        
        # Convert profile to dict
        profile_dict = profile.model_dump()
        
        # Save to database
        user_data = save_user_profile(
            uid=profile.uid,
            profile=profile_dict,
            roadmap=None  # Roadmap saved separately
        )
        
        print(f"✓ Profile saved successfully for user: {profile.uid}", file=sys.stderr, flush=True)
        
        return {
            "success": True,
            "message": "Profile saved successfully",
            "user": user_data
        }
        
    except Exception as e:
        import traceback
        error_msg = f"Error saving profile: {str(e)}\n{traceback.format_exc()}"
        print(error_msg, file=sys.stderr, flush=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to save profile: {str(e)}"
        )


@app.post("/generate-roadmap", response_model=Roadmap)
def generate_roadmap(profile: UserProfile):
    """
    Generate a personalized learning roadmap based on user profile using AI.
    Also saves the profile and roadmap to the database.
    """
    try:
        print(f"Received profile: {profile}", file=sys.stderr, flush=True)
        
        # Generate roadmap using AI
        roadmap = generate_ai_roadmap(profile)
        
        print(f"Generated roadmap successfully", file=sys.stderr, flush=True)
        print(f"Roadmap user_id: {roadmap.user_id}", file=sys.stderr, flush=True)
        print(f"Roadmap modules count: {len(roadmap.modules)}", file=sys.stderr, flush=True)
        
        # Save profile and roadmap to database
        try:
            profile_dict = profile.model_dump()
            roadmap_dict = roadmap.model_dump()
            
            save_user_profile(
                uid=profile.uid,
                profile=profile_dict,
                roadmap=roadmap_dict
            )
            
            print(f"✓ Saved profile and roadmap to database for user: {profile.uid}", file=sys.stderr, flush=True)
        except Exception as db_error:
            # Log error but don't fail the request
            print(f"⚠ Warning: Failed to save to database: {db_error}", file=sys.stderr, flush=True)
        
        return roadmap
        
    except Exception as e:
        import traceback
        error_msg = f"Error generating roadmap: {str(e)}\n{traceback.format_exc()}"
        print(error_msg, file=sys.stderr, flush=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate roadmap: {str(e)}"
        )


@app.post("/generate-lesson", response_model=Lesson)
def generate_lesson(request: LessonRequest):
    """
    Generate a micro-lesson for a specific topic based on user learning preference.
    
    This endpoint:
    1. Generates an optimized search query for the topic
    2. Retrieves a YouTube video transcript
    3. Synthesizes the transcript into a structured lesson
    4. Adapts content based on user preference (visual/text learner)
    """
    try:
        print(f"Received lesson request: {request}", file=sys.stderr, flush=True)
        lesson = generate_ai_lesson(request.topic, request.user_preference)
        print(f"Generated lesson successfully", file=sys.stderr, flush=True)
        return lesson
    except Exception as e:
        import traceback
        error_msg = f"Error generating lesson: {str(e)}\n{traceback.format_exc()}"
        print(error_msg, file=sys.stderr, flush=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate lesson: {str(e)}"
        )


@app.get("/search-youtube")
async def search_youtube(query: str):
    """
    Search for YouTube videos and return metadata (URLs, titles, etc.)
    Does NOT fetch transcripts - that's done on the frontend to avoid IP blocking.
    
    Args:
        query: Search query
        
    Returns:
        List of video metadata
    """
    try:
        print(f"Searching YouTube for: {query}", file=sys.stderr, flush=True)
        video_list = search_youtube_video(query, max_results=5)
        
        if not video_list:
            return []
        
        print(f"Found {len(video_list)} videos", file=sys.stderr, flush=True)
        return video_list
        
    except Exception as e:
        print(f"Error searching YouTube: {e}", file=sys.stderr, flush=True)
        return []


@app.get("/fetch-transcript/{video_id}")
async def fetch_transcript_proxy(video_id: str):
    """
    Proxy endpoint to fetch YouTube transcript.
    Falls back to cached transcripts if YouTube is blocked.
    
    Args:
        video_id: YouTube video ID
        
    Returns:
        Transcript text or error
    """
    try:
        print(f"Fetching transcript for video: {video_id}", file=sys.stderr, flush=True)
        
        # Import here to avoid issues
        from youtube_transcript_api import YouTubeTranscriptApi
        from youtube_transcript_api._errors import TranscriptsDisabled, NoTranscriptFound
        import json
        
        # Try multiple language codes
        language_codes = ['en', 'hi', 'es', 'fr', 'de', 'pt', 'ja', 'ko']
        
        try:
            # Create instance and fetch transcript
            api = YouTubeTranscriptApi()
            transcript_list = api.list_transcripts(video_id)
            
            # Try to find English transcript first
            try:
                transcript = transcript_list.find_transcript(['en'])
                transcript_data = transcript.fetch()
            except:
                # If no English, get first available
                transcript = transcript_list.find_generated_transcript(language_codes)
                transcript_data = transcript.fetch()
            
            # Combine all transcript segments
            full_transcript = " ".join([segment['text'] for segment in transcript_data])
            full_transcript = full_transcript.replace('\n', ' ').strip()
            
            # Limit to 15,000 characters
            if len(full_transcript) > 15000:
                full_transcript = full_transcript[:15000]
            
            print(f"✓ Transcript fetched: {len(full_transcript)} chars", file=sys.stderr, flush=True)
            
            return {
                "success": True,
                "text": full_transcript,
                "video_id": video_id
            }
            
        except (TranscriptsDisabled, NoTranscriptFound) as e:
            print(f"✗ No transcript available: {e}", file=sys.stderr, flush=True)
            print(f"Trying cached transcript fallback...", file=sys.stderr, flush=True)
            
            # Try to load from cache
            try:
                cache_path = Path(__file__).parent / 'transcript_cache.json'
                if cache_path.exists():
                    with open(cache_path, 'r') as f:
                        cache = json.load(f)
                    
                    # Try to find a matching cached transcript
                    for key, cached_text in cache.items():
                        print(f"✓ Using cached transcript: {key}", file=sys.stderr, flush=True)
                        return {
                            "success": True,
                            "text": cached_text,
                            "video_id": video_id,
                            "cached": True
                        }
            except Exception as cache_error:
                print(f"Cache lookup failed: {cache_error}", file=sys.stderr, flush=True)
            
            return {
                "success": False,
                "error": "No transcript available for this video",
                "video_id": video_id
            }
        except Exception as e:
            print(f"✗ Transcript fetch failed: {e}", file=sys.stderr, flush=True)
            return {
                "success": False,
                "error": str(e),
                "video_id": video_id
            }
        
    except Exception as e:
        print(f"Error in transcript proxy: {e}", file=sys.stderr, flush=True)
        return {
            "success": False,
            "error": str(e),
            "video_id": video_id
        }


@app.post("/generate-lesson-content", response_model=LessonContent)
async def generate_lesson_content(request: LessonRequestWithTranscript):
    """
    Generate a comprehensive micro-lesson with multi-source attribution (Perplexity-style).
    
    This endpoint:
    1. Accepts pre-fetched video transcript from frontend (to avoid IP blocking)
    2. Searches for official documentation pages
    3. Uses ContentRefineryAgent to synthesize structured lesson
    4. Attributes concepts to specific sources
    5. Adapts content based on user preference (visual/text learner)
    6. Falls back to AI-generated content if no sources found
    
    Args:
        request: LessonRequestWithTranscript with topic, user_preference, and optional video_transcript
        
    Returns:
        LessonContent: Structured lesson with multi-source attribution
    """
    try:
        print(f"Received lesson content request: {request}", file=sys.stderr, flush=True)
        
        # Step 1: Collect content from multiple sources
        content_results = []
        
        # Use pre-fetched video transcript from frontend if available
        if request.video_transcript:
            print(f"Using pre-fetched video transcript from frontend", file=sys.stderr, flush=True)
            
            # Get video metadata from YouTube API
            video_list = search_youtube_video(request.topic, max_results=1)
            video_metadata = video_list[0] if video_list else None
            
            # Create ContentResult from frontend transcript
            from tools import ContentResult
            video_result = ContentResult(
                text=request.video_transcript.text,
                url=request.video_transcript.url,
                title=video_metadata['title'] if video_metadata else f"YouTube Video: {request.topic}",
                source_type="video",
                metadata={
                    'channel': video_metadata['channel'] if video_metadata else 'YouTube',
                    'views': video_metadata['views'] if video_metadata else 'N/A'
                }
            )
            content_results.append(video_result)
            print(f"✓ Video transcript added: {len(request.video_transcript.text)} chars", file=sys.stderr, flush=True)
        else:
            # Fallback: Try to fetch video content from backend (may fail due to IP blocking)
            print(f"No pre-fetched transcript, trying backend fetch...", file=sys.stderr, flush=True)
            video_query = f"{request.topic} tutorial for beginners"
            video_result = get_video_content(video_query)
            
            if video_result:
                content_results.append(video_result)
                print(f"Found video: {video_result.title}", file=sys.stderr, flush=True)
            else:
                print("No video found from backend", file=sys.stderr, flush=True)
        
        # Search for documentation
        print(f"Searching for documentation...", file=sys.stderr, flush=True)
        docs_query = f"{request.topic} official documentation"
        docs_result = search_web_docs(docs_query)
        
        if docs_result:
            content_results.append(docs_result)
            print(f"Found docs: {docs_result.title}", file=sys.stderr, flush=True)
        else:
            print("No documentation found", file=sys.stderr, flush=True)
        
        print(f"Total sources collected: {len(content_results)}", file=sys.stderr, flush=True)
        
        # Log source details
        for idx, source in enumerate(content_results):
            print(f"  Source {idx}: {source.source_type} - {source.title}", file=sys.stderr, flush=True)
            print(f"    URL: {source.url}", file=sys.stderr, flush=True)
            print(f"    Content length: {len(source.text)} chars", file=sys.stderr, flush=True)
        
        # Step 2: Initialize ContentRefineryAgent
        agent = ContentRefineryAgent()
        
        # Step 3: Synthesize lesson from multiple sources
        lesson = await agent.synthesize_lesson(
            topic=request.topic,
            content_results=content_results,
            user_preference=request.user_preference
        )
        
        print(f"Generated lesson content with {len(lesson.sources)} sources", file=sys.stderr, flush=True)
        
        return lesson
        
    except Exception as e:
        import traceback
        error_msg = f"Error generating lesson content: {str(e)}\n{traceback.format_exc()}"
        print(error_msg, file=sys.stderr, flush=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate lesson content: {str(e)}"
        )


@app.post("/generate-study-notes", response_model=StudyNotes)
async def generate_study_notes(lesson: LessonContent):
    """
    Generate comprehensive study notes from lesson content.
    
    This endpoint takes a lesson and generates detailed, well-structured study notes
    that expand on the original content with:
    - More detailed explanations
    - Additional context and examples
    - Key takeaways for quick review
    - Practice exercises
    - Suggestions for further study
    
    Args:
        lesson: LessonContent object to generate notes from
        
    Returns:
        StudyNotes: Comprehensive study notes optimized for learning
    """
    try:
        print(f"Received study notes request for: {lesson.title}", file=sys.stderr, flush=True)
        
        # Initialize NotesGeneratorAgent
        notes_agent = NotesGeneratorAgent()
        
        # Generate comprehensive study notes
        notes = await notes_agent.generate_study_notes(lesson)
        
        print(f"Generated study notes successfully", file=sys.stderr, flush=True)
        
        return notes
        
    except Exception as e:
        import traceback
        error_msg = f"Error generating study notes: {str(e)}\n{traceback.format_exc()}"
        print(error_msg, file=sys.stderr, flush=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate study notes: {str(e)}"
        )



# ============================================================================
# VIVA ENGINE ENDPOINTS
# ============================================================================

@app.post("/viva/start", response_model=VivaStartResponse)
async def start_viva(request: VivaStartRequest):
    """
    Start a new Viva Voce examination session.
    
    Args:
        request: VivaStartRequest with module_id and module_title
        
    Returns:
        VivaStartResponse with session_id, greeting, and first question
    """
    try:
        print(f"Starting viva for module: {request.module_title}", file=sys.stderr, flush=True)
        
        # Check if required API keys are available
        if not os.getenv("GEMINI_API_KEY"):
            raise HTTPException(
                status_code=503,
                detail="Viva Engine is not configured. GEMINI_API_KEY is missing."
            )
        
        if not os.getenv("GROQ_API_KEY"):
            raise HTTPException(
                status_code=503,
                detail="Viva Engine is not configured. GROQ_API_KEY is missing."
            )
        
        # Initialize Viva Agent (uses Gemini + Groq + Edge-TTS)
        viva_agent = VivaAgent()
        
        # Generate session ID
        session_id = str(uuid.uuid4())
        
        # Generate initial greeting and question (using Gemini)
        module_context = f"{request.module_title}"
        if request.module_description:
            module_context += f": {request.module_description}"
        
        print("Generating initial question with Gemini...", file=sys.stderr, flush=True)
        greeting_and_question = viva_agent.generate_initial_question(
            module_title=request.module_title,
            module_description=request.module_description,
            user_goal=request.user_goal
        )
        
        print(f"✓ Generated: {greeting_and_question[:100]}...", file=sys.stderr, flush=True)
        
        # Split into greeting and question (simple heuristic)
        parts = greeting_and_question.split("?", 1)
        if len(parts) == 2:
            greeting = parts[0] + "?"
            first_question = parts[1].strip()
        else:
            greeting = f"Hey! Let's chat about {request.module_title}."
            first_question = greeting_and_question
        
        # Create session
        now = datetime.utcnow().isoformat()
        session_data = {
            "session_id": session_id,
            "module_id": request.module_id,
            "module_title": request.module_title,
            "transcript": [
                {
                    "role": "interviewer",
                    "content": greeting_and_question,
                    "timestamp": now
                }
            ],
            "current_score": 50,  # Start at 50/100
            "status": "active",
            "question_count": 1,
            "created_at": now,
            "updated_at": now
        }
        
        create_session(session_data)
        
        # Generate TTS audio (using Edge-TTS - FREE)
        audio_base64 = None
        try:
            print("Generating TTS audio with Edge-TTS...", file=sys.stderr, flush=True)
            audio_bytes = await generate_audio_bytes(greeting_and_question)
            audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
            print(f"✓ TTS audio generated ({len(audio_bytes)} bytes)", file=sys.stderr, flush=True)
        except Exception as e:
            print(f"Warning: TTS generation failed: {e}", file=sys.stderr, flush=True)
        
        print(f"✓ Viva session created: {session_id}", file=sys.stderr, flush=True)
        
        return VivaStartResponse(
            session_id=session_id,
            greeting=greeting,
            first_question=first_question,
            audio_base64=audio_base64
        )
        
    except Exception as e:
        import traceback
        error_msg = f"Error starting viva: {str(e)}\n{traceback.format_exc()}"
        print(error_msg, file=sys.stderr, flush=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to start viva: {str(e)}"
        )


@app.post("/viva/interact", response_model=VivaInteractResponse)
async def interact_viva(
    session_id: str = Form(...),
    user_audio: Optional[UploadFile] = File(None),
    user_text: Optional[str] = Form(None)
):
    """
    Interact with an active Viva session using FREE services.
    
    Workflow:
    1. Receive audio/text from user
    2. Transcribe audio using Groq (Whisper-v3) - FREE & ultra-fast
    3. Process with Gemini (conversation logic) - FREE
    4. Generate speech using Edge-TTS - FREE
    5. Return response with audio
    
    Args:
        session_id: Active session ID
        user_audio: Optional audio file (WAV, MP3, WebM, etc.)
        user_text: Optional text input (if no audio)
        
    Returns:
        VivaInteractResponse with reply, status, score, and audio
    """
    try:
        print(f"Viva interaction for session: {session_id}", file=sys.stderr, flush=True)
        
        # Check if required API keys are available
        if not os.getenv("GEMINI_API_KEY"):
            raise HTTPException(
                status_code=503,
                detail="Viva Engine is not configured. GEMINI_API_KEY is missing."
            )
        
        if not os.getenv("GROQ_API_KEY"):
            raise HTTPException(
                status_code=503,
                detail="Viva Engine is not configured. GROQ_API_KEY is missing."
            )
        
        # Get session
        session_data = get_session(session_id)
        if not session_data:
            raise HTTPException(status_code=404, detail="Session not found")
        
        # Check if session is still active
        if session_data["status"] != "active":
            raise HTTPException(
                status_code=400,
                detail=f"Session is already {session_data['status']}"
            )
        
        # Initialize Viva Agent (uses Gemini + Groq + Edge-TTS)
        viva_agent = VivaAgent()
        
        # Step 1: Transcribe audio or use text (STT with Groq)
        if user_audio:
            print("Transcribing audio with Groq Whisper-v3...", file=sys.stderr, flush=True)
            try:
                user_input = viva_agent.transcribe_audio(user_audio.file)
                print(f"✓ Transcribed: {user_input}", file=sys.stderr, flush=True)
            except Exception as e:
                print(f"Error transcribing audio: {e}", file=sys.stderr, flush=True)
                raise HTTPException(
                    status_code=400,
                    detail=f"Failed to transcribe audio: {str(e)}"
                )
        elif user_text:
            user_input = user_text
            print(f"Using text input: {user_input}", file=sys.stderr, flush=True)
        else:
            raise HTTPException(
                status_code=400,
                detail="Either user_audio or user_text must be provided"
            )
        
        # Add user message to transcript
        now = datetime.utcnow().isoformat()
        session_data["transcript"].append({
            "role": "user",
            "content": user_input,
            "timestamp": now
        })
        
        # Step 2: Generate AI response (Process with Gemini)
        module_context = f"Module: {session_data['module_title']}"
        
        print("Generating viva response with Gemini...", file=sys.stderr, flush=True)
        response_text, score_update = viva_agent.generate_viva_response(
            history=session_data["transcript"],
            user_input=user_input,
            module_context=module_context
        )
        
        print(f"✓ Response: {response_text[:100]}...", file=sys.stderr, flush=True)
        print(f"✓ Score update: {score_update}", file=sys.stderr, flush=True)
        
        # Step 3: Update score
        session_data["current_score"] += score_update
        session_data["current_score"] = max(0, min(100, session_data["current_score"]))
        
        # Add interviewer response to transcript
        session_data["transcript"].append({
            "role": "interviewer",
            "content": response_text,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        # Increment question count
        session_data["question_count"] += 1
        
        # Step 4: Check if exam should conclude
        final_result = None
        if session_data["question_count"] >= 5:
            print("Concluding viva examination...", file=sys.stderr, flush=True)
            
            # Determine pass/fail
            passed = session_data["current_score"] >= 70
            session_data["status"] = "passed" if passed else "failed"
            
            # Generate final feedback
            final_feedback = viva_agent.generate_final_feedback(
                score=session_data["current_score"],
                passed=passed,
                module_title=session_data["module_title"],
                transcript=session_data["transcript"]
            )
            
            # Add final feedback to transcript
            session_data["transcript"].append({
                "role": "interviewer",
                "content": final_feedback,
                "timestamp": datetime.utcnow().isoformat()
            })
            
            # Append final feedback to response
            response_text = f"{response_text}\n\n{final_feedback}"
            
            final_result = {
                "passed": passed,
                "final_score": session_data["current_score"],
                "feedback": final_feedback
            }
        
        # Update session in database
        update_session(session_id, session_data)
        
        # Step 5: Generate TTS audio (Edge-TTS - FREE)
        audio_base64 = None
        try:
            print("Generating TTS audio with Edge-TTS...", file=sys.stderr, flush=True)
            # Use the async TTS tool
            audio_bytes = await generate_audio_bytes(response_text)
            audio_base64 = base64.b64encode(audio_bytes).decode('utf-8')
            print(f"✓ TTS audio generated ({len(audio_bytes)} bytes)", file=sys.stderr, flush=True)
        except Exception as e:
            print(f"Warning: TTS generation failed: {e}", file=sys.stderr, flush=True)
        
        print(f"✓ Viva interaction completed", file=sys.stderr, flush=True)
        
        return VivaInteractResponse(
            reply_text=response_text,
            status=session_data["status"],
            current_score=session_data["current_score"],
            question_count=session_data["question_count"],
            audio_base64=audio_base64,
            final_result=final_result
        )
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_msg = f"Error in viva interaction: {str(e)}\n{traceback.format_exc()}"
        print(error_msg, file=sys.stderr, flush=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process viva interaction: {str(e)}"
        )


@app.get("/viva/session/{session_id}")
async def get_viva_session(session_id: str):
    """
    Get viva session details.
    
    Args:
        session_id: Session ID
        
    Returns:
        Session data
    """
    try:
        session_data = get_session(session_id)
        if not session_data:
            raise HTTPException(status_code=404, detail="Session not found")
        
        return session_data
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting viva session: {e}", file=sys.stderr, flush=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get session: {str(e)}"
        )


# ============================================================================
# SIMPLIFIED VIVA CHAT ENDPOINT (Text-only)
# ============================================================================

# In-memory session storage (replace with database in production)
viva_sessions = {}

@app.post("/viva/chat", response_model=VivaResponse)
async def viva_chat(interaction: VivaInteraction):
    """
    Simplified text-based viva interaction.
    
    Args:
        interaction: VivaInteraction with session_id, user_text, module_topic
        
    Returns:
        VivaResponse with reply, next_question, score, etc.
    """
    try:
        print(f"[VIVA] Chat interaction for session: {interaction.session_id}", file=sys.stderr, flush=True)
        print(f"[VIVA] User said: {interaction.user_text}", file=sys.stderr, flush=True)
        print(f"[VIVA] Starting Viva with Role: {interaction.target_role}", file=sys.stderr, flush=True)
        
        # Use strict Gemini agent
        print(f"[VIVA] Using Strict Gemini Agent (gemini-2.5-flash)", file=sys.stderr, flush=True)
        
        # Get or create session
        if interaction.session_id not in viva_sessions:
            viva_sessions[interaction.session_id] = {
                "history": [],
                "scores": [],
                "question_count": 0
            }
        
        session = viva_sessions[interaction.session_id]
        
        # Add user message to history
        session["history"].append({
            "role": "user",
            "content": interaction.user_text
        })
        
        # Get interviewer response using strict Gemini agent (returns tuple)
        response_text, score_update = get_interviewer_response(
            history=session["history"],
            user_input=interaction.user_text,
            module_topic=interaction.module_topic,
            target_role=interaction.target_role  # Pass target_role to agent
        )
        
        # Split response into reply and next question
        parts = response_text.split("?", 1)
        if len(parts) == 2:
            reply = parts[0].strip() + "?"
            next_question = parts[1].strip()
            if not next_question:
                next_question = "Continue."
        else:
            # Try splitting by period
            parts = response_text.split(".", 1)
            if len(parts) == 2:
                reply = parts[0].strip() + "."
                next_question = parts[1].strip()
            else:
                reply = response_text
                next_question = ""
        
        # Use score_update from the response (only if it's not -1)
        if score_update >= 0:
            score = score_update
        else:
            # No grading occurred (user said "continue" or similar)
            score = 0
        
        result = {
            "reply": reply,
            "next_question": next_question,
            "score": score
        }
        
        print(f"[VIVA] Score for this answer: {result['score']} (score_update: {score_update})", file=sys.stderr, flush=True)
        
        # Add interviewer response to history
        full_response = f"{result['reply']} {result['next_question']}".strip()
        session["history"].append({
            "role": "assistant",
            "content": full_response
        })
        
        # Update scores (only if grading occurred)
        if score_update >= 0:
            session["scores"].append(result["score"])
            session["question_count"] += 1
        
        # Calculate cumulative score
        if len(session["scores"]) > 0:
            cumulative_score = int(sum(session["scores"]) / len(session["scores"]))
        else:
            cumulative_score = 0
        
        # Check if viva is complete (5 questions)
        is_complete = session["question_count"] >= 5
        final_feedback = None
        
        if is_complete:
            print(f"[VIVA] Session complete. Final score: {cumulative_score}", file=sys.stderr, flush=True)
            final_feedback = generate_final_feedback(
                total_score=cumulative_score,
                module_topic=interaction.module_topic
            )
        
        return VivaResponse(
            reply=result["reply"],
            next_question=result["next_question"],
            score=result["score"],
            cumulative_score=cumulative_score,
            question_count=session["question_count"],
            is_complete=is_complete,
            final_feedback=final_feedback
        )
        
    except Exception as e:
        import traceback
        error_msg = f"Error in viva chat: {str(e)}\n{traceback.format_exc()}"
        print(error_msg, file=sys.stderr, flush=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to process viva interaction: {str(e)}"
        )


@app.post("/viva/start-simple")
async def start_simple_viva(module_topic: str, user_goal: str = None):
    """
    Start a new simplified viva session.
    
    Args:
        module_topic: Topic to test (e.g., "Git Basics")
        user_goal: Optional user goal for personalization
        
    Returns:
        Dict with session_id and first_question
    """
    try:
        print(f"[VIVA] Starting simple viva for: {module_topic}", file=sys.stderr, flush=True)
        
        # Generate session ID
        session_id = str(uuid.uuid4())
        
        # Use strict Gemini agent
        print(f"[VIVA] Using Strict Gemini Agent (gemini-2.5-flash)", file=sys.stderr, flush=True)
        
        # Generate first question
        first_question = generate_initial_question(
            module_topic=module_topic,
            user_goal=user_goal
        )
        
        # Create session
        viva_sessions[session_id] = {
            "history": [{
                "role": "interviewer",
                "content": first_question
            }],
            "scores": [],
            "question_count": 0
        }
        
        print(f"[VIVA] Session created: {session_id}", file=sys.stderr, flush=True)
        
        return {
            "session_id": session_id,
            "first_question": first_question
        }
        
    except Exception as e:
        import traceback
        error_msg = f"Error starting viva: {str(e)}\n{traceback.format_exc()}"
        print(error_msg, file=sys.stderr, flush=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to start viva: {str(e)}"
        )


@app.post("/viva/complete", response_model=VivaCompleteResponse)
async def complete_viva(request: VivaCompleteRequest):
    """
    Complete a viva exam and unlock the next module.
    
    Args:
        request: VivaCompleteRequest with user_id, module_id, and final_score
        
    Returns:
        VivaCompleteResponse with success status and unlocked module info
    """
    try:
        print(f"[VIVA] Completing viva for user {request.user_id}, module: {request.module_id}, score: {request.final_score}", file=sys.stderr, flush=True)
        
        # Load user data
        user_data = get_user(request.user_id)
        if not user_data:
            raise HTTPException(
                status_code=404,
                detail=f"User {request.user_id} not found"
            )
        
        roadmap = user_data.get("roadmap")
        if not roadmap:
            raise HTTPException(
                status_code=404,
                detail=f"No roadmap found for user {request.user_id}"
            )
        
        modules = roadmap.get("modules", [])
        if not modules:
            raise HTTPException(
                status_code=404,
                detail="No modules found in roadmap"
            )
        
        # Find the current module by title
        current_module_index = None
        for i, module in enumerate(modules):
            if module.get("title") == request.module_id:
                current_module_index = i
                break
        
        if current_module_index is None:
            raise HTTPException(
                status_code=404,
                detail=f"Module '{request.module_id}' not found in roadmap"
            )
        
        # Handle academic dishonesty
        if request.academic_dishonesty_flag:
            print(f"[VIVA] ⚠️ Academic dishonesty detected for user {request.user_id}", file=sys.stderr, flush=True)
            print(f"[VIVA] Integrity violations: {request.integrity_log}", file=sys.stderr, flush=True)
            
            # Force score to 0
            final_score = 0
            passed = False
            
            # Update module with dishonesty status
            modules[current_module_index]["viva_score"] = final_score
            modules[current_module_index]["status"] = "failed_dishonesty"
            modules[current_module_index]["integrity_log"] = request.integrity_log
            modules[current_module_index]["dishonesty_detected"] = True
            
            # Save updated roadmap
            roadmap["modules"] = modules
            update_user_roadmap(request.user_id, roadmap)
            
            print(f"[VIVA] Module '{request.module_id}' marked as failed_dishonesty", file=sys.stderr, flush=True)
            
            return VivaCompleteResponse(
                success=True,
                passed=False,
                unlocked_module_id=None,
                message="Academic dishonesty detected. Your exam has been flagged and you received a score of 0. Please contact your instructor."
            )
        
        # Normal flow: Check if passed (70% threshold)
        passed = request.final_score >= 70
        
        # Update current module
        modules[current_module_index]["viva_score"] = request.final_score
        modules[current_module_index]["integrity_log"] = request.integrity_log if request.integrity_log else None
        modules[current_module_index]["dishonesty_detected"] = False
        
        unlocked_module_id = None
        
        if passed:
            # Mark as completed
            modules[current_module_index]["status"] = "completed"
            print(f"[VIVA] Module '{request.module_id}' marked as completed", file=sys.stderr, flush=True)
            
            # Unlock next module (if exists)
            if current_module_index + 1 < len(modules):
                next_module = modules[current_module_index + 1]
                next_module["status"] = "active"
                unlocked_module_id = next_module.get("title")
                print(f"[VIVA] Unlocked next module: {unlocked_module_id}", file=sys.stderr, flush=True)
            else:
                print(f"[VIVA] No more modules to unlock (completed all)", file=sys.stderr, flush=True)
        else:
            # Mark as failed (needs retake)
            modules[current_module_index]["status"] = "pending"
            print(f"[VIVA] Module '{request.module_id}' marked as failed (score: {request.final_score})", file=sys.stderr, flush=True)
        
        # Save updated roadmap
        roadmap["modules"] = modules
        update_user_roadmap(request.user_id, roadmap)
        
        print(f"[VIVA] Roadmap updated successfully", file=sys.stderr, flush=True)
        
        # Build response message
        if passed:
            if unlocked_module_id:
                message = f"Congratulations! You passed with {request.final_score}/100. Next module '{unlocked_module_id}' is now unlocked."
            else:
                message = f"Congratulations! You passed with {request.final_score}/100. You've completed all modules!"
        else:
            message = f"You scored {request.final_score}/100. You need 70% to pass. Review the material and try again."
        
        return VivaCompleteResponse(
            success=True,
            passed=passed,
            unlocked_module_id=unlocked_module_id,
            message=message
        )
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_msg = f"Error completing viva: {str(e)}\n{traceback.format_exc()}"
        print(error_msg, file=sys.stderr, flush=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to complete viva: {str(e)}"
        )


@app.get("/users/{uid}/stats")
async def get_user_stats(uid: str):
    """
    Get user progress statistics for the dashboard.
    
    Args:
        uid: Firebase user ID
        
    Returns:
        Dictionary with user stats including modules completed, viva scores, etc.
    """
    try:
        print(f"[STATS] Fetching stats for user: {uid}", file=sys.stderr, flush=True)
        
        # Load user data
        user_data = get_user(uid)
        if not user_data:
            raise HTTPException(
                status_code=404,
                detail=f"User {uid} not found"
            )
        
        roadmap = user_data.get("roadmap")
        if not roadmap:
            raise HTTPException(
                status_code=404,
                detail=f"No roadmap found for user {uid}"
            )
        
        modules = roadmap.get("modules", [])
        
        # Calculate statistics
        total_modules = len(modules)
        completed_modules = len([m for m in modules if m.get("status") == "completed"])
        active_modules = len([m for m in modules if m.get("status") == "active"])
        pending_modules = len([m for m in modules if m.get("status") == "pending"])
        
        # Get current module (first active or pending)
        current_module = None
        for module in modules:
            if module.get("status") in ["active", "pending"]:
                current_module = {
                    "title": module.get("title"),
                    "description": module.get("description"),
                    "week": module.get("week"),
                    "status": module.get("status")
                }
                break
        
        # Calculate viva statistics
        viva_scores = [m.get("viva_score") for m in modules if m.get("viva_score") is not None]
        viva_count = len(viva_scores)
        avg_viva_score = int(sum(viva_scores) / len(viva_scores)) if viva_scores else 0
        
        # Calculate progress percentage
        progress_percentage = int((completed_modules / total_modules) * 100) if total_modules > 0 else 0
        
        # Get user profile
        profile = user_data.get("profile", {})
        goal = profile.get("goal", "Developer")
        
        # Calculate streak (mock for now - would need activity tracking)
        streak = 0  # TODO: Implement activity tracking
        
        # Calculate XP (based on completed modules and viva scores)
        xp = (completed_modules * 100) + sum(viva_scores)
        level = (xp // 500) + 1  # Level up every 500 XP
        
        stats = {
            "total_modules": total_modules,
            "completed_modules": completed_modules,
            "active_modules": active_modules,
            "pending_modules": pending_modules,
            "progress_percentage": progress_percentage,
            "current_module": current_module,
            "viva_count": viva_count,
            "avg_viva_score": avg_viva_score,
            "viva_scores": viva_scores,
            "goal": goal,
            "streak": streak,
            "xp": xp,
            "level": level,
            "modules": [
                {
                    "title": m.get("title"),
                    "status": m.get("status"),
                    "week": m.get("week"),
                    "viva_score": m.get("viva_score")
                }
                for m in modules
            ]
        }
        
        print(f"[STATS] Calculated stats: {completed_modules}/{total_modules} modules, avg score: {avg_viva_score}%", file=sys.stderr, flush=True)
        
        return stats
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_msg = f"Error fetching user stats: {str(e)}\n{traceback.format_exc()}"
        print(error_msg, file=sys.stderr, flush=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch user stats: {str(e)}"
        )


@app.get("/users/{uid}/roadmap")
async def get_user_roadmap(uid: str):
    """
    Get user's complete roadmap with current status.
    
    Args:
        uid: Firebase user ID
        
    Returns:
        User's roadmap with all modules and their statuses
    """
    try:
        print(f"[ROADMAP] Fetching roadmap for user: {uid}", file=sys.stderr, flush=True)
        
        # Load user data
        user_data = get_user(uid)
        if not user_data:
            raise HTTPException(
                status_code=404,
                detail=f"User {uid} not found"
            )
        
        roadmap = user_data.get("roadmap")
        if not roadmap:
            raise HTTPException(
                status_code=404,
                detail=f"No roadmap found for user {uid}"
            )
        
        profile = user_data.get("profile", {})
        
        return {
            "user_id": roadmap.get("user_id"),
            "goal": profile.get("goal", "Developer"),
            "modules": roadmap.get("modules", [])
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_msg = f"Error fetching roadmap: {str(e)}\n{traceback.format_exc()}"
        print(error_msg, file=sys.stderr, flush=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to fetch roadmap: {str(e)}"
        )


@app.post("/users/{uid}/sync-progress")
async def sync_user_progress(uid: str, request: dict):
    """
    Sync user progress from frontend localStorage to backend database.
    This ensures Dashboard and Learning Path show the same data.
    
    Args:
        uid: Firebase user ID
        request: Dictionary with roadmap and vivaStatus from localStorage
        
    Returns:
        Success message
    """
    try:
        print(f"[SYNC] Syncing progress for user: {uid}", file=sys.stderr, flush=True)
        
        # Load user data
        user_data = get_user(uid)
        if not user_data:
            raise HTTPException(
                status_code=404,
                detail=f"User {uid} not found"
            )
        
        # Get the roadmap from request
        frontend_roadmap = request.get("roadmap")
        viva_status = request.get("vivaStatus", {})
        
        if not frontend_roadmap:
            raise HTTPException(
                status_code=400,
                detail="No roadmap data provided"
            )
        
        print(f"[SYNC] Received roadmap with {len(frontend_roadmap.get('modules', []))} modules", file=sys.stderr, flush=True)
        print(f"[SYNC] Viva status: {viva_status}", file=sys.stderr, flush=True)
        
        # Update the backend roadmap with frontend data
        backend_roadmap = user_data.get("roadmap", {})
        backend_modules = backend_roadmap.get("modules", [])
        frontend_modules = frontend_roadmap.get("modules", [])
        
        # Sync each module
        synced_count = 0
        for i, backend_module in enumerate(backend_modules):
            if i < len(frontend_modules):
                frontend_module = frontend_modules[i]
                
                # Update status from frontend
                backend_module["status"] = frontend_module.get("status", backend_module.get("status"))
                
                # Check viva status
                module_title = backend_module.get("title")
                if module_title in viva_status and viva_status[module_title]:
                    # Module has passed viva
                    backend_module["status"] = "completed"
                    # Set a passing score if not already set
                    if not backend_module.get("viva_score") or backend_module.get("viva_score") < 70:
                        backend_module["viva_score"] = 75  # Default passing score
                    synced_count += 1
                    print(f"[SYNC] Module '{module_title}' marked as completed with viva passed", file=sys.stderr, flush=True)
        
        # Save updated roadmap
        backend_roadmap["modules"] = backend_modules
        update_user_roadmap(uid, backend_roadmap)
        
        print(f"[SYNC] Successfully synced {synced_count} completed modules", file=sys.stderr, flush=True)
        
        return {
            "success": True,
            "message": f"Synced {synced_count} completed modules to database",
            "synced_modules": synced_count
        }
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_msg = f"Error syncing progress: {str(e)}\n{traceback.format_exc()}"
        print(error_msg, file=sys.stderr, flush=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to sync progress: {str(e)}"
        )


@app.post("/admin/migrate-to-mongodb")
async def migrate_to_mongodb():
    """
    Migrate data from user_state.json to MongoDB.
    This is a one-time migration endpoint.
    """
    try:
        from mongodb_database import migrate_from_json
        
        print("[MIGRATION] Starting migration from JSON to MongoDB...", file=sys.stderr, flush=True)
        migrate_from_json()
        print("[MIGRATION] Migration complete!", file=sys.stderr, flush=True)
        
        return {
            "success": True,
            "message": "Data migrated successfully from user_state.json to MongoDB"
        }
        
    except Exception as e:
        import traceback
        error_msg = f"Error during migration: {str(e)}\n{traceback.format_exc()}"
        print(error_msg, file=sys.stderr, flush=True)
        raise HTTPException(
            status_code=500,
            detail=f"Migration failed: {str(e)}"
        )
