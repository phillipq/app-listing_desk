# 💳 Stripe Integration Setup Guide

This guide will help you set up Stripe subscriptions with 7-day free trials for your application.

## 📋 Prerequisites

- A Stripe account ([sign up here](https://stripe.com))
- Access to your Stripe Dashboard
- Your application deployed or running locally with webhook endpoint accessible

## 🚀 Step-by-Step Setup

### Step 1: Get Your Stripe API Keys

1. Log in to your [Stripe Dashboard](https://dashboard.stripe.com)
2. Go to **Developers** → **API keys**
3. Copy your keys:
   - **Publishable key** (starts with `pk_test_` or `pk_live_`)
   - **Secret key** (starts with `sk_test_` or `sk_live_`)

   ⚠️ **Important**: Use test keys (`pk_test_` and `sk_test_`) for development, and live keys (`pk_live_` and `sk_live_`) for production.

4. Add these to your `.env` file:
   ```env
   STRIPE_SECRET_KEY=sk_test_your_secret_key_here
   STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
   ```

### Step 2: Create Products and Prices in Stripe

You need to create 3 products corresponding to your subscription plans:

#### Product 1: Starter Plan ($29/month)

1. Go to **Products** in Stripe Dashboard
2. Click **"Add product"**
3. Fill in:
   - **Name**: `Starter Plan`
   - **Description**: `50 leads per month, Basic analytics, Email support, Standard chatbot`
4. Click **"Add price"**
5. Configure price:
   - **Price**: `$29.00`
   - **Billing period**: `Monthly (recurring)`
   - **Currency**: `USD`
6. Click **"Save product"**
7. **Copy the Price ID** (starts with `price_`) - you'll need this!

#### Product 2: Professional Plan ($79/month)

1. Repeat steps above with:
   - **Name**: `Professional Plan`
   - **Description**: `200 leads per month, Advanced analytics, Priority support, Custom branding, CRM integration`
   - **Price**: `$79.00`
   - **Billing period**: `Monthly (recurring)`
2. **Copy the Price ID**

#### Product 3: Enterprise Plan ($199/month)

1. Repeat steps above with:
   - **Name**: `Enterprise Plan`
   - **Description**: `Unlimited leads, Full analytics suite, Dedicated support, White-label options, API access, Custom integrations`
   - **Price**: `$199.00`
   - **Billing period**: `Monthly (recurring)`
2. **Copy the Price ID**

### Step 3: Configure Price IDs in Your Application

Add the Price IDs to your `.env` file:

```env
STRIPE_STARTER_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_PROFESSIONAL_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_ENTERPRISE_PRICE_ID=price_xxxxxxxxxxxxx
```

**Note**: The code will use these environment variables. Make sure they match the Price IDs you copied from Stripe.

### Step 4: Set Up Webhooks

Webhooks are crucial for keeping your database in sync with Stripe subscriptions.

#### For Local Development (using Stripe CLI):

1. Install Stripe CLI:
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe
   
   # Windows (using Scoop)
   scoop install stripe
   
   # Linux
   # Download from https://github.com/stripe/stripe-cli/releases
   ```

2. Login to Stripe CLI:
   ```bash
   stripe login
   ```

3. Forward webhooks to your local server:
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

4. Copy the webhook signing secret (starts with `whsec_`) that appears
5. Add to your `.env`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   ```

#### For Production:

1. Go to **Developers** → **Webhooks** in Stripe Dashboard
2. Click **"Add endpoint"**
3. Enter your webhook URL:
   ```
   https://yourdomain.com/api/stripe/webhook
   ```
4. Select events to listen to:
   - ✅ `checkout.session.completed`
   - ✅ `customer.subscription.created`
   - ✅ `customer.subscription.updated`
   - ✅ `customer.subscription.deleted`
   - ✅ `invoice.payment_succeeded`
   - ✅ `invoice.payment_failed`
5. Click **"Add endpoint"**
6. Copy the **Signing secret** (starts with `whsec_`)
7. Add to your production `.env`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_your_production_webhook_secret_here
   ```

### Step 5: Enable Trial Periods in Stripe

The code automatically adds a 7-day trial when creating subscriptions for new users. However, you need to ensure trials are enabled in Stripe:

1. Go to **Settings** → **Billing** in Stripe Dashboard
2. Under **"Trials"**, ensure **"Allow free trials"** is enabled
3. This is usually enabled by default

### Step 6: Test Your Integration

#### Test Mode Setup:

1. Make sure you're using **test mode** in Stripe Dashboard (toggle in top right)
2. Use Stripe test card numbers:
   - **Success**: `4242 4242 4242 4242`
   - **Decline**: `4000 0000 0000 0002`
   - Use any future expiry date and any 3-digit CVC
3. Test the flow:
   - Sign up for a new account
   - Select a plan on the pricing page
   - Complete checkout with test card
   - Verify subscription is created with trial status
   - Check webhook events in Stripe Dashboard

#### Verify Trial Period:

1. After checkout, go to **Customers** in Stripe Dashboard
2. Find the test customer
3. Click on their subscription
4. Verify:
   - Status shows **"Trialing"**
   - **Trial end date** is 7 days from today
   - **Billing cycle** shows the trial period

### Step 7: Package Setup in Database

Ensure your packages exist in the database with matching slugs:

- Package slug: `starter` → Stripe plan: `starter`
- Package slug: `professional` → Stripe plan: `professional`
- Package slug: `enterprise` → Stripe plan: `enterprise`

You can create these via your admin panel or seed script.

## 🔄 Subscription Flow

### New User Signup Flow:

1. User signs up → Account created with `subscriptionStatus: 'trial'`
2. User redirected to `/pricing` page
3. User selects a plan → Redirected to Stripe Checkout
4. User enters payment info → Stripe creates subscription with 7-day trial
5. Webhook `checkout.session.completed` → Subscription record created with status `trialing`
6. After 7 days → Stripe charges the card automatically
7. Webhook `invoice.payment_succeeded` → Status updated to `active`

### Trial Period Behavior:

- **During trial**: User has full access to selected plan features
- **Trial end**: Stripe automatically charges the card
- **If payment fails**: Subscription status becomes `past_due` or `unpaid`
- **User can cancel**: Anytime during trial (no charge) or after (cancels at period end)

## 🛠️ Troubleshooting

### Webhooks Not Working:

1. **Check webhook URL**: Must be publicly accessible (use ngrok for local testing)
2. **Verify signing secret**: Must match the one from Stripe Dashboard
3. **Check webhook logs**: Go to **Developers** → **Webhooks** → Click your endpoint → View logs
4. **Test webhook**: Use Stripe CLI or send test events from Dashboard

### Subscription Not Creating:

1. **Check Price IDs**: Verify they're correct in `.env` and match Stripe
2. **Check API keys**: Ensure you're using test keys in test mode
3. **Check console logs**: Look for errors in your application logs
4. **Verify package exists**: The package must exist in database with matching slug

### Trial Not Applied:

1. **Check user status**: User must have `subscriptionStatus: 'trial'` or `'inactive'`
2. **Verify Stripe settings**: Trials must be enabled in Stripe Dashboard
3. **Check subscription creation**: Look at `subscription_data.trial_period_days` in checkout session

## 📝 Environment Variables Summary

Add all these to your `.env` file:

```env
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx

# Stripe Price IDs
STRIPE_STARTER_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_PROFESSIONAL_PRICE_ID=price_xxxxxxxxxxxxx
STRIPE_ENTERPRISE_PRICE_ID=price_xxxxxxxxxxxxx

# Your application URL (for redirects)
NEXTAUTH_URL=http://localhost:3000
```

## 🚀 Going Live

When ready for production:

1. Switch to **Live mode** in Stripe Dashboard
2. Get your **live API keys** (replace `test` with `live`)
3. Update `.env` with live keys
4. Create webhook endpoint in **live mode**
5. Update `NEXTAUTH_URL` to your production domain
6. Test with a real card (use a small amount first!)

## 📚 Additional Resources

- [Stripe Subscriptions Documentation](https://stripe.com/docs/billing/subscriptions/overview)
- [Stripe Trials Guide](https://stripe.com/docs/billing/subscriptions/trials)
- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe Testing Guide](https://stripe.com/docs/testing)

## ✅ Checklist

Before going live, ensure:

- [ ] All Price IDs are configured correctly
- [ ] Webhook endpoint is set up and tested
- [ ] Webhook signing secret is secure
- [ ] Trial periods are working correctly
- [ ] Subscription status updates correctly
- [ ] Payment failures are handled
- [ ] Cancellations work properly
- [ ] Tested with real cards (small amounts)

---

**Need Help?** Check the Stripe Dashboard logs or your application logs for detailed error messages.

