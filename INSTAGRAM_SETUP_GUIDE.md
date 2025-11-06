# Instagram Business Account Integration - Setup Guide

## Overview

This guide walks you through setting up Instagram Business account integration for your app. The integration allows users to connect their Instagram Business accounts via Facebook's OAuth system to enable direct messaging (DMs) through the app.

## Prerequisites

1. **Instagram Business Account** (not personal account)
   - Must be converted to Business account
   - Must be connected to a Facebook Page
   - If no Facebook Page exists, create one (free)
   - Link your Instagram Business account to that Facebook Page

2. **Facebook Developer Account**
   - Go to https://developers.facebook.com/
   - Sign in with your Facebook account
   - Complete the developer account verification (if required)

## Step-by-Step Setup

### Step 1: Create a Facebook App

1. Go to https://developers.facebook.com/apps/
2. Click **"Create App"** button
3. Select **"Business"** as the app type
4. Click **"Next"**
5. Fill in app details:
   - **App Name**: Your app name (e.g., "Realtor Communication Platform")
   - **App Contact Email**: Your email
   - **Business Account**: Select or create a business account
6. Click **"Create App"**

### Step 2: Add Instagram Product

1. In your Facebook App dashboard, go to **"Add Products"**
2. Find **"Instagram"** and click **"Set Up"**
3. Select **"Instagram Messaging"** or **"Instagram Graph API"**
4. Follow the setup wizard

### Step 3: Configure Instagram Basic Display

1. In your Facebook App dashboard, navigate to **"Settings" > "Basic"**
2. Note your **App ID** and **App Secret** (you'll need these for environment variables)
3. Add **App Domains**: Your domain (e.g., `yourdomain.com`)
4. Click **"Add Platform"** if needed and select **"Website"**
5. Add **Site URL**: Your production URL (e.g., `https://yourdomain.com`)

### Step 4: Configure OAuth Redirect URIs

1. In your Facebook App dashboard, go to **"Facebook Login" > "Settings"**
   - Or find **"Instagram Basic Display"** > **"Settings"** (if using Basic Display)
2. Add **Valid OAuth Redirect URIs**:
   ```
   https://yourdomain.com/api/integrations/instagram/callback
   http://localhost:3014/api/integrations/instagram/callback  (for local development)
   ```
3. Save changes

### Step 5: Request Required Permissions

In your app settings, ensure you request these permissions:
- `instagram_manage_messages` - To send and receive Instagram DMs
- `pages_manage_metadata` - To manage Facebook Page metadata
- `pages_show_list` - To list user's Facebook Pages
- `pages_messaging` - To send messages via Pages API

### Step 6: Configure Environment Variables

Add these to your `.env` file:

```env
# Meta/Facebook/Instagram App Configuration
META_APP_ID="your-facebook-app-id-here"
META_APP_SECRET="your-facebook-app-secret-here"

# Instagram Webhook Verification (optional but recommended)
INSTAGRAM_VERIFY_TOKEN="your-random-verification-token-here"

# Your app URL (should already exist)
NEXTAUTH_URL="http://localhost:3014"  # For local dev
# NEXTAUTH_URL="https://yourdomain.com"  # For production
```

### Step 7: Set App to Live Mode (Optional for Testing)

1. In Facebook App dashboard, go to **"Settings" > "Basic"**
2. Scroll to **"App Review"**
3. For development/testing:
   - Keep app in **"Development"** mode
   - Add test users in **"Roles" > "Test Users"**
4. For production:
   - Submit for **"App Review"** when ready
   - Request the required permissions mentioned in Step 5
   - Wait for Meta approval (can take 1-7 days)

**Note**: In Development mode, only test users added to your app can connect Instagram.

### Step 8: Configure Webhooks (Optional but Recommended)

For receiving Instagram messages via webhooks:

1. Go to **"Instagram"** product in your app dashboard
2. Navigate to **"Webhooks"**
3. Click **"Add Callback URL"**
4. Enter:
   - **Callback URL**: `https://yourdomain.com/api/webhooks/instagram`
   - **Verify Token**: Same value as `INSTAGRAM_VERIFY_TOKEN` in your `.env`
5. Subscribe to these events:
   - `messages` - For incoming messages
   - `messaging_postbacks` - For postback events
   - `messaging_referrals` - For referral links

## Testing the Integration

### For Development/Testing:

1. **Add Test Users**:
   - In Facebook App dashboard: **"Roles" > "Test Users"**
   - Click **"Add Test Users"**
   - Log in as test user and accept the app

2. **Test Instagram Connection**:
   - Log in to your app as a test user
   - Go to **Communication Channels** or **Setup** page
   - Click **"Connect Instagram"**
   - Should redirect to Facebook OAuth
   - Authorize the app
   - Should redirect back and show Instagram as connected

### For Production:

1. Ensure app is in **"Live"** mode
2. Ensure **App Review** is approved for required permissions
3. Users can now connect their Instagram Business accounts

## Common Issues & Solutions

### Issue: "Instagram integration not configured"
**Solution**: Ensure `META_APP_ID` is set in your `.env` file

### Issue: "redirect_uri_mismatch"
**Solution**: 
- Check that your redirect URI in Facebook App settings matches exactly
- Include both `http://localhost:3014` (dev) and your production URL
- Ensure no trailing slashes

### Issue: "No Instagram account found"
**Solution**:
- User's Instagram must be a Business account
- Instagram must be connected to a Facebook Page
- User must be an admin of that Facebook Page

### Issue: "Invalid OAuth access token"
**Solution**:
- Tokens expire after 60 days
- App implements token refresh automatically
- If issues persist, user may need to reconnect

### Issue: "Permissions not approved"
**Solution**:
- In Development mode: Only works for test users
- In Production: Must complete App Review for each permission
- Check **"App Review" > "Permissions and Features"** status

## Required User Setup (End Users)

Users connecting Instagram need:
1. ✅ Instagram Business account (not personal)
2. ✅ Instagram connected to a Facebook Page
3. ✅ Admin access to that Facebook Page
4. ✅ Facebook account linked to their Instagram

## Environment Variables Summary

```env
# Required
META_APP_ID="your-app-id"
META_APP_SECRET="your-app-secret"
NEXTAUTH_URL="your-app-url"

# Optional but recommended
INSTAGRAM_VERIFY_TOKEN="random-secret-token-for-webhooks"
```

## Next Steps After Setup

1. ✅ Test the connection flow end-to-end
2. ✅ Verify webhooks are receiving messages (if configured)
3. ✅ Test sending messages via the app
4. ✅ Test receiving messages via webhooks
5. ✅ Submit for App Review if going to production

## Support Resources

- **Facebook Developer Docs**: https://developers.facebook.com/docs/instagram-api/
- **Instagram Graph API**: https://developers.facebook.com/docs/instagram-api/
- **OAuth Troubleshooting**: https://developers.facebook.com/docs/facebook-login/guides/

## Security Notes

⚠️ **Important**:
- Never commit `.env` file to version control
- Keep `META_APP_SECRET` secure
- Use different apps for development and production
- Regularly rotate `INSTAGRAM_VERIFY_TOKEN`
- Monitor app usage in Facebook App dashboard

