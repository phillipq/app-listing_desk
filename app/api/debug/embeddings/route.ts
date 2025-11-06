import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    // Check if we have any property embeddings in the database (using raw SQL since table is in Supabase)
    const embeddingsResult = await prisma.$queryRaw<Array<{
      mls_id: string
      property_data: unknown
      description_embedding: number[] | null
      features_embedding: number[] | null
      combined_embedding: number[] | null
      created_at: Date
      updated_at: Date
    }>>`
      SELECT mls_id, property_data, description_embedding, features_embedding, combined_embedding, created_at, updated_at
      FROM property_embeddings
      LIMIT 5
    `

    // Check total count
    const countResult = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) as count FROM property_embeddings
    `
    const totalCount = Number(countResult[0]?.count || 0)

    // Check if we have any properties in the cache
    const cachedProperties = await prisma.property.findMany({
      take: 5,
      select: {
        mlsId: true,
        address: true,
        city: true,
        price: true,
        updatedAt: true
      }
    })

    const cachedCount = await prisma.property.count()

    return NextResponse.json({
      success: true,
      embeddings: {
        count: totalCount,
        samples: embeddingsResult.map(embedding => {
          const propertyData = embedding.property_data as { address?: string } | null
          return {
            mlsId: embedding.mls_id,
            hasDescriptionEmbedding: !!embedding.description_embedding,
            hasFeaturesEmbedding: !!embedding.features_embedding,
            hasCombinedEmbedding: !!embedding.combined_embedding,
            createdAt: embedding.created_at,
            updatedAt: embedding.updated_at,
            propertyAddress: propertyData?.address || 'N/A'
          }
        })
      },
      cachedProperties: {
        count: cachedCount,
        samples: cachedProperties
      }
    })

  } catch (error) {
    console.error('Error checking embeddings:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to check embeddings',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
