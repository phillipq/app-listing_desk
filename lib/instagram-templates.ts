/**
 * Instagram Post Templates for Real Estate
 * Each template has a structure, variables, and AI prompt guidelines
 */

export interface TemplateVariable {
  key: string
  label: string
  description: string
  example?: string
}

export interface InstagramTemplate {
  id: string
  name: string
  category: string // 'Property', 'Market Analysis', 'Location', 'Education', 'Community', 'Business'
  description: string
  icon: string
  structure: {
    hook: string // Opening line to grab attention
    body: string // Main content section
    cta: string // Call-to-action
    hashtags: string[] // Default hashtags (can be customized)
  }
  variables: TemplateVariable[]
  aiPrompt: string // Instructions for AI generation
  example: {
    userInput: string
    generatedCaption: string
    generatedHashtags: string[]
  }
}

export const INSTAGRAM_TEMPLATES: InstagramTemplate[] = [
  {
    id: 'property-showcase',
    name: 'Property Showcase',
    category: 'Property',
    description: 'Highlight a specific property with compelling details',
    icon: '🏠',
    structure: {
      hook: 'Eye-catching opening line about the property',
      body: 'Property details, features, and benefits',
      cta: 'Invitation to inquire or schedule viewing',
      hashtags: ['realestate', 'property', 'homeforsale', 'realtor', 'homeselling']
    },
    variables: [
      { key: 'property_address', label: 'Property Address', description: 'Location of the property' },
      { key: 'property_type', label: 'Property Type', description: 'House, Condo, Townhouse, etc.' },
      { key: 'key_features', label: 'Key Features', description: '3-5 standout features' },
      { key: 'price', label: 'Price', description: 'Asking price (optional)' },
      { key: 'neighborhood', label: 'Neighborhood', description: 'Area/location highlights' }
    ],
    aiPrompt: 'Create an engaging Instagram post showcasing a real estate property. Focus on emotional appeal, lifestyle benefits, and unique features. Keep it conversational and visual (imagine the photos).',
    example: {
      userInput: 'Beautiful 3-bedroom house in downtown with modern kitchen and large backyard',
      generatedCaption: `🏠 **Downtown Dream Home** ✨

Looking for the perfect blend of city living and suburban comfort? This stunning 3-bedroom home has it all!

📍 **What makes this special:**
• Modern, renovated kitchen with top-of-the-line appliances
• Spacious backyard perfect for entertaining or relaxing
• Prime downtown location - walk to shops, restaurants, and parks
• Move-in ready with attention to every detail

Ready to call this your home? 💙

DM me for a private showing or link in bio! 👆

#DowntownLiving #ModernHome #RealEstate #HomeForSale #DreamHome #Property #Realtor`,
      generatedHashtags: ['downtownliving', 'modernhome', 'realestate', 'homeforsale', 'dreamhome', 'property', 'realtor', 'househunting']
    }
  },
  {
    id: 'market-update',
    name: 'Market Update',
    category: 'Market Analysis',
    description: 'Share market trends, statistics, and insights',
    icon: '📊',
    structure: {
      hook: 'Attention-grabbing stat or trend',
      body: 'Market analysis and what it means',
      cta: 'Invitation to discuss market conditions',
      hashtags: ['realestatetips', 'marketupdate', 'realestatenews', 'housingmarket', 'realtor']
    },
    variables: [
      { key: 'market_stat', label: 'Market Statistic', description: 'Key number or percentage' },
      { key: 'trend_direction', label: 'Trend Direction', description: 'Up, down, or stable' },
      { key: 'location', label: 'Location', description: 'City, area, or region' },
      { key: 'time_period', label: 'Time Period', description: 'This month, quarter, year, etc.' },
      { key: 'insight', label: 'Key Insight', description: 'What this means for buyers/sellers' }
    ],
    aiPrompt: 'Create an informative but engaging market update post. Use clear formatting with bullet points or emojis. Make complex data easy to understand. End with actionable advice.',
    example: {
      userInput: 'Housing prices up 5% this quarter, inventory low, great time for sellers',
      generatedCaption: `📊 **Market Update: Q4 2024** 📈

Here's what's happening in our local market:

📈 **Prices:** Up 5% this quarter - strong seller's market continues
📉 **Inventory:** Still low, creating competitive conditions
⏰ **Days on Market:** Average 21 days (down from 35 last year)

**What this means:**
✅ **Sellers:** Your home could sell faster and for top dollar
🏠 **Buyers:** Act quickly when you find the right property

The market is moving fast! Whether you're buying or selling, timing is everything.

Want a personalized market analysis for your area? Let's chat! 💬

#MarketUpdate #RealEstate #HousingMarket #RealEstateNews #SellerMarket #HomeBuying #RealEstateTips`,
      generatedHashtags: ['marketupdate', 'realestate', 'housingmarket', 'realestatenews', 'sellermarket', 'homebuying', 'realestatetips', 'realtor']
    }
  },
  {
    id: 'neighborhood-spotlight',
    name: 'Neighborhood Spotlight',
    category: 'Location',
    description: 'Highlight a specific neighborhood or area',
    icon: '📍',
    structure: {
      hook: 'What makes this area special',
      body: 'Neighborhood features, amenities, lifestyle',
      cta: 'Invitation to explore or ask questions',
      hashtags: ['neighborhood', 'community', 'location', 'living', 'area']
    },
    variables: [
      { key: 'neighborhood_name', label: 'Neighborhood Name', description: 'Name of the area' },
      { key: 'key_amenities', label: 'Key Amenities', description: 'Schools, parks, shops, etc.' },
      { key: 'lifestyle', label: 'Lifestyle', description: 'What living here is like' },
      { key: 'property_types', label: 'Property Types', description: 'Types of homes available' },
      { key: 'proximity', label: 'Proximity', description: 'Distance to downtown, transit, etc.' }
    ],
    aiPrompt: 'Create a warm, inviting post about a neighborhood. Focus on lifestyle, community feel, and quality of life. Make readers want to live there. Use descriptive language.',
    example: {
      userInput: 'Riverside Heights - family-friendly, great schools, parks, close to downtown',
      generatedCaption: `📍 **Neighborhood Spotlight: Riverside Heights** 🏘️

Looking for the perfect family-friendly community? Let me introduce you to Riverside Heights!

🌳 **Why families love it:**
• Top-rated schools within walking distance
• Beautiful parks and playgrounds on every corner
• Safe, quiet streets perfect for evening walks
• Strong community spirit with regular events

🏠 **Housing Options:**
Mix of charming single-family homes and modern townhouses

📍 **Location Perks:**
Just 15 minutes to downtown, but feels like a world away
Easy access to major highways
Minutes from shopping and dining

It's not just a place to live - it's a place to belong! 💙

Thinking about making Riverside Heights home? I know this area inside and out - let's explore together!

#RiversideHeights #Neighborhood #Community #FamilyFriendly #GreatSchools #LocalArea #HomeBuying #RealEstate`,
      generatedHashtags: ['riversideheights', 'neighborhood', 'community', 'familyfriendly', 'greatschools', 'localarea', 'homebuying', 'realestate']
    }
  },
  {
    id: 'educational-tips',
    name: 'Educational Tips',
    category: 'Education',
    description: 'Share valuable home buying/selling advice',
    icon: '💡',
    structure: {
      hook: 'Question or interesting fact',
      body: 'Educational content with tips',
      cta: 'Invitation to learn more or ask questions',
      hashtags: ['realestatetips', 'homebuyingtips', 'firsttimehomebuyer', 'advice', 'education']
    },
    variables: [
      { key: 'tip_category', label: 'Tip Category', description: 'Buying, selling, investing, etc.' },
      { key: 'main_tip', label: 'Main Tip', description: 'The key piece of advice' },
      { key: 'supporting_points', label: 'Supporting Points', description: '2-3 additional tips or details' },
      { key: 'target_audience', label: 'Target Audience', description: 'First-time buyers, sellers, investors, etc.' },
      { key: 'common_mistake', label: 'Common Mistake', description: 'What to avoid (optional)' }
    ],
    aiPrompt: 'Create an educational, helpful post that provides genuine value. Use clear formatting, bullet points, or numbered lists. Make it easy to scan and remember. Be friendly and approachable.',
    example: {
      userInput: 'First-time homebuyers should check credit score and get pre-approved before house hunting',
      generatedCaption: `💡 **First-Time Homebuyer Tip Tuesday** ✨

Ready to buy your first home? Here's where to start:

✅ **Step 1: Check Your Credit Score**
• Aim for 620+ (better rates with 740+)
• Review your credit report for errors
• Give yourself time to improve if needed

✅ **Step 2: Get Pre-Approved**
• Shows sellers you're serious
• Know your true budget (not just what you think you can afford)
• Lock in your rate protection

✅ **Step 3: Then Start House Hunting**
• Save yourself time and heartbreak
• Make stronger offers with pre-approval in hand
• Move faster when you find "the one"

**Common Mistake:** ❌ Falling in love with houses you can't afford because you didn't check your numbers first!

Save this post for when you're ready! 📌

Questions? I'm here to help guide you through every step! 💬

#FirstTimeHomebuyer #HomeBuyingTips #RealEstateTips #PreApproval #CreditScore #HomeBuying #RealEstateAdvice`,
      generatedHashtags: ['firsttimehomebuyer', 'homebuyingtips', 'realestatetips', 'preapproval', 'creditscore', 'homebuying', 'realestateadvice', 'realtor']
    }
  },
  {
    id: 'community-event',
    name: 'Community Event',
    category: 'Community',
    description: 'Promote local events or community involvement',
    icon: '🎉',
    structure: {
      hook: 'Event announcement or community highlight',
      body: 'Event details, what to expect, or community news',
      cta: 'Invitation to attend or participate',
      hashtags: ['community', 'localevents', 'supportlocal', 'neighborhood', 'events']
    },
    variables: [
      { key: 'event_name', label: 'Event Name', description: 'Name of the event' },
      { key: 'event_date', label: 'Event Date', description: 'When it happens' },
      { key: 'event_location', label: 'Event Location', description: 'Where it takes place' },
      { key: 'event_details', label: 'Event Details', description: 'What to expect, activities, etc.' },
      { key: 'personal_connection', label: 'Personal Connection', description: 'Why you care about this event' }
    ],
    aiPrompt: 'Create an enthusiastic, community-focused post. Show genuine interest in local events. Use warm, inviting language. Include practical details but keep it engaging.',
    example: {
      userInput: 'Annual Fall Festival this Saturday, family fun, local vendors, community spirit',
      generatedCaption: `🎉 **Save the Date: Annual Fall Festival** 🍂

This Saturday, our community comes together for a day of fun and celebration!

📅 **When:** Saturday, October 5th, 10am - 4pm
📍 **Where:** Riverside Park (Main Street entrance)
🎪 **What to Expect:**
• Live music and entertainment
• Local food vendors and treats
• Kids activities and games
• Craft market with local artisans
• Community spirit at its finest!

**Why I love this event:**
It's a chance to connect with neighbors, support local businesses, and celebrate what makes our community special! 💙

See you there? I'll be the one checking out the real estate market... just kidding, I'll be enjoying the festivities like everyone else! 😄

Tag a friend who should join! 👇

#FallFestival #CommunityEvent #SupportLocal #Neighborhood #LocalEvents #Community #RiversidePark`,
      generatedHashtags: ['fallfestival', 'communityevent', 'supportlocal', 'neighborhood', 'localevents', 'community', 'riversidepark', 'realtor']
    }
  },
  {
    id: 'product-service-highlight',
    name: 'Product/Service Highlight',
    category: 'Business',
    description: 'Showcase a product or service you offer',
    icon: '⭐',
    structure: {
      hook: 'Eye-catching introduction to your product/service',
      body: 'Key features, benefits, and value proposition',
      cta: 'Invitation to learn more, try, or purchase',
      hashtags: ['product', 'service', 'business', 'quality', 'value']
    },
    variables: [
      { key: 'product_name', label: 'Product/Service Name', description: 'What you\'re showcasing' },
      { key: 'key_benefits', label: 'Key Benefits', description: 'Main advantages or features' },
      { key: 'target_audience', label: 'Target Audience', description: 'Who this is perfect for' },
      { key: 'special_offer', label: 'Special Offer', description: 'Discount, promotion, or special (optional)' },
      { key: 'unique_selling_point', label: 'Unique Selling Point', description: 'What makes this special' }
    ],
    aiPrompt: 'Create an engaging Instagram post highlighting a product or service. Focus on benefits over features, use storytelling, and create desire. Keep it authentic and helpful.',
    example: {
      userInput: 'New premium coffee blend, ethically sourced, perfect for morning routine, limited edition',
      generatedCaption: `⭐ **Introducing Our Premium Coffee Blend** ☕

After months of sourcing and testing, we're excited to share something special!

☕ **What Makes This Special:**
• Ethically sourced from sustainable farms
• Rich, bold flavor - the perfect morning companion
• Limited edition - available while supplies last

**Perfect For:**
Coffee lovers who care about quality AND sustainability ✨

Start your day right with a cup that makes a difference. 💙

**Limited Time:** Try a bag today - link in bio! 👆

#PremiumCoffee #EthicalSourcing #CoffeeLovers #QualityCoffee #SmallBusiness #CoffeeShop #MorningRoutine`,
      generatedHashtags: ['premiumcoffee', 'ethicalsourcing', 'coffeelovers', 'qualitycoffee', 'smallbusiness', 'coffeeshop', 'morningroutine', 'limitededition']
    }
  },
  {
    id: 'customer-testimonial',
    name: 'Customer Testimonial',
    category: 'Business',
    description: 'Share positive customer feedback and success stories',
    icon: '💬',
    structure: {
      hook: 'Customer quote or result highlight',
      body: 'Customer story, experience, and outcome',
      cta: 'Invitation to experience the same results',
      hashtags: ['testimonial', 'reviews', 'satisfiedcustomer', 'success', 'customerstories']
    },
    variables: [
      { key: 'customer_quote', label: 'Customer Quote', description: 'What the customer said' },
      { key: 'customer_result', label: 'Result/Outcome', description: 'What they achieved' },
      { key: 'service_provided', label: 'Service Provided', description: 'What you helped with' },
      { key: 'customer_type', label: 'Customer Type', description: 'Business, individual, etc.' },
      { key: 'key_benefit', label: 'Key Benefit Highlighted', description: 'Main benefit mentioned' }
    ],
    aiPrompt: 'Create a genuine, authentic testimonial post. Use the customer\'s voice when possible, highlight real results, and make it relatable. Show social proof naturally.',
    example: {
      userInput: 'Sarah said our marketing service increased her sales by 40%, she was thrilled with the results',
      generatedCaption: `💬 **Real Results from Real Customers** ✨

We love hearing from our clients! Here's what Sarah had to say:

"Working with them completely transformed my business. In just 3 months, I saw a 40% increase in sales. The personalized approach and strategic guidance made all the difference!"

**What We Did:**
Custom marketing strategy tailored to Sarah's unique business needs.

**The Result:**
40% sales growth and a thriving business! 📈

Seeing our clients succeed is why we do what we do. 💙

Ready to transform your business? Let's chat! 💬

#Testimonial #SuccessStory #MarketingSuccess #SmallBusiness #BusinessGrowth #Results #CustomerSuccess`,
      generatedHashtags: ['testimonial', 'successstory', 'marketingsuccess', 'smallbusiness', 'businessgrowth', 'results', 'customersuccess', 'reviews']
    }
  },
  {
    id: 'behind-scenes',
    name: 'Behind the Scenes',
    category: 'Business',
    description: 'Show the human side of your business',
    icon: '🎬',
    structure: {
      hook: 'What\'s happening behind the scenes',
      body: 'Process, team, or daily operations insight',
      cta: 'Invitation to connect or learn more',
      hashtags: ['behindthescenes', 'smallbusiness', 'team', 'process', 'authentic']
    },
    variables: [
      { key: 'scene_description', label: 'Scene Description', description: 'What\'s happening' },
      { key: 'team_members', label: 'Team Members', description: 'Who\'s involved (optional)' },
      { key: 'process_step', label: 'Process Step', description: 'What part of your process' },
      { key: 'learning_insight', label: 'Learning/Insight', description: 'Something interesting or educational' },
      { key: 'business_value', label: 'Business Value', description: 'Why this matters' }
    ],
    aiPrompt: 'Create an authentic behind-the-scenes post that shows the human side of your business. Be genuine, show personality, and help followers feel connected. Keep it casual and relatable.',
    example: {
      userInput: 'Our team working late preparing custom orders for the holiday rush, showing dedication to quality',
      generatedCaption: `🎬 **Behind the Scenes: Holiday Prep** 🎁

Ever wonder what goes into making your custom orders? Here's a peek! 👀

✨ **What We're Up To:**
The team is working late tonight, carefully preparing each custom order for the holiday rush. Attention to detail is everything!

**Why This Matters:**
Every order gets the same care and quality, no matter how busy we get. That's our promise to you. 💙

**The Reality:**
Running a business isn't always glamorous, but seeing happy customers makes every late night worth it! ✨

Thanks for being part of our journey! 🙏

#BehindTheScenes #SmallBusiness #TeamWork #CustomOrders #Quality #SmallBusinessOwner #Authentic`,
      generatedHashtags: ['behindthescenes', 'smallbusiness', 'teamwork', 'customorders', 'quality', 'smallbusinessowner', 'authentic', 'process']
    }
  },
  {
    id: 'promotional-offer',
    name: 'Special Offer/Promotion',
    category: 'Business',
    description: 'Announce discounts, sales, or limited-time offers',
    icon: '🎉',
    structure: {
      hook: 'Attention-grabbing offer announcement',
      body: 'Offer details, value, and terms',
      cta: 'Clear call-to-action to take advantage',
      hashtags: ['sale', 'promotion', 'limitedtime', 'offer', 'discount']
    },
    variables: [
      { key: 'offer_type', label: 'Offer Type', description: 'Discount, sale, promotion, etc.' },
      { key: 'discount_amount', label: 'Discount Amount', description: 'Percentage or amount off' },
      { key: 'valid_period', label: 'Valid Period', description: 'How long the offer lasts' },
      { key: 'product_service', label: 'Product/Service', description: 'What\'s on offer' },
      { key: 'special_terms', label: 'Special Terms', description: 'Any conditions or exclusions' }
    ],
    aiPrompt: 'Create an exciting, clear promotional post. Build urgency, highlight value, and make it easy to understand. Use engaging language but remain professional. Include clear terms.',
    example: {
      userInput: '20% off all services this weekend only, perfect time to start your project',
      generatedCaption: `🎉 **Weekend Special: 20% Off Everything!** ✨

This weekend only - don't miss out!

💰 **The Deal:**
• 20% OFF all services
• No minimum purchase required
• Perfect time to start that project you've been planning

**When:**
Friday - Sunday only (ends Sunday at midnight!)

**How to Redeem:**
Use code WEEKEND20 at checkout or mention this post when you reach out! 👆

Limited time offer - grab it while you can! ⏰

#WeekendSale #SpecialOffer #LimitedTime #Discount #SaveMoney #Deal #Offer`,
      generatedHashtags: ['weekendsale', 'specialoffer', 'limitedtime', 'discount', 'savemoney', 'deal', 'offer', 'promotion']
    }
  },
  {
    id: 'industry-news',
    name: 'Industry News & Updates',
    category: 'Business',
    description: 'Share industry trends, news, or insights',
    icon: '📰',
    structure: {
      hook: 'Industry news or trend headline',
      body: 'Explanation of what it means and why it matters',
      cta: 'Invitation to discuss or learn more',
      hashtags: ['industrynews', 'trends', 'insights', 'industry', 'business']
    },
    variables: [
      { key: 'news_topic', label: 'News Topic', description: 'What\'s happening in your industry' },
      { key: 'impact', label: 'Impact', description: 'How it affects customers or businesses' },
      { key: 'expert_insight', label: 'Expert Insight', description: 'Your perspective or analysis' },
      { key: 'trend_direction', label: 'Trend Direction', description: 'Growing, declining, changing, etc.' },
      { key: 'action_tip', label: 'Action Tip', description: 'What people should do about it' }
    ],
    aiPrompt: 'Create an informative but engaging industry news post. Position yourself as a knowledgeable expert. Make complex topics accessible. Add your unique perspective and actionable insights.',
    example: {
      userInput: 'New regulations affecting small businesses, compliance deadlines approaching, important for business owners to know',
      generatedCaption: `📰 **Important Industry Update** ⚠️

Heads up, business owners! There are new regulations coming into effect that you'll want to know about.

📋 **What's Changing:**
New compliance requirements with deadlines approaching. These changes could impact how you operate.

**Why This Matters:**
Staying ahead of regulations protects your business and avoids costly penalties. 💙

**What You Should Do:**
• Review the new requirements
• Plan ahead for compliance deadlines
• Reach out if you need guidance

**My Take:**
While regulations can feel overwhelming, they often protect both businesses and customers. Getting ahead of the curve is always smart! 💡

Have questions? I'm here to help navigate these changes! 💬

#IndustryNews #BusinessRegulations #Compliance #SmallBusiness #BusinessTips #IndustryUpdate #StayInformed`,
      generatedHashtags: ['industrynews', 'businessregulations', 'compliance', 'smallbusiness', 'businesstips', 'industryupdate', 'stayinformed', 'businessowner']
    }
  }
]

/**
 * Get template by ID
 */
export function getTemplateById(id: string): InstagramTemplate | undefined {
  return INSTAGRAM_TEMPLATES.find(t => t.id === id)
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: string): InstagramTemplate[] {
  return INSTAGRAM_TEMPLATES.filter(t => t.category === category)
}

/**
 * Get all template categories
 */
export function getTemplateCategories(): string[] {
  const categories = INSTAGRAM_TEMPLATES.map(t => t.category)
  return categories.filter((value, index, self) => self.indexOf(value) === index)
}

