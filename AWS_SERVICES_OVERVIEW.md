# AWS Services Used in AdaptEd

## 🎯 Overview

AdaptEd leverages **6 core AWS services** to deliver an enterprise-grade adaptive learning platform:

```
┌─────────────────────────────────────────────────────────┐
│                    AdaptEd Platform                     │
│              Powered by AWS Cloud Services              │
└─────────────────────────────────────────────────────────┘
         │
         ├─► AWS Bedrock (Claude 3) - AI Generation
         ├─► AWS DynamoDB - Database
         ├─► AWS Transcribe - Speech-to-Text
         ├─► AWS Polly - Text-to-Speech
         ├─► AWS S3 - File Storage
         └─► AWS EC2 - Application Hosting
```

---

## 1. 🤖 AWS Bedrock (Claude 3)

### Purpose
Powers all AI features in AdaptEd with Anthropic's Claude 3 Sonnet model.

### Use Cases
- **Roadmap Generation**: Creates personalized learning paths based on user profile
- **Lesson Content Synthesis**: Combines multiple sources into structured lessons
- **Viva Examinations**: Conducts intelligent Q&A sessions with students
- **Study Notes Generation**: Transforms lessons into comprehensive study materials

### Why Claude 3?
- Superior reasoning and educational content generation
- Long context window (200K tokens)
- Better at Socratic teaching methods
- More natural conversation flow

### Model Used
- **Primary**: `anthropic.claude-3-sonnet-20240229-v1:0`
- **Alternative**: `anthropic.claude-3-haiku-20240307-v1:0` (faster, cheaper)

### Cost
- ~$3 per 1M input tokens
- ~$15 per 1M output tokens
- **Estimated**: $30/month for 100 active users

### Code Example
```python
from aws_config import get_bedrock_client, BEDROCK_MODEL_ID

bedrock_client = get_bedrock_client()
response = bedrock_client.invoke_model(
    modelId=BEDROCK_MODEL_ID,
    body=json.dumps({
        "anthropic_version": "bedrock-2023-05-31",
        "max_tokens": 4000,
        "messages": [{"role": "user", "content": prompt}]
    })
)
```

---

## 2. 🗄️ AWS DynamoDB

### Purpose
Serverless NoSQL database for storing user data, roadmaps, and viva sessions.

### Tables
1. **adapted-users** - User profiles and authentication data
2. **adapted-roadmaps** - Personalized learning paths
3. **adapted-viva-sessions** - Examination sessions and transcripts

### Why DynamoDB?
- Serverless (no server management)
- Auto-scaling
- Low latency (single-digit milliseconds)
- Pay-per-request pricing
- Built-in backup and restore

### Schema Example
```python
# adapted-users table
{
    "uid": "firebase_user_id",  # Primary Key
    "profile": {
        "goal": "Full Stack Developer",
        "expertise_level": "Intermediate",
        "age": "25"
    },
    "onboarding_completed": True,
    "created_at": "2024-01-01T00:00:00Z"
}
```

### Cost
- Free tier: 25 GB storage, 25 read/write capacity units
- **Estimated**: $1.25/month for 100 active users

### Code Example
```python
from aws_dynamodb import get_user, save_user_profile

# Save user
save_user_profile(uid="user123", profile=profile_data, roadmap=roadmap_data)

# Retrieve user
user_data = get_user(uid="user123")
```

---

## 3. 🎤 AWS Transcribe

### Purpose
Converts student voice responses to text during viva examinations.

### Features
- Real-time and batch transcription
- Custom vocabulary support
- Speaker identification
- Automatic punctuation

### Why AWS Transcribe?
- High accuracy (95%+ for clear audio)
- Supports multiple audio formats (WAV, MP3, FLAC)
- Automatic language detection
- Medical and custom vocabulary support

### Workflow
1. Upload audio to S3
2. Start transcription job
3. Poll for completion
4. Retrieve transcript
5. Delete temporary files

### Cost
- $0.024 per minute of audio
- **Estimated**: $12/month for 100 active users (500 minutes)

### Code Example
```python
from aws_config import get_transcribe_client, get_s3_client

# Upload audio to S3
s3_client.upload_fileobj(audio_file, bucket, key)

# Start transcription
transcribe_client.start_transcription_job(
    TranscriptionJobName=job_name,
    Media={'MediaFileUri': f's3://{bucket}/{key}'},
    MediaFormat='wav',
    LanguageCode='en-US'
)
```

---

## 4. 🔊 AWS Polly

### Purpose
Generates natural-sounding voice for AI interviewer responses during vivas.

### Features
- Neural TTS engine
- Multiple voices and languages
- SSML support for emphasis and pauses
- Streaming audio output

### Why AWS Polly?
- Natural-sounding neural voices
- Low latency
- SSML for fine-grained control
- Multiple output formats (MP3, OGG, PCM)

### Voice Used
- **Voice ID**: Joanna (US English, Female)
- **Engine**: Neural (higher quality)

### Cost
- $16 per 1M characters (Neural voices)
- **Estimated**: $8/month for 100 active users (500K characters)

### Code Example
```python
from aws_config import get_polly_client

polly_client = get_polly_client()
response = polly_client.synthesize_speech(
    Text="Great answer! Let's move to the next question.",
    OutputFormat='mp3',
    VoiceId='Joanna',
    Engine='neural'
)
audio_bytes = response['AudioStream'].read()
```

---

## 5. 📦 AWS S3

### Purpose
Stores audio files for transcription processing and other media assets.

### Bucket
- **Name**: `adapted-audio-files`
- **Region**: us-east-1
- **Access**: Private (IAM-controlled)

### Why AWS S3?
- 99.999999999% durability
- Unlimited storage
- Lifecycle policies for automatic cleanup
- Integrates with Transcribe

### Lifecycle Policy
```json
{
  "Rules": [{
    "Id": "DeleteOldAudio",
    "Status": "Enabled",
    "Expiration": {"Days": 7},
    "Filter": {"Prefix": "transcribe-input/"}
  }]
}
```

### Cost
- $0.023 per GB/month (Standard storage)
- **Estimated**: $0.30/month for 100 active users (10 GB)

### Code Example
```python
from aws_config import get_s3_client

s3_client = get_s3_client()

# Upload file
s3_client.upload_fileobj(file, bucket, key)

# Download file
s3_client.download_fileobj(bucket, key, file)

# Delete file
s3_client.delete_object(Bucket=bucket, Key=key)
```

---

## 6. 💻 AWS EC2

### Purpose
Hosts the frontend and backend applications.

### Instance Type
- **Development**: t3.small (2 vCPU, 2 GB RAM)
- **Production**: t3.medium (2 vCPU, 4 GB RAM)
- **High Traffic**: c5.large (2 vCPU, 4 GB RAM, compute-optimized)

### Why AWS EC2?
- Full control over environment
- Flexible instance types
- Auto-scaling support
- Reserved instances for cost savings

### Architecture
```
┌─────────────────┐      ┌─────────────────┐
│  Frontend EC2   │      │  Backend EC2    │
│  React App      │◄─────│  FastAPI        │
│  Port 5173      │      │  Port 8001      │
└─────────────────┘      └─────────────────┘
```

### Cost
- t3.medium: ~$30/month per instance
- **Estimated**: $60/month for 2 instances (frontend + backend)

### Deployment
```bash
# Launch instance
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t3.medium \
  --key-name your-key-pair

# SSH and deploy
ssh -i key.pem ec2-user@instance-ip
git clone repo && cd repo
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8001
```

---

## 📊 Total Cost Breakdown

### Monthly Cost (100 Active Users)

| Service | Usage | Cost |
|---------|-------|------|
| AWS Bedrock | 10M tokens | $30.00 |
| DynamoDB | 1M requests, 5 GB | $1.25 |
| Transcribe | 500 minutes | $12.00 |
| Polly | 500K characters | $8.00 |
| S3 | 10 GB, 1K requests | $0.30 |
| EC2 | 2x t3.medium | $60.00 |
| Data Transfer | 50 GB out | $4.50 |
| **Total** | | **$116.05** |

### Cost Optimization Tips
1. Use Reserved Instances for EC2 (save up to 72%)
2. Enable DynamoDB auto-scaling
3. Use S3 lifecycle policies to delete old files
4. Cache Bedrock responses for common queries
5. Use Haiku model for simple tasks

---

## 🔐 Security & Compliance

### IAM Permissions
All services use IAM roles with least-privilege access:
- Bedrock: `bedrock:InvokeModel`
- DynamoDB: `dynamodb:GetItem`, `dynamodb:PutItem`, etc.
- S3: `s3:GetObject`, `s3:PutObject`, etc.
- Transcribe: `transcribe:StartTranscriptionJob`, etc.
- Polly: `polly:SynthesizeSpeech`

### Encryption
- **At Rest**: All DynamoDB tables and S3 buckets encrypted with AWS KMS
- **In Transit**: All API calls use HTTPS/TLS 1.2+

### Compliance
AWS services are compliant with:
- SOC 2
- HIPAA
- GDPR
- ISO 27001
- PCI DSS

---

## 📈 Monitoring & Logging

### CloudWatch Metrics
- Bedrock invocations and latency
- DynamoDB read/write capacity
- S3 storage and requests
- EC2 CPU and memory utilization
- Transcribe job success rate
- Polly character count

### CloudWatch Logs
- Application logs from EC2
- Bedrock API calls
- DynamoDB operations
- S3 access logs

### Alarms
- High error rate (> 5%)
- High latency (p99 > 2s)
- DynamoDB throttling
- High daily costs (> $50)

---

## 🚀 Getting Started

1. **Enable Services**
   ```bash
   # Enable Bedrock
   aws bedrock list-foundation-models --region us-east-1
   ```

2. **Create Infrastructure**
   ```bash
   cd AdaptEd/backend
   python aws_setup.py
   ```

3. **Deploy Application**
   ```bash
   python -m uvicorn main:app --reload --port 8001
   ```

4. **Monitor**
   ```bash
   # View CloudWatch metrics
   aws cloudwatch get-metric-statistics \
     --namespace AWS/Bedrock \
     --metric-name Invocations \
     --start-time 2024-01-01T00:00:00Z \
     --end-time 2024-01-31T23:59:59Z \
     --period 3600 \
     --statistics Sum
   ```

---

## 📚 Additional Resources

- [AWS Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [AWS DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [AWS Transcribe Developer Guide](https://docs.aws.amazon.com/transcribe/)
- [AWS Polly Developer Guide](https://docs.aws.amazon.com/polly/)
- [AWS S3 User Guide](https://docs.aws.amazon.com/s3/)
- [AWS EC2 User Guide](https://docs.aws.amazon.com/ec2/)

---

**Built with AWS** ☁️ | **6 Core Services** 🔧 | **Enterprise-Grade** 🏢
