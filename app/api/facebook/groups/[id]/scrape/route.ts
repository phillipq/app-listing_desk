import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import FacebookAPIService from '@/lib/facebook-api'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json() as { accessToken: string }
    const { accessToken } = body
    if (!accessToken) {
      return NextResponse.json({ error: 'Access token is required' }, { status: 400 })
    }

    // Get the group
    const group = await prisma.facebookGroup.findFirst({
      where: { 
        id,
        realtorId: session.user.id 
      }
    })

    if (!group) {
      return NextResponse.json({ error: 'Group not found' }, { status: 404 })
    }

    // Initialize Facebook API
    const facebookAPI = new FacebookAPIService(accessToken)

    // Get posts from the group
    const posts = await facebookAPI.getGroupPosts(group.groupId, 50)

    let newListings = 0
    let updatedListings = 0

    for (const post of posts) {
      try {
        // Extract property information
        const propertyInfo = facebookAPI.extractPropertyInfo(post)

        // Check if listing already exists
        const existingListing = await prisma.facebookListing.findFirst({
          where: { 
            postId: post.id,
            groupId: group.id
          }
        })

        if (existingListing) {
          // Update existing listing
          await prisma.facebookListing.update({
            where: { id: existingListing.id },
            data: {
              title: propertyInfo.title,
              description: propertyInfo.description,
              price: propertyInfo.price,
              address: propertyInfo.address,
              city: propertyInfo.city,
              province: propertyInfo.province,
              bedrooms: propertyInfo.bedrooms,
              bathrooms: propertyInfo.bathrooms,
              propertyType: propertyInfo.propertyType,
              images: propertyInfo.images,
              lastScraped: new Date()
            }
          })
          updatedListings++
        } else {
          // Create new listing
          await prisma.facebookListing.create({
            data: {
              postId: post.id,
              groupId: group.id,
              realtor: { connect: { id: group.realtorId } },
              title: propertyInfo.title,
              description: propertyInfo.description,
              price: propertyInfo.price,
              address: propertyInfo.address,
              city: propertyInfo.city,
              province: propertyInfo.province,
              bedrooms: propertyInfo.bedrooms,
              bathrooms: propertyInfo.bathrooms,
              propertyType: propertyInfo.propertyType,
              images: propertyInfo.images,
              postedDate: new Date(post.created_time)
            }
          })
          newListings++
        }
      } catch (error) {
        console.error(`Error processing post ${post.id}:`, error)
        // Continue with other posts
      }
    }

    // Update group's last scraped time
    await prisma.facebookGroup.update({
      where: { id: group.id },
      data: {
        lastScraped: new Date(),
        nextScrape: new Date(Date.now() + group.scrapeInterval * 60 * 60 * 1000)
      }
    })

    return NextResponse.json({
      success: true,
      newListings,
      updatedListings,
      totalPosts: posts.length
    })
  } catch (error) {
    console.error('Error scraping Facebook group:', error)
    return NextResponse.json({ error: 'Failed to scrape group' }, { status: 500 })
  }
}
