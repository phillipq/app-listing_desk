import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../lib/auth'
import { prisma } from '../../../../lib/prisma'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || !session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check if user is admin
    const user = await prisma.realtor.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true }
    })

    if (!user?.isAdmin) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    console.log('🔧 Creating vector search function in Supabase...')

    const sql = `
      -- Create function for vector similarity search
      CREATE OR REPLACE FUNCTION search_properties_by_similarity(
        query_embedding vector(1536),
        match_threshold float DEFAULT 0.1,
        match_count int DEFAULT 10
      )
      RETURNS TABLE (
        id text,
        "mlsId" text,
        "mlsNumber" text,
        address text,
        city text,
        province text,
        "postalCode" text,
        price bigint,
        bedrooms int,
        bathrooms int,
        "propertyType" text,
        "squareFootage" int,
        status text,
        images jsonb,
        description text,
        "listDate" timestamp,
        "daysOnMarket" int,
        neighborhood text,
        "yearBuilt" int,
        "lotSize" text,
        parking text,
        heating text,
        cooling text,
        "virtualTour" text,
        "rawData" jsonb,
        "lastUpdated" timestamp,
        "createdAt" timestamp,
        "updatedAt" timestamp,
        "realtorId" text,
        "isActive" boolean,
        similarity_score float
      )
      LANGUAGE sql
      AS $$
        SELECT 
          p.id,
          p."mlsId",
          p."mlsNumber",
          p.address,
          p.city,
          p.province,
          p."postalCode",
          p.price,
          p.bedrooms,
          p.bathrooms,
          p."propertyType",
          p."squareFootage",
          p.status,
          p.images,
          p.description,
          p."listDate",
          p."daysOnMarket",
          p.neighborhood,
          p."yearBuilt",
          p."lotSize",
          p.parking,
          p.heating,
          p.cooling,
          p."virtualTour",
          p."rawData",
          p."lastUpdated",
          p."createdAt",
          p."updatedAt",
          p."realtorId",
          p."isActive",
          1 - (pe."combinedEmbedding" <=> query_embedding) as similarity_score
        FROM "Property" p
        LEFT JOIN "PropertyEmbedding" pe ON p."mlsId" = pe."mlsId"
        WHERE p."isActive" = true
          AND pe."combinedEmbedding" IS NOT NULL
          AND 1 - (pe."combinedEmbedding" <=> query_embedding) > match_threshold
        ORDER BY pe."combinedEmbedding" <=> query_embedding
        LIMIT match_count;
      $$;
    `

    const { data: _data, error } = await supabase.rpc('exec_sql', { sql })

    if (error) {
      console.error('❌ Error creating vector function:', error)
      return NextResponse.json(
        { error: 'Failed to create vector function', details: error.message },
        { status: 500 }
      )
    }

    console.log('✅ Vector search function created successfully')

    return NextResponse.json({
      success: true,
      message: 'Vector search function created successfully'
    })

  } catch (error) {
    console.error('❌ Error creating vector function:', error)
    return NextResponse.json(
      { error: 'Failed to create vector function' },
      { status: 500 }
    )
  }
}
