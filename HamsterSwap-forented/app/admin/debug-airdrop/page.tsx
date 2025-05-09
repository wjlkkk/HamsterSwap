"use client"

import { useState, useEffect } from "react"
import { useWallet } from "@/contexts/wallet-context"
import { ethers } from "ethers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import Navbar from "@/components/navbar"

// 空投合约ABI
const AIRDROP_ABI = [
  "function createAirdrop(address tokenAddress, uint256 amount, uint256 startTime, uint256 endTime) external",
]

// 代币ABI
const TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
]

// 空投合约地址
const AIRDROP_CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"

export default function DebugAirdrop() {
  const { walletState } = useWallet()
  const [tokenAddress, setTokenAddress] = useState("")
  const [amount, setAmount] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [tokenDecimals, setTokenDecimals] = useState<number | null>(null)
  const [tokenSymbol, setTokenSymbol] = useState<string>("")

  // 获取代币信息
  const fetchTokenInfo = async () => {
    if (!walletState.provider || !tokenAddress) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const provider = new ethers.BrowserProvider(walletState.provider)
      const tokenContract = new ethers.Contract(tokenAddress, TOKEN_ABI, provider)

      // 获取代币小数位数和符号
      const [decimals, symbol] = await Promise.all([tokenContract.decimals(), tokenContract.symbol()])

      setTokenDecimals(decimals)
      setTokenSymbol(symbol)

      console.log(`代币信息: ${symbol}, 小数位: ${decimals}`)
    } catch (err) {
      console.error("获取代币信息失败:", err)
      setError("获取代币信息失败，请确保代币地址正确")
      setTokenDecimals(null)
      setTokenSymbol("")
    } finally {
      setIsLoading(false)
    }
  }

  // 当代币地址变化时获取代币信息
  useEffect(() => {
    if (tokenAddress) {
      fetchTokenInfo()
    } else {
      setTokenDecimals(null)
      setTokenSymbol("")
    }
  }, [tokenAddress])

  // 检查代币余额和授权
  const checkTokenStatus = async () => {
    if (!walletState.provider || !walletState.address || !tokenAddress || tokenDecimals === null) {
      setError("请先连接钱包并输入有效的代币地址")
      return
    }

    setIsLoading(true)
    setError(null)
    setDebugInfo(null)

    try {
      const provider = new ethers.BrowserProvider(walletState.provider)
      const tokenContract = new ethers.Contract(tokenAddress, TOKEN_ABI, provider)

      // 获取余额
      const balance = await tokenContract.balanceOf(walletState.address)

      // 获取授权额度
      const allowance = await tokenContract.allowance(walletState.address, AIRDROP_CONTRACT_ADDRESS)

      // 获取当前时间戳
      const currentTimestamp = Math.floor(Date.now() / 1000)

      // 解析开始和结束时间
      const parsedStartTime = startTime ? Math.floor(new Date(startTime).getTime() / 1000) : 0
      const parsedEndTime = endTime ? Math.floor(new Date(endTime).getTime() / 1000) : 0

      // 解析金额
      const parsedAmount = amount ? ethers.parseUnits(amount, tokenDecimals) : ethers.parseUnits("0", tokenDecimals)

      setDebugInfo({
        balance: ethers.formatUnits(balance, tokenDecimals),
        allowance: ethers.formatUnits(allowance, tokenDecimals),
        currentTimestamp,
        parsedStartTime,
        parsedEndTime,
        parsedAmount: ethers.formatUnits(parsedAmount, tokenDecimals),
        hasEnoughBalance: balance >= parsedAmount,
        hasEnoughAllowance: allowance >= parsedAmount,
        isStartTimeValid: parsedStartTime > currentTimestamp,
        isEndTimeValid: parsedEndTime > parsedStartTime,
      })

      console.log("检查状态成功:", {
        balance: ethers.formatUnits(balance, tokenDecimals),
        allowance: ethers.formatUnits(allowance, tokenDecimals),
        decimals: tokenDecimals,
      })
    } catch (err) {
      console.error("检查代币状态失败:", err)
      setError("检查代币状态失败，请确保代币地址正确")
    } finally {
      setIsLoading(false)
    }
  }

  // 授权代币
  const approveToken = async () => {
    if (!walletState.provider || !walletState.address || !tokenAddress || !amount || tokenDecimals === null) {
      setError("请先连接钱包并输入代币地址和金额")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // 确保我们有一个有效的提供者和签名者
      const provider = new ethers.BrowserProvider(walletState.provider)
      const signer = await provider.getSigner()

      console.log("获取到签名者:", await signer.getAddress())

      // 创建带有签名者的合约实例
      const tokenContract = new ethers.Contract(tokenAddress, TOKEN_ABI, signer)

      // 将金额转换为正确的单位（使用代币的小数位数）
      const parsedAmount = ethers.parseUnits(amount, tokenDecimals)

      console.log(`尝试授权 ${amount} ${tokenSymbol} (${parsedAmount.toString()} wei) 给 ${AIRDROP_CONTRACT_ADDRESS}`)

      // 发送授权交易
      const tx = await tokenContract.approve(AIRDROP_CONTRACT_ADDRESS, parsedAmount)
      console.log("授权交易已发送:", tx.hash)

      // 等待交易确认
      const receipt = await tx.wait()
      console.log("授权交易已确认:", receipt)

      setDebugInfo({
        ...debugInfo,
        message: `成功授权 ${amount} ${tokenSymbol} 给空投合约`,
      })

      // 重新检查状态
      await checkTokenStatus()
    } catch (err: any) {
      console.error("授权代币失败:", err)
      setError(`授权代币失败: ${err.message || "未知错误"}`)
    } finally {
      setIsLoading(false)
    }
  }

  // 尝试创建空投
  const tryCreateAirdrop = async () => {
    if (
      !walletState.provider ||
      !walletState.address ||
      !tokenAddress ||
      !amount ||
      !startTime ||
      !endTime ||
      tokenDecimals === null
    ) {
      setError("请填写所有必填字段")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const provider = new ethers.BrowserProvider(walletState.provider)
      const signer = await provider.getSigner()
      const airdropContract = new ethers.Contract(AIRDROP_CONTRACT_ADDRESS, AIRDROP_ABI, signer)

      // 解析参数
      const parsedAmount = ethers.parseUnits(amount, tokenDecimals)
      const parsedStartTime = Math.floor(new Date(startTime).getTime() / 1000)
      const parsedEndTime = Math.floor(new Date(endTime).getTime() / 1000)

      console.log("尝试估算创建空投的Gas:", {
        tokenAddress,
        amount: parsedAmount.toString(),
        startTime: parsedStartTime,
        endTime: parsedEndTime,
      })

      // 尝试估算gas
      try {
        const gasEstimate = await airdropContract.createAirdrop.estimateGas(
          tokenAddress,
          parsedAmount,
          parsedStartTime,
          parsedEndTime,
        )

        setDebugInfo({
          ...debugInfo,
          gasEstimate: gasEstimate.toString(),
          message: "Gas估算成功，交易应该可以执行",
        })

        console.log("Gas估算成功:", gasEstimate.toString())
      } catch (err: any) {
        console.error("Gas估算失败:", err)
        setError(`Gas估算失败: ${err.message || "未知错误"}`)
      }
    } catch (err: any) {
      console.error("尝试创建空投失败:", err)
      setError(`尝试创建空投失败: ${err.message || "未知错误"}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F9F5EA] via-[#EACC91]/20 to-[#F9F5EA]">
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-32">
        <Card className="border-[#EACC91]">
          <CardHeader className="bg-gradient-to-r from-[#F9F5EA] to-transparent">
            <CardTitle className="text-[#523805]">空投调试工具</CardTitle>
            <CardDescription>诊断和修复空投创建问题</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label htmlFor="tokenAddress" className="text-[#523805]">
                代币地址
              </Label>
              <Input
                id="tokenAddress"
                placeholder="0x..."
                value={tokenAddress}
                onChange={(e) => setTokenAddress(e.target.value)}
                className="font-mono border-[#EACC91] focus-visible:ring-[#987A3F]"
              />
              {tokenSymbol && tokenDecimals !== null && (
                <p className="text-sm text-[#987A3F] mt-1">
                  已识别: {tokenSymbol} (小数位: {tokenDecimals})
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount" className="text-[#523805]">
                空投数量
              </Label>
              <Input
                id="amount"
                type="text"
                placeholder="例如: 1000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="border-[#EACC91] focus-visible:ring-[#987A3F]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime" className="text-[#523805]">
                  开始时间
                </Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="border-[#EACC91] focus-visible:ring-[#987A3F]"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime" className="text-[#523805]">
                  结束时间
                </Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="border-[#EACC91] focus-visible:ring-[#987A3F]"
                />
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>错误</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {debugInfo && (
              <div className="bg-[#F9F5EA] p-4 rounded-md space-y-2">
                <h3 className="font-medium text-[#523805]">诊断信息</h3>

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="text-[#987A3F]">钱包余额:</div>
                  <div className={`font-medium ${debugInfo.hasEnoughBalance ? "text-green-700" : "text-red-700"}`}>
                    {debugInfo.balance} {tokenSymbol} {debugInfo.hasEnoughBalance ? "✓" : "✗"}
                  </div>

                  <div className="text-[#987A3F]">授权额度:</div>
                  <div className={`font-medium ${debugInfo.hasEnoughAllowance ? "text-green-700" : "text-red-700"}`}>
                    {debugInfo.allowance} {tokenSymbol} {debugInfo.hasEnoughAllowance ? "✓" : "✗"}
                  </div>

                  <div className="text-[#987A3F]">当前时间戳:</div>
                  <div className="text-[#523805]">{debugInfo.currentTimestamp}</div>

                  <div className="text-[#987A3F]">开始时间戳:</div>
                  <div className={`font-medium ${debugInfo.isStartTimeValid ? "text-green-700" : "text-red-700"}`}>
                    {debugInfo.parsedStartTime} {debugInfo.isStartTimeValid ? "✓" : "✗"}
                  </div>

                  <div className="text-[#987A3F]">结束时间戳:</div>
                  <div className={`font-medium ${debugInfo.isEndTimeValid ? "text-green-700" : "text-red-700"}`}>
                    {debugInfo.parsedEndTime} {debugInfo.isEndTimeValid ? "✓" : "✗"}
                  </div>

                  <div className="text-[#987A3F]">空投金额:</div>
                  <div className="text-[#523805]">
                    {debugInfo.parsedAmount} {tokenSymbol}
                  </div>
                </div>

                {debugInfo.message && <div className="mt-2 text-green-700 font-medium">{debugInfo.message}</div>}

                {debugInfo.gasEstimate && (
                  <div className="mt-2 text-green-700 font-medium">Gas估算: {debugInfo.gasEstimate}</div>
                )}
              </div>
            )}
          </CardContent>
          <CardFooter className="bg-[#F9F5EA] border-t border-[#EACC91] flex justify-between">
            <Button
              onClick={checkTokenStatus}
              disabled={isLoading || !tokenAddress || tokenDecimals === null}
              className="bg-[#987A3F] hover:bg-[#523805] text-white"
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              检查状态
            </Button>

            <Button
              onClick={approveToken}
              disabled={isLoading || !tokenAddress || !amount || tokenDecimals === null}
              className="bg-[#987A3F] hover:bg-[#523805] text-white"
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              授权代币
            </Button>

            <Button
              onClick={tryCreateAirdrop}
              disabled={isLoading || !tokenAddress || !amount || !startTime || !endTime || tokenDecimals === null}
              className="bg-[#987A3F] hover:bg-[#523805] text-white"
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              测试创建
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
