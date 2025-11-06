'use client'

import dynamic from 'next/dynamic'

// Dynamically import the actual guide page to avoid SSR issues
const InstagramGuide = dynamic(() => import('../../app/(dashboard)/communication/instagram-guide/page'), { ssr: false })

export default function InstagramGuideWrapper() {
  return <InstagramGuide />
}
