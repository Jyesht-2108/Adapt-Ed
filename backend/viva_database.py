"""
Database operations for Viva sessions.
"""
import json
import os
from pathlib import Path
from typing import Optional, Dict, Any
from datetime import datetime
import threading

# Thread-safe file operations
_lock = threading.Lock()

# Database file path
VIVA_DB_PATH = Path(__file__).parent / "viva_sessions.json"


def _load_db() -> Dict[str, Any]:
    """Load the viva sessions database from JSON file."""
    with _lock:
        if not VIVA_DB_PATH.exists():
            return {"sessions": {}}
        
        try:
            with open(VIVA_DB_PATH, 'r', encoding='utf-8') as f:
                return json.load(f)
        except json.JSONDecodeError:
            print(f"Warning: Corrupted viva database file, creating new one")
            return {"sessions": {}}


def _save_db(data: Dict[str, Any]) -> None:
    """Save the viva sessions database to JSON file."""
    with _lock:
        with open(VIVA_DB_PATH, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)


def create_session(session_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create a new viva session.
    
    Args:
        session_data: Session data dictionary
        
    Returns:
        Created session data
    """
    db = _load_db()
    
    session_id = session_data["session_id"]
    db["sessions"][session_id] = session_data
    
    _save_db(db)
    return session_data


def get_session(session_id: str) -> Optional[Dict[str, Any]]:
    """
    Get viva session by ID.
    
    Args:
        session_id: Session ID
        
    Returns:
        Session data or None if not found
    """
    db = _load_db()
    return db["sessions"].get(session_id)


def update_session(session_id: str, session_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Update viva session.
    
    Args:
        session_id: Session ID
        session_data: Updated session data
        
    Returns:
        Updated session data
    """
    db = _load_db()
    
    if session_id not in db["sessions"]:
        raise ValueError(f"Session {session_id} not found")
    
    session_data["updated_at"] = datetime.utcnow().isoformat()
    db["sessions"][session_id] = session_data
    
    _save_db(db)
    return session_data


def delete_session(session_id: str) -> bool:
    """
    Delete viva session.
    
    Args:
        session_id: Session ID
        
    Returns:
        True if deleted, False if not found
    """
    db = _load_db()
    
    if session_id in db["sessions"]:
        del db["sessions"][session_id]
        _save_db(db)
        return True
    
    return False


def get_all_sessions() -> Dict[str, Any]:
    """
    Get all viva sessions.
    
    Returns:
        Dictionary of all sessions
    """
    db = _load_db()
    return db["sessions"]


def get_user_sessions(user_id: str) -> Dict[str, Any]:
    """
    Get all sessions for a specific user.
    
    Args:
        user_id: User ID
        
    Returns:
        Dictionary of user's sessions
    """
    db = _load_db()
    user_sessions = {}
    
    for session_id, session_data in db["sessions"].items():
        if session_data.get("user_id") == user_id:
            user_sessions[session_id] = session_data
    
    return user_sessions
