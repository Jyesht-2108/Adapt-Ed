"""
AWS DynamoDB Database Layer for AdaptEd
Replaces JSON/MongoDB with AWS DynamoDB for scalable cloud storage
"""
import json
from datetime import datetime
from typing import Optional, Dict, Any
from aws_config import (
    get_dynamodb_resource,
    DYNAMODB_USERS_TABLE,
    DYNAMODB_ROADMAPS_TABLE,
    DYNAMODB_VIVA_SESSIONS_TABLE
)
from boto3.dynamodb.conditions import Key


# Initialize DynamoDB resource
dynamodb = get_dynamodb_resource()

# Get table references
users_table = dynamodb.Table(DYNAMODB_USERS_TABLE)
roadmaps_table = dynamodb.Table(DYNAMODB_ROADMAPS_TABLE)
viva_sessions_table = dynamodb.Table(DYNAMODB_VIVA_SESSIONS_TABLE)


def save_user_profile(uid: str, profile: Dict[str, Any], roadmap: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Save user profile to AWS DynamoDB.
    
    Args:
        uid: Firebase user ID
        profile: User profile dictionary
        roadmap: Optional roadmap dictionary
        
    Returns:
        Saved user data
    """
    try:
        timestamp = datetime.utcnow().isoformat()
        
        # Prepare user item
        user_item = {
            'uid': uid,
            'profile': profile,
            'onboarding_completed': True,
            'created_at': timestamp,
            'updated_at': timestamp
        }
        
        # Save to DynamoDB users table
        users_table.put_item(Item=user_item)
        
        print(f"[DynamoDB] Saved user profile: {uid}")
        
        # Save roadmap separately if provided
        if roadmap:
            roadmap_item = {
                'uid': uid,
                'roadmap': roadmap,
                'created_at': timestamp,
                'updated_at': timestamp
            }
            roadmaps_table.put_item(Item=roadmap_item)
            print(f"[DynamoDB] Saved roadmap for user: {uid}")
            user_item['roadmap'] = roadmap
        
        return user_item
        
    except Exception as e:
        print(f"[DynamoDB] Error saving user profile: {e}")
        raise


def get_user(uid: str) -> Optional[Dict[str, Any]]:
    """
    Get user data from AWS DynamoDB.
    
    Args:
        uid: Firebase user ID
        
    Returns:
        User data dictionary or None if not found
    """
    try:
        # Get user profile
        response = users_table.get_item(Key={'uid': uid})
        
        if 'Item' not in response:
            print(f"[DynamoDB] User not found: {uid}")
            return None
        
        user_data = response['Item']
        
        # Get roadmap
        roadmap_response = roadmaps_table.get_item(Key={'uid': uid})
        if 'Item' in roadmap_response:
            user_data['roadmap'] = roadmap_response['Item'].get('roadmap')
        
        print(f"[DynamoDB] Retrieved user: {uid}")
        return user_data
        
    except Exception as e:
        print(f"[DynamoDB] Error getting user: {e}")
        return None


def check_user_status(uid: str) -> Dict[str, Any]:
    """
    Check if user has completed onboarding.
    
    Args:
        uid: Firebase user ID
        
    Returns:
        UserStatus dictionary
    """
    try:
        user_data = get_user(uid)
        
        if not user_data:
            # User doesn't exist yet
            return {
                'uid': uid,
                'onboarding_completed': False,
                'profile': None,
                'roadmap': None,
                'created_at': datetime.utcnow().isoformat(),
                'updated_at': datetime.utcnow().isoformat()
            }
        
        return {
            'uid': uid,
            'onboarding_completed': user_data.get('onboarding_completed', False),
            'profile': user_data.get('profile'),
            'roadmap': user_data.get('roadmap'),
            'created_at': user_data.get('created_at'),
            'updated_at': user_data.get('updated_at')
        }
        
    except Exception as e:
        print(f"[DynamoDB] Error checking user status: {e}")
        raise


def update_user_roadmap(uid: str, roadmap: Dict[str, Any]) -> bool:
    """
    Update user's roadmap in AWS DynamoDB.
    
    Args:
        uid: Firebase user ID
        roadmap: Updated roadmap dictionary
        
    Returns:
        True if successful
    """
    try:
        timestamp = datetime.utcnow().isoformat()
        
        # Update roadmap in DynamoDB
        roadmaps_table.update_item(
            Key={'uid': uid},
            UpdateExpression='SET roadmap = :roadmap, updated_at = :timestamp',
            ExpressionAttributeValues={
                ':roadmap': roadmap,
                ':timestamp': timestamp
            }
        )
        
        print(f"[DynamoDB] Updated roadmap for user: {uid}")
        return True
        
    except Exception as e:
        print(f"[DynamoDB] Error updating roadmap: {e}")
        raise


def create_session(session_data: Dict[str, Any]) -> bool:
    """
    Create a new viva session in AWS DynamoDB.
    
    Args:
        session_data: Session data dictionary
        
    Returns:
        True if successful
    """
    try:
        viva_sessions_table.put_item(Item=session_data)
        print(f"[DynamoDB] Created viva session: {session_data['session_id']}")
        return True
        
    except Exception as e:
        print(f"[DynamoDB] Error creating session: {e}")
        raise


def get_session(session_id: str) -> Optional[Dict[str, Any]]:
    """
    Get viva session from AWS DynamoDB.
    
    Args:
        session_id: Session ID
        
    Returns:
        Session data or None if not found
    """
    try:
        response = viva_sessions_table.get_item(Key={'session_id': session_id})
        
        if 'Item' not in response:
            print(f"[DynamoDB] Session not found: {session_id}")
            return None
        
        return response['Item']
        
    except Exception as e:
        print(f"[DynamoDB] Error getting session: {e}")
        return None


def update_session(session_id: str, session_data: Dict[str, Any]) -> bool:
    """
    Update viva session in AWS DynamoDB.
    
    Args:
        session_id: Session ID
        session_data: Updated session data
        
    Returns:
        True if successful
    """
    try:
        timestamp = datetime.utcnow().isoformat()
        session_data['updated_at'] = timestamp
        
        viva_sessions_table.put_item(Item=session_data)
        print(f"[DynamoDB] Updated viva session: {session_id}")
        return True
        
    except Exception as e:
        print(f"[DynamoDB] Error updating session: {e}")
        raise


# Alias functions for backward compatibility
save_user = save_user_profile
