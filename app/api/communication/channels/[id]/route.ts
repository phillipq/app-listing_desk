import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { id } = await params

    // Verify channel belongs to user
    const channel = await prisma.communicationChannel.findFirst({
      where: {
        id,
        userId: user.id
      }
    })

    if (!channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 })
    }

    // Delete the channel (this will cascade to messages and conversations)
    await prisma.communicationChannel.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Channel deleted successfully' })
  } catch (error) {
    console.error('Error deleting channel:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
