"use client"

import { useState, useEffect } from "react"
import { AlertCircle, X } from "lucide-react"
import { useWallet } from "@/contexts/wallet-context"
import { Button } from "@/components/ui/button"

export default function LocalNetworkBanner() {
  const [dismissed, setDismissed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { walletState, switchToLocalNetwork } = useWallet()

  // 组件挂载后设置mounted为true
  useEffect(() => {
    setMounted(true)
  }, [])

  // 如果组件未挂载、已关闭或已连接到本地网络，不显示
  if (!mounted || dismissed || walletState.chainId === 31337) {
    return null
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#EACC91] p-3 z-50">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-[#523805]" />
          <span className="text-sm text-[#523805]">
            You are not connected to the local blockchain network. Some features may not work correctly.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="border-[#523805] text-[#523805] hover:bg-[#523805] hover:text-white"
            onClick={() => switchToLocalNetwork()}
          >
            Switch to Local Network
          </Button>
          <button className="text-[#523805] hover:text-[#523805]/70" onClick={() => setDismissed(true)}>
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
