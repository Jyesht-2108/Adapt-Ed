# AWS Quick Start Guide for AdaptEd

## ⚡ 5-Minute Setup

### Prerequisites
- AWS Account
- AWS CLI installed
- Python 3.8+
- Node.js 18+

### Step 1: Configure AWS CLI (2 minutes)
```bash
aws configure
# Enter:
# - AWS Access Key ID
# - AWS Secret Access Key
# - Default region: us-east-1
# - Default output: json
```

### Step 2: Enable AWS Bedrock (1 minute)
1. Go to https://console.aws.amazon.com/bedrock/
2. Click "Model access" in left sidebar
3. Click "Request model access"
4. Select "Anthropic Claude 3 Sonnet"
5. Click "Request model access" button
6. Wait for approval (usually instant)

### Step 3: Setup Backend (2 minutes)
```bash
cd AdaptEd/backend
pip install -r requirements.txt
cp .env.example .env

# Edit .env and add:
# AWS_ACCESS_KEY_ID=your_key
# AWS_SECRET_ACCESS_KEY=your_secret
# AWS_REGION=us-east-1

# Create AWS infrastructure
python aws_setup.py

# Start backend
python -m uvicorn main:app --reload --port 8001
```

### Step 4: Setup Frontend (1 minute)
```bash
cd AdaptEd/frontend
npm install
cp .env.example .env
# Edit .env and add Firebase credentials
npm run dev
```

### Done! 🎉
- Frontend: http://localhost:5173
- Backend: http://localhost:8001
- API Docs: http://localhost:8001/docs

---

## 🔑 Required AWS Permissions

Your IAM user needs these permissions:
- `bedrock:InvokeModel`
- `dynamodb:*` (for adapted-* tables)
- `s3:*` (for adapted-audio-files bucket)
- `transcribe:*`
- `polly:SynthesizeSpeech`

---

## 💰 Cost Alert Setup

Set up billing alerts to avoid surprises:

```bash
# Create SNS topic for alerts
aws sns create-topic --name billing-alerts

# Subscribe your email
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:YOUR_ACCOUNT_ID:billing-alerts \
  --protocol email \
  --notification-endpoint your-email@example.com

# Create CloudWatch alarm for $50/day
aws cloudwatch put-metric-alarm \
  --alarm-name daily-billing-alert \
  --alarm-description "Alert when daily costs exceed $50" \
  --metric-name EstimatedCharges \
  --namespace AWS/Billing \
  --statistic Maximum \
  --period 86400 \
  --evaluation-periods 1 \
  --threshold 50 \
  --comparison-operator GreaterThanThreshold \
  --alarm-actions arn:aws:sns:us-east-1:YOUR_ACCOUNT_ID:billing-alerts
```

---

## 🧪 Test Your Setup

```bash
# Test AWS credentials
aws sts get-caller-identity

# Test Bedrock access
aws bedrock list-foundation-models --region us-east-1

# Test DynamoDB tables
aws dynamodb list-tables --region us-east-1

# Test S3 bucket
aws s3 ls s3://adapted-audio-files

# Test backend health
curl http://localhost:8001/health
```

---

## 🐛 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| "Credentials not found" | Run `aws configure` |
| "Bedrock access denied" | Enable model access in AWS Console |
| "Table not found" | Run `python aws_setup.py` |
| "Bucket not found" | Run `python aws_setup.py` |
| "High costs" | Check CloudWatch metrics, enable billing alerts |

---

## 📚 Next Steps

1. Read [AWS_DEPLOYMENT.md](AWS_DEPLOYMENT.md) for production deployment
2. Read [AWS_ARCHITECTURE.md](AWS_ARCHITECTURE.md) for architecture details
3. Set up CloudWatch monitoring
4. Configure auto-scaling
5. Set up CI/CD pipeline

---

**Need Help?** Check [AWS_MIGRATION_COMPLETE.md](AWS_MIGRATION_COMPLETE.md) for detailed migration info.
