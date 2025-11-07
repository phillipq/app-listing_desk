import { prisma } from '@/lib/prisma'

interface LeadQualificationResult {
  isQualified: boolean
  leadScore: number
  propertyType?: string
  bedrooms?: number
  bathrooms?: number
  priceRange?: { min?: number; max?: number }
  location?: string
  timeline?: string
  motivation?: string
  mustHaves?: string[]
  niceToHaves?: string[]
  notes?: string
}

interface MessageRoutingDecision {
  shouldAutoRespond: boolean
  requiresHuman: boolean
  response?: string
  confidence: number
  reasoning: string
  suggestedAction?: string
}

export class AIMessageProcessor {
  private static instance: AIMessageProcessor

  static getInstance(): AIMessageProcessor {
    if (!AIMessageProcessor.instance) {
      AIMessageProcessor.instance = new AIMessageProcessor()
    }
    return AIMessageProcessor.instance
  }

  async processMessage(leadId: string, messageContent: string): Promise<LeadQualificationResult> {
    try {
    // Get lead context
    const lead = await prisma.lead.findUnique({
      where: { id: leadId }
    })

      if (!lead) {
        throw new Error('Lead not found')
      }

      // Build conversation context (simplified for now)
      const conversationContext = ''

      // Process with AI (simplified version - in production, use OpenAI API)
      const result = await this.analyzeMessage(messageContent, conversationContext)

      // Update lead with AI analysis
      await this.updateLeadWithAI(leadId, result)

      return result
    } catch (error) {
      console.error('Error processing message with AI:', error)
      throw error
    }
  }

  async routeMessage(messageContent: string, conversationId?: string): Promise<MessageRoutingDecision> {
    try {
      // Get conversation context if available
      let conversationContext = ''
      if (conversationId) {
        const messages = await prisma.message.findMany({
          where: { conversationId },
          orderBy: { timestamp: 'asc' },
          take: 10 // Last 10 messages for context
        })
        conversationContext = messages.map(m => `${m.isIncoming ? 'Customer' : 'Agent'}: ${m.content}`).join('\n')
      }

      // Analyze message for routing decision
      const analysis = await this.analyzeMessageForRouting(messageContent, conversationContext)
      
      return analysis
    } catch (error) {
      console.error('Error routing message:', error)
      // Default to human response on error
      return {
        shouldAutoRespond: false,
        requiresHuman: true,
        confidence: 0.5,
        reasoning: 'Error in analysis, defaulting to human response',
        suggestedAction: 'manual_review'
      }
    }
  }

  private async analyzeMessageForRouting(messageContent: string, conversationContext: string): Promise<MessageRoutingDecision> {
    const content = messageContent.toLowerCase()
    const context = conversationContext.toLowerCase()

    // Keywords that indicate AI should handle
    const aiKeywords = [
      'hello', 'hi', 'hey', 'interested', 'looking for', 'budget', 'price', 'cost',
      'bedroom', 'bathroom', 'garage', 'location', 'area', 'neighborhood',
      'when', 'available', 'timeline', 'move', 'buying', 'selling',
      'information', 'details', 'tell me', 'can you', 'do you have'
    ]

    // Keywords that require human attention
    const humanKeywords = [
      'appointment', 'viewing', 'showing', 'meet', 'schedule', 'time',
      'contract', 'offer', 'negotiate', 'price', 'deal', 'closing',
      'urgent', 'asap', 'immediately', 'today', 'tomorrow',
      'problem', 'issue', 'complaint', 'wrong', 'mistake',
      'existing client', 'current customer', 'my agent'
    ]

    // Check for human keywords first (higher priority)
    const hasHumanKeywords = humanKeywords.some(keyword => content.includes(keyword))
    const hasAIKeywords = aiKeywords.some(keyword => content.includes(keyword))

    // Check conversation context for escalation patterns
    const isEscalation = context.includes('escalate') || context.includes('manager') || context.includes('supervisor')
    const isFollowUp = context.includes('follow up') || context.includes('call back')

    // Determine routing decision
    if (hasHumanKeywords || isEscalation || isFollowUp) {
      return {
        shouldAutoRespond: false,
        requiresHuman: true,
        confidence: 0.9,
        reasoning: 'Message contains keywords requiring human attention',
        suggestedAction: 'notify_realtor'
      }
    }

    if (hasAIKeywords) {
      // Generate appropriate AI response
      const response = await this.generateAIResponse(content, context)
      return {
        shouldAutoRespond: true,
        requiresHuman: false,
        response: response,
        confidence: 0.8,
        reasoning: 'Message appears to be a general inquiry suitable for AI response',
        suggestedAction: 'auto_respond'
      }
    }

    // Default to human for ambiguous messages
    return {
      shouldAutoRespond: false,
      requiresHuman: true,
      confidence: 0.6,
      reasoning: 'Message is ambiguous, defaulting to human response',
      suggestedAction: 'manual_review'
    }
  }

  private async generateAIResponse(messageContent: string, _conversationContext: string): Promise<string> {
    const content = messageContent.toLowerCase()

    // Simple response templates - in production, use OpenAI API
    if (content.includes('hello') || content.includes('hi') || content.includes('hey')) {
      return "Hello! I'd be happy to help you with your real estate needs. What type of property are you looking for?"
    }

    if (content.includes('budget') || content.includes('price') || content.includes('cost')) {
      return "Great! What's your budget range? This will help me find the perfect properties for you."
    }

    if (content.includes('bedroom') || content.includes('bathroom')) {
      return "Perfect! How many bedrooms and bathrooms are you looking for? Any other specific requirements?"
    }

    if (content.includes('location') || content.includes('area') || content.includes('neighborhood')) {
      return "What area or neighborhood are you most interested in? I can help you find properties in your preferred location."
    }

    if (content.includes('timeline') || content.includes('when') || content.includes('move')) {
      return "What's your timeline for moving? This helps me prioritize the most suitable properties for you."
    }

    // Default response
    return "I'd be happy to help you find the perfect property! Could you tell me more about what you're looking for?"
  }

  private async analyzeMessage(messageContent: string, conversationContext: string): Promise<LeadQualificationResult> {
    // Simplified AI analysis - in production, this would call OpenAI API
    const content = messageContent.toLowerCase()
    const context = conversationContext.toLowerCase()

    let leadScore = 50 // Base score
    let isQualified = false
    const result: LeadQualificationResult = {
      isQualified: false,
      leadScore: 50
    }

    // Analyze for property interest keywords
    const propertyKeywords = [
      'house', 'home', 'property', 'buy', 'purchase', 'looking for', 'interested in',
      'condo', 'townhouse', 'apartment', 'duplex', 'single family'
    ]

    const hasPropertyInterest = propertyKeywords.some(keyword => 
      content.includes(keyword) || context.includes(keyword)
    )

    if (hasPropertyInterest) {
      leadScore += 20
    }

    // Analyze for urgency indicators
    const urgencyKeywords = [
      'asap', 'urgent', 'quickly', 'soon', 'immediately', 'right away',
      'this month', 'next month', 'timeline', 'when can we'
    ]

    const hasUrgency = urgencyKeywords.some(keyword => 
      content.includes(keyword) || context.includes(keyword)
    )

    if (hasUrgency) {
      leadScore += 15
    }

    // Analyze for budget indicators
    const budgetPattern = /\$[\d,]+|\d+\s*(k|thousand|million)/gi
    const budgetMatches = content.match(budgetPattern) || context.match(budgetPattern)
    
    if (budgetMatches) {
      leadScore += 10
      // Extract price range
      const prices = budgetMatches.map(match => {
        const num = match.replace(/[$,]/g, '')
        if (num.includes('k')) {
          return parseInt(num.replace('k', '')) * 1000
        } else if (num.includes('million')) {
          return parseInt(num.replace('million', '')) * 1000000
        }
        return parseInt(num)
      }).filter(price => !isNaN(price))

      if (prices.length > 0) {
        result.priceRange = {
          min: Math.min(...prices),
          max: Math.max(...prices)
        }
      }
    }

    // Analyze for location preferences
    const locationKeywords = [
      'calgary', 'edmonton', 'vancouver', 'toronto', 'montreal', 'ottawa',
      'downtown', 'suburbs', 'north', 'south', 'east', 'west', 'center'
    ]

    const locationMatch = locationKeywords.find(keyword => 
      content.includes(keyword) || context.includes(keyword)
    )

    if (locationMatch) {
      leadScore += 5
      result.location = locationMatch
    }

    // Analyze for property specifications
    const bedroomPattern = /(\d+)\s*(bed|bedroom|br)/gi
    const bedroomMatch = content.match(bedroomPattern) || context.match(bedroomPattern)
    if (bedroomMatch) {
      const bedrooms = parseInt(bedroomMatch[0].match(/\d+/)?.[0] || '0')
      result.bedrooms = bedrooms
      leadScore += 5
    }

    const bathroomPattern = /(\d+)\s*(bath|bathroom|ba)/gi
    const bathroomMatch = content.match(bathroomPattern) || context.match(bathroomPattern)
    if (bathroomMatch) {
      const bathrooms = parseInt(bathroomMatch[0].match(/\d+/)?.[0] || '0')
      result.bathrooms = bathrooms
      leadScore += 5
    }

    // Analyze for property type
    const propertyTypes = {
      'condo': ['condo', 'condominium', 'apartment'],
      'house': ['house', 'home', 'single family', 'detached'],
      'townhouse': ['townhouse', 'townhome', 'row house'],
      'duplex': ['duplex', 'semi-detached']
    }

    for (const [type, keywords] of Object.entries(propertyTypes)) {
      if (keywords.some(keyword => content.includes(keyword) || context.includes(keyword))) {
        result.propertyType = type
        leadScore += 5
        break
      }
    }

    // Analyze for timeline
    const timelineKeywords = {
      'immediate': ['asap', 'urgent', 'immediately', 'right now'],
      '1-3 months': ['next month', 'in a month', 'soon', 'quickly'],
      '3-6 months': ['in a few months', 'spring', 'summer', 'fall'],
      '6+ months': ['next year', 'long term', 'eventually', 'planning']
    }

    for (const [timeline, keywords] of Object.entries(timelineKeywords)) {
      if (keywords.some(keyword => content.includes(keyword) || context.includes(keyword))) {
        result.timeline = timeline
        leadScore += 5
        break
      }
    }

    // Analyze for motivation
    const motivationKeywords = {
      'first time buyer': ['first time', 'new to', 'never owned'],
      'upgrading': ['bigger', 'upgrade', 'growing family', 'need more space'],
      'downsizing': ['smaller', 'downsize', 'retirement', 'empty nest'],
      'investment': ['investment', 'rental', 'income property', 'flip']
    }

    for (const [motivation, keywords] of Object.entries(motivationKeywords)) {
      if (keywords.some(keyword => content.includes(keyword) || context.includes(keyword))) {
        result.motivation = motivation
        leadScore += 5
        break
      }
    }

    // Analyze for must-haves and nice-to-haves
    const mustHaveKeywords = [
      'must have', 'need', 'required', 'essential', 'important',
      'garage', 'yard', 'garden', 'pool', 'basement', 'fireplace'
    ]

    const niceToHaveKeywords = [
      'would like', 'prefer', 'nice to have', 'bonus', 'if possible',
      'walk-in closet', 'hardwood', 'granite', 'stainless steel'
    ]

    const mustHaves: string[] = []
    const niceToHaves: string[] = []

    mustHaveKeywords.forEach(keyword => {
      if (content.includes(keyword) || context.includes(keyword)) {
        mustHaves.push(keyword)
      }
    })

    niceToHaveKeywords.forEach(keyword => {
      if (content.includes(keyword) || context.includes(keyword)) {
        niceToHaves.push(keyword)
      }
    })

    if (mustHaves.length > 0) {
      result.mustHaves = mustHaves
      leadScore += 5
    }

    if (niceToHaves.length > 0) {
      result.niceToHaves = niceToHaves
      leadScore += 3
    }

    // Determine if qualified
    isQualified = leadScore >= 70 && hasPropertyInterest

    result.isQualified = isQualified
    result.leadScore = Math.min(leadScore, 100) // Cap at 100

    // Generate notes
    result.notes = this.generateNotes(result, messageContent)

    return result
  }

  private generateNotes(result: LeadQualificationResult, messageContent: string): string {
    const notes: string[] = []

    if (result.propertyType) {
      notes.push(`Property type: ${result.propertyType}`)
    }

    if (result.bedrooms && result.bathrooms) {
      notes.push(`Size: ${result.bedrooms} bed, ${result.bathrooms} bath`)
    }

    if (result.priceRange) {
      notes.push(`Budget: $${result.priceRange.min?.toLocaleString()} - $${result.priceRange.max?.toLocaleString()}`)
    }

    if (result.location) {
      notes.push(`Location preference: ${result.location}`)
    }

    if (result.timeline) {
      notes.push(`Timeline: ${result.timeline}`)
    }

    if (result.motivation) {
      notes.push(`Motivation: ${result.motivation}`)
    }

    if (result.mustHaves && result.mustHaves.length > 0) {
      notes.push(`Must-haves: ${result.mustHaves.join(', ')}`)
    }

    if (result.niceToHaves && result.niceToHaves.length > 0) {
      notes.push(`Nice-to-haves: ${result.niceToHaves.join(', ')}`)
    }

    notes.push(`Latest message: ${messageContent}`)

    return notes.join('\n')
  }

  private async updateLeadWithAI(leadId: string, result: LeadQualificationResult): Promise<void> {
    try {
      await prisma.lead.update({
        where: { id: leadId },
        data: {
          aiSummary: result.notes
        }
      })
    } catch (error) {
      console.error('Error updating lead with AI results:', error)
    }
  }
}

export const aiMessageProcessor = AIMessageProcessor.getInstance()
