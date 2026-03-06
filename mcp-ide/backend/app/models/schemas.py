from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class EditorState(BaseModel):
    file_path: str
    language: str
    full_code: str
    cursor_line: int
    cursor_column: int
    selected_text: str = ""
    errors: List[str] = []

class ContextPayload(BaseModel):
    editor_state: EditorState
    user_question: str

class TutorResponse(BaseModel):
    response: str
    hints: List[str] = []
    related_concepts: List[str] = []

class ChatMessage(BaseModel):
    role: str  # 'user' or 'assistant'
    content: str
    timestamp: Optional[datetime] = None
