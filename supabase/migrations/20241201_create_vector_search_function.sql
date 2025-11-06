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
