"""
Simple JSON-based database for user profiles and roadmaps.
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
DB_PATH = Path(__file__).parent / "user_state.json"


def _load_db() -> Dict[str, Any]:
    """Load the database from JSON file."""
    with _lock:
        if not DB_PATH.exists():
            return {"users": {}}
        
        try:
            with open(DB_PATH, 'r', encoding='utf-8') as f:
                return json.load(f)
        except json.JSONDecodeError:
            print(f"Warning: Corrupted database file, creating new one")
            return {"users": {}}


def _save_db(data: Dict[str, Any]) -> None:
    """Save the database to JSON file."""
    with _lock:
        with open(DB_PATH, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)


def get_user(uid: str) -> Optional[Dict[str, Any]]:
    """
    Get user data by Firebase UID.
    
    Args:
        uid: Firebase user ID
        
    Returns:
        User data dictionary or None if not found
    """
    db = _load_db()
    return db["users"].get(uid)


def save_user_profile(uid: str, profile: Dict[str, Any], roadmap: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Save or update user profile and optionally roadmap.
    
    Args:
        uid: Firebase user ID
        profile: User profile data
        roadmap: Optional roadmap data
        
    Returns:
        Updated user data
    """
    db = _load_db()
    
    now = datetime.utcnow().isoformat()
    
    if uid not in db["users"]:
        # New user
        db["users"][uid] = {
            "uid": uid,
            "profile": profile,
            "roadmap": roadmap,
            "onboarding_completed": roadmap is not None,
            "created_at": now,
            "updated_at": now
        }
    else:
        # Update existing user
        db["users"][uid]["profile"] = profile
        if roadmap is not None:
            db["users"][uid]["roadmap"] = roadmap
            db["users"][uid]["onboarding_completed"] = True
        db["users"][uid]["updated_at"] = now
    
    _save_db(db)
    return db["users"][uid]


def update_user_roadmap(uid: str, roadmap: Dict[str, Any]) -> Dict[str, Any]:
    """
    Update user's roadmap.
    
    Args:
        uid: Firebase user ID
        roadmap: Roadmap data
        
    Returns:
        Updated user data
    """
    db = _load_db()
    
    if uid not in db["users"]:
        raise ValueError(f"User {uid} not found")
    
    db["users"][uid]["roadmap"] = roadmap
    db["users"][uid]["onboarding_completed"] = True
    db["users"][uid]["updated_at"] = datetime.utcnow().isoformat()
    
    _save_db(db)
    return db["users"][uid]


def check_user_status(uid: str) -> Dict[str, Any]:
    """
    Check if user has completed onboarding.
    
    Args:
        uid: Firebase user ID
        
    Returns:
        Dictionary with onboarding_completed status
    """
    user = get_user(uid)
    
    if user is None:
        return {
            "uid": uid,
            "onboarding_completed": False,
            "profile": None,
            "roadmap": None
        }
    
    return {
        "uid": user["uid"],
        "onboarding_completed": user.get("onboarding_completed", False),
        "profile": user.get("profile"),
        "roadmap": user.get("roadmap")
    }


def delete_user(uid: str) -> bool:
    """
    Delete user data.
    
    Args:
        uid: Firebase user ID
        
    Returns:
        True if deleted, False if not found
    """
    db = _load_db()
    
    if uid in db["users"]:
        del db["users"][uid]
        _save_db(db)
        return True
    
    return False


def get_all_users() -> Dict[str, Any]:
    """
    Get all users (for admin purposes).
    
    Returns:
        Dictionary of all users
    """
    db = _load_db()
    return db["users"]


def get_user_count() -> int:
    """
    Get total number of users.
    
    Returns:
        Number of users
    """
    db = _load_db()
    return len(db["users"])
