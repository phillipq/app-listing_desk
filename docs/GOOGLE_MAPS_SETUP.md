# 🗺️ **Google Maps API Setup Guide**

## **Overview**
This guide helps you set up Google Maps API for proximity calculations in your realtor chatbot platform.

## **🔧 Required APIs**

You need to enable these APIs in your Google Cloud Console:

### **1. Geocoding API**
- **Purpose**: Convert addresses to coordinates
- **Usage**: `geocodeAddress()` function
- **Cost**: $5 per 1,000 requests

### **2. Distance Matrix API**
- **Purpose**: Calculate driving distances and times
- **Usage**: `calculateDistance()` function
- **Cost**: $5 per 1,000 requests

### **3. Places API**
- **Purpose**: Find nearby amenities (schools, malls, etc.)
- **Usage**: `findNearbyAmenities()` function
- **Cost**: $17 per 1,000 requests

## **📋 Setup Steps**

### **Step 1: Google Cloud Console Setup**

1. **Go to [Google Cloud Console](https://console.cloud.google.com/)**
2. **Create a new project** or select existing one
3. **Enable billing** (required for API usage)
4. **Enable the required APIs**:
   - Go to **APIs & Services → Library**
   - Search for and enable:
     - **Geocoding API**
     - **Distance Matrix API**
     - **Places API**

### **Step 2: Create API Key**

1. **Go to APIs & Services → Credentials**
2. **Click "Create Credentials" → API Key**
3. **Copy the API key**
4. **Set restrictions** (recommended):
   - **Application restrictions**: HTTP referrers
   - **API restrictions**: Select the 3 APIs above

### **Step 3: Configure Environment**

Add to your `.env.local`:
```bash
GOOGLE_MAPS_API_KEY="your-api-key-here"
```

### **Step 4: Test the Integration**

```bash
# Test the integration
node test-google-maps.js

# Or test via API endpoint
curl "http://localhost:3014/api/test-google-maps"
```

## **💰 Cost Estimation**

### **Typical Usage Per Property:**
- **Geocoding**: 1 request = $0.005
- **Distance Matrix**: 5 requests = $0.025
- **Places Search**: 5 requests = $0.085
- **Total per property**: ~$0.12

### **Monthly Estimates:**
- **100 properties**: $12/month
- **1,000 properties**: $120/month
- **10,000 properties**: $1,200/month

## **🚀 Features Enabled**

### **1. Property Proximity Calculation**
```typescript
// Calculate proximity for a property
const proximityData = await googleMapsService.calculatePropertyProximity({
  latitude: 51.0447,
  longitude: -114.0719
})
```

### **2. Distance Calculations**
```typescript
// Calculate driving distance and time
const distance = await googleMapsService.calculateDistance(
  origin,
  destination,
  'driving'
)
```

### **3. Nearby Amenities Search**
```typescript
// Find nearby schools
const schools = await googleMapsService.findNearbyAmenities(
  location,
  'school',
  2000 // 2km radius
)
```

### **4. Proximity Scoring**
```typescript
// Score properties based on proximity preferences
const scores = await proximityService.calculateProximityScores(
  propertyIds,
  preferences
)
```

## **🎯 Use Cases**

### **1. Lead Qualification**
- **"I need to be close to schools"** → Find properties near schools
- **"Walking distance to shopping"** → Calculate walkable amenities
- **"Within 15 minutes of downtown"** → Filter by drive time

### **2. Property Matching**
- **Match user preferences** with proximity data
- **Score properties** based on amenity importance
- **Rank results** by proximity score

### **3. Market Analysis**
- **Compare neighborhoods** by amenity access
- **Identify property advantages** (walkability, transit)
- **Provide location insights** to realtors

## **🔒 Security Best Practices**

### **1. API Key Restrictions**
```bash
# Restrict by HTTP referrer
https://yourdomain.com/*
https://localhost:3014/*

# Restrict by IP (if using server-side)
YOUR_SERVER_IP
```

### **2. Usage Monitoring**
- **Set up billing alerts** in Google Cloud Console
- **Monitor API usage** in the dashboard
- **Set daily quotas** to prevent overuse

### **3. Rate Limiting**
```typescript
// Implement rate limiting in your app
const RATE_LIMIT = 100 // requests per minute
const requests = new Map()

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const userRequests = requests.get(ip) || []
  
  // Remove old requests (older than 1 minute)
  const recentRequests = userRequests.filter(time => now - time < 60000)
  
  if (recentRequests.length >= RATE_LIMIT) {
    return false
  }
  
  recentRequests.push(now)
  requests.set(ip, recentRequests)
  return true
}
```

## **🐛 Troubleshooting**

### **Common Issues:**

#### **1. REQUEST_DENIED Error**
- **Check API key** is correct
- **Verify APIs are enabled** in Google Cloud Console
- **Check API restrictions** (IP, referrer, API type)

#### **2. QUOTA_EXCEEDED Error**
- **Check billing** is enabled
- **Verify quotas** in Google Cloud Console
- **Monitor usage** in the dashboard

#### **3. INVALID_REQUEST Error**
- **Check request format** and parameters
- **Verify coordinates** are valid
- **Check address format** for geocoding

### **Debug Commands:**
```bash
# Test API key
curl "https://maps.googleapis.com/maps/api/geocode/json?address=Calgary&key=YOUR_API_KEY"

# Test distance matrix
curl "https://maps.googleapis.com/maps/api/distancematrix/json?origins=Calgary&destinations=Edmonton&key=YOUR_API_KEY"

# Test places search
curl "https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=51.0447,-114.0719&radius=2000&type=school&key=YOUR_API_KEY"
```

## **📊 Monitoring & Analytics**

### **1. Usage Tracking**
```typescript
// Track API usage
const usage = {
  geocoding: 0,
  distanceMatrix: 0,
  places: 0,
  totalCost: 0
}

// Log each API call
function logApiUsage(api: string, cost: number) {
  usage[api]++
  usage.totalCost += cost
  console.log(`API Usage: ${api} = $${cost.toFixed(4)}`)
}
```

### **2. Performance Monitoring**
```typescript
// Monitor response times
const startTime = Date.now()
const result = await googleMapsService.calculateDistance(...)
const duration = Date.now() - startTime

console.log(`Distance calculation took ${duration}ms`)
```

## **🎉 Next Steps**

1. **Enable the required APIs** in Google Cloud Console
2. **Add your API key** to `.env.local`
3. **Test the integration** with `node test-google-maps.js`
4. **Start using proximity features** in your chatbot
5. **Monitor usage and costs** in Google Cloud Console

Your Google Maps integration is now ready for production! 🚀✨
