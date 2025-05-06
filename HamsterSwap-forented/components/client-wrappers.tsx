"use client"

import { useState, useEffect, type ReactNode } from "react"
import dynamic from "next/dynamic"

// Dynamically import components with ssr: false
const WalletModal = dynamic(() => import("@/components/wallet-modal"), { ssr: false })
const LocalNetworkBanner = dynamic(() => import("@/components/local-network-banner"), { ssr: false })

export function ClientWrappers({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <>
      {children}
      {mounted && (
        <>
          <WalletModal />
          <LocalNetworkBanner />
        </>
      )}
    </>
  )
}
