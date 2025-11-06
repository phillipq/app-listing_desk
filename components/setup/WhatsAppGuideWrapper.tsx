'use client'

import dynamic from 'next/dynamic'

// Dynamically import the actual guide page to avoid SSR issues
const WhatsAppGuide = dynamic(() => import('../../app/(dashboard)/communication/whatsapp-guide/page'), { ssr: false })

export default function WhatsAppGuideWrapper() {
  return <WhatsAppGuide />
}
