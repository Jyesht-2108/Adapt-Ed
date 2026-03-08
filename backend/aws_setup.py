"""
AWS Infrastructure Setup Script
Creates required DynamoDB tables and S3 buckets for AdaptEd
"""
import boto3
import os
from dotenv import load_dotenv

load_dotenv()

AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")

# Table names
USERS_TABLE = os.getenv("DYNAMODB_USERS_TABLE", "adapted-users")
ROADMAPS_TABLE = os.getenv("DYNAMODB_ROADMAPS_TABLE", "adapted-roadmaps")
VIVA_SESSIONS_TABLE = os.getenv("DYNAMODB_VIVA_SESSIONS_TABLE", "adapted-viva-sessions")
S3_BUCKET = os.getenv("S3_AUDIO_BUCKET", "adapted-audio-files")


def create_dynamodb_tables():
    """Create DynamoDB tables for AdaptEd"""
    dynamodb = boto3.client(
        'dynamodb',
        region_name=AWS_REGION,
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY
    )
    
    print("Creating DynamoDB tables...")
    
    # Users table
    try:
        dynamodb.create_table(
            TableName=USERS_TABLE,
            KeySchema=[
                {'AttributeName': 'uid', 'KeyType': 'HASH'}
            ],
            AttributeDefinitions=[
                {'AttributeName': 'uid', 'AttributeType': 'S'}
            ],
            BillingMode='PAY_PER_REQUEST'
        )
        print(f"✓ Created table: {USERS_TABLE}")
    except dynamodb.exceptions.ResourceInUseException:
        print(f"⚠ Table already exists: {USERS_TABLE}")
    
    # Roadmaps table
    try:
        dynamodb.create_table(
            TableName=ROADMAPS_TABLE,
            KeySchema=[
                {'AttributeName': 'uid', 'KeyType': 'HASH'}
            ],
            AttributeDefinitions=[
                {'AttributeName': 'uid', 'AttributeType': 'S'}
            ],
            BillingMode='PAY_PER_REQUEST'
        )
        print(f"✓ Created table: {ROADMAPS_TABLE}")
    except dynamodb.exceptions.ResourceInUseException:
        print(f"⚠ Table already exists: {ROADMAPS_TABLE}")
    
    # Viva sessions table
    try:
        dynamodb.create_table(
            TableName=VIVA_SESSIONS_TABLE,
            KeySchema=[
                {'AttributeName': 'session_id', 'KeyType': 'HASH'}
            ],
            AttributeDefinitions=[
                {'AttributeName': 'session_id', 'AttributeType': 'S'}
            ],
            BillingMode='PAY_PER_REQUEST'
        )
        print(f"✓ Created table: {VIVA_SESSIONS_TABLE}")
    except dynamodb.exceptions.ResourceInUseException:
        print(f"⚠ Table already exists: {VIVA_SESSIONS_TABLE}")


def create_s3_bucket():
    """Create S3 bucket for audio files"""
    s3 = boto3.client(
        's3',
        region_name=AWS_REGION,
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY
    )
    
    print("\nCreating S3 bucket...")
    
    try:
        if AWS_REGION == 'us-east-1':
            s3.create_bucket(Bucket=S3_BUCKET)
        else:
            s3.create_bucket(
                Bucket=S3_BUCKET,
                CreateBucketConfiguration={'LocationConstraint': AWS_REGION}
            )
        print(f"✓ Created S3 bucket: {S3_BUCKET}")
    except s3.exceptions.BucketAlreadyOwnedByYou:
        print(f"⚠ Bucket already exists: {S3_BUCKET}")
    except Exception as e:
        print(f"✗ Error creating bucket: {e}")


def verify_bedrock_access():
    """Verify AWS Bedrock access"""
    bedrock = boto3.client(
        'bedrock',
        region_name=AWS_REGION,
        aws_access_key_id=AWS_ACCESS_KEY_ID,
        aws_secret_access_key=AWS_SECRET_ACCESS_KEY
    )
    
    print("\nVerifying AWS Bedrock access...")
    
    try:
        # List foundation models
        response = bedrock.list_foundation_models()
        claude_models = [m for m in response['modelSummaries'] if 'claude' in m['modelId'].lower()]
        
        if claude_models:
            print(f"✓ AWS Bedrock access verified")
            print(f"✓ Found {len(claude_models)} Claude models available")
            for model in claude_models[:3]:
                print(f"  - {model['modelId']}")
        else:
            print("⚠ No Claude models found. You may need to request access in AWS Console.")
    except Exception as e:
        print(f"✗ Error accessing Bedrock: {e}")
        print("  Make sure you have enabled Bedrock in your AWS account")


if __name__ == "__main__":
    print("=" * 60)
    print("AdaptEd AWS Infrastructure Setup")
    print("=" * 60)
    print(f"Region: {AWS_REGION}")
    print()
    
    if not AWS_ACCESS_KEY_ID or not AWS_SECRET_ACCESS_KEY:
        print("ERROR: AWS credentials not found!")
        print("Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env file")
        exit(1)
    
    create_dynamodb_tables()
    create_s3_bucket()
    verify_bedrock_access()
    
    print("\n" + "=" * 60)
    print("Setup complete!")
    print("=" * 60)
    print("\nNext steps:")
    print("1. Enable AWS Bedrock models in AWS Console (if not already done)")
    print("2. Request access to Claude 3 models in Bedrock")
    print("3. Run: python -m uvicorn main:app --reload --port 8001")
