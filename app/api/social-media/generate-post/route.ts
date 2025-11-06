import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import OpenAI from 'openai'
import { getTemplateById } from '@/lib/instagram-templates'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { success: false, error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    const body = await request.json() as {
      templateId: string
      userInput: string
      location?: string
      trendingTopic?: string
    }

    const { templateId, userInput, location, trendingTopic } = body

    if (!templateId || !userInput) {
      return NextResponse.json(
        { success: false, error: 'Template ID and user input are required' },
        { status: 400 }
      )
    }

    // Get the template
    const template = getTemplateById(templateId)
    if (!template) {
      return NextResponse.json(
        { success: false, error: 'Template not found' },
        { status: 404 }
      )
    }

    // Build the AI prompt
    const systemPrompt = `You are a creative social media content writer specializing in real estate. Your goal is to create engaging, authentic Instagram posts that feel personal and genuine, not salesy.

Key Guidelines:
- Use emojis strategically (2-4 per post maximum)
- Keep the tone warm, friendly, and professional
- Use formatting (bold with **, line breaks) to make it scannable
- Include a clear call-to-action
- Make it feel conversational, not robotic
- Focus on benefits and emotional appeal
- Keep captions between 150-250 words for optimal engagement

Template Style: ${template.name} (${template.category})
Template Guidelines: ${template.aiPrompt}`

    const userPrompt = `Create an Instagram post using the "${template.name}" template.

User's Input/Request:
"${userInput}"

${location ? `Location Context: ${location}` : ''}
${trendingTopic ? `Currently Trending Topic: ${trendingTopic}` : ''}

Template Structure:
- Hook: ${template.structure.hook}
- Body: ${template.structure.body}
- CTA: ${template.structure.cta}

Generate a complete Instagram caption following the template style. Return ONLY the caption text, no additional commentary.

Then, on a new line after "---HASHTAGS---", provide 8-12 relevant hashtags (one per line, no # symbol).`

    // Generate content with OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      temperature: 0.8,
      max_tokens: 500,
    })

    const fullResponse = completion.choices[0]?.message?.content || ''
    
    // Split caption and hashtags
    const parts = fullResponse.split('---HASHTAGS---')
    const caption = parts[0]?.trim() || fullResponse.trim()
    const hashtagsText = parts[1]?.trim() || ''
    
    // Extract hashtags (remove # if present, split by newline or space)
    const hashtags = hashtagsText
      .split(/[\n\s]+/)
      .map(tag => tag.replace(/^#/, '').trim().toLowerCase())
      .filter(tag => tag.length > 0)
      .slice(0, 12) // Limit to 12 hashtags

    // If no hashtags were generated, use template defaults
    const finalHashtags = hashtags.length > 0 ? hashtags : template.structure.hashtags

    return NextResponse.json({
      success: true,
      caption,
      hashtags: finalHashtags,
    })
  } catch (error) {
    console.error('Error generating Instagram post:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { success: false, error: 'Failed to generate post', details: message },
      { status: 500 }
    )
  }
}

