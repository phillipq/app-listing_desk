import { PrismaClient } from '@prisma/client'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - Module resolution issue with prisma-extension-pgvector package types
import { withPGVector as _withPGVector } from 'prisma-extension-pgvector'

// Create Prisma client with vector extension
// Note: To use vector extension, configure with modelName and vectorFieldName:
// .$extends(_withPGVector({ modelName: 'PropertyEmbedding', vectorFieldName: 'combined_embedding' }))
const prisma = new PrismaClient()

export { prisma }
