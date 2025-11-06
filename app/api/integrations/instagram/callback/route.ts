import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// TypeScript interfaces for Facebook/Instagram API responses
interface FacebookPage {
  id: string
  name: string
  access_token: string
}

interface FacebookPagesResponse {
  data: FacebookPage[]
}

interface InstagramPage {
  pageId: string
  pageName: string
  instagramId: string
  accessToken: string
}


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')

    if (error) {
      console.error('Instagram OAuth error:', error)
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/communication/channels?error=instagram_auth_failed`)
    }

    if (!code || !state) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/communication/channels?error=missing_parameters`)
    }

    // Verify state parameter
    let _stateData
    try {
      _stateData = JSON.parse(Buffer.from(state, 'base64').toString())
    } catch {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/communication/channels?error=invalid_state`)
    }

    const META_APP_ID = process.env.META_APP_ID
    const META_APP_SECRET = process.env.META_APP_SECRET
    const REDIRECT_URI = `${process.env.NEXTAUTH_URL}/api/integrations/instagram/callback`

    if (!META_APP_ID || !META_APP_SECRET) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/communication/channels?error=configuration_error`)
    }

    // Exchange code for access token
    const tokenResponse = await fetch(
      `https://graph.facebook.com/v19.0/oauth/access_token?` +
      `client_id=${META_APP_ID}&` +
      `redirect_uri=${encodeURIComponent(REDIRECT_URI)}&` +
      `client_secret=${META_APP_SECRET}&` +
      `code=${code}`,
      { method: 'GET' }
    )

    if (!tokenResponse.ok) {
      console.error('Failed to exchange code for token:', await tokenResponse.text())
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/communication/channels?error=token_exchange_failed`)
    }

    const tokenData = await tokenResponse.json() as { access_token: string }
    const accessToken = tokenData.access_token

    if (!accessToken) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/communication/channels?error=no_access_token`)
    }

    // Get user's pages (Instagram Business accounts are linked to Facebook Pages)
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v19.0/me/accounts?access_token=${accessToken}`,
      { method: 'GET' }
    )

    if (!pagesResponse.ok) {
      console.error('Failed to fetch pages:', await pagesResponse.text())
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/communication/channels?error=pages_fetch_failed`)
    }

    const pagesData = await pagesResponse.json() as FacebookPagesResponse
    const pages = pagesData.data || []

    // Find pages with Instagram Business accounts
    const instagramPages: InstagramPage[] = []
    for (const page of pages) {
      try {
        const instagramResponse = await fetch(
          `https://graph.facebook.com/v19.0/${page.id}?fields=instagram_business_account&access_token=${accessToken}`,
          { method: 'GET' }
        )
        
        if (instagramResponse.ok) {
          const instagramData = await instagramResponse.json() as { instagram_business_account?: { id: string } }
          if (instagramData.instagram_business_account) {
            instagramPages.push({
              pageId: page.id,
              pageName: page.name,
              instagramId: instagramData.instagram_business_account.id,
              accessToken: page.access_token
            })
          }
        }
      } catch (err) {
        console.error(`Error checking Instagram for page ${page.id}:`, err)
      }
    }

    if (instagramPages.length === 0) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/communication/channels?error=no_instagram_account`)
    }

    // Get current user
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/communication/channels?error=unauthorized`)
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/communication/channels?error=user_not_found`)
    }

    // Store Instagram connections
    for (const instagramPage of instagramPages) {
      // Create or update social token
      await prisma.socialToken.upsert({
        where: {
          userId_platform_pageId: {
            userId: user.id,
            platform: 'instagram',
            pageId: instagramPage.pageId
          }
        },
        update: {
          accessToken: instagramPage.accessToken,
          instagramBusinessId: instagramPage.instagramId,
          expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
          updatedAt: new Date()
        },
        create: {
          userId: user.id,
          platform: 'instagram',
          pageId: instagramPage.pageId,
          accessToken: instagramPage.accessToken,
          instagramBusinessId: instagramPage.instagramId,
          expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
          metadata: {
            pageName: instagramPage.pageName
          }
        }
      })

      // Create communication channel
      await prisma.communicationChannel.upsert({
        where: {
          id: `instagram_${instagramPage.pageId}_${user.id}`
        },
        update: {
          name: `Instagram - ${instagramPage.pageName}`,
          isActive: true,
          config: {
            pageId: instagramPage.pageId,
            instagramId: instagramPage.instagramId,
            accessToken: instagramPage.accessToken,
            webhookUrl: `${process.env.NEXTAUTH_URL}/api/webhooks/instagram`
          },
          updatedAt: new Date()
        },
        create: {
          id: `instagram_${instagramPage.pageId}_${user.id}`,
          userId: user.id,
          name: `Instagram - ${instagramPage.pageName}`,
          type: 'instagram',
          isActive: true,
          config: {
            pageId: instagramPage.pageId,
            instagramId: instagramPage.instagramId,
            accessToken: instagramPage.accessToken,
            webhookUrl: `${process.env.NEXTAUTH_URL}/api/webhooks/instagram`
          }
        }
      })
    }

    // Redirect back to channels page with success
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/communication/channels?success=instagram_connected&count=${instagramPages.length}`)
  } catch (error) {
    console.error('Error in Instagram callback:', error)
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/communication/channels?error=callback_failed`)
  }
}
