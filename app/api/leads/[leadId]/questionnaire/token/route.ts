import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '../../../../../../lib/auth'
import { prisma } from '../../../../../../lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ leadId: string }> }
) {
  try {
    const { leadId: _leadId } = await params
    const { expiresIn = '7d' } = await request.json() as { expiresIn?: '7d' | '30d' }
    
    // Get the current session to verify the realtor
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Find the realtor
    const realtor = await prisma.realtor.findUnique({
      where: { id: session.user.id }
    })
    
    if (!realtor) {
      return NextResponse.json({ error: 'Realtor not found' }, { status: 404 })
    }
    
    // Generate secure token
    const token = `qst_${crypto.randomUUID().replace(/-/g, '')}`
    
    // Parse expiration time
    const expiresAt = new Date()
    if (expiresIn === '7d') {
      expiresAt.setDate(expiresAt.getDate() + 7)
    } else if (expiresIn === '30d') {
      expiresAt.setDate(expiresAt.getDate() + 30)
    } else {
      // Default to 7 days
      expiresAt.setDate(expiresAt.getDate() + 7)
    }
    
    return NextResponse.json({
      success: true,
      token,
      url: `${process.env.NEXT_PUBLIC_APP_URL}/questionnaire/${token}`,
      expiresAt: expiresAt.toISOString(),
      questionnaireId: token
    })
    
  } catch (error) {
    console.error('Error generating questionnaire token:', error)
    return NextResponse.json(
      { error: 'Failed to generate questionnaire token' },
      { status: 500 }
    )
  }
}
