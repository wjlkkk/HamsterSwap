"use client"

import { useState } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { AlertCircle, Loader2 } from "lucide-react"
import { useWallet, type WalletType } from "@/contexts/wallet-context"

// 钱包选项数据
const walletOptions = [
  {
    id: "metamask",
    name: "MetaMask",
    icon: "/wallets/metamask.svg",
    description: "Connect to your MetaMask Wallet",
    popular: true,
  },
  {
    id: "walletconnect",
    name: "WalletConnect",
    icon: "/wallets/walletconnect.svg",
    description: "Scan with WalletConnect to connect",
    popular: true,
  },
  {
    id: "coinbase",
    name: "Coinbase Wallet",
    icon: "/wallets/coinbase.svg",
    description: "Connect to your Coinbase Wallet",
    popular: false,
  },
  {
    id: "trustwallet",
    name: "Trust Wallet",
    icon: "/wallets/trustwallet.svg",
    description: "Connect to your Trust Wallet",
    popular: false,
  },
]

export default function WalletModal() {
  const { walletState, connectWallet, isWalletModalOpen, setIsWalletModalOpen } = useWallet()
  const [showAllWallets, setShowAllWallets] = useState(false)

  // 过滤钱包选项
  const filteredWallets = showAllWallets ? walletOptions : walletOptions.filter((wallet) => wallet.popular)

  // 处理钱包连接
  const handleConnectWallet = (walletId: string) => {
    connectWallet(walletId as WalletType)
  }

  return (
    <Dialog open={isWalletModalOpen} onOpenChange={setIsWalletModalOpen}>
      <DialogContent className="sm:max-w-md rounded-2xl border border-[#EACC91]">
        <DialogHeader>
          <DialogTitle className="text-[#523805] text-xl">Connect Wallet</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          {walletState.error && (
            <div className="mb-4 p-3 bg-red-50 rounded-lg border border-red-100 flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm text-red-700 font-medium">Connection Error</p>
                <p className="text-xs text-red-600 mt-1">{walletState.error}</p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <AnimatePresence>
              {filteredWallets.map((wallet) => (
                <motion.div
                  key={wallet.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button
                    variant="outline"
                    className="w-full justify-between items-center h-auto py-3 px-4 border-[#EACC91] hover:bg-[#EACC91]/20 hover:text-[#523805] text-[#523805]/80 rounded-xl"
                    onClick={() => handleConnectWallet(wallet.id)}
                    disabled={walletState.connecting}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative h-8 w-8 rounded-full overflow-hidden bg-white p-1 shadow-sm">
                        <Image
                          src={wallet.icon || "/placeholder.svg"}
                          alt={wallet.name}
                          width={32}
                          height={32}
                          className="object-contain"
                          onError={(e) => {
                            // 如果图片加载失败，使用占位符
                            e.currentTarget.src = "/placeholder.svg?height=32&width=32"
                          }}
                        />
                      </div>
                      <div className="text-left">
                        <div className="font-medium">{wallet.name}</div>
                        <div className="text-xs text-[#523805]/60">{wallet.description}</div>
                      </div>
                    </div>
                    {walletState.connecting && walletState.walletType === wallet.id && (
                      <Loader2 className="h-5 w-5 animate-spin text-[#987A3F]" />
                    )}
                  </Button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {!showAllWallets && walletOptions.some((wallet) => !wallet.popular) && (
            <Button
              variant="ghost"
              className="w-full mt-3 text-[#987A3F] hover:text-[#523805] hover:bg-[#EACC91]/20"
              onClick={() => setShowAllWallets(true)}
            >
              Show More Options
            </Button>
          )}

          <div className="mt-6 text-center text-xs text-[#523805]/60">
            <p>
              By connecting a wallet, you agree to HamsterSwap's{" "}
              <a href="#" className="text-[#987A3F] hover:underline">
                Terms of Service
              </a>{" "}
              and{" "}
              <a href="#" className="text-[#987A3F] hover:underline">
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
