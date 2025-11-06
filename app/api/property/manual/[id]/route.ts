import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if the property exists and belongs to the current user
    const property = await prisma.property.findFirst({
      where: {
        id,
        realtorId: session.user.id,
        mlsId: {
          startsWith: 'TLD'
        }
      }
    })

    if (!property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 })
    }

    // Delete the property
    await prisma.property.delete({
      where: {
        id
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting manual property:', error)
    return NextResponse.json({ error: 'Failed to delete property' }, { status: 500 })
  }
}
