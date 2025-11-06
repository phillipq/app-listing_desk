# Twilio Integration Setup

## Required Environment Variables

Add these variables to your `.env.local` file for Twilio integration:

```bash
# Twilio Main Account Credentials
TWILIO_ACCOUNT_SID=your_main_account_sid_here
TWILIO_AUTH_TOKEN=your_main_auth_token_here

# Twilio Phone Number (for main account webhooks)
TWILIO_PHONE_NUMBER=+1234567890

# Twilio Webhook URLs (update with your domain)
TWILIO_WHATSAPP_WEBHOOK_URL=https://yourdomain.com/api/webhooks/whatsapp
TWILIO_SMS_WEBHOOK_URL=https://yourdomain.com/api/webhooks/sms
TWILIO_VOICEMAIL_WEBHOOK_URL=https://yourdomain.com/api/webhooks/voicemail
TWILIO_STATUS_WEBHOOK_URL=https://yourdomain.com/api/webhooks/twilio-status

# Twilio Configuration
TWILIO_REGION=us1  # or your region (us1, us2, au1, etc.)
TWILIO_EDGE=  # leave empty for default

# Optional: Twilio Subaccount for testing (if using subaccounts)
TWILIO_SUBACCOUNT_SID=your_subaccount_sid_here
TWILIO_SUBACCOUNT_AUTH_TOKEN=your_subaccount_auth_token_here
```

## How to Get These Values

### 1. Main Account Credentials
1. Go to [Twilio Console](https://console.twilio.com/)
2. Sign in to your account
3. Go to **Account** → **API Keys & Tokens**
4. Copy your **Account SID** and **Auth Token**

### 2. Phone Number
1. Go to **Phone Numbers** → **Manage** → **Active Numbers**
2. Copy your Twilio phone number (format: +1234567890)
3. If you don't have a number, purchase one from **Phone Numbers** → **Buy a Number**

### 3. Webhook URLs
Update the webhook URLs with your actual domain:
- Replace `yourdomain.com` with your production domain
- For local development, use `ngrok` or similar tunneling service

### 4. Region and Edge
- **Region**: Usually `us1` (United States)
- **Edge**: Leave empty for default routing

## Webhook Configuration

### WhatsApp Webhook
1. Go to **Phone Numbers** → **Manage** → **Active Numbers**
2. Click on your phone number
3. In the **Messaging** section, set:
   - **Webhook URL**: `https://yourdomain.com/api/webhooks/whatsapp`
   - **HTTP Method**: `POST`

### SMS Webhook
1. In the same phone number settings
2. In the **Messaging** section, set:
   - **Webhook URL**: `https://yourdomain.com/api/webhooks/sms`
   - **HTTP Method**: `POST`

### Voicemail Webhook
1. Go to **Phone Numbers** → **Manage** → **Active Numbers**
2. Click on your phone number
3. In the **Voice** section, set:
   - **Webhook URL**: `https://yourdomain.com/api/webhooks/voicemail`
   - **HTTP Method**: `POST`

## Testing Your Setup

### 1. Test WhatsApp
```bash
# Send a test message to your Twilio number
# Check that it appears in your app's inbox
```

### 2. Test SMS
```bash
# Send an SMS to your Twilio number
# Check that it appears in your app's inbox
```

### 3. Test Voicemail
```bash
# Call your Twilio number and leave a voicemail
# Check that the transcription appears in your app
```

## Troubleshooting

### Common Issues

1. **Webhook not receiving messages**
   - Check that your webhook URLs are accessible from the internet
   - Use `ngrok` for local development
   - Verify the URLs in Twilio console

2. **Authentication errors**
   - Double-check your Account SID and Auth Token
   - Ensure there are no extra spaces or characters

3. **Phone number not working**
   - Verify the phone number format (+1234567890)
   - Check that the number is active in Twilio console

4. **Webhook returns 404**
   - Ensure your API routes are properly deployed
   - Check the webhook URL paths match your API routes

### Debug Mode

Enable debug logging by adding to your `.env.local`:
```bash
TWILIO_DEBUG=true
```

This will log all Twilio API calls and responses to help with debugging.

## Security Notes

- Never commit your `.env.local` file to version control
- Use different credentials for development and production
- Regularly rotate your Auth Token
- Use subaccounts for better organization and security
