"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Button } from "@/components/ui/button"
import { useWallet } from "@/contexts/wallet-context"
import { Copy, Check, LogOut, ExternalLink, ChevronDown, RefreshCw } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function WalletButton() {
  const { walletState, disconnectWallet, setIsWalletModalOpen, switchToLocalNetwork } = useWallet()
  const [copied, setCopied] = useState(false)
  const [switching, setSwitching] = useState(false)
  const [mounted, setMounted] = useState(false)

  // 组件挂载后设置mounted为true
  useEffect(() => {
    setMounted(true)
  }, [])

  // 如果组件未挂载，返回一个占位按钮
  if (!mounted) {
    return (
      <Button
        className="rounded-full bg-gradient-to-r from-[#EACC91] to-[#987A3F] text-[#523805] font-medium shadow-md px-6 py-2 border-2 border-white opacity-0"
        aria-hidden="true"
      >
        <span className="flex items-center gap-2">
          <span>🐹</span> Connect Wallet
        </span>
      </Button>
    )
  }

  // 处理复制地址
  const handleCopyAddress = () => {
    if (walletState.address) {
      navigator.clipboard.writeText(walletState.address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // 格式化地址显示
  const formatAddress = (address: string) => {
    return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`
  }

  // 查看区块浏览器
  const viewOnExplorer = () => {
    if (walletState.address) {
      // 对于本地网络，我们可以使用本地区块浏览器（如果有）
      // 这里我们假设没有本地区块浏览器
      alert("Local blockchain explorer not available")
    }
  }

  // 切换到本地网络
  const handleSwitchToLocalNetwork = async () => {
    setSwitching(true)
    try {
      await switchToLocalNetwork()
    } finally {
      setSwitching(false)
    }
  }

  if (!walletState.connected) {
    return (
      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
        <Button
          onClick={() => setIsWalletModalOpen(true)}
          className="rounded-full bg-gradient-to-r from-[#EACC91] to-[#987A3F] hover:from-[#987A3F] hover:to-[#523805] text-[#523805] hover:text-white font-medium shadow-md hover:shadow-lg transition-all duration-300 px-6 py-2 border-2 border-white"
        >
          <span className="flex items-center gap-2">
            <span>🐹</span> Connect Wallet
          </span>
        </Button>
      </motion.div>
    )
  }

  return (
    <div className="flex items-center gap-2">
      {walletState.balance && (
        <motion.div
          className="hidden md:flex items-center gap-1 rounded-full bg-gradient-to-r from-[#EACC91] to-[#987A3F] px-4 py-2 text-[#523805] font-medium"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="text-sm">{walletState.balance} ETH</span>
        </motion.div>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button className="rounded-full bg-gradient-to-r from-[#EACC91] to-[#987A3F] hover:from-[#987A3F] hover:to-[#523805] text-[#523805] hover:text-white font-medium shadow-md hover:shadow-lg transition-all duration-300 px-4 py-2 border-2 border-white">
              <span className="flex items-center gap-2">
                <span>🐹</span>
                {walletState.address && formatAddress(walletState.address)}
                <ChevronDown className="h-4 w-4" />
              </span>
            </Button>
          </motion.div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 rounded-xl p-2 border border-[#EACC91]">
          <div className="px-2 py-1.5 text-sm font-medium text-[#523805]">
            {walletState.address && formatAddress(walletState.address)}
          </div>
          <DropdownMenuSeparator className="bg-[#EACC91]/30" />
          <DropdownMenuItem
            className="cursor-pointer flex items-center gap-2 rounded-lg hover:bg-[#EACC91]/20 text-[#523805]"
            onClick={handleCopyAddress}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            <span>{copied ? "Copied!" : "Copy Address"}</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer flex items-center gap-2 rounded-lg hover:bg-[#EACC91]/20 text-[#523805]"
            onClick={viewOnExplorer}
          >
            <ExternalLink className="h-4 w-4" />
            <span>View on Explorer</span>
          </DropdownMenuItem>
          <DropdownMenuItem
            className="cursor-pointer flex items-center gap-2 rounded-lg hover:bg-[#EACC91]/20 text-[#523805]"
            onClick={handleSwitchToLocalNetwork}
          >
            <RefreshCw className={`h-4 w-4 ${switching ? "animate-spin" : ""}`} />
            <span>Switch to Local Network</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-[#EACC91]/30" />
          <DropdownMenuItem
            className="cursor-pointer flex items-center gap-2 rounded-lg hover:bg-[#EACC91]/20 text-[#523805]"
            onClick={disconnectWallet}
          >
            <LogOut className="h-4 w-4" />
            <span>Disconnect</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
