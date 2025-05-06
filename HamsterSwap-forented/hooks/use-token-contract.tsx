"use client"

import { useState, useEffect, useCallback } from "react"
import { useWallet } from "@/contexts/wallet-context"
import { ethers } from "ethers"

// ERC20 ABI - 包含标准方法和扩展方法
const ERC20_ABI = [
  // 标准ERC20方法
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transferFrom(address sender, address recipient, uint256 amount) returns (bool)",

  // 扩展方法 - 所有者功能
  "function mint(address to, uint256 amount) returns (bool)",
  "function burn(uint256 amount) returns (bool)",
  "function pause() returns (bool)",
  "function unpause() returns (bool)",
  "function paused() view returns (bool)",
  "function owner() view returns (address)",

  // 事件
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)",
  "event Paused(address account)",
  "event Unpaused(address account)",
]

export function useTokenContract(tokenAddress: string) {
  const { walletState } = useWallet()
  const [tokenInfo, setTokenInfo] = useState<any>(null)
  const [balance, setBalance] = useState<string>("0")
  const [allowance, setAllowance] = useState<string>("0")
  const [totalSupply, setTotalSupply] = useState<string>("0")
  const [owner, setOwner] = useState<string | null>(null)
  const [isPaused, setIsPaused] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 获取代币信息
  const fetchTokenInfo = useCallback(async () => {
    if (!tokenAddress || !walletState.provider) return

    setIsLoading(true)
    setError(null)

    try {
      const provider = new ethers.BrowserProvider(walletState.provider)
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider)

      // 获取基本信息
      const [name, symbol, decimals, totalSupplyValue] = await Promise.all([
        tokenContract.name(),
        tokenContract.symbol(),
        tokenContract.decimals(),
        tokenContract.totalSupply(),
      ])

      // 尝试获取扩展信息
      let ownerAddress = null
      let pausedState = false

      try {
        ownerAddress = await tokenContract.owner()
      } catch (e) {
        console.log("Token does not have owner method")
      }

      try {
        pausedState = await tokenContract.paused()
      } catch (e) {
        console.log("Token does not have paused method")
      }

      setTokenInfo({
        address: tokenAddress,
        name,
        symbol,
        decimals,
        owner: ownerAddress, // 添加owner到tokenInfo
      })

      setTotalSupply(ethers.formatUnits(totalSupplyValue, decimals))
      setOwner(ownerAddress)
      setIsPaused(pausedState)
    } catch (err) {
      console.error("Error fetching token info:", err)
      setError("获取代币信息失败")
    } finally {
      setIsLoading(false)
    }
  }, [tokenAddress, walletState.provider])

  // 获取余额
  const fetchBalance = useCallback(async () => {
    if (!tokenAddress || !walletState.provider || !walletState.address || !tokenInfo) return

    setIsLoading(true)
    setError(null)

    try {
      const provider = new ethers.BrowserProvider(walletState.provider)
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider)
      const balanceValue = await tokenContract.balanceOf(walletState.address)
      setBalance(ethers.formatUnits(balanceValue, tokenInfo.decimals))
    } catch (err) {
      console.error("Error fetching token balance:", err)
      setError("获取余额失败")
    } finally {
      setIsLoading(false)
    }
  }, [tokenAddress, walletState.provider, walletState.address, tokenInfo])

  // 获取授权额度
  const fetchAllowance = useCallback(
    async (spender?: string) => {
      if (!tokenAddress || !walletState.provider || !walletState.address || !tokenInfo) return

      setIsLoading(true)
      setError(null)

      try {
        const provider = new ethers.BrowserProvider(walletState.provider)
        // 使用提供的spender或默认使用空投合约地址
        const spenderAddress = spender || "0x5FbDB2315678afecb367f032d93F642f64180aa3" // 空投合约地址

        console.log("获取授权额度:", {
          owner: walletState.address,
          spender: spenderAddress,
          tokenAddress,
        })

        const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider)
        const allowanceValue = await tokenContract.allowance(walletState.address, spenderAddress)

        console.log("原始授权额度:", allowanceValue.toString())
        const formattedAllowance = ethers.formatUnits(allowanceValue, tokenInfo.decimals)
        console.log("格式化后授权额度:", formattedAllowance)

        setAllowance(formattedAllowance)
      } catch (err) {
        console.error("获取授权额度失败详细错误:", err)
        setError(`获取授权额度失败: ${err.message || "未知错误"}`)
      } finally {
        setIsLoading(false)
      }
    },
    [tokenAddress, walletState.provider, walletState.address, tokenInfo],
  )

  // 转账代币
  const transfer = async (to: string, amount: string) => {
    if (!tokenAddress || !walletState.provider || !walletState.signer || !tokenInfo) {
      setError("请先连接钱包")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const provider = new ethers.BrowserProvider(walletState.provider)
      const signer = await provider.getSigner()
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer)

      // 将金额转换为正确的单位
      const amountInWei = ethers.parseUnits(amount, tokenInfo.decimals)

      // 发送交易
      const tx = await tokenContract.transfer(to, amountInWei)

      // 等待交易确认
      const receipt = await tx.wait()

      // 更新余额
      await fetchBalance()

      return receipt
    } catch (err) {
      console.error("Error transferring tokens:", err)
      setError("转账失败")
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // 授权代币
  const approve = async (amount: string, spender?: string) => {
    if (!tokenAddress || !walletState.provider || !tokenInfo) {
      setError("请先连接钱包")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const provider = new ethers.BrowserProvider(walletState.provider)
      // 获取签名者
      const signer = await provider.getSigner()

      // 使用提供的spender或默认使用空投合约地址
      const spenderAddress = spender || "0x5FbDB2315678afecb367f032d93F642f64180aa3" // 空投合约地址

      // 创建带有签名者的合约实例
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer)

      console.log("授权信息:", {
        tokenAddress,
        spenderAddress,
        amount,
        decimals: tokenInfo.decimals,
      })

      // 将金额转换为正确的单位
      const amountInWei = ethers.parseUnits(amount, tokenInfo.decimals)
      console.log("授权金额(Wei):", amountInWei.toString())

      // 发送交易
      const tx = await tokenContract.approve(spenderAddress, amountInWei)
      console.log("授权交易已发送:", tx.hash)

      // 等待交易确认
      const receipt = await tx.wait()
      console.log("授权交易已确认:", receipt)

      // 更新授权额度 - 添加延迟确保区块链状态更新
      setTimeout(() => {
        fetchAllowance(spenderAddress)
      }, 2000)

      return receipt
    } catch (err) {
      console.error("授权失败详细错误:", err)
      setError(`授权失败: ${err.message || "未知错误"}`)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // 铸造代币
  const mint = async (to: string, amount: string) => {
    if (!tokenAddress || !walletState.provider || !tokenInfo) {
      setError("请先连接钱包")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      console.log("开始铸造代币:", {
        tokenAddress,
        to,
        amount,
        decimals: tokenInfo.decimals,
      })

      const provider = new ethers.BrowserProvider(walletState.provider)
      const signer = await provider.getSigner()
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signer)

      // 检查当前用户是否是合约所有者
      const currentOwner = await tokenContract.owner()
      const currentSigner = await signer.getAddress()

      console.log("合约所有者:", currentOwner)
      console.log("当前签名者:", currentSigner)

      if (currentOwner.toLowerCase() !== currentSigner.toLowerCase()) {
        throw new Error("只有合约所有者才能铸造代币")
      }

      // 将金额转换为正确的单位
      const amountInWei = ethers.parseUnits(amount, tokenInfo.decimals)
      console.log("铸造金额(Wei):", amountInWei.toString())

      // 发送交易
      const mintTx = await tokenContract.mint(to, amountInWei)
      console.log("铸造交易已发送:", mintTx.hash)

      // 等待交易确认
      const receipt = await mintTx.wait()
      console.log("铸造交易已确认:", receipt)

      // 更新总供应量和余额
      await fetchTokenInfo()
      await fetchBalance()

      return receipt
    } catch (err) {
      console.error("铸造失败详细错误:", err)
      setError(`铸造失败: ${err.message || "未知错误"}`)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // 销毁代币
  const burn = async (amount: string) => {
    if (!tokenAddress || !walletState.provider || !walletState.signer || !tokenInfo) {
      setError("请先连接钱包")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const provider = new ethers.BrowserProvider(walletState.provider)
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider)
      const signer = await provider.getSigner()
      const tokenWithSigner = tokenContract.connect(signer)

      // 将金额转换为正确的单位
      const amountInWei = ethers.parseUnits(amount, tokenInfo.decimals)

      // 发送交易
      const tx = await tokenWithSigner.burn(amountInWei)

      // 等待交易确认
      const receipt = await tx.wait()

      // 更新总供应量和余额
      await fetchTokenInfo()
      await fetchBalance()

      return receipt
    } catch (err) {
      console.error("Error burning tokens:", err)
      setError("销毁失败")
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // 暂停代币
  const pause = async () => {
    if (!tokenAddress || !walletState.provider || !walletState.signer) {
      setError("请先连接钱包")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const provider = new ethers.BrowserProvider(walletState.provider)
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider)
      const tokenWithSigner = tokenContract.connect(walletState.signer)

      // 发送交易
      const tx = await tokenWithSigner.pause()

      // 等待交易确认
      const receipt = await tx.wait()

      // 更新暂停状态
      setIsPaused(true)

      return receipt
    } catch (err) {
      console.error("Error pausing token:", err)
      setError("暂停失败")
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // 恢复代币
  const unpause = async () => {
    if (!tokenAddress || !walletState.provider || !walletState.signer) {
      setError("请先连接钱包")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const provider = new ethers.BrowserProvider(walletState.provider)
      const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider)
      const tokenWithSigner = tokenContract.connect(walletState.signer)

      // 发送交易
      const tx = await tokenWithSigner.unpause()

      // 等待交易确认
      const receipt = await tx.wait()

      // 更新暂停状态
      setIsPaused(false)

      return receipt
    } catch (err) {
      console.error("Error unpausing token:", err)
      setError("恢复失败")
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // 初始加载
  useEffect(() => {
    if (tokenAddress) {
      fetchTokenInfo()
    }
  }, [fetchTokenInfo, tokenAddress])

  // 钱包连接状态变化时获取余额和授权额度
  useEffect(() => {
    if (tokenAddress && walletState.connected && walletState.address && tokenInfo) {
      fetchBalance()
      fetchAllowance()
    }
  }, [fetchBalance, fetchAllowance, tokenAddress, walletState.connected, walletState.address, tokenInfo])

  return {
    tokenInfo,
    balance,
    allowance,
    totalSupply,
    owner,
    isPaused,
    isLoading,
    error,
    fetchTokenInfo,
    fetchBalance,
    fetchAllowance,
    transfer,
    approve,
    mint,
    burn,
    pause,
    unpause,
  }
}
