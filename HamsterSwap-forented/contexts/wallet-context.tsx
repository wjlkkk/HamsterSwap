"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { ethers } from "ethers"

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
  provider: any | null
  signer: any | null
}

// 定义上下文类型
type WalletContextType = {
  walletState: WalletState
  connectWallet: (walletType: WalletType) => Promise<void>
  disconnectWallet: () => void
  isWalletModalOpen: boolean
  setIsWalletModalOpen: (isOpen: boolean) => void
  switchToLocalNetwork: () => Promise<void>
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
  provider: null,
  signer: null,
}

// 本地区块链网络配置
const LOCAL_CHAIN_ID = 31337 // Hardhat默认chainId
const LOCAL_NETWORK = {
  chainId: `0x${LOCAL_CHAIN_ID.toString(16)}`, // 十六进制格式
  chainName: "Localhost 8545",
  nativeCurrency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: ["http://localhost:8545"],
  blockExplorerUrls: [],
}

// 检查是否在浏览器环境中
const isBrowser = typeof window !== "undefined"

// 钱包提供者组件
export function WalletProvider({ children }: { children: ReactNode }) {
  const [walletState, setWalletState] = useState<WalletState>(initialState)
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  // 组件挂载后设置mounted为true
  useEffect(() => {
    setMounted(true)
  }, [])

  // 从本地存储恢复钱包状态
  useEffect(() => {
    if (!isBrowser || !mounted) return

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
  }, [mounted])

  // 切换到本地网络
  const switchToLocalNetwork = async () => {
    if (!isBrowser || !window.ethereum) {
      console.error("MetaMask is not installed")
      return
    }

    try {
      // 尝试切换到本地网络
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: LOCAL_NETWORK.chainId }],
      })
    } catch (switchError: any) {
      // 如果网络不存在，则添加网络
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [LOCAL_NETWORK],
          })
        } catch (addError) {
          console.error("Failed to add local network:", addError)
        }
      } else {
        console.error("Failed to switch to local network:", switchError)
      }
    }
  }

  // 连接钱包
  const connectWallet = async (walletType: WalletType) => {
    if (!isBrowser) return

    setWalletState((prev) => ({ ...prev, connecting: true, error: null }))

    try {
      // 检查是否有window.ethereum (MetaMask)
      if (walletType === "metamask" && !window.ethereum) {
        throw new Error("MetaMask is not installed")
      }

      // 真实连接逻辑
      if (window.ethereum) {
        // 请求账户访问
        const accounts = await window.ethereum.request({ method: "eth_requestAccounts" })

        if (accounts.length === 0) {
          throw new Error("No accounts found")
        }

        // 获取当前链ID
        const chainId = await window.ethereum.request({ method: "eth_chainId" })
        const chainIdNumber = Number.parseInt(chainId, 16)

        // 如果不是本地网络，尝试切换
        if (chainIdNumber !== LOCAL_CHAIN_ID) {
          await switchToLocalNetwork()
        }

        // 创建provider和signer
        const provider = new ethers.BrowserProvider(window.ethereum)
        const signer = await provider.getSigner()

        // 获取余额
        const balance = await provider.getBalance(accounts[0])
        const balanceInEth = ethers.formatEther(balance)

        // 更新状态
        const newState = {
          connected: true,
          address: accounts[0],
          chainId: chainIdNumber,
          balance: Number(balanceInEth).toFixed(4),
          walletType,
          connecting: false,
          error: null,
          provider: window.ethereum,
          signer,
        }

        setWalletState(newState)

        // 保存到本地存储
        localStorage.setItem(
          "hamsterswap_wallet",
          JSON.stringify({
            walletType,
            address: accounts[0],
          }),
        )

        // 设置事件监听器
        window.ethereum.on("accountsChanged", handleAccountsChanged)
        window.ethereum.on("chainChanged", handleChainChanged)
        window.ethereum.on("disconnect", handleDisconnect)

        // 关闭钱包选择模态框
        setIsWalletModalOpen(false)

        return
      }

      // 如果没有真实连接，使用模拟数据
      const mockAddress = `0x${Array.from({ length: 40 }, () => Math.floor(Math.random() * 16).toString(16)).join("")}`
      const mockChainId = LOCAL_CHAIN_ID
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
        provider: null,
        signer: null,
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

  // 处理账户变更
  const handleAccountsChanged = (accounts: string[]) => {
    if (!isBrowser) return

    if (accounts.length === 0) {
      // 用户断开了所有账户
      disconnectWallet()
    } else {
      // 账户已更改，更新状态
      setWalletState((prev) => ({
        ...prev,
        address: accounts[0],
      }))
    }
  }

  // 处理链变更
  const handleChainChanged = (chainId: string) => {
    if (!isBrowser) return

    // 当链变更时，刷新页面是最安全的做法
    window.location.reload()
  }

  // 处理断开连接
  const handleDisconnect = () => {
    if (!isBrowser) return

    disconnectWallet()
  }

  // 断开钱包连接
  const disconnectWallet = () => {
    if (!isBrowser) return

    // 移除事件监听器
    if (window.ethereum) {
      window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
      window.ethereum.removeListener("chainChanged", handleChainChanged)
      window.ethereum.removeListener("disconnect", handleDisconnect)
    }

    setWalletState(initialState)
    localStorage.removeItem("hamsterswap_wallet")
  }

  // 如果不在浏览器环境中，提供一个基本的上下文值
  if (!isBrowser || !mounted) {
    return (
      <WalletContext.Provider
        value={{
          walletState: initialState,
          connectWallet: async () => {},
          disconnectWallet: () => {},
          isWalletModalOpen: false,
          setIsWalletModalOpen: () => {},
          switchToLocalNetwork: async () => {},
        }}
      >
        {children}
      </WalletContext.Provider>
    )
  }

  return (
    <WalletContext.Provider
      value={{
        walletState,
        connectWallet,
        disconnectWallet,
        isWalletModalOpen,
        setIsWalletModalOpen,
        switchToLocalNetwork,
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
