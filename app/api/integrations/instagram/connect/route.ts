import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const META_APP_ID = process.env.META_APP_ID
    const REDIRECT_URI = `${process.env.NEXTAUTH_URL}/api/integrations/instagram/callback`
    
    if (!META_APP_ID) {
      return NextResponse.json({ error: 'Instagram integration not configured' }, { status: 500 })
    }

    // Generate state parameter for security
    const state = Buffer.from(JSON.stringify({
      userId: session.user.id,
      timestamp: Date.now()
    })).toString('base64')

    // Instagram OAuth URL with required permissions
    const authUrl = `https://www.facebook.com/v19.0/dialog/oauth?` +
      `client_id=${META_APP_ID}&` +
      `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
      `scope=instagram_manage_messages,pages_manage_metadata,pages_show_list,pages_messaging&` +
      `response_type=code&` +
      `state=${state}`

    return NextResponse.redirect(authUrl)
  } catch (error) {
    console.error('Error initiating Instagram OAuth:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
