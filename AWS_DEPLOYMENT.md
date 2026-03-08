# AWS Deployment Guide for AdaptEd

AdaptEd is built on AWS cloud infrastructure, leveraging multiple AWS services for scalability, reliability, and performance.

## 🏗️ AWS Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     AdaptEd on AWS                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────┐      ┌──────────────┐                   │
│  │   Frontend   │      │   Backend    │                   │
│  │  (React App) │─────▶│  (FastAPI)   │                   │
│  │   on EC2     │      │   on EC2     │                   │
│  └──────────────┘      └──────┬───────┘                   │
│                               │                            │
│                               ▼                            │
│                    ┌──────────────────┐                   │
│                    │   AWS Bedrock    │                   │
│                    │   (Claude 3)     │                   │
│                    │  AI Generation   │                   │
│                    └──────────────────┘                   │
│                               │                            │
│         ┌─────────────────────┼─────────────────────┐    │
│         ▼                     ▼                     ▼    │
│  ┌─────────────┐      ┌─────────────┐      ┌──────────┐ │
│  │  DynamoDB   │      │ AWS Polly   │      │   AWS    │ │
│  │  Database   │      │    TTS      │      │Transcribe│ │
│  └─────────────┘      └─────────────┘      └──────────┘ │
│         │                                         │       │
│         └─────────────────┬───────────────────────┘       │
│                           ▼                               │
│                    ┌─────────────┐                        │
│                    │   AWS S3    │                        │
│                    │ File Storage│                        │
│                    └─────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 AWS Services Used

### 1. **AWS Bedrock (Claude 3)** - AI Content Generation
- **Purpose**: Powers all AI features (roadmap generation, lesson content, viva examinations)
- **Model**: Anthropic Claude 3 Sonnet
- **Why**: Superior reasoning, long context, and educational content generation
- **Cost**: Pay-per-token pricing (~$3 per 1M input tokens)

### 2. **AWS DynamoDB** - NoSQL Database
- **Purpose**: Stores user profiles, roadmaps, and viva sessions
- **Tables**:
  - `adapted-users` - User profiles and authentication data
  - `adapted-roadmaps` - Personalized learning paths
  - `adapted-viva-sessions` - Examination sessions and transcripts
- **Why**: Serverless, auto-scaling, low latency
- **Cost**: Pay-per-request pricing (free tier: 25 GB storage)

### 3. **AWS Transcribe** - Speech-to-Text
- **Purpose**: Converts student voice responses to text during viva examinations
- **Language**: English (US)
- **Why**: High accuracy, real-time processing
- **Cost**: $0.024 per minute of audio

### 4. **AWS Polly** - Text-to-Speech
- **Purpose**: Generates natural voice for AI interviewer during vivas
- **Voice**: Joanna (Neural engine)
- **Why**: Natural-sounding, low latency
- **Cost**: $16 per 1M characters (Neural voices)

### 5. **AWS S3** - Object Storage
- **Purpose**: Stores audio files for transcription processing
- **Bucket**: `adapted-audio-files`
- **Why**: Durable, scalable, integrates with Transcribe
- **Cost**: $0.023 per GB/month

### 6. **AWS EC2** - Compute Instances
- **Purpose**: Hosts frontend and backend applications
- **Instance Type**: t3.medium (2 vCPU, 4 GB RAM)
- **Why**: Flexible, scalable, cost-effective
- **Cost**: ~$30/month per instance

## 📋 Prerequisites

1. **AWS Account** with billing enabled
2. **AWS CLI** installed and configured
3. **IAM User** with permissions for:
   - Bedrock (model invocation)
   - DynamoDB (full access)
   - S3 (full access)
   - Transcribe (full access)
   - Polly (full access)
   - EC2 (launch instances)

## 🚀 Quick Start Deployment

### Step 1: Enable AWS Bedrock

1. Go to [AWS Bedrock Console](https://console.aws.amazon.com/bedrock/)
2. Navigate to **Model access**
3. Request access to **Anthropic Claude 3 Sonnet**
4. Wait for approval (usually instant)

### Step 2: Set Up AWS Credentials

```bash
# Configure AWS CLI
aws configure

# Enter your credentials:
# AWS Access Key ID: YOUR_ACCESS_KEY
# AWS Secret Access Key: YOUR_SECRET_KEY
# Default region: us-east-1
# Default output format: json
```

### Step 3: Create AWS Infrastructure

```bash
cd AdaptEd/backend

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env and add your AWS credentials

# Run setup script to create DynamoDB tables and S3 bucket
python aws_setup.py
```

### Step 4: Deploy Backend to EC2

```bash
# Launch EC2 instance (t3.medium recommended)
aws ec2 run-instances \
  --image-id ami-0c55b159cbfafe1f0 \
  --instance-type t3.medium \
  --key-name your-key-pair \
  --security-group-ids sg-xxxxxxxx \
  --subnet-id subnet-xxxxxxxx

# SSH into instance
ssh -i your-key.pem ec2-user@your-instance-ip

# Install dependencies
sudo yum update -y
sudo yum install python3 python3-pip git -y

# Clone repository
git clone https://github.com/your-repo/AdaptEd.git
cd AdaptEd/backend

# Install Python packages
pip3 install -r requirements.txt

# Set environment variables
export AWS_ACCESS_KEY_ID=your_key
export AWS_SECRET_ACCESS_KEY=your_secret
export AWS_REGION=us-east-1

# Run backend
python3 -m uvicorn main:app --host 0.0.0.0 --port 8001
```

### Step 5: Deploy Frontend to EC2

```bash
# Launch another EC2 instance or use the same one
cd AdaptEd/frontend

# Install Node.js
curl -sL https://rpm.nodesource.com/setup_18.x | sudo bash -
sudo yum install nodejs -y

# Install dependencies
npm install

# Build for production
npm run build

# Serve with nginx or use serve
npm install -g serve
serve -s dist -p 5173
```

## 🔐 Security Configuration

### IAM Policy for AdaptEd

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:ListFoundationModels"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "dynamodb:PutItem",
        "dynamodb:GetItem",
        "dynamodb:UpdateItem",
        "dynamodb:Query",
        "dynamodb:Scan"
      ],
      "Resource": [
        "arn:aws:dynamodb:*:*:table/adapted-users",
        "arn:aws:dynamodb:*:*:table/adapted-roadmaps",
        "arn:aws:dynamodb:*:*:table/adapted-viva-sessions"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::adapted-audio-files/*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "transcribe:StartTranscriptionJob",
        "transcribe:GetTranscriptionJob",
        "transcribe:DeleteTranscriptionJob"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "polly:SynthesizeSpeech"
      ],
      "Resource": "*"
    }
  ]
}
```

### Security Group Rules

**Backend (Port 8001)**:
- Inbound: TCP 8001 from Frontend security group
- Outbound: All traffic

**Frontend (Port 5173)**:
- Inbound: TCP 5173 from 0.0.0.0/0 (or your IP range)
- Inbound: TCP 443 (HTTPS)
- Outbound: All traffic

## 💰 Cost Estimation

### Monthly Costs (Estimated for 100 active users)

| Service | Usage | Cost |
|---------|-------|------|
| **AWS Bedrock (Claude 3)** | ~10M tokens/month | $30 |
| **DynamoDB** | 1M requests, 5 GB storage | $1.25 |
| **AWS Transcribe** | 500 minutes audio | $12 |
| **AWS Polly** | 500K characters | $8 |
| **S3** | 10 GB storage, 1K requests | $0.30 |
| **EC2 (2x t3.medium)** | 730 hours/month | $60 |
| **Data Transfer** | 50 GB out | $4.50 |
| **Total** | | **~$116/month** |

### Cost Optimization Tips

1. **Use Bedrock Haiku** for simple tasks (cheaper than Sonnet)
2. **Enable DynamoDB auto-scaling** to reduce costs during low traffic
3. **Use S3 lifecycle policies** to delete old audio files
4. **Consider Reserved Instances** for EC2 (up to 72% savings)
5. **Use CloudFront CDN** for frontend to reduce EC2 load

## 📊 Monitoring & Logging

### CloudWatch Metrics

```bash
# View Bedrock invocations
aws cloudwatch get-metric-statistics \
  --namespace AWS/Bedrock \
  --metric-name Invocations \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-31T23:59:59Z \
  --period 3600 \
  --statistics Sum

# View DynamoDB read/write capacity
aws cloudwatch get-metric-statistics \
  --namespace AWS/DynamoDB \
  --metric-name ConsumedReadCapacityUnits \
  --dimensions Name=TableName,Value=adapted-users \
  --start-time 2024-01-01T00:00:00Z \
  --end-time 2024-01-31T23:59:59Z \
  --period 3600 \
  --statistics Average
```

### Application Logs

Logs are available in CloudWatch Logs:
- `/aws/ec2/adapted-backend` - Backend application logs
- `/aws/ec2/adapted-frontend` - Frontend access logs

## 🔄 CI/CD Pipeline (Optional)

### Using AWS CodePipeline

1. **Source**: GitHub repository
2. **Build**: AWS CodeBuild
3. **Deploy**: AWS CodeDeploy to EC2

```yaml
# buildspec.yml for CodeBuild
version: 0.2
phases:
  install:
    commands:
      - pip install -r requirements.txt
  build:
    commands:
      - python -m pytest tests/
  post_build:
    commands:
      - echo "Build completed"
artifacts:
  files:
    - '**/*'
```

## 🆘 Troubleshooting

### Bedrock Access Denied
- Verify model access is enabled in Bedrock console
- Check IAM permissions for `bedrock:InvokeModel`

### DynamoDB Throttling
- Increase provisioned capacity or use on-demand mode
- Check for hot partitions

### Transcribe Job Fails
- Verify audio format (WAV, MP3, FLAC supported)
- Check S3 bucket permissions
- Ensure audio file is < 2 hours

### High Costs
- Review CloudWatch metrics for usage spikes
- Enable AWS Cost Explorer
- Set up billing alerts

## 📚 Additional Resources

- [AWS Bedrock Documentation](https://docs.aws.amazon.com/bedrock/)
- [DynamoDB Best Practices](https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/best-practices.html)
- [AWS Well-Architected Framework](https://aws.amazon.com/architecture/well-architected/)

## 🤝 Support

For AWS-specific issues:
- AWS Support (if you have a support plan)
- AWS Forums
- Stack Overflow (tag: amazon-web-services)

---

**Built with AWS** ☁️ | **Powered by Claude 3** 🤖 | **Scalable & Secure** 🔒
