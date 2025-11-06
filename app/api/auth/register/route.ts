import bcrypt from "bcryptjs"
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "../../../../lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, domain } = await request.json() as {
      name: string
      email: string
      password: string
      domain: string
    }

    // Validate required fields
    if (!name || !email || !password || !domain) {
      return NextResponse.json(
        { error: "All fields are required" },
        { status: 400 }
      )
    }

    // Check if email already exists
    const existingRealtor = await prisma.realtor.findUnique({
      where: { email }
    })

    if (existingRealtor) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 400 }
      )
    }

    // Check if domain already exists
    const existingDomain = await prisma.realtor.findUnique({
      where: { domain }
    })

    if (existingDomain) {
      return NextResponse.json(
        { error: "Domain already exists" },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create realtor with trial status
    // Trial period will be managed by Stripe when subscription is created
    const realtor = await prisma.realtor.create({
      data: {
        name,
        email,
        password: hashedPassword,
        domain,
        isAdmin: false,
        isActive: true,
        subscriptionStatus: 'trial' // Set to trial status - will convert to 'active' after Stripe checkout
      }
    })

    return NextResponse.json(
      { 
        message: "Account created successfully",
        realtor: {
          id: realtor.id,
          name: realtor.name,
          email: realtor.email,
          domain: realtor.domain,
        }
      },
      { status: 201 }
    )

  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
