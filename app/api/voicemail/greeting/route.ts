import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const businessName = request.nextUrl.searchParams.get('business') || 'our business'
    
    // Create TwiML response for voicemail greeting
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">
    Thank you for calling ${businessName}. 
    Please leave your name, phone number, and a brief message, 
    and we'll get back to you as soon as possible.
  </Say>
  <Record 
    maxLength="300" 
    timeout="10" 
    transcribe="true" 
    transcribeCallback="${process.env.NEXTAUTH_URL}/api/webhooks/voicemail"
    action="${process.env.NEXTAUTH_URL}/api/webhooks/voicemail"
    method="POST"
  />
  <Say voice="alice">
    Thank you for your message. We'll get back to you soon. Goodbye.
  </Say>
  <Hangup/>
</Response>`

    return new NextResponse(twiml, {
      headers: {
        'Content-Type': 'text/xml',
      },
    })
  } catch (error) {
    console.error('Voicemail greeting error:', error)
    return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response><Say>Sorry, there was an error. Please try again later.</Say><Hangup/></Response>', {
      headers: {
        'Content-Type': 'text/xml',
      },
    })
  }
}
