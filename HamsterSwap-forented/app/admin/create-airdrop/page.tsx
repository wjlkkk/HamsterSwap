"use client"

import { useState } from "react"
import { useWallet } from "@/contexts/wallet-context"
import { useAdmin } from "@/contexts/admin-context"
import { ethers } from "ethers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, ArrowLeft, Loader2 } from "lucide-react"
import Navbar from "@/components/navbar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { deployedTokens } from "@/contracts/token-contract"
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
      <div className="container mx-auto px-4 py-8 pt-32">
        <div className="mb-6">
          <Button variant="outline" asChild className="mb-4">
            <Link href="/admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回管理面板
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-[#523805]">创建空投</h1>
          <p className="text-[#987A3F]">创建新的代币空投活动</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-[#EACC91]">
            <CardHeader className="bg-gradient-to-r from-[#F9F5EA] to-transparent">
              <CardTitle className="text-[#523805]">空投参数</CardTitle>
              <CardDescription>设置空投的基本参数</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* 代币选择 */}
              <div className="space-y-2">
                <Label htmlFor="tokenSelect" className="text-[#523805]">
                  选择代币
                </Label>
                <Select
                  value={tokenAddress}
                  onValueChange={(value) => {
                    setTokenAddress(value)
                    setTokenInfo(null)
                    setBalance(null)
                    setAllowance(null)
                    setError(null)
                    if (value !== "custom") {
                      setCustomTokenAddress("")
                    }
                  }}
                >
                  <SelectTrigger className="w-full border-[#EACC91] focus-visible:ring-[#987A3F]">
                    <SelectValue placeholder="选择代币" />
                  </SelectTrigger>
                  <SelectContent>
                    {deployedTokens.map((token) => (
                      <SelectItem key={token.address} value={token.address}>
                        {token.name} ({token.symbol})
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">自定义代币地址</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* 自定义代币地址 */}
              {tokenAddress === "custom" && (
                <div className="space-y-2">
                  <Label htmlFor="customTokenAddress" className="text-[#523805]">
                    自定义代币地址
                  </Label>
                  <Input
                    id="customTokenAddress"
                    placeholder="0x..."
                    value={customTokenAddress}
                    onChange={(e) => setCustomTokenAddress(e.target.value)}
                    className="font-mono border-[#EACC91] focus-visible:ring-[#987A3F]"
                  />
                </div>
              )}

              {/* 空投数量 */}
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

              {/* 时间设置 */}
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

              {/* 获取代币信息按钮 */}
              <Button
                onClick={fetchTokenInfo}
                disabled={isLoading || (!tokenAddress && !customTokenAddress)}
                className="w-full bg-[#987A3F] hover:bg-[#523805] text-white"
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                获取代币信息
              </Button>

              {/* 错误信息 */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>错误</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* 成功信息 */}
              {success && (
                <Alert className="bg-green-50 border-green-200">
                  <AlertTitle className="text-green-800">空投创建成功</AlertTitle>
                  <AlertDescription className="text-green-700">
                    空投ID: {airdropId}
                    <br />
                    您可以在空投列表中查看详情
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          <div className="space-y-6">
            {/* 代币信息卡片 */}
            {tokenInfo && (
              <Card className="border-[#EACC91]">
                <CardHeader className="bg-gradient-to-r from-[#F9F5EA] to-transparent">
                  <CardTitle className="text-[#523805]">代币信息</CardTitle>
                  <CardDescription>当前选择的代币详情</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-[#987A3F]">名称:</div>
                      <div className="text-[#523805] font-medium">{tokenInfo.name}</div>

                      <div className="text-[#987A3F]">符号:</div>
                      <div className="text-[#523805] font-medium">{tokenInfo.symbol}</div>

                      <div className="text-[#987A3F]">小数位:</div>
                      <div className="text-[#523805] font-medium">{tokenInfo.decimals}</div>

                      <div className="text-[#987A3F]">您的余额:</div>
                      <div className="text-[#523805] font-medium">
                        {balance} {tokenInfo.symbol}
                      </div>

                      <div className="text-[#987A3F]">授权额度:</div>
                      <div className="text-[#523805] font-medium">
                        {allowance} {tokenInfo.symbol}
                      </div>
                    </div>

                    {/* 授权按钮 */}
                    <Button
                      onClick={approveToken}
                      disabled={isLoading || !amount}
                      className="w-full bg-[#987A3F] hover:bg-[#523805] text-white"
                    >
                      {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      授权代币
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 创建空投按钮 */}
            <Card className="border-[#EACC91]">
              <CardHeader className="bg-gradient-to-r from-[#F9F5EA] to-transparent">
                <CardTitle className="text-[#523805]">创建空投</CardTitle>
                <CardDescription>确认信息并创建空投</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={createAirdrop}
                  disabled={
                    isLoading ||
                    (!tokenAddress && !customTokenAddress) ||
                    !amount ||
                    !startTime ||
                    !endTime ||
                    !tokenInfo
                  }
                  className="w-full bg-[#987A3F] hover:bg-[#523805] text-white"
                >
                  {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  创建空投
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
