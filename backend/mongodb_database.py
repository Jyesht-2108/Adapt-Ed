"""
MongoDB database for user profiles and roadmaps.
Replaces the JSON file-based storage.
"""
from pymongo import MongoClient
from typing import Optional, Dict, Any
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

# MongoDB connection
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017/")
DATABASE_NAME = os.getenv("MONGODB_DATABASE", "adapted")

# Initialize MongoDB client
client = None
db = None

def get_database():
    """Get MongoDB database instance."""
    global client, db
    if db is None:
        client = MongoClient(MONGODB_URL)
        db = client[DATABASE_NAME]
        print(f"✓ Connected to MongoDB: {DATABASE_NAME}")
    return db

def get_users_collection():
    """Get users collection."""
    db = get_database()
    return db["users"]


def get_user(uid: str) -> Optional[Dict[str, Any]]:
    """
    Get user data by Firebase UID.
    
    Args:
        uid: Firebase user ID
        
    Returns:
        User data dictionary or None if not found
    """
    collection = get_users_collection()
    user = collection.find_one({"uid": uid})
    
    if user:
        # Remove MongoDB's _id field
        user.pop("_id", None)
    
    return user


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
    collection = get_users_collection()
    
    now = datetime.utcnow().isoformat()
    
    # Check if user exists
    existing_user = collection.find_one({"uid": uid})
    
    if existing_user:
        # Update existing user
        update_data = {
            "profile": profile,
            "updated_at": now
        }
        
        if roadmap is not None:
            update_data["roadmap"] = roadmap
            update_data["onboarding_completed"] = True
        
        collection.update_one(
            {"uid": uid},
            {"$set": update_data}
        )
        
        # Get updated user
        user = collection.find_one({"uid": uid})
    else:
        # Create new user
        user_data = {
            "uid": uid,
            "profile": profile,
            "roadmap": roadmap,
            "onboarding_completed": roadmap is not None,
            "created_at": now,
            "updated_at": now
        }
        
        collection.insert_one(user_data)
        user = user_data
    
    # Remove MongoDB's _id field
    if user:
        user.pop("_id", None)
    
    return user


def update_user_roadmap(uid: str, roadmap: Dict[str, Any]) -> Dict[str, Any]:
    """
    Update user's roadmap.
    
    Args:
        uid: Firebase user ID
        roadmap: Roadmap data
        
    Returns:
        Updated user data
    """
    collection = get_users_collection()
    
    # Check if user exists
    existing_user = collection.find_one({"uid": uid})
    if not existing_user:
        raise ValueError(f"User {uid} not found")
    
    # Update roadmap
    collection.update_one(
        {"uid": uid},
        {
            "$set": {
                "roadmap": roadmap,
                "onboarding_completed": True,
                "updated_at": datetime.utcnow().isoformat()
            }
        }
    )
    
    # Get updated user
    user = collection.find_one({"uid": uid})
    if user:
        user.pop("_id", None)
    
    return user


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
    collection = get_users_collection()
    result = collection.delete_one({"uid": uid})
    return result.deleted_count > 0


def get_all_users() -> list:
    """
    Get all users (for admin purposes).
    
    Returns:
        List of all users
    """
    collection = get_users_collection()
    users = list(collection.find({}))
    
    # Remove MongoDB's _id field from all users
    for user in users:
        user.pop("_id", None)
    
    return users


def get_user_count() -> int:
    """
    Get total number of users.
    
    Returns:
        Number of users
    """
    collection = get_users_collection()
    return collection.count_documents({})


def migrate_from_json():
    """
    Migrate data from user_state.json to MongoDB.
    This is a one-time migration function.
    """
    import json
    from pathlib import Path
    
    json_path = Path(__file__).parent / "user_state.json"
    
    if not json_path.exists():
        print("No user_state.json found to migrate")
        return
    
    try:
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        users = data.get("users", {})
        collection = get_users_collection()
        
        migrated_count = 0
        for uid, user_data in users.items():
            # Check if user already exists
            existing = collection.find_one({"uid": uid})
            if not existing:
                collection.insert_one(user_data)
                migrated_count += 1
                print(f"Migrated user: {uid}")
        
        print(f"✓ Migration complete: {migrated_count} users migrated")
        
    except Exception as e:
        print(f"Error during migration: {e}")
