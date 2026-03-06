from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from enum import Enum
from datetime import date


class ModuleStatus(str, Enum):
    pending = "pending"
    active = "active"
    completed = "completed"
    failed = "failed"
    failed_dishonesty = "failed_dishonesty"


class UserProfile(BaseModel):
    uid: str = Field(description="Firebase UID of the user")
    goal: str
    current_skills: List[str]
    preferred_language: str
    time_commitment: str
    notification_time: str = Field(default="09:00", description="Daily notification time in HH:MM format")
    weekly_hours: int = Field(default=10, description="Hours per week commitment")


class UserStatus(BaseModel):
    """User onboarding status."""
    uid: str
    onboarding_completed: bool
    profile: Optional[UserProfile] = None
    roadmap: Optional['Roadmap'] = None
    created_at: str
    updated_at: str


class LearningModule(BaseModel):
    title: str
    description: str
    week: int
    status: ModuleStatus
    resources: List[str]
    viva_score: Optional[int] = Field(default=None, description="Score from viva exam (0-100)")
    integrity_log: Optional[List[str]] = Field(default=None, description="Academic integrity violations log")
    dishonesty_detected: Optional[bool] = Field(default=False, description="Flag if academic dishonesty was detected")


class Roadmap(BaseModel):
    user_id: str
    modules: List[LearningModule]


class VivaCompleteRequest(BaseModel):
    """Request to complete a viva and unlock next module."""
    user_id: str = Field(description="Firebase UID of the user")
    module_id: str = Field(description="Module title that was completed")
    final_score: int = Field(description="Final viva score (0-100)")
    academic_dishonesty_flag: bool = Field(default=False, description="Flag indicating if academic dishonesty was detected")
    integrity_log: List[str] = Field(default_factory=list, description="Log of integrity violations (e.g., 'Looking away detected at 02:15')")


class VivaCompleteResponse(BaseModel):
    """Response after completing a viva."""
    success: bool
    passed: bool
    unlocked_module_id: Optional[str] = Field(default=None, description="Next module that was unlocked")
    message: str


class LessonRequest(BaseModel):
    topic: str
    user_preference: str  # e.g., "visual learner", "text learner"


class VideoTranscriptData(BaseModel):
    """Video transcript data sent from frontend."""
    text: str = Field(description="The transcript text")
    url: str = Field(description="YouTube video URL")
    video_id: str = Field(description="YouTube video ID")


class LessonRequestWithTranscript(BaseModel):
    """Lesson request with pre-fetched transcript from frontend."""
    topic: str
    user_preference: str
    video_transcript: Optional[VideoTranscriptData] = Field(
        default=None,
        description="Pre-fetched video transcript from frontend"
    )


# Simplified Viva Models (Text-only)
class VivaInteraction(BaseModel):
    """Request model for text-based viva interaction."""
    session_id: str = Field(description="Unique session ID")
    user_text: str = Field(description="The answer the user just gave")
    module_topic: str = Field(description="Topic being tested (e.g., 'Git Basics')")
    target_role: Optional[str] = Field(default="Senior Technical Interviewer", description="Interviewer persona (e.g., 'Senior Backend Engineer')")


class VivaResponse(BaseModel):
    """Response model for viva interaction."""
    reply: str = Field(description="Interviewer's spoken response")
    next_question: str = Field(description="Next technical question to ask")
    score: int = Field(description="Score for this answer (0-100)")
    cumulative_score: int = Field(description="Total score so far")
    question_count: int = Field(description="Number of questions asked")
    is_complete: bool = Field(default=False, description="Whether the viva is complete")
    final_feedback: Optional[str] = Field(default=None, description="Final feedback if complete")


class Lesson(BaseModel):
    topic: str
    summary: str
    key_points: List[str]
    code_snippets: List[str]


class CodeSnippet(BaseModel):
    """Code snippet with language specification."""
    language: str = Field(description="Programming language (e.g., 'python', 'bash', 'javascript')")
    code: str = Field(description="The actual code content")


class Source(BaseModel):
    """Source reference for educational content (Perplexity-style)."""
    title: str = Field(description="Source title, e.g., 'NetworkChuck - Docker Volumes by NetworkChuck'")
    url: str = Field(description="The link to the source")
    type: str = Field(description="Type of source: 'video' or 'documentation'")
    metadata: Optional[Dict[str, str]] = Field(
        default=None,
        description="Additional metadata like views, channel, etc."
    )


class LessonContent(BaseModel):
    """Detailed micro-lesson with structured educational content and multiple sources."""
    title: str = Field(description="The main title of the lesson")
    summary: str = Field(description="A concise 2-sentence summary of the topic")
    key_concepts: List[str] = Field(description="List of 3-5 bullet points covering the core ideas")
    main_content: str = Field(description="The educational content in Markdown format. Use headers, bold text for emphasis, and clear paragraphs.")
    code_snippets: List[CodeSnippet] = Field(description="A list of code blocks found in the content. Each should have 'language' and 'code' fields.")
    quiz_question: str = Field(description="A single conceptual multiple-choice question to test understanding")
    sources: List[Source] = Field(description="List of sources used to create this lesson (videos, documentation, etc.)")
    citation_map: Optional[Dict[str, int]] = Field(
        default=None,
        description="Optional mapping of key concepts to source indices. E.g., {'Bind Mounts': 0, 'Volumes': 1}"
    )


class StudyNotes(BaseModel):
    """Comprehensive study notes generated from lesson content."""
    title: str = Field(description="Title of the notes")
    overview: str = Field(description="Brief overview paragraph")
    detailed_notes: str = Field(description="Comprehensive notes in Markdown format with proper structure")
    key_takeaways: List[str] = Field(description="5-7 key takeaways for quick review")
    practice_exercises: List[str] = Field(description="3-5 practice exercises or questions")
    additional_resources: List[str] = Field(description="Suggested topics for further study")
    sources: List[Source] = Field(description="Original sources from the lesson")

# Scheduler Component Models


class ActivityType(str, Enum):
    learning = "learning"
    coding_practice = "coding_practice"
    viva = "viva"
    remedial = "remedial"


class TimeSlot(BaseModel):
    day: str  # e.g., "Monday"
    start_time: str  # e.g., "18:00"
    duration_minutes: int
    activity_type: ActivityType


class ModuleStatusScheduler(str, Enum):
    locked = "locked"
    unlocked = "unlocked"
    completed = "completed"
    failed = "failed"


class LearningModuleScheduler(BaseModel):
    id: str
    title: str  # e.g., "Docker Containers"
    prerequisites: List[str]
    estimated_hours: int
    status: ModuleStatusScheduler
    viva_passed: bool


class UserSchedule(BaseModel):
    user_id: str
    goal: str
    start_date: date
    daily_commitment_hours: int
    preferred_language: str
    modules: List[LearningModuleScheduler]  # The dependency tree
    calendar: List[TimeSlot]  # The actual mapped schedule


# Viva Engine Models


class VivaStatus(str, Enum):
    active = "active"
    passed = "passed"
    failed = "failed"


class VivaMessage(BaseModel):
    """Single message in viva conversation."""
    role: str = Field(description="'user' or 'interviewer'")
    content: str = Field(description="Message content")
    timestamp: str = Field(description="ISO timestamp")


class VivaSession(BaseModel):
    """Viva Voce examination session."""
    session_id: str = Field(description="Unique session ID (UUID)")
    module_id: str = Field(description="ID of the module being tested")
    module_title: str = Field(description="Title of the module")
    transcript: List[VivaMessage] = Field(default_factory=list, description="Conversation history")
    current_score: int = Field(default=50, description="Current score (0-100)")
    status: VivaStatus = Field(default=VivaStatus.active, description="Session status")
    question_count: int = Field(default=0, description="Number of questions asked")
    created_at: str = Field(description="Session creation timestamp")
    updated_at: str = Field(description="Last update timestamp")


class VivaStartRequest(BaseModel):
    """Request to start a viva session."""
    module_id: str = Field(description="ID of the module to test")
    module_title: str = Field(description="Title of the module")
    module_description: Optional[str] = Field(default=None, description="Module description for context")
    user_goal: Optional[str] = Field(default=None, description="User's learning goal (e.g., 'Full Stack Developer')")


class VivaStartResponse(BaseModel):
    """Response when starting a viva session."""
    session_id: str
    greeting: str
    first_question: str
    audio_base64: Optional[str] = None


class VivaInteractRequest(BaseModel):
    """Request for viva interaction (used for text input)."""
    session_id: str
    user_text: str


class VivaInteractResponse(BaseModel):
    """Response from viva interaction."""
    reply_text: str
    status: VivaStatus
    current_score: int
    question_count: int
    audio_base64: Optional[str] = None
    final_result: Optional[Dict[str, Any]] = None
