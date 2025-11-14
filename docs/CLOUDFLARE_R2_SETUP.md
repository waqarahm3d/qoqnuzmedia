# Cloudflare R2 Setup Guide

## What is Cloudflare R2?

Cloudflare R2 is an object storage service (like AWS S3) that we'll use to store and serve music files and images. It's cost-effective and has zero egress fees.

---

## Step 1: Create a Cloudflare Account

1. Go to https://dash.cloudflare.com/sign-up
2. Sign up for a free account
3. Verify your email

---

## Step 2: Create an R2 Bucket

### Via Cloudflare Dashboard:

1. **Log in to Cloudflare Dashboard**: https://dash.cloudflare.com
2. **Navigate to R2**:
   - Click on "R2" in the left sidebar
   - If prompted, click "Enable R2"
3. **Create a bucket**:
   - Click "Create bucket"
   - **Bucket name**: `qoqnuz-media` (must be unique globally)
   - **Location**: Choose "Automatic" or select a region close to your users
   - Click "Create bucket"

---

## Step 3: Create API Tokens for Access

You need API credentials to upload and access files programmatically.

### Create R2 API Token:

1. **In the R2 dashboard**, click "Manage R2 API Tokens" (top right)
2. Click "Create API Token"
3. **Configuration**:
   - **Token name**: `qoqnuz-app-token`
   - **Permissions**:
     - ✅ Object Read & Write
   - **Bucket**: Select `qoqnuz-media` (or "All buckets")
   - **TTL**: Leave as "Forever" or set expiration
4. Click "Create API Token"

5. **IMPORTANT - Save these credentials** (you won't see them again):
   ```
   Access Key ID: <YOUR_ACCESS_KEY_ID>
   Secret Access Key: <YOUR_SECRET_ACCESS_KEY>
   ```

6. **Also note your Account ID**:
   - Found at the top of the R2 page
   - Format: `abc123def456...`

---

## Step 4: Configure Custom Domain (Optional but Recommended)

For serving files via your own domain (e.g., `cdn.qoqnuz.com`):

1. **In your R2 bucket settings**, click "Settings"
2. Click "Add custom domain"
3. **Enter domain**: `cdn.qoqnuz.com`
4. **Add DNS records** to your domain:
   - Type: `CNAME`
   - Name: `cdn`
   - Target: `<your-bucket>.r2.cloudflarestorage.com`
5. Wait for DNS propagation (5-10 minutes)

---

## Step 5: Upload Sample Music Files

We'll upload 3 sample MP3 files for testing. You can use free/royalty-free music.

### Option A: Via Cloudflare Dashboard (Easy for beginners)

1. Open your `qoqnuz-media` bucket
2. Click "Upload"
3. Create folder structure:
   - Create folder: `tracks/`
   - Inside `tracks/`, create folders for each artist
4. Upload your MP3 files

### Option B: Via Command Line (Recommended)

We'll use the AWS CLI (compatible with R2) or `rclone`.

#### Using AWS CLI:

**1. Install AWS CLI on Ubuntu:**

```bash
# Update package list
sudo apt update

# Install AWS CLI
sudo apt install awscli -y

# Verify installation
aws --version
# Expected output: aws-cli/2.x.x ...
```

**2. Configure AWS CLI for R2:**

```bash
# Configure AWS CLI
aws configure

# When prompted, enter:
# AWS Access Key ID: <YOUR_R2_ACCESS_KEY_ID>
# AWS Secret Access Key: <YOUR_R2_SECRET_ACCESS_KEY>
# Default region name: auto
# Default output format: json
```

**3. Create folder structure and upload files:**

First, let's download 3 sample royalty-free MP3 files:

```bash
# Create a local temp directory for sample files
mkdir -p ~/qoqnuz-samples

# Download sample tracks (these are placeholders - use real royalty-free music)
# Option 1: Use your own MP3 files
# Option 2: Download from free music sites like:
# - https://incompetech.com
# - https://freemusicarchive.org
# - https://soundcloud.com (with proper licensing)

# For this tutorial, we'll create placeholder files
# In production, replace these with real MP3 files

cd ~/qoqnuz-samples
```

**4. Upload to R2:**

```bash
# Set your R2 endpoint (replace ACCOUNT_ID with your actual account ID)
export R2_ENDPOINT="https://ACCOUNT_ID.r2.cloudflarestorage.com"

# Upload a file to R2
aws s3 cp ~/qoqnuz-samples/sample1.mp3 \
  s3://qoqnuz-media/tracks/luna-eclipse/aurora.mp3 \
  --endpoint-url $R2_ENDPOINT

# What this command does:
# - 'aws s3 cp' = Copy file to S3-compatible storage
# - First path = Your local file
# - Second path = Destination in R2 bucket
# - --endpoint-url = Tells AWS CLI to use R2 instead of AWS

# Expected output:
# upload: sample1.mp3 to s3://qoqnuz-media/tracks/luna-eclipse/aurora.mp3

# Upload more files
aws s3 cp ~/qoqnuz-samples/sample2.mp3 \
  s3://qoqnuz-media/tracks/crimson-waves/ocean-heart.mp3 \
  --endpoint-url $R2_ENDPOINT

aws s3 cp ~/qoqnuz-samples/sample3.mp3 \
  s3://qoqnuz-media/tracks/maya-rivers/golden.mp3 \
  --endpoint-url $R2_ENDPOINT
```

**5. Verify uploads:**

```bash
# List all files in bucket
aws s3 ls s3://qoqnuz-media/ --recursive --endpoint-url $R2_ENDPOINT

# Expected output:
# 2025-01-14 12:00:00    3456789 tracks/luna-eclipse/aurora.mp3
# 2025-01-14 12:00:01    4567890 tracks/crimson-waves/ocean-heart.mp3
# 2025-01-14 12:00:02    5678901 tracks/maya-rivers/golden.mp3
```

---

## Step 6: Set Bucket CORS Policy (Important!)

To allow your web app to access the files, you need to set CORS headers.

**Create a CORS policy file:**

```bash
# Create CORS configuration file
cat > ~/cors-policy.json << 'EOF'
{
  "CORSRules": [
    {
      "AllowedOrigins": ["https://app.qoqnuz.com", "http://localhost:3000"],
      "AllowedMethods": ["GET", "HEAD"],
      "AllowedHeaders": ["*"],
      "ExposeHeaders": ["ETag"],
      "MaxAgeSeconds": 3600
    }
  ]
}
EOF
```

**Apply CORS policy:**

```bash
aws s3api put-bucket-cors \
  --bucket qoqnuz-media \
  --cors-configuration file://~/cors-policy.json \
  --endpoint-url $R2_ENDPOINT

# What this does:
# - Allows your domain to fetch files from R2
# - Permits GET and HEAD requests (for streaming)
# - Sets cache time to 1 hour
```

---

## Step 7: Environment Variables

Save your R2 credentials in your environment variables (we'll use these in the Next.js app):

**Create `.env.local` file** (we'll do this in the Next.js setup):

```bash
# Cloudflare R2 Configuration
R2_ACCOUNT_ID=your_account_id_here
R2_ACCESS_KEY_ID=your_access_key_here
R2_SECRET_ACCESS_KEY=your_secret_key_here
R2_BUCKET_NAME=qoqnuz-media
R2_PUBLIC_URL=https://your-account-id.r2.cloudflarestorage.com/qoqnuz-media
```

---

## Step 8: Generate Signed URLs (Security)

For security, we don't want to expose music files publicly. Instead, we'll generate **signed URLs** that expire after a short time.

This will be implemented in the Next.js API routes (see next section).

---

## Troubleshooting

### Error: "The specified bucket does not exist"
- Check bucket name spelling
- Verify you're using the correct endpoint URL

### Error: "Access Denied"
- Verify API token has correct permissions
- Check that access keys are correctly configured

### CORS Errors in Browser
- Ensure CORS policy is applied to bucket
- Check that your domain is in the AllowedOrigins list

### Upload Fails
- Check file size (R2 supports up to 5TB per object)
- Verify internet connection
- Ensure AWS CLI is properly configured

---

## Quick Reference Commands

```bash
# List files in bucket
aws s3 ls s3://qoqnuz-media/ --recursive --endpoint-url $R2_ENDPOINT

# Upload file
aws s3 cp local-file.mp3 s3://qoqnuz-media/path/to/file.mp3 --endpoint-url $R2_ENDPOINT

# Download file
aws s3 cp s3://qoqnuz-media/path/to/file.mp3 local-file.mp3 --endpoint-url $R2_ENDPOINT

# Delete file
aws s3 rm s3://qoqnuz-media/path/to/file.mp3 --endpoint-url $R2_ENDPOINT

# Sync entire folder
aws s3 sync ./local-folder/ s3://qoqnuz-media/remote-folder/ --endpoint-url $R2_ENDPOINT
```

---

## Next Steps

- ✅ R2 bucket created
- ✅ API tokens generated
- ✅ Sample files uploaded
- ✅ CORS configured

**Now proceed to**: Next.js app setup to create the streaming API!

---

## Cost Estimate

R2 Pricing (as of 2025):
- **Storage**: $0.015 per GB/month
- **Class A Operations** (writes): $4.50 per million
- **Class B Operations** (reads): $0.36 per million
- **Egress**: **FREE** (this is the big advantage!)

**Example**: 10,000 songs × 5MB average = 50GB storage = ~$0.75/month

Much cheaper than traditional CDNs! 💰
