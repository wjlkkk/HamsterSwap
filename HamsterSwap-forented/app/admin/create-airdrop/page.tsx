"use client"

import { useState } from "react"
import { useWallet } from "@/contexts/wallet-context"
import { useAdmin } from "@/contexts/admin-context"
import { ethers } from "ethers"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import Navbar from "@/components/navbar"
import { AIRDROP_CONTRACT_ADDRESS, AIRDROP_ABI } from "@/contracts/airdrop-contract"
import { useToast } from "@/hooks/use-toast"
import Link from "next/link"

// 代币ABI
const TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
]

export default function CreateAirdrop() {
  const { walletState } = useWallet()
  const { isAdmin } = useAdmin()
  const { toast } = useToast()
  const [tokenAddress, setTokenAddress] = useState("")
  const [customTokenAddress, setCustomTokenAddress] = useState("")
  const [amount, setAmount] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [tokenInfo, setTokenInfo] = useState<any>(null)
  const [balance, setBalance] = useState<string | null>(null)
  const [allowance, setAllowance] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [airdropId, setAirdropId] = useState<number | null>(null)

  // 获取代币信息
  const fetchTokenInfo = async () => {
    if (!walletState.provider || !walletState.address) {
      setError("请先连接钱包")
      return
    }

    const actualTokenAddress = tokenAddress === "custom" ? customTokenAddress : tokenAddress
    if (!actualTokenAddress) {
      setError("请选择代币")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const provider = new ethers.BrowserProvider(walletState.provider)
      const tokenContract = new ethers.Contract(actualTokenAddress, TOKEN_ABI, provider)

      // 获取代币信息
      const [name, symbol, decimals, balance, allowance] = await Promise.all([
        tokenContract.name(),
        tokenContract.symbol(),
        tokenContract.decimals(),
        tokenContract.balanceOf(walletState.address),
        tokenContract.allowance(walletState.address, AIRDROP_CONTRACT_ADDRESS),
      ])

      const tokenInfo = {
        name,
        symbol,
        decimals,
      }

      setTokenInfo(tokenInfo)
      setBalance(ethers.formatUnits(balance, decimals))
      setAllowance(ethers.formatUnits(allowance, decimals))

      return { tokenContract, provider, decimals }
    } catch (err: any) {
      console.error("获取代币信息失败:", err)
      setError(`获取代币信息失败: ${err.message || "未知错误"}`)
      setTokenInfo(null)
      setBalance(null)
      setAllowance(null)
      return null
    } finally {
      setIsLoading(false)
    }
  }

  // 授权代币
  const approveToken = async () => {
    if (!walletState.provider || !walletState.signer || !walletState.address) {
      setError("请先连接钱包")
      return
    }

    const actualTokenAddress = tokenAddress === "custom" ? customTokenAddress : tokenAddress
    if (!actualTokenAddress || !amount) {
      setError("请填写代币地址和金额")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await fetchTokenInfo()
      if (!result) return

      const { tokenContract, provider, decimals } = result
      const signer = await provider.getSigner()
      const tokenWithSigner = tokenContract.connect(signer)

      // 将金额转换为正确的单位
      const parsedAmount = ethers.parseUnits(amount, decimals)

      // 发送授权交易
      const tx = await tokenWithSigner.approve(AIRDROP_CONTRACT_ADDRESS, parsedAmount)

      toast({
        title: "授权交易已发送",
        description: "请等待交易确认",
      })

      // 等待交易确认
      await tx.wait()

      toast({
        title: "授权成功",
        description: `已成功授权 ${amount} ${tokenInfo.symbol} 给空投合约`,
      })

      // 重新获取授权额度
      const newAllowance = await tokenContract.allowance(walletState.address, AIRDROP_CONTRACT_ADDRESS)
      setAllowance(ethers.formatUnits(newAllowance, decimals))

      return true
    } catch (err: any) {
      console.error("授权代币失败:", err)
      setError(`授权代币失败: ${err.message || "未知错误"}`)
      toast({
        title: "授权失败",
        description: `授权代币失败: ${err.message || "未知错误"}`,
        variant: "destructive",
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // 创建空投
  const createAirdrop = async () => {
    if (!walletState.provider || !walletState.signer || !walletState.address) {
      setError("请先连接钱包")
      return
    }

    const actualTokenAddress = tokenAddress === "custom" ? customTokenAddress : tokenAddress
    if (!actualTokenAddress || !amount || !startTime || !endTime) {
      setError("请填写所有必填字段")
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(false)
    setAirdropId(null)

    try {
      const result = await fetchTokenInfo()
      if (!result) return

      const { provider, decimals } = result

      // 检查授权额度
      if (Number.parseFloat(allowance || "0") < Number.parseFloat(amount)) {
        toast({
          title: "授权额度不足",
          description: "需要先授权代币",
        })
        const approved = await approveToken()
        if (!approved) {
          setError("授权失败，无法继续创建空投")
          return
        }
      }

      // 解析参数
      const parsedAmount = ethers.parseUnits(amount, decimals)
      const parsedStartTime = Math.floor(new Date(startTime).getTime() / 1000)
      const parsedEndTime = Math.floor(new Date(endTime).getTime() / 1000)
      const currentTime = Math.floor(Date.now() / 1000)

      // 验证时间参数
      if (parsedStartTime <= currentTime) {
        setError("开始时间必须晚于当前时间")
        setIsLoading(false)
        return
      }

      if (parsedEndTime <= parsedStartTime) {
        setError("结束时间必须晚于开始时间")
        setIsLoading(false)
        return
      }

      // 创建空投合约实例
      const signer = await provider.getSigner()
      const airdropContract = new ethers.Contract(AIRDROP_CONTRACT_ADDRESS, AIRDROP_ABI, signer)

      // 添加默认的merkleRoot参数 (ethers.ZeroHash)
      const merkleRoot = ethers.ZeroHash // 默认空merkle root

      // 发送创建空投交易
      const tx = await airdropContract.createAirdrop(
        actualTokenAddress,
        parsedAmount,
        parsedStartTime,
        parsedEndTime,
        merkleRoot,
      )

      toast({
        title: "交易已发送",
        description: "请等待交易确认",
      })

      // 等待交易确认
      const receipt = await tx.wait()

      // 从事件中获取空投ID
      const airdropCreatedEvent = receipt?.logs
        .filter((log: any) => {
          try {
            const parsedLog = airdropContract.interface.parseLog({
              topics: log.topics as string[],
              data: log.data,
            })
            return parsedLog?.name === "AirdropCreated"
          } catch (e) {
            return false
          }
        })
        .map((log: any) => {
          const parsedLog = airdropContract.interface.parseLog({
            topics: log.topics as string[],
            data: log.data,
          })
          return {
            airdropId: Number(parsedLog.args[0]),
            tokenAddress: parsedLog.args[1],
            totalAmount: parsedLog.args[2],
          }
        })[0]

      if (airdropCreatedEvent) {
        setAirdropId(airdropCreatedEvent.airdropId)
        setSuccess(true)
        toast({
          title: "空投创建成功",
          description: `空投ID: ${airdropCreatedEvent.airdropId}`,
        })
      } else {
        toast({
          title: "交易成功",
          description: "但未找到空投ID",
        })
      }
    } catch (err: any) {
      console.error("创建空投失败:", err)
      setError(`创建空投失败: ${err.message || "未知错误"}`)
      toast({
        title: "创建失败",
        description: `创建空投失败: ${err.message || "未知错误"}`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 如果不是管理员，显示未授权消息
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F9F5EA] via-[#EACC91]/20 to-[#F9F5EA]">
        <Navbar />
        <div className="container mx-auto px-4 py-8 pt-32">
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>未授权访问</AlertTitle>
            <AlertDescription>您没有管理员权限，无法访问此页面。</AlertDescription>
          </Alert>
          <Button variant="outline" asChild>
            <Link href="/admin">返回管理面板</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F9F5EA] via-[#EACC91]/20 to-[#F9F5EA]">
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-32"/>\
