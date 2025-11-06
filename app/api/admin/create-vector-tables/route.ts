import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../../../lib/auth'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(_request: NextRequest) {
  try {
    // Check if user is admin
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { prisma } = await import('../../../../lib/prisma')
    const user = await prisma.realtor.findUnique({
      where: { id: session.user.id },
      select: { isAdmin: true }
    })

    if (!user?.isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    console.log('🔧 Creating vector tables in Supabase...')

    // Create property embeddings table
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS property_embeddings (
        id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        mls_id text UNIQUE NOT NULL,
        property_data jsonb,
        description_embedding vector(1536),
        features_embedding vector(1536),
        combined_embedding vector(1536),
        created_at timestamp DEFAULT now(),
        updated_at timestamp DEFAULT now()
      );
    `

    const { error: tableError } = await supabase.rpc('exec_sql', {
      sql: createTableSQL
    })

    if (tableError) {
      console.error('❌ Error creating table:', tableError)
      return NextResponse.json({ 
        error: 'Failed to create table', 
        details: tableError.message 
      }, { status: 500 })
    }

    // Create vector similarity index
    const createIndexSQL = `
      CREATE INDEX IF NOT EXISTS property_embeddings_combined_embedding_idx 
      ON property_embeddings USING ivfflat (combined_embedding vector_l2_ops)
      WITH (lists = 100);
    `

    const { error: indexError } = await supabase.rpc('exec_sql', {
      sql: createIndexSQL
    })

    if (indexError) {
      console.error('❌ Error creating index:', indexError)
      return NextResponse.json({ 
        error: 'Failed to create index', 
        details: indexError.message 
      }, { status: 500 })
    }

    // Create RPC function for similarity search
    const createFunctionSQL = `
      CREATE OR REPLACE FUNCTION match_property_embeddings(
        query_embedding vector(1536),
        match_threshold float DEFAULT 0.8,
        match_count int DEFAULT 5
      )
      RETURNS TABLE (
        mls_id text,
        property_data jsonb,
        similarity float
      )
      LANGUAGE sql
      AS $$
        SELECT 
          pe.mls_id,
          pe.property_data,
          1 - (pe.combined_embedding <=> query_embedding) as similarity
        FROM property_embeddings pe
        WHERE 1 - (pe.combined_embedding <=> query_embedding) > match_threshold
        ORDER BY pe.combined_embedding <=> query_embedding
        LIMIT match_count;
      $$;
    `

    const { error: functionError } = await supabase.rpc('exec_sql', {
      sql: createFunctionSQL
    })

    if (functionError) {
      console.error('❌ Error creating function:', functionError)
      return NextResponse.json({ 
        error: 'Failed to create function', 
        details: functionError.message 
      }, { status: 500 })
    }

    // Create function to get embedding by mls_id
    const createGetFunctionSQL = `
      CREATE OR REPLACE FUNCTION get_property_embedding(mls_id_param text)
      RETURNS TABLE (
        mls_id text,
        property_data jsonb,
        description_embedding vector(1536),
        features_embedding vector(1536),
        combined_embedding vector(1536)
      )
      LANGUAGE sql
      AS $$
        SELECT 
          pe.mls_id,
          pe.property_data,
          pe.description_embedding,
          pe.features_embedding,
          pe.combined_embedding
        FROM property_embeddings pe
        WHERE pe.mls_id = mls_id_param;
      $$;
    `

    const { error: getFunctionError } = await supabase.rpc('exec_sql', {
      sql: createGetFunctionSQL
    })

    if (getFunctionError) {
      console.error('❌ Error creating get function:', getFunctionError)
      return NextResponse.json({ 
        error: 'Failed to create get function', 
        details: getFunctionError.message 
      }, { status: 500 })
    }

    console.log('✅ Vector tables and functions created successfully!')

    return NextResponse.json({ 
      success: true, 
      message: 'Vector tables and functions created successfully' 
    })

  } catch (error) {
    console.error('❌ Error creating vector tables:', error)
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 })
  }
}
