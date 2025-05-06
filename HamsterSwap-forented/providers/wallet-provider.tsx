"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"

// 定义钱包类型
export type WalletType = "metamask" | "walletconnect" | "coinbase" | "trustwallet"

// 定义钱包连接状态
export type WalletState = {
  connected: boolean
  address: string | null
  chainId: number | null
  balance: string | null
  walletType: WalletType | null
  connecting: boolean
  error: string | null
}

// 定义上下文类型
type WalletContextType = {
  walletState: WalletState
  connectWallet: (walletType: WalletType) => Promise<void>
  disconnectWallet: () => void
  isWalletModalOpen: boolean
  setIsWalletModalOpen: (isOpen: boolean) => void
}

// 创建上下文
const WalletContext = createContext<WalletContextType | undefined>(undefined)

// 初始状态
const initialState: WalletState = {
  connected: false,
  address: null,
  chainId: null,
  balance: null,
  walletType: null,
  connecting: false,
  error: null,
}

// 钱包提供者组件
export function WalletProvider({ children }: { children: ReactNode }) {
  const [walletState, setWalletState] = useState<WalletState>(initialState)
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false)

  // 从本地存储恢复钱包状态
  useEffect(() => {
    const savedWallet = localStorage.getItem("hamsterswap_wallet")
    if (savedWallet) {
      try {
        const parsed = JSON.parse(savedWallet)
        // 只恢复必要的信息，不恢复连接状态
        setWalletState({
          ...initialState,
          walletType: parsed.walletType,
        })

        // 如果之前有连接过，尝试自动重连
        if (parsed.walletType) {
          connectWallet(parsed.walletType)
        }
      } catch (error) {
        console.error("Failed to parse saved wallet:", error)
        localStorage.removeItem("hamsterswap_wallet")
      }
    }
  }, [])

  // 连接钱包
  const connectWallet = async (walletType: WalletType) => {
    setWalletState((prev) => ({ ...prev, connecting: true, error: null }))

    try {
      // 模拟钱包连接过程
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // 检查是否有window.ethereum (MetaMask)
      if (walletType === "metamask" && !window.ethereum) {
        throw new Error("MetaMask is not installed")
      }

      // 生成模拟数据
      const mockAddress = `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`

      const mockChainId = 5 // Goerli testnet
      const mockBalance = (Math.random() * 10).toFixed(4)

      // 更新状态
      const newState = {
        connected: true,
        address: mockAddress,
        chainId: mockChainId,
        balance: mockBalance,
        walletType,
        connecting: false,
        error: null,
      }

      setWalletState(newState)

      // 保存到本地存储
      localStorage.setItem(
        "hamsterswap_wallet",
        JSON.stringify({
          walletType,
          address: mockAddress,
        }),
      )

      // 关闭钱包选择模态框
      setIsWalletModalOpen(false)
    } catch (error) {
      console.error("Wallet connection error:", error)
      setWalletState((prev) => ({
        ...prev,
        connecting: false,
        error: error instanceof Error ? error.message : "Failed to connect wallet",
      }))
    }
  }

  // 断开钱包连接
  const disconnectWallet = () => {
    setWalletState(initialState)
    localStorage.removeItem("hamsterswap_wallet")
  }

  return (
    <WalletContext.Provider
      value={{
        walletState,
        connectWallet,
        disconnectWallet,
        isWalletModalOpen,
        setIsWalletModalOpen,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

// 使用钱包上下文的钩子
export function useWallet() {
  const context = useContext(WalletContext)
  if (context === undefined) {
    throw new Error("useWallet must be used within a WalletProvider")
  }
  return context
}

// 为TypeScript添加window.ethereum类型
declare global {
  interface Window {
    ethereum?: any
  }
}
