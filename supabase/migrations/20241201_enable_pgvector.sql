-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create a table for property embeddings
CREATE TABLE IF NOT EXISTS property_embeddings (
  id SERIAL PRIMARY KEY,
  mls_id TEXT UNIQUE NOT NULL,
  property_data JSONB NOT NULL,
  description_embedding vector(1536), -- OpenAI text-embedding-3-small dimensions
  features_embedding vector(1536),
  combined_embedding vector(1536),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for fast similarity search
CREATE INDEX IF NOT EXISTS idx_property_embeddings_description 
  ON property_embeddings USING ivfflat (description_embedding vector_cosine_ops) 
  WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_property_embeddings_features 
  ON property_embeddings USING ivfflat (features_embedding vector_cosine_ops) 
  WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_property_embeddings_combined 
  ON property_embeddings USING ivfflat (combined_embedding vector_cosine_ops) 
  WITH (lists = 100);

-- Create index on mls_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_property_embeddings_mls_id 
  ON property_embeddings (mls_id);

-- Add RLS (Row Level Security) for multi-tenancy
ALTER TABLE property_embeddings ENABLE ROW LEVEL SECURITY;

-- Create policy for realtors to access their own data
-- Note: This will be updated when we implement proper realtor isolation
CREATE POLICY IF NOT EXISTS "Allow all access to property embeddings" ON property_embeddings
  FOR ALL USING (true);
