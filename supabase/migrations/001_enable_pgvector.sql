-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create a table for property embeddings
CREATE TABLE property_embeddings (
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
CREATE INDEX ON property_embeddings USING ivfflat (description_embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX ON property_embeddings USING ivfflat (features_embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX ON property_embeddings USING ivfflat (combined_embedding vector_cosine_ops) WITH (lists = 100);

-- Create index on mls_id for fast lookups
CREATE INDEX ON property_embeddings (mls_id);

-- Add RLS (Row Level Security) for multi-tenancy
ALTER TABLE property_embeddings ENABLE ROW LEVEL SECURITY;

-- Create policy for realtors to access their own data
CREATE POLICY "Realtors can access their property embeddings" ON property_embeddings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM realtors r 
      WHERE r.id = auth.uid()
    )
  );
