# Subscription Plans Setup Guide

## Overview
The application now supports 4 subscription plans organized by user type:

### Realtor Plans
1. **Realtor Pro** - $199.99/month
   - Stripe Price ID: `STRIPE_REL_PRO`
   - Includes: Property management, location insights, showing tours, AI lead generation

2. **Realtor Pro + Communications** - $249.00/month
   - Stripe Price ID: `STRIPE_REL_PRO_COMM`
   - Includes: Everything in Realtor Pro + Social Media Hub + Communication Hub

### Business Plans
3. **Business Pro** - $99.99/month
   - Stripe Price ID: `STRIPE_BUS_PRO`
   - Includes: Customer management, service management, appointment scheduling, AI chatbot

4. **Business Pro + Communications** - $149.99/month
   - Stripe Price ID: `STRIPE_BUS_PRO_COMM`
   - Includes: Everything in Business Pro + Social Media Hub + Communication Hub

---

## Environment Variables Required

Add these to your `.env` file:

```env
STRIPE_REL_PRO=price_xxxxx
STRIPE_REL_PRO_COMM=price_xxxxx
STRIPE_BUS_PRO=price_xxxxx
STRIPE_BUS_PRO_COMM=price_xxxxx
```

---

## Database Setup Required

### Create Package Records

You need to create Package records in your database with the following slugs:

```sql
-- Realtor Pro
INSERT INTO "Package" (id, name, slug, type, "isActive", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'Realtor Pro',
  'realtor_pro',
  'base',
  true,
  NOW(),
  NOW()
);

-- Realtor Pro + Communications
INSERT INTO "Package" (id, name, slug, type, "isActive", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'Realtor Pro + Communications',
  'realtor_pro_comm',
  'base',
  true,
  NOW(),
  NOW()
);

-- Business Pro
INSERT INTO "Package" (id, name, slug, type, "isActive", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'Business Pro',
  'business_pro',
  'base',
  true,
  NOW(),
  NOW()
);

-- Business Pro + Communications
INSERT INTO "Package" (id, name, slug, type, "isActive", "createdAt", "updatedAt")
VALUES (
  gen_random_uuid(),
  'Business Pro + Communications',
  'business_pro_comm',
  'base',
  true,
  NOW(),
  NOW()
);
```

**Important**: The package `slug` must match the plan key exactly:
- `realtor_pro`
- `realtor_pro_comm`
- `business_pro`
- `business_pro_comm`

---

## How It Works

### 1. User Selects Plan
- User goes to `/pricing` page
- Sees 4 plans organized by category (Realtor vs Business)
- Clicks "Start Trial" or "Continue to Sign Up"

### 2. Signup Flow
- If not logged in: Redirects to `/auth/signup?plan=realtor_pro_comm`
- User fills out signup form
- Plan is pre-selected from URL
- After registration, user is auto-logged in
- Immediately redirected to Stripe checkout

### 3. Stripe Checkout
- Checkout session created with selected plan's Stripe Price ID
- 7-day free trial for new users
- Plan type stored in metadata

### 4. Webhook Processing
- When checkout completes, webhook receives event
- Finds Package record by slug matching plan key
- Creates Subscription record linking user to package
- Updates user's subscription status

### 5. Feature Access
- Sidebar checks user's subscription plan
- Communication Hub and Social Media Hub only shown if plan includes communications
- User type (realtor vs business) determined from plan

---

## Navigation Visibility

### Always Visible (All Plans)
- Dashboard
- Leads
- Analytics
- Setup Center

### Realtor Tools (Realtor Plans Only)
- Properties
- Location Insights
- Showing Tours
- Context

### Business Tools (Business Plans Only)
- Customers
- Scheduling
- Services
- Context

### Communications Features (Comm Plans Only)
- Communication Hub
- Social Media Hub

---

## Testing Checklist

- [ ] All 4 Stripe Price IDs are set in `.env`
- [ ] Package records created in database with correct slugs
- [ ] Pricing page shows 4 plans correctly
- [ ] Signup flow works with plan parameter
- [ ] Stripe checkout initiates correctly
- [ ] Webhook creates subscription record
- [ ] Sidebar shows correct tools based on plan
- [ ] Communication links only show for comm plans
- [ ] User type correctly determined from plan

---

## Troubleshooting

### Communication links not showing
- Check that user has active subscription with `realtor_pro_comm` or `business_pro_comm`
- Verify Package record exists with matching slug
- Check `hasCommunicationsAccess()` function in `lib/subscription-access.ts`

### Wrong user type
- Verify Package slug matches plan key exactly
- Check `getUserTypeFromPlan()` function
- Ensure subscription was created correctly via webhook

### Plan not found in checkout
- Verify Stripe Price ID is correct in `.env`
- Check that plan key exists in `subscriptionPlans` object
- Ensure Price ID matches the one in Stripe dashboard

