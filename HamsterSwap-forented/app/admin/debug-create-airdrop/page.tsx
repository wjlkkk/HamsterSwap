"use client"

import { useState, useEffect } from "react"
import { useWallet } from "@/contexts/wallet-context"
import { ethers } from "ethers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2, Copy, Check, RefreshCw, ArrowRight } from "lucide-react"
import Navbar from "@/components/navbar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { deployedTokens } from "@/contracts/token-contract"
import { AIRDROP_CONTRACT_ADDRESS, AIRDROP_ABI } from "@/contracts/airdrop-contract"

// 代币ABI
const TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
]

export default function DebugCreateAirdrop() {
  const { walletState } = useWallet()
  const [tokenAddress, setTokenAddress] = useState("")
  const [customTokenAddress, setCustomTokenAddress] = useState("")
  const [amount, setAmount] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [logs, setLogs] = useState<string[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [tokenInfo, setTokenInfo] = useState<any>(null)
  const [balance, setBalance] = useState<string | null>(null)
  const [allowance, setAllowance] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [airdropId, setAirdropId] = useState<number | null>(null)
  const [copySuccess, setCopySuccess] = useState(false)

  // 添加日志
  const addLog = (message: string) => {
    setLogs((prevLogs) => [...prevLogs, `[${new Date().toLocaleTimeString()}] ${message}`])
  }

  // 清除日志
  const clearLogs = () => {
    setLogs([])
    setError(null)
    setTxHash(null)
    setAirdropId(null)
  }

  // 复制到剪贴板
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopySuccess(true)
    setTimeout(() => setCopySuccess(false), 2000)
  }

  // 当选择代币时更新自定义代币地址
  useEffect(() => {
    if (tokenAddress && tokenAddress !== "custom") {
      setCustomTokenAddress("")
    }
  }, [tokenAddress])

  // 获取代币信息
  const fetchTokenInfo = async () => {
    if (!walletState.provider || !walletState.address) {
      addLog("❌ 钱包未连接")
      return
    }

    const actualTokenAddress = tokenAddress === "custom" ? customTokenAddress : tokenAddress
    if (!actualTokenAddress) {
      addLog("❌ 未选择代币")
      return
    }

    setIsLoading(true)
    clearLogs()
    addLog(`🔍 获取代币信息: ${actualTokenAddress}`)

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

      addLog(`✅ 代币信息: ${name} (${symbol}), 小数位: ${decimals}`)
      addLog(`💰 余额: ${ethers.formatUnits(balance, decimals)} ${symbol}`)
      addLog(`🔓 授权额度: ${ethers.formatUnits(allowance, decimals)} ${symbol}`)

      return { tokenContract, provider, decimals }
    } catch (err: any) {
      console.error("获取代币信息失败:", err)
      addLog(`❌ 获取代币信息失败: ${err.message || "未知错误"}`)
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
    if (!walletState.provider || !walletState.address) {
      addLog("❌ 钱包未连接")
      return
    }

    const actualTokenAddress = tokenAddress === "custom" ? customTokenAddress : tokenAddress
    if (!actualTokenAddress || !amount) {
      addLog("❌ 请填写代币地址和金额")
      return
    }

    setIsLoading(true)
    addLog(`🔄 开始授权代币...`)

    try {
      const result = await fetchTokenInfo()
      if (!result) return

      const { tokenContract, provider, decimals } = result
      const signer = await provider.getSigner()
      const tokenWithSigner = tokenContract.connect(signer)

      // 将金额转换为正确的单位
      const parsedAmount = ethers.parseUnits(amount, decimals)

      addLog(`🔄 授权 ${amount} 代币给空投合约 (${AIRDROP_CONTRACT_ADDRESS})`)

      // 发送授权交易
      const tx = await tokenWithSigner.approve(AIRDROP_CONTRACT_ADDRESS, parsedAmount)
      addLog(`📤 授权交易已发送: ${tx.hash}`)

      // 等待交易确认
      const receipt = await tx.wait()
      addLog(`✅ 授权交易已确认: ${receipt.hash}`)

      // 重新获取授权额度
      const newAllowance = await tokenContract.allowance(walletState.address, AIRDROP_CONTRACT_ADDRESS)
      setAllowance(ethers.formatUnits(newAllowance, decimals))
      addLog(`🔓 新授权额度: ${ethers.formatUnits(newAllowance, decimals)} ${tokenInfo.symbol}`)

      return true
    } catch (err: any) {
      console.error("授权代币失败:", err)
      addLog(`❌ 授权代币失败: ${err.message || "未知错误"}`)
      setError(`授权代币失败: ${err.message || "未知错误"}`)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // 创建空投
  const createAirdrop = async () => {
    if (!walletState.provider || !walletState.address) {
      addLog("❌ 钱包未连接")
      return
    }

    const actualTokenAddress = tokenAddress === "custom" ? customTokenAddress : tokenAddress
    if (!actualTokenAddress || !amount || !startTime || !endTime) {
      addLog("❌ 请填写所有必填字段")
      return
    }

    setIsLoading(true)
    setError(null)
    setTxHash(null)
    setAirdropId(null)
    addLog(`🔄 开始创建空投...`)

    try {
      const result = await fetchTokenInfo()
      if (!result) return

      const { provider, decimals } = result

      // 检查授权额度
      if (Number.parseFloat(allowance || "0") < Number.parseFloat(amount)) {
        addLog(`⚠️ 授权额度不足，需要先授权`)
        const approved = await approveToken()
        if (!approved) {
          addLog(`❌ 授权失败，无法继续创建空投`)
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
        addLog(`⚠️ 开始时间必须晚于当前时间`)
        setError("开始时间必须晚于当前时间")
        setIsLoading(false)
        return
      }

      if (parsedEndTime <= parsedStartTime) {
        addLog(`⚠️ 结束时间必须晚于开始时间`)
        setError("结束时间必须晚于开始时间")
        setIsLoading(false)
        return
      }

      addLog(`📊 参数验证:`)
      addLog(`- 代币地址: ${actualTokenAddress}`)
      addLog(`- 数量: ${amount} (${parsedAmount.toString()} wei)`)
      addLog(`- 开始时间: ${new Date(parsedStartTime * 1000).toLocaleString()} (${parsedStartTime})`)
      addLog(`- 结束时间: ${new Date(parsedEndTime * 1000).toLocaleString()} (${parsedEndTime})`)

      // 创建空投合约实例
      const signer = await provider.getSigner()
      const airdropContract = new ethers.Contract(AIRDROP_CONTRACT_ADDRESS, AIRDROP_ABI, signer)

      // 添加默认的merkleRoot参数 (ethers.ZeroHash)
      const merkleRoot = ethers.ZeroHash // 默认空merkle root
      addLog(`- Merkle Root: ${merkleRoot} (默认空值)`)

      // 估算Gas
      try {
        addLog(`🔄 估算Gas...`)
        const gasEstimate = await airdropContract.createAirdrop.estimateGas(
          actualTokenAddress,
          parsedAmount,
          parsedStartTime,
          parsedEndTime,
          merkleRoot,
        )
        addLog(`✅ Gas估算成功: ${gasEstimate.toString()}`)
      } catch (err: any) {
        console.error("Gas估算失败:", err)
        addLog(`❌ Gas估算失败: ${err.message || "未知错误"}`)
        // 避免JSON序列化BigInt错误
        let errorDetails = "无法序列化错误详情"
        try {
          errorDetails = JSON.stringify(err, (key, value) => (typeof value === "bigint" ? value.toString() : value))
        } catch (e) {
          console.error("Error stringifying error:", e)
        }
        addLog(`🔍 详细错误: ${errorDetails}`)
        setError(`Gas估算失败: ${err.message || "未知错误"}`)
        setIsLoading(false)
        return
      }

      // 发送创建空投交易
      addLog(`🔄 发送创建空投交易...`)
      const tx = await airdropContract.createAirdrop(
        actualTokenAddress,
        parsedAmount,
        parsedStartTime,
        parsedEndTime,
        merkleRoot,
      )
      setTxHash(tx.hash)
      addLog(`📤 交易已发送: ${tx.hash}`)

      // 等待交易确认
      const receipt = await tx.wait()
      addLog(`✅ 交易已确认: ${receipt.hash}`)

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
        addLog(`🎉 空投创建成功! ID: ${airdropCreatedEvent.airdropId}`)
      } else {
        addLog(`⚠️ 交易成功但未找到空投ID`)
      }
    } catch (err: any) {
      console.error("创建空投失败:", err)
      addLog(`❌ 创建空投失败: ${err.message || "未知错误"}`)
      addLog(`🔍 详细错误: ${JSON.stringify(err)}`)
      setError(`创建空投失败: ${err.message || "未知错误"}`)
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
            <CardTitle className="text-[#523805]">空投创建调试工具</CardTitle>
            <CardDescription>诊断和修复空投创建问题</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 左侧：参数设置 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-[#523805]">参数设置</h3>

                {/* 代币选择 */}
                <div className="space-y-2">
                  <Label htmlFor="tokenSelect" className="text-[#523805]">
                    选择代币
                  </Label>
                  <Select
                    value={tokenAddress}
                    onValueChange={(value) => {
                      setTokenAddress(value)
                      clearLogs()
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

                {/* 代币信息 */}
                {tokenInfo && (
                  <div className="bg-[#F9F5EA] p-4 rounded-md space-y-2">
                    <h4 className="font-medium text-[#523805]">代币信息</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-[#987A3F]">名称:</div>
                      <div className="text-[#523805]">{tokenInfo.name}</div>

                      <div className="text-[#987A3F]">符号:</div>
                      <div className="text-[#523805]">{tokenInfo.symbol}</div>

                      <div className="text-[#987A3F]">小数位:</div>
                      <div className="text-[#523805]">{tokenInfo.decimals}</div>

                      <div className="text-[#987A3F]">余额:</div>
                      <div className="text-[#523805]">
                        {balance} {tokenInfo.symbol}
                      </div>

                      <div className="text-[#987A3F]">授权额度:</div>
                      <div className="text-[#523805]">
                        {allowance} {tokenInfo.symbol}
                      </div>
                    </div>
                  </div>
                )}

                {/* 空投合约信息 */}
                <div className="bg-[#F9F5EA] p-4 rounded-md space-y-2">
                  <h4 className="font-medium text-[#523805]">空投合约信息</h4>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div className="text-[#987A3F]">合约地址:</div>
                    <div className="flex items-center">
                      <code className="bg-white px-2 py-1 rounded text-xs font-mono text-[#523805] flex-1 overflow-x-auto">
                        {AIRDROP_CONTRACT_ADDRESS}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 ml-1 text-[#987A3F] hover:text-[#523805] hover:bg-[#EACC91]/20"
                        onClick={() => copyToClipboard(AIRDROP_CONTRACT_ADDRESS)}
                      >
                        {copySuccess ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                      </Button>
                    </div>
                  </div>
                </div>

                {/* 错误信息 */}
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>错误</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {/* 交易结果 */}
                {txHash && (
                  <div className="bg-green-50 border border-green-200 p-4 rounded-md space-y-2">
                    <h4 className="font-medium text-green-800">交易成功</h4>
                    <div className="grid grid-cols-1 gap-2 text-sm">
                      <div className="text-green-700">交易哈希:</div>
                      <div className="flex items-center">
                        <code className="bg-white px-2 py-1 rounded text-xs font-mono text-green-800 flex-1 overflow-x-auto">
                          {txHash}
                        </code>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 ml-1 text-green-700 hover:text-green-800 hover:bg-green-100"
                          onClick={() => copyToClipboard(txHash)}
                        >
                          {copySuccess ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        </Button>
                      </div>
                      {airdropId !== null && (
                        <>
                          <div className="text-green-700">空投ID:</div>
                          <div className="text-green-800 font-medium">{airdropId}</div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 右侧：日志和操作 */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-[#523805]">操作日志</h3>

                {/* 日志显示 */}
                <div className="bg-[#F9F5EA] p-4 rounded-md h-[400px] overflow-y-auto">
                  {logs.length === 0 ? (
                    <p className="text-[#987A3F] italic">日志将显示在这里...</p>
                  ) : (
                    logs.map((log, index) => (
                      <div key={index} className="text-sm mb-1 font-mono">
                        {log}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-[#F9F5EA] border-t border-[#EACC91] flex justify-between">
            <div className="flex space-x-2">
              <Button
                onClick={fetchTokenInfo}
                disabled={isLoading || (!tokenAddress && !customTokenAddress)}
                className="bg-[#987A3F] hover:bg-[#523805] text-white"
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                刷新信息
              </Button>

              <Button
                onClick={approveToken}
                disabled={
                  isLoading || (!tokenAddress && !customTokenAddress) || !amount || !tokenInfo || !walletState.address
                }
                className="bg-[#987A3F] hover:bg-[#523805] text-white"
              >
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                授权代币
              </Button>
            </div>

            <Button
              onClick={createAirdrop}
              disabled={
                isLoading ||
                (!tokenAddress && !customTokenAddress) ||
                !amount ||
                !startTime ||
                !endTime ||
                !tokenInfo ||
                !walletState.address
              }
              className="bg-[#987A3F] hover:bg-[#523805] text-white"
            >
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ArrowRight className="mr-2 h-4 w-4" />}
              创建空投
            </Button>
          </CardFooter>
        </Card>

        {/* 常见问题解决方案 */}
        <Card className="border-[#EACC91] mt-6">
          <CardHeader>
            <CardTitle className="text-[#523805]">常见问题解决方案</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-[#523805]">授权问题</h4>
                <p className="text-[#987A3F] text-sm mt-1">
                  如果授权不生效，可能是因为交易未被确认或授权金额不足。尝试使用"授权代币"按钮重新授权，并确保授权金额大于或等于空投金额。
                </p>
              </div>

              <div>
                <h4 className="font-medium text-[#523805]">时间参数问题</h4>
                <p className="text-[#987A3F] text-sm mt-1">
                  确保开始时间晚于当前时间，结束时间晚于开始时间。时间参数使用的是UTC时间，请注意时区差异。
                </p>
              </div>

              <div>
                <h4 className="font-medium text-[#523805]">Gas估算失败</h4>
                <p className="text-[#987A3F] text-sm mt-1">
                  如果Gas估算失败，通常表示交易会在执行时回滚。检查代币授权、时间参数和合约权限。
                </p>
              </div>

              <div>
                <h4 className="font-medium text-[#523805]">合约地址问题</h4>
                <p className="text-[#987A3F] text-sm mt-1">
                  确保代币地址和空投合约地址不同。不能将空投合约本身作为要空投的代币。
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
