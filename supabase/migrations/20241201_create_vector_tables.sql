-- Create property embeddings table for vector search
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

-- Create vector similarity index for fast searches
CREATE INDEX IF NOT EXISTS property_embeddings_combined_embedding_idx 
ON property_embeddings USING ivfflat (combined_embedding vector_l2_ops)
WITH (lists = 100);

-- Create RPC function for similarity search
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

-- Create function to get embedding by mls_id
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
