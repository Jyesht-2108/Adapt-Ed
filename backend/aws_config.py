"""
AWS Configuration and Client Initialization
Centralized AWS service configuration for AdaptEd platform
"""
import os
import boto3
from botocore.config import Config
from dotenv import load_dotenv

load_dotenv()

# AWS Configuration
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")

# Boto3 configuration with retry logic
boto_config = Config(
    region_name=AWS_REGION,
    retries={
        'max_attempts': 3,
        'mode': 'adaptive'
    }
)

# Initialize AWS clients
def get_bedrock_client():
    """Get AWS Bedrock Runtime client for Claude AI"""
    return boto3.client(
        'bedrock-runtime',
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        config=boto_config
    )

def get_transcribe_client():
    """Get AWS Transcribe client for speech-to-text"""
    return boto3.client(
        'transcribe',
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        config=boto_config
    )

def get_polly_client():
    """Get AWS Polly client for text-to-speech"""
    return boto3.client(
        'polly',
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        config=boto_config
    )

def get_dynamodb_resource():
    """Get AWS DynamoDB resource"""
    return boto3.resource(
        'dynamodb',
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        config=boto_config
    )

def get_s3_client():
    """Get AWS S3 client for file storage"""
    return boto3.client(
        's3',
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY,
        config=boto_config
    )

# Model configurations
BEDROCK_MODEL_ID = "anthropic.claude-3-sonnet-20240229-v1:0"  # Claude 3 Sonnet
BEDROCK_MODEL_HAIKU = "anthropic.claude-3-haiku-20240307-v1:0"  # Claude 3 Haiku (faster, cheaper)

# DynamoDB table names
DYNAMODB_USERS_TABLE = os.getenv("DYNAMODB_USERS_TABLE", "adapted-users")
DYNAMODB_ROADMAPS_TABLE = os.getenv("DYNAMODB_ROADMAPS_TABLE", "adapted-roadmaps")
DYNAMODB_VIVA_SESSIONS_TABLE = os.getenv("DYNAMODB_VIVA_SESSIONS_TABLE", "adapted-viva-sessions")

# S3 bucket for audio files
S3_AUDIO_BUCKET = os.getenv("S3_AUDIO_BUCKET", "adapted-audio-files")

# Polly voice configuration
POLLY_VOICE_ID = "Joanna"  # Professional female voice
POLLY_ENGINE = "neural"  # Neural engine for better quality

print(f"✓ AWS Configuration loaded")
print(f"  Region: {AWS_REGION}")
print(f"  Bedrock Model: {BEDROCK_MODEL_ID}")
print(f"  DynamoDB Tables: {DYNAMODB_USERS_TABLE}, {DYNAMODB_ROADMAPS_TABLE}, {DYNAMODB_VIVA_SESSIONS_TABLE}")
print(f"  S3 Bucket: {S3_AUDIO_BUCKET}")
