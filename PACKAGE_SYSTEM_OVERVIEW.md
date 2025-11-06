# Package System Overview - App Monetization

## Package Structure

### Base Packages
1. **Real Estate** (`real_estate`) - $49.99/month
   - Property management
   - Showing tours
   - Customer management
   - Real estate specific features

2. **Business** (`business`) - $49.99/month
   - General business features
   - Customer management (generic)
   - Service management
   - Business-specific features

### Addon Packages
3. **Communications** (`communications`) - Addon Bundle - $99.99/month
   - WhatsApp integration
   - Instagram integration
   - Social Media Hub
   - Messaging features
   - Can be added to either base package

## Package Combinations

| User Type | Base Package | Addons | Total Access |
|-----------|--------------|--------|--------------|
| Realtor | Real Estate | None | Real Estate features only |
| Realtor Pro | Real Estate | Communications | Real Estate + Communications |
| Business | Business | None | Business features only |
| Business Pro | Business | Communications | Business + Communications |

## Database Schema

### New Tables Needed

```prisma
model Package {
  id          String   @id @default(cuid())
  name        String   // "Real Estate", "Business", "Communications"
  slug        String   @unique // "real_estate", "business", "communications"
  type        String   // "base" or "addon"
  description String?
  features    String[] // List of feature IDs/names
  price       Decimal? // Monthly price (null for addons, priced separately)
  stripePriceId String? @unique // Stripe Price ID
  isActive    Boolean  @default(true)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  subscriptions Subscription[]
  userPackages   UserPackage[]
}

model UserPackage {
  id          String   @id @default(cuid())
  userId      String
  packageId   String
  package     Package   @relation(fields: [packageId], references: [id])
  user        Realtor   @relation(fields: [userId], references: [id], onDelete: Cascade)
  status      String   // "active", "cancelled", "expired"
  startsAt    DateTime  @default(now())
  expiresAt   DateTime?
  stripeSubscriptionId String? // Link to Stripe subscription
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  @@unique([userId, packageId])
  @@index([userId])
}

model Subscription {
  id          String   @id @default(cuid())
  userId      String
  packageId   String
  package     Package   @relation(fields: [packageId], references: [id])
  user        Realtor   @relation(fields: [userId], references: [id], onDelete: Cascade)
  stripeSubscriptionId String @unique // Stripe subscription ID
  stripeCustomerId    String // Stripe customer ID
  status      String   // "active", "cancelled", "past_due", "unpaid"
  currentPeriodStart   DateTime
  currentPeriodEnd     DateTime
  cancelAtPeriodEnd   Boolean @default(false)
  cancelledAt         DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  @@index([userId])
  @@index([stripeSubscriptionId])
  @@index([status])
}
```

### Update Realtor Model

```prisma
model Realtor {
  // ... existing fields ...
  
  userPackages   UserPackage[]
  subscriptions  Subscription[]
  
  // Helper field to track subscription status
  subscriptionStatus String @default("inactive") // "active", "trial", "expired"
}
```

## Page/Feature Access Control

### Feature Flags System

Each page/feature needs metadata about which packages grant access:

```typescript
// lib/package-features.ts
export interface FeatureAccess {
  featureId: string
  pagePath: string
  requiredPackages: string[] // Package slugs
  description: string
}

export const FEATURE_ACCESS: FeatureAccess[] = [
  {
    featureId: 'properties',
    pagePath: '/realtor/properties',
    requiredPackages: ['real_estate'],
    description: 'Property management'
  },
  {
    featureId: 'showing-tours',
    pagePath: '/realtor/showing-tours',
    requiredPackages: ['real_estate'],
    description: 'Showing tour planner'
  },
  {
    featureId: 'customers',
    pagePath: '/realtor/customers',
    requiredPackages: ['real_estate', 'business'], // Accessible by both
    description: 'Customer management'
  },
  {
    featureId: 'social-media-hub',
    pagePath: '/social-media-hub',
    requiredPackages: ['communications'], // Addon only
    description: 'Social media management'
  },
  {
    featureId: 'whatsapp',
    pagePath: '/communications/whatsapp',
    requiredPackages: ['communications'],
    description: 'WhatsApp integration'
  },
  {
    featureId: 'instagram',
    pagePath: '/communications/instagram',
    requiredPackages: ['communications'],
    description: 'Instagram integration'
  },
  // ... more features
]
```

## User Signup Flow

### Step 1: Choose Base Package
- User selects "I'm a Realtor" or "I'm a Business Owner"
- This sets their base package

### Step 2: Choose Addons (Optional)
- Show Communications bundle as optional addon
- User can check/uncheck

### Step 3: Account Creation
- Create user account
- Assign selected packages
- Create Stripe customer
- If packages have price, redirect to Stripe checkout

### Step 4: Subscription Activation
- After Stripe payment, webhook activates packages
- User can access features

## Access Control Middleware

```typescript
// lib/package-access.ts
export async function checkPackageAccess(
  userId: string,
  requiredPackages: string[]
): Promise<boolean> {
  const userPackages = await prisma.userPackage.findMany({
    where: {
      userId,
      status: 'active',
      expiresAt: {
        gte: new Date() // Not expired
      }
    },
    include: {
      package: true
    }
  })
  
  const userPackageSlugs = userPackages.map(up => up.package.slug)
  
  // Check if user has at least one required package
  return requiredPackages.some(slug => userPackageSlugs.includes(slug))
}

// Middleware for Next.js pages
export function withPackageAccess(
  requiredPackages: string[],
  redirectTo: string = '/pricing'
) {
  return async (req: NextRequest) => {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.redirect(new URL('/auth/signin', req.url))
    }
    
    const hasAccess = await checkPackageAccess(session.user.id, requiredPackages)
    if (!hasAccess) {
      return NextResponse.redirect(new URL(redirectTo, req.url))
    }
    
    return null // Allow access
  }
}
```

## Admin Dashboard Structure

### Routes
- `/admin` - Admin dashboard home
- `/admin/users` - List all users with their packages
- `/admin/users/[id]` - View/edit user packages
- `/admin/packages` - Manage packages
- `/admin/subscriptions` - View all subscriptions
- `/admin/stripe-events` - View Stripe webhook events

### Admin Authentication
- Separate admin role/table
- Or use `isAdmin` flag on existing user model
- Admin login at `/admin/login`

### Features
1. **User Management**
   - View all users
   - Filter by package, status
   - Search users
   - View user details

2. **Package Management**
   - Assign packages to users
   - Remove packages
   - View user's current packages
   - Override subscription status (for testing/manual grants)

3. **Subscription Management**
   - View all Stripe subscriptions
   - Manual activation/cancellation
   - View payment history

## Stripe Integration

### Products & Prices Setup

1. **Create Products in Stripe Dashboard**
   - Product: "Real Estate Package"
   - Product: "Business Package"
   - Product: "Communications Bundle"

2. **Create Prices**
   - Monthly recurring prices
   - Store Price IDs in database

### Stripe Checkout Flow

```typescript
// When user signs up with paid packages
const session = await stripe.checkout.sessions.create({
  customer_email: user.email,
  payment_method_types: ['card'],
  line_items: selectedPackages.map(pkg => ({
    price: pkg.stripePriceId,
    quantity: 1,
  })),
  mode: 'subscription',
  success_url: `${baseUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
  cancel_url: `${baseUrl}/pricing?canceled=true`,
})
```

### Stripe Webhooks

Handle these events:
- `customer.subscription.created` - Activate packages
- `customer.subscription.updated` - Update subscription status
- `customer.subscription.deleted` - Deactivate packages
- `invoice.payment_succeeded` - Confirm active status
- `invoice.payment_failed` - Handle failed payments

## Implementation Plan

### Phase 1: Database & Models
1. Create Package model
2. Create UserPackage model
3. Create Subscription model
4. Update Realtor model
5. Run migrations

### Phase 2: Package Management System
1. Create package service
2. Seed default packages
3. Create package access utilities
4. Create feature flags system

### Phase 3: Access Control
1. Create middleware for route protection
2. Update existing pages with package flags
3. Add access checks to API routes
4. Create "Upgrade Required" pages

### Phase 4: Signup Flow
1. Update signup page with package selection
2. Create pricing page
3. Handle package assignment on signup
4. Create onboarding flow

### Phase 5: Stripe Integration
1. Set up Stripe products/prices
2. Create checkout flow
3. Set up webhooks
4. Handle subscription events

### Phase 6: Admin Dashboard
1. Create admin authentication
2. Build admin dashboard UI
3. Implement user management
4. Implement package management
5. Add subscription management

### Phase 7: Testing & Polish
1. Test all package combinations
2. Test Stripe flows
3. Test admin features
4. Add error handling
5. Add documentation

## File Structure

```
app/
  admin/
    dashboard/
      page.tsx
    users/
      page.tsx
      [id]/
        page.tsx
    packages/
      page.tsx
    subscriptions/
      page.tsx
  pricing/
    page.tsx
  signup/
    page.tsx
    [package]/
      page.tsx
lib/
  packages/
    service.ts
    access.ts
    features.ts
  stripe/
    checkout.ts
    webhooks.ts
    subscriptions.ts
prisma/
  migrations/
  schema.prisma
```

## Next Steps

1. Review and approve this architecture
2. Implement database schema changes
3. Create package management system
4. Set up Stripe integration
5. Build admin dashboard
6. Update existing pages with access control

