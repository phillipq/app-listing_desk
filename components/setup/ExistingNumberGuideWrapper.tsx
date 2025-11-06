'use client'

import dynamic from 'next/dynamic'

// Dynamically import the actual guide page to avoid SSR issues
const ExistingNumberGuide = dynamic(() => import('../../app/(dashboard)/communication/existing-number-guide/page'), { ssr: false })

export default function ExistingNumberGuideWrapper() {
  return <ExistingNumberGuide />
}
