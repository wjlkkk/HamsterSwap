"use client"

import { useState, useEffect } from "react"
import { useWallet } from "@/contexts/wallet-context"
import { ethers } from "ethers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2, RefreshCw, Check, Copy } from "lucide-react"
import Navbar from "@/components/navbar"
import { useToast } from "@/hooks/use-toast"
import { deployedTokens } from "@/contracts/token-contract"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// ERC20 ABI - 只包含我们需要的方法
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

export default function DebugApprove() {
  const { walletState } = useWallet()
  const { toast } = useToast()
  const [tokenAddress, setTokenAddress] = useState("")
  const [spenderAddress, setSpenderAddress] = useState(AIRDROP_CONTRACT_ADDRESS)
  const [amount, setAmount] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [tokenInfo, setTokenInfo] = useState<any>(null)
  const [allowanceInfo, setAllowanceInfo] = useState<any>(null)
  const [balanceInfo, setBalanceInfo] = useState<any>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])

  // 添加日志
  const addLog = (message: string) => {
    setLogs((prevLogs) => [...prevLogs, `[${new Date().toLocaleTimeString()}] ${message}`])
  }

  // 复制到剪贴板
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "已复制到剪贴板",
      description: "文本已成功复制到剪贴板。",
      duration: 2000,
    })
  }

  // 获取代币信息
  const fetchTokenInfo = async () => {
    if (!walletState.provider || !tokenAddress) {
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(null)
    setTokenInfo(null)

    try {
      addLog(`开始获取代币信息: ${tokenAddress}`)
      const provider = new ethers.BrowserProvider(walletState.provider)
      const tokenContract = new ethers.Contract(tokenAddress, TOKEN_ABI, provider)

      // 获取代币信息
      const [name, symbol, decimals] = await Promise.all([
        tokenContract.name(),
        tokenContract.symbol(),
        tokenContract.decimals(),
      ])

      const info = { name, symbol, decimals }
      setTokenInfo(info)
      addLog(`代币信息获取成功: ${symbol} (${name}), 小数位: ${decimals}`)

      // 获取余额
      if (walletState.address) {
        await fetchBalance()
      }

      // 获取授权额度
      if (walletState.address && spenderAddress) {
        await fetchAllowance()
      }
    } catch (err: any) {
      console.error("获取代币信息失败:", err)
      setError(`获取代币信息失败: ${err.message || "未知错误"}`)
      addLog(`获取代币信息失败: ${err.message || "未知错误"}`)
    } finally {
      setIsLoading(false)
    }
  }

  // 获取余额
  const fetchBalance = async () => {
    if (!walletState.provider || !walletState.address || !tokenAddress || !tokenInfo) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      addLog(`开始获取余额: 地址=${walletState.address}`)
      const provider = new ethers.BrowserProvider(walletState.provider)
      const tokenContract = new ethers.Contract(tokenAddress, TOKEN_ABI, provider)

      // 获取余额
      const balance = await tokenContract.balanceOf(walletState.address)
      const formattedBalance = ethers.formatUnits(balance, tokenInfo.decimals)

      setBalanceInfo({
        raw: balance.toString(),
        formatted: formattedBalance,
      })

      addLog(`余额获取成功: ${formattedBalance} ${tokenInfo.symbol}`)
    } catch (err: any) {
      console.error("获取余额失败:", err)
      setError(`获取余额失败: ${err.message || "未知错误"}`)
      addLog(`获取余额失败: ${err.message || "未知错误"}`)
    } finally {
      setIsLoading(false)
    }
  }

  // 获取授权额度
  const fetchAllowance = async () => {
    if (!walletState.provider || !walletState.address || !tokenAddress || !spenderAddress || !tokenInfo) {
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      addLog(`开始获取授权额度: 所有者=${walletState.address}, 授权者=${spenderAddress}`)
      const provider = new ethers.BrowserProvider(walletState.provider)
      const tokenContract = new ethers.Contract(tokenAddress, TOKEN_ABI, provider)

      // 获取授权额度
      const allowance = await tokenContract.allowance(walletState.address, spenderAddress)
      const formattedAllowance = ethers.formatUnits(allowance, tokenInfo.decimals)

      setAllowanceInfo({
        raw: allowance.toString(),
        formatted: formattedAllowance,
      })

      addLog(`授权额度获取成功: ${formattedAllowance} ${tokenInfo.symbol}`)
    } catch (err: any) {
      console.error("获取授权额度失败:", err)
      setError(`获取授权额度失败: ${err.message || "未知错误"}`)
      addLog(`获取授权额度失败: ${err.message || "未知错误"}`)
    } finally {
      setIsLoading(false)
    }
  }

  // 授权代币
  const approveToken = async () => {
    if (!walletState.provider || !walletState.address || !tokenAddress || !spenderAddress || !amount || !tokenInfo) {
      setError("请填写所有必填字段")
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(null)
    setTxHash(null)

    try {
      addLog(`开始授权代币: 代币=${tokenAddress}, 授权者=${spenderAddress}, 数量=${amount}`)

      // 获取签名者
      const provider = new ethers.BrowserProvider(walletState.provider)
      const signer = await provider.getSigner()
      addLog(`获取签名者成功: ${await signer.getAddress()}`)

      // 创建合约实例
      const tokenContract = new ethers.Contract(tokenAddress, TOKEN_ABI, signer)

      // 将金额转换为正确的单位
      const amountInWei = ethers.parseUnits(amount, tokenInfo.decimals)
      addLog(`授权金额(Wei): ${amountInWei.toString()}`)

      // 发送交易
      addLog("发送授权交易...")
      const tx = await tokenContract.approve(spenderAddress, amountInWei)
      setTxHash(tx.hash)
      addLog(`交易已发送: ${tx.hash}`)

      // 等待交易确认
      addLog("等待交易确认...")
      const receipt = await tx.wait()
      addLog(`交易已确认: 区块号=${receipt.blockNumber}, 状态=${receipt.status === 1 ? "成功" : "失败"}`)

      if (receipt.status === 1) {
        setSuccess(`授权成功! 交易哈希: ${tx.hash}`)

        // 延迟一下再查询授权额度，确保区块链状态已更新
        setTimeout(() => {
          fetchAllowance()
        }, 2000)
      } else {
        setError("交易已确认但状态为失败")
      }
    } catch (err: any) {
      console.error("授权代币失败:", err)
      setError(`授权代币失败: ${err.message || "未知错误"}`)
      addLog(`授权代币失败: ${err.message || "未知错误"}`)
    } finally {
      setIsLoading(false)
    }
  }

  // 当代币地址变化时获取代币信息
  useEffect(() => {
    if (tokenAddress) {
      fetchTokenInfo()
    }
  }, [tokenAddress])

  // 当spender地址变化时获取授权额度
  useEffect(() => {
    if (tokenInfo && spenderAddress && walletState.address) {
      fetchAllowance()
    }
  }, [spenderAddress, tokenInfo, walletState.address])

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F9F5EA] via-[#EACC91]/20 to-[#F9F5EA]">
      <Navbar />
      <div className="container mx-auto px-4 py-8 pt-32">
        <Card className="border-[#EACC91]">
          <CardHeader className="bg-gradient-to-r from-[#F9F5EA] to-transparent">
            <CardTitle className="text-[#523805]">授权调试工具</CardTitle>
            <CardDescription>诊断和修复代币授权问题</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="space-y-2">
              <Label htmlFor="tokenSelect" className="text-[#523805]">
                代币
              </Label>
              <Select onValueChange={setTokenAddress}>
                <SelectTrigger id="tokenSelect" className="border-[#EACC91] focus-visible:ring-[#987A3F]">
                  <SelectValue placeholder="选择代币" />
                </SelectTrigger>
                <SelectContent>
                  {deployedTokens.map((token) => (
                    <SelectItem key={token.address} value={token.address}>
                      {token.name} ({token.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="text-sm text-[#987A3F] mt-1">或直接输入代币地址:</div>
              <Input
                placeholder="代币地址 (0x...)"
                value={tokenAddress}
                onChange={(e) => setTokenAddress(e.target.value)}
                className="font-mono border-[#EACC91] focus-visible:ring-[#987A3F]"
              />
            </div>

            {tokenInfo && (
              <div className="bg-[#F9F5EA] p-4 rounded-md">
                <h3 className="font-medium text-[#523805]">代币信息</h3>
                <div className="grid grid-cols-2 gap-2 text-sm mt-2">
                  <div className="text-[#987A3F]">名称:</div>
                  <div className="text-[#523805]">{tokenInfo.name}</div>

                  <div className="text-[#987A3F]">符号:</div>
                  <div className="text-[#523805]">{tokenInfo.symbol}</div>

                  <div className="text-[#987A3F]">小数位:</div>
                  <div className="text-[#523805]">{tokenInfo.decimals}</div>

                  {balanceInfo && (
                    <>
                      <div className="text-[#987A3F]">余额:</div>
                      <div className="text-[#523805]">
                        {balanceInfo.formatted} {tokenInfo.symbol}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 ml-1 text-[#987A3F]"
                          onClick={() => fetchBalance()}
                        >
                          <RefreshCw className="h-3 w-3" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="spenderAddress" className="text-[#523805]">
                授权地址 (Spender)
              </Label>
              <Input
                id="spenderAddress"
                placeholder="授权地址 (0x...)"
                value={spenderAddress}
                onChange={(e) => setSpenderAddress(e.target.value)}
                className="font-mono border-[#EACC91] focus-visible:ring-[#987A3F]"
              />
              <div className="text-xs text-[#987A3F]">默认为空投合约地址: {AIRDROP_CONTRACT_ADDRESS}</div>
            </div>

            {allowanceInfo && (
              <div className="bg-[#F9F5EA] p-4 rounded-md">
                <h3 className="font-medium text-[#523805]">当前授权额度</h3>
                <div className="flex items-center mt-2">
                  <span className="text-[#523805] font-medium">{allowanceInfo.formatted}</span>
                  <span className="text-[#987A3F] ml-1">{tokenInfo.symbol}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 ml-1 text-[#987A3F]"
                    onClick={() => fetchAllowance()}
                  >
                    <RefreshCw className="h-3 w-3" />
                  </Button>
                </div>
                <div className="text-xs text-[#987A3F] mt-1">原始值 (Wei): {allowanceInfo.raw}</div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="amount" className="text-[#523805]">
                授权数量
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

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>错误</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert variant="default" className="bg-green-50 border-green-200">
                <Check className="h-4 w-4 text-green-600" />
                <AlertTitle className="text-green-800">成功</AlertTitle>
                <AlertDescription className="text-green-700">{success}</AlertDescription>
              </Alert>
            )}

            {txHash && (
              <div className="bg-[#F9F5EA] p-4 rounded-md">
                <h3 className="font-medium text-[#523805]">交易哈希</h3>
                <div className="flex items-center mt-2">
                  <code className="text-xs font-mono text-[#523805] truncate">{txHash}</code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 ml-1 text-[#987A3F]"
                    onClick={() => copyToClipboard(txHash)}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}

            <div className="bg-black/90 text-green-400 p-4 rounded-md font-mono text-xs h-60 overflow-y-auto">
              <div className="mb-2 text-white">== 调试日志 ==</div>
              {logs.length === 0 ? (
                <div className="text-gray-500">等待操作...</div>
              ) : (
                logs.map((log, index) => <div key={index}>{log}</div>)
              )}
            </div>
          </CardContent>
          <CardFooter className="bg-[#F9F5EA] border-t border-[#EACC91] flex justify-between">
            <Button
              onClick={fetchTokenInfo}
              disabled={isLoading || !tokenAddress}
              className="bg-[#987A3F] hover:bg-[#523805] text-white"
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              刷新信息
            </Button>

            <Button
              onClick={approveToken}
              disabled={isLoading || !tokenAddress || !spenderAddress || !amount || !tokenInfo}
              className="bg-[#987A3F] hover:bg-[#523805] text-white"
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              授权代币
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  )
}
