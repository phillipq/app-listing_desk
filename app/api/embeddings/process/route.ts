import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../lib/auth'
import { mlsService } from '../../../../lib/mls'
import { vectorSearchService } from '../../../../lib/vector-search'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as { limit?: number }
    const limit = body.limit ?? 50

    console.log(`🔄 Processing ${limit} properties for embeddings...`)

    // Fetch properties from MLS service
    const properties = await mlsService.fetchProperties({})
    
    if (properties.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No properties found to process'
      })
    }

    // Limit the number of properties to process
    const propertiesToProcess = properties.slice(0, limit)

    // Process properties for embeddings
    await vectorSearchService.processPropertiesForEmbeddings(
      propertiesToProcess as unknown as import('../../../../lib/vector-search').PropertyData[]
    )

    return NextResponse.json({
      success: true,
      message: `Successfully processed ${propertiesToProcess.length} properties for embeddings`,
      processed: propertiesToProcess.length,
      total: properties.length
    })

  } catch (error) {
    console.error('Error processing embeddings:', error)
    return NextResponse.json(
      { error: 'Failed to process embeddings', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
