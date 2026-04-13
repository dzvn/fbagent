# Facebook Messenger Setup Guide

## Step 1: Create Facebook App

1. Go to https://developers.facebook.com
2. Click "Create App" → Select "Other" → "Business"
3. Fill in app name: `FB Agent`
4. Complete security check

## Step 2: Add Messenger Product

1. In app dashboard, click "Add Product" → "Messenger"
2. Click "Set Up" next to Messenger

## Step 3: Configure Webhook

1. In Messenger settings, find "Webhooks" section
2. Click "Add Callback URL"
3. Enter:
   - **Callback URL:** `https://your-domain.com/webhook`
   - **Verify Token:** `fbagent_verify_2026` (or set in .env)
4. Click "Verify and Save"

## Step 4: Subscribe to Events

1. After webhook is verified, subscribe to these events:
   - ✅ `messages`
   - ✅ `messaging_postbacks`
   - ✅ `messaging_optins`

## Step 5: Get Page Access Token

1. Go to Messenger → Settings → Access Tokens
2. Generate token for your page
3. Copy and save to `.env`:
   ```
   FB_PAGE_ACCESS_TOKEN=your_token_here
   ```

## Step 6: Test Webhook

```bash
# Test verification
curl "http://localhost:9001/webhook?hub.mode=subscribe&hub.verify_token=fbagent_verify_2026&hub.challenge=test123"

# Should return: test123
```

## Step 7: Ngrok for Local Testing

For local development without public URL:

```bash
# Install ngrok
npm install -g ngrok

# Start tunnel
ngrok http 9001

# Use the ngrok URL as webhook:
# https://xxxx.ngrok.io/webhook
```

## Troubleshooting

### Webhook verification failed
- Check verify token matches in .env
- Ensure callback URL is publicly accessible

### Not receiving messages
- Verify page subscription is active
- Check page access token has correct permissions
- Ensure webhook URL uses HTTPS

### 403 Forbidden
- Page access token may be expired
- Regenerate token in Facebook Developer Console
