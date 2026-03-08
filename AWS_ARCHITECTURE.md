# AdaptEd AWS Architecture

## 🏗️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          AdaptEd Platform                                │
│                     Built on AWS Cloud Infrastructure                    │
└─────────────────────────────────────────────────────────────────────────┘

                              ┌──────────────┐
                              │   Internet   │
                              │    Users     │
                              └──────┬───────┘
                                     │
                                     ▼
                        ┌────────────────────────┐
                        │   AWS Route 53 (DNS)   │
                        │  adapted-platform.com  │
                        └────────────┬───────────┘
                                     │
                                     ▼
                        ┌────────────────────────┐
                        │  AWS CloudFront (CDN)  │
                        │   Content Delivery     │
                        └────────────┬───────────┘
                                     │
                    ┌────────────────┴────────────────┐
                    │                                 │
                    ▼                                 ▼
        ┌───────────────────┐            ┌───────────────────┐
        │   Frontend EC2    │            │   Backend EC2     │
        │   React App       │◄───────────│   FastAPI         │
        │   Port 5173       │            │   Port 8001       │
        └───────────────────┘            └─────────┬─────────┘
                                                   │
                                                   │
                    ┌──────────────────────────────┼──────────────────────────────┐
                    │                              │                              │
                    ▼                              ▼                              ▼
        ┌───────────────────┐        ┌───────────────────┐        ┌───────────────────┐
        │   AWS Bedrock     │        │   AWS DynamoDB    │        │   AWS S3          │
        │   (Claude 3)      │        │   NoSQL Database  │        │   File Storage    │
        │   AI Generation   │        │   - Users         │        │   - Audio Files   │
        └───────────────────┘        │   - Roadmaps      │        └───────────────────┘
                                     │   - Viva Sessions │
                                     └───────────────────┘
                    │                              │
                    ▼                              ▼
        ┌───────────────────┐        ┌───────────────────┐
        │  AWS Transcribe   │        │   AWS Polly       │
        │  Speech-to-Text   │        │   Text-to-Speech  │
        │  (Viva Input)     │        │   (Viva Output)   │
        └───────────────────┘        └───────────────────┘
                    │
                    ▼
        ┌───────────────────────────────────────┐
        │      AWS CloudWatch                   │
        │   Monitoring, Logging & Alerts        │
        └───────────────────────────────────────┘
```

## 🔄 Data Flow Diagrams

### 1. User Onboarding Flow

```
User → Frontend → Backend → AWS Bedrock (Claude 3) → Generate Roadmap
                     ↓
                AWS DynamoDB
                (Save Profile & Roadmap)
```

### 2. Lesson Generation Flow

```
User Request → Backend → YouTube API (Video Search)
                  ↓
            Fetch Transcript
                  ↓
         AWS Bedrock (Claude 3)
         (Synthesize Lesson)
                  ↓
            Return Lesson Content
```

### 3. Viva Voice Examination Flow

```
User Voice → Frontend → Backend → AWS S3 (Upload Audio)
                          ↓
                   AWS Transcribe
                   (Speech-to-Text)
                          ↓
                   AWS Bedrock (Claude 3)
                   (Evaluate Answer)
                          ↓
                   AWS Polly
                   (Text-to-Speech)
                          ↓
                   Return Audio Response
                          ↓
                   AWS DynamoDB
                   (Save Session)
```

### 4. Progress Tracking Flow

```
User Action → Frontend → Backend → AWS DynamoDB
                                   (Update Progress)
                                         ↓
                                   Retrieve Stats
                                         ↓
                                   Return to Frontend
```

## 🗄️ AWS DynamoDB Schema

### Table: adapted-users

```
Primary Key: uid (String)

Attributes:
- uid: String (Firebase UID)
- profile: Map
  - goal: String
  - current_skills: List<String>
  - preferred_language: String
  - time_commitment: String
  - age: String
  - expertise_level: String
- onboarding_completed: Boolean
- created_at: String (ISO timestamp)
- updated_at: String (ISO timestamp)
```

### Table: adapted-roadmaps

```
Primary Key: uid (String)

Attributes:
- uid: String (Firebase UID)
- roadmap: Map
  - user_id: String
  - modules: List<Map>
    - title: String
    - description: String
    - week: Number
    - status: String (active|pending|completed)
    - resources: List<String>
    - viva_score: Number (optional)
- created_at: String (ISO timestamp)
- updated_at: String (ISO timestamp)
```

### Table: adapted-viva-sessions

```
Primary Key: session_id (String)

Attributes:
- session_id: String (UUID)
- module_id: String
- module_title: String
- transcript: List<Map>
  - role: String (user|interviewer)
  - content: String
  - timestamp: String
- current_score: Number
- status: String (active|passed|failed)
- question_count: Number
- created_at: String (ISO timestamp)
- updated_at: String (ISO timestamp)
```

## 🔐 AWS IAM Permissions

### Required IAM Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "BedrockAccess",
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:ListFoundationModels"
      ],
      "Resource": "*"
    },
    {
      "Sid": "DynamoDBAccess",
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:UpdateItem",
        "dynamodb:Query",
        "dynamodb:Scan",
        "dynamodb:DeleteItem"
      ],
      "Resource": [
        "arn:aws:dynamodb:*:*:table/adapted-users",
        "arn:aws:dynamodb:*:*:table/adapted-roadmaps",
        "arn:aws:dynamodb:*:*:table/adapted-viva-sessions"
      ]
    },
    {
      "Sid": "S3Access",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::adapted-audio-files",
        "arn:aws:s3:::adapted-audio-files/*"
      ]
    },
    {
      "Sid": "TranscribeAccess",
      "Effect": "Allow",
      "Action": [
        "transcribe:StartTranscriptionJob",
        "transcribe:GetTranscriptionJob",
        "transcribe:DeleteTranscriptionJob"
      ],
      "Resource": "*"
    },
    {
      "Sid": "PollyAccess",
      "Effect": "Allow",
      "Action": [
        "polly:SynthesizeSpeech"
      ],
      "Resource": "*"
    },
    {
      "Sid": "CloudWatchLogs",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    }
  ]
}
```

## 📊 AWS Service Usage Patterns

### AWS Bedrock (Claude 3)

**Use Cases:**
1. **Roadmap Generation** - Analyzes user profile and generates personalized learning path
2. **Lesson Content Synthesis** - Combines multiple sources into structured lessons
3. **Viva Examination** - Conducts intelligent Q&A sessions
4. **Study Notes Generation** - Creates comprehensive notes from lessons

**Model Selection:**
- **Claude 3 Sonnet**: Primary model for complex reasoning and content generation
- **Claude 3 Haiku**: Faster, cheaper alternative for simple tasks (future optimization)

**Token Usage Estimation:**
- Roadmap Generation: ~2,000 tokens per request
- Lesson Content: ~3,000 tokens per request
- Viva Question: ~500 tokens per interaction
- Study Notes: ~2,500 tokens per request

### AWS DynamoDB

**Access Patterns:**
1. **Get User by UID** - Primary key lookup (fast)
2. **Get Roadmap by UID** - Primary key lookup (fast)
3. **Get Viva Session by ID** - Primary key lookup (fast)
4. **Update User Progress** - Update item operation
5. **List User Modules** - Query with filter

**Capacity Mode:** Pay-per-request (on-demand) for variable workload

### AWS Transcribe

**Configuration:**
- **Language**: English (US)
- **Media Format**: WAV, MP3, FLAC
- **Job Type**: Batch transcription
- **Vocabulary**: Custom vocabulary for technical terms (optional)

**Workflow:**
1. Upload audio to S3
2. Start transcription job
3. Poll for completion
4. Retrieve transcript from S3
5. Delete temporary files

### AWS Polly

**Configuration:**
- **Voice**: Joanna (Neural engine)
- **Output Format**: MP3
- **Sample Rate**: 24000 Hz
- **Text Type**: SSML (for emphasis and pauses)

**Optimization:**
- Cache common responses
- Use SSML for natural pauses
- Limit response length to reduce costs

## 🔄 Scalability Considerations

### Horizontal Scaling

**Frontend:**
- Deploy multiple EC2 instances behind Application Load Balancer
- Use Auto Scaling Group for automatic scaling
- Serve static assets from CloudFront CDN

**Backend:**
- Deploy multiple EC2 instances behind Application Load Balancer
- Use Auto Scaling Group based on CPU/memory metrics
- Implement connection pooling for DynamoDB

### Vertical Scaling

**EC2 Instance Types:**
- **Development**: t3.small (2 vCPU, 2 GB RAM)
- **Production**: t3.medium (2 vCPU, 4 GB RAM)
- **High Traffic**: c5.large (2 vCPU, 4 GB RAM, compute-optimized)

### Caching Strategy

1. **CloudFront** - Cache static assets (HTML, CSS, JS, images)
2. **ElastiCache** (optional) - Cache DynamoDB queries
3. **Application-level** - Cache Bedrock responses for common queries

## 💰 Cost Optimization

### 1. Use Reserved Instances
- Save up to 72% on EC2 costs
- Commit to 1-year or 3-year terms

### 2. Right-size Resources
- Monitor CloudWatch metrics
- Downsize underutilized instances
- Use Spot Instances for non-critical workloads

### 3. Optimize Bedrock Usage
- Cache common responses
- Use Haiku model for simple tasks
- Implement rate limiting

### 4. DynamoDB Optimization
- Use on-demand pricing for variable workload
- Enable auto-scaling for provisioned capacity
- Archive old data to S3

### 5. S3 Lifecycle Policies
- Delete audio files after 7 days
- Move old logs to Glacier after 30 days

## 🔒 Security Best Practices

1. **Use IAM Roles** - Attach roles to EC2 instances instead of hardcoding credentials
2. **Enable Encryption** - Encrypt DynamoDB tables and S3 buckets at rest
3. **Use VPC** - Deploy EC2 instances in private subnets
4. **Enable CloudTrail** - Audit all API calls
5. **Use Secrets Manager** - Store sensitive data (API keys, passwords)
6. **Enable MFA** - Require MFA for AWS Console access
7. **Regular Backups** - Enable DynamoDB point-in-time recovery

## 📈 Monitoring & Alerts

### CloudWatch Metrics

**Application Metrics:**
- API response time
- Error rate
- Request count
- Active users

**AWS Service Metrics:**
- Bedrock invocations
- DynamoDB read/write capacity
- S3 storage usage
- EC2 CPU/memory utilization

### CloudWatch Alarms

1. **High Error Rate** - Alert if error rate > 5%
2. **High Latency** - Alert if p99 latency > 2 seconds
3. **DynamoDB Throttling** - Alert if throttled requests > 10
4. **High Costs** - Alert if daily spend > $50

## 🚀 Deployment Pipeline

```
GitHub → AWS CodePipeline → AWS CodeBuild → AWS CodeDeploy → EC2
```

**Stages:**
1. **Source** - GitHub webhook triggers pipeline
2. **Build** - CodeBuild runs tests and builds artifacts
3. **Deploy** - CodeDeploy deploys to EC2 instances
4. **Verify** - Health checks and smoke tests

---

**Architecture Version**: 1.0  
**Last Updated**: 2024  
**Maintained By**: AdaptEd Team
