# Signup Flow Options & Recommendation

## Current Issues
1. User signs up → Account created but **not logged in** → Redirected to pricing
2. User clicks plan → Not authenticated → Redirected back to signup (loop!)
3. All users become 'realtor' type regardless of plan selection

## Recommended Flow: **Product-First with Auto-Login**

### Flow Steps:
1. **Landing Page** → User clicks "Get Started" → Goes to `/pricing?signup=true`
2. **Pricing Page** → User selects a plan → Redirects to `/auth/signup?plan=starter` (or professional/enterprise)
3. **Signup Page** → User fills form (plan is pre-selected from URL) → Account created
4. **Auto-Login** → User automatically logged in after registration
5. **Stripe Checkout** → Immediately initiate Stripe checkout with selected plan
6. **Payment** → User completes payment on Stripe
7. **Success** → Redirected to `/dashboard?success=true`

### Benefits:
- ✅ User knows what they're buying upfront
- ✅ Clear value proposition before signup
- ✅ Plan selection drives the entire flow
- ✅ No redirect loops
- ✅ Seamless experience
- ✅ Plan type can be stored during registration

---

## Alternative Option 1: Account-First with Plan Selection

### Flow Steps:
1. **Landing Page** → User clicks "Get Started" → Goes to `/auth/signup`
2. **Signup Page** → User fills form → Account created → **Auto-login**
3. **Pricing Page** → User redirected to `/pricing?newSignup=true` → Selects plan
4. **Stripe Checkout** → Checkout initiated → Payment completed
5. **Dashboard** → User redirected to dashboard

### Benefits:
- ✅ Simple flow
- ✅ User can explore before committing to plan
- ✅ Account exists even if they don't select plan immediately

### Drawbacks:
- ❌ User doesn't know pricing upfront
- ❌ May create accounts without subscriptions

---

## Alternative Option 2: Combined Single-Page Experience

### Flow Steps:
1. **Landing Page** → User clicks "Get Started" → Goes to `/pricing`
2. **Pricing Page** → User selects plan → **Modal/Expandable form appears**
3. **Inline Signup** → User fills form in modal → Account created → Auto-login
4. **Stripe Checkout** → Checkout initiated immediately
5. **Dashboard** → After payment, redirected to dashboard

### Benefits:
- ✅ Single page experience
- ✅ No page navigation
- ✅ Very smooth UX

### Drawbacks:
- ❌ More complex UI
- ❌ Harder to handle errors
- ❌ Less mobile-friendly

---

## Implementation Details for Recommended Flow

### 1. Update Landing Page Links
- Change "Get Started" → `/pricing?signup=true` (instead of `/auth/signup`)

### 2. Update Pricing Page
- Check for `?signup=true` query param
- If present, show "Create Account" button instead of "Start Trial"
- Pass selected plan to signup: `/auth/signup?plan=professional`

### 3. Update Signup Page
- Read `plan` from URL query params
- Show selected plan badge/indicator
- After registration:
  - Auto-login using `signIn('credentials', ...)`
  - Immediately call `/api/stripe/checkout` with plan
  - Redirect to Stripe checkout URL

### 4. Update Registration API
- Accept optional `plan` parameter
- Store plan preference (can be used later for user type determination)
- Return success with realtor data

### 5. Handle User Types
- Need to determine if user is "realtor" or "business_owner" based on plan
- Or create separate signup flows for each
- Or add "userType" field to registration

---

## User Type Determination

### Option A: Plan-Based
- Starter/Professional/Enterprise → Realtor tools
- Business plans → Business tools
- All-in-One → Both tools

### Option B: Explicit Selection
- Add "I am a..." radio buttons on signup:
  - Real Estate Professional
  - Business Owner
  - Both

### Option C: Separate Signup Pages
- `/auth/signup/realtor` → Realtor signup
- `/auth/signup/business` → Business signup
- Pricing page has separate CTAs

---

## Recommended: Plan-Based with Explicit Selection

**Best approach**: Combine plan selection with user type selection

1. Pricing page shows two sections:
   - "For Real Estate Professionals" (Starter, Professional, Enterprise)
   - "For Business Owners" (Business plans)
   - "All-in-One" (if applicable)

2. User selects plan → Plan determines user type automatically

3. Signup form shows:
   - Selected plan badge
   - User type indicator ("You're signing up as a Real Estate Professional")

4. Registration stores:
   - Plan preference
   - User type (derived from plan)

---

## Next Steps

1. **Implement auto-login after registration**
2. **Update pricing page to handle signup flow**
3. **Update signup page to accept plan parameter**
4. **Immediately initiate Stripe checkout after signup**
5. **Determine user type based on plan selection**
6. **Update sidebar to show correct tools based on user type**

