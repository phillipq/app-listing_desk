# Social Media Hub - Setup Instructions

## Database Migration

Run the Prisma migration to add the new tables:

```bash
npx prisma migrate dev --name add_social_media_hub_tables
```

Or if you prefer to generate the migration first:

```bash
npx prisma migrate dev --create-only --name add_social_media_hub_tables
npx prisma migrate deploy
```

## What Was Added

### New Database Models

1. **CustomSearchTerm** - Stores user-defined search terms (up to 3)
   - `keyword` - The search term
   - `location` - Optional location override
   - `category` - Optional category
   - `isActive` - Active status

2. **TrendingSearch** - Stores trending search data
   - `keyword` - The search term
   - `location` - Location context
   - `searchVolume` - Search volume estimate
   - `trendDirection` - "up", "down", or "stable"
   - `trendData` - Historical trend data points (JSON)
   - `lastUpdated` - Last update timestamp

### New API Routes

1. **GET /api/social-media/custom-search-terms** - Fetch user's custom search terms
2. **POST /api/social-media/custom-search-terms** - Save custom search terms (up to 3)
3. **GET /api/social-media/trending-searches** - Fetch trending data for custom terms
4. **POST /api/social-media/trending-searches** - Manually refresh trending data

### New UI

- **Dashboard**: `/social-media-hub`
- Accessible from sidebar navigation

## Usage

1. Navigate to **Social Media Hub** in the sidebar
2. Click **"Add Search Terms"** to configure 2-3 custom search terms
3. Enter keywords like:
   - "homes for sale Vernon"
   - "Vernon real estate"
   - "condos Vernon"
4. Optionally set a location (or auto-detect from properties)
5. Click **"Refresh Trends"** to fetch latest trending data
6. View trending dashboard with charts and metrics

## Next Steps

- Integrate real Google Trends API (currently using mock data)
- Add AI post generation based on trending searches
- Add scheduling and publishing to Instagram/WhatsApp

See `SOCIAL_MEDIA_HUB_PROPOSAL.md` for full architecture details.
