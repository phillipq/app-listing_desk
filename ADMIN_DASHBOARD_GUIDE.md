# Admin Dashboard Guide

## Overview

The Admin Dashboard provides complete management of users, packages, subscriptions, and revenue tracking. Only users with `isAdmin = true` can access these pages.

## Setup

### 1. Make a User an Admin

To make your first admin user:

```bash
npx tsx scripts/make-admin.ts your-email@example.com
```

You can also manually set `isAdmin = true` in the database for any Realtor.

### 2. Access Admin Dashboard

Navigate to: `/admin`

You'll be redirected if:
- Not logged in → `/auth/signin?redirect=/admin`
- Not an admin → `/dashboard`

## Admin Pages

### Dashboard (`/admin`)
- **Revenue Statistics**
  - Total revenue (all time)
  - Monthly revenue (current month)
  - Active subscriptions count
  - Total users count
  
- **Revenue by Package**
  - Shows revenue breakdown per package
  - Monthly and yearly projections
  
- **Recent Subscriptions**
  - Last 10 subscription activations
  - Status, amounts, dates

### Users (`/admin/users`)
- **List View**
  - All users (non-admins)
  - Email, name, packages
  - Subscription status
  - Created date
  - Quick link to user detail

- **User Detail (`/admin/users/[id]`)**
  - Full user information
  - Package management (assign/remove)
  - View Stripe subscriptions
  - Subscription status
  - Admin status toggle (shown but can be added)

### Packages (`/admin/packages`)
- View all packages
- See active user count per package
- Package details (price, features, Stripe Price ID)
- Active/inactive status

### Subscriptions (`/admin/subscriptions`)
- All Stripe subscriptions
- Grouped by status (active, cancelled, past_due, etc.)
- Full subscription details
- Period information
- Stripe subscription IDs

## Features

### Package Management

**From User Detail Page:**
1. Navigate to `/admin/users/[id]`
2. Use "Package Management" section
3. Select base package (radio - one only)
4. Select addon packages (checkboxes - multiple)
5. Click "Save Package Changes"

**API Endpoint:**
```
POST /api/admin/users/[id]/packages
Body: { packageIds: ["package-id-1", "package-id-2"] }
```

**Rules:**
- User must have exactly one base package
- User can have multiple addon packages
- Changes are saved immediately
- User subscription status updates automatically

### Making Users Admin

**Command Line:**
```bash
npx tsx scripts/make-admin.ts user@example.com
```

**Database:**
```sql
UPDATE "Realtor" SET "isAdmin" = true WHERE email = 'user@example.com';
```

## Security

- All admin pages check `isAdmin` flag
- All admin API routes use `adminApiMiddleware`
- Non-admin users are redirected to `/dashboard`
- Unauthenticated users are redirected to sign-in

## Revenue Tracking

The dashboard calculates revenue from:
- All active subscriptions
- Package prices stored in database
- Monthly aggregation
- Package-based breakdowns

**Note:** Revenue is calculated from subscription records, so Stripe webhooks must be properly configured to track all payments.

## Next Steps

1. **Make yourself admin:**
   ```bash
   npx tsx scripts/make-admin.ts your-email@example.com
   ```

2. **Access dashboard:**
   Navigate to `/admin` and log in

3. **Test package assignment:**
   - Go to Users page
   - Click on a user
   - Assign packages
   - Verify changes

4. **Monitor revenue:**
   - Check dashboard for stats
   - Review subscriptions page
   - Track package adoption

## API Endpoints

### Admin User Packages
```
POST /api/admin/users/[id]/packages
Headers: { Authorization: Session required }
Body: { packageIds: string[] }
Response: { success: boolean, added: number, removed: number }
```

All admin routes require:
- Valid session
- `isAdmin = true` on user account

## Troubleshooting

**Can't access `/admin`:**
- Check you're logged in
- Verify `isAdmin = true` in database
- Check browser console for errors

**Package changes not saving:**
- Check API route logs
- Verify user exists
- Ensure package IDs are valid

**Revenue showing $0:**
- No subscriptions exist yet
- Subscriptions need to be created via Stripe
- Check subscription records in database

