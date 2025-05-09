"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { useWallet } from "@/contexts/wallet-context"
import { useAirdropContract } from "@/hooks/use-airdrop-contract"
import { Info, HelpCircle, ArrowLeft } from "lucide-react"
import Navbar from "@/components/navbar"
import Link from "next/link"

export default function SetEligibilityPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { walletState } = useWallet()
  const { getAllAirdrops, setEligibility, isLoading, error } = useAirdropContract()

  const [selectedAirdropId, setSelectedAirdropId] = useState<string>("")
  const [addresses, setAddresses] = useState<string>("")
  const [defaultAmount, setDefaultAmount] = useState<string>("1")
  const [isAdvancedMode, setIsAdvancedMode] = useState<boolean>(false)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)
  const [airdrops, setAirdrops] = useState<any[]>([])

  // 获取空投列表
  useEffect(() => {
    const fetchedAirdrops = getAllAirdrops()
    setAirdrops(fetchedAirdrops)
  }, [getAllAirdrops])

  // 处理提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!walletState.connected) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to set eligibility",
        variant: "destructive",
      })
      return
    }

    if (!selectedAirdropId) {
      toast({
        title: "No airdrop selected",
        description: "Please select an airdrop",
        variant: "destructive",
      })
      return
    }

    if (!addresses.trim()) {
      toast({
        title: "No addresses provided",
        description: "Please enter at least one address",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      // 解析地址和金额
      const userAddresses: string[] = []
      const userAmounts: string[] = []

      if (isAdvancedMode) {
        // 高级模式: 每行格式为 "地址,金额"
        const lines = addresses.trim().split("\n")

        for (const line of lines) {
          if (!line.trim()) continue

          const parts = line.split(",")
          if (parts.length < 2) {
            throw new Error(`Invalid format in line: ${line}. Expected format: "address,amount"`)
          }

          const address = parts[0].trim()
          const amount = parts[1].trim()

          // 验证地址格式
          if (!address.startsWith("0x") || address.length !== 42) {
            throw new Error(`Invalid Ethereum address: ${address}`)
          }

          // 验证金额格式
          const amountNum = Number.parseFloat(amount)
          if (isNaN(amountNum) || amountNum <= 0) {
            throw new Error(`Invalid amount: ${amount}. Must be a positive number.`)
          }

          userAddresses.push(address)
          userAmounts.push(amount)
        }
      } else {
        // 简单模式: 每行一个地址，所有地址使用相同金额
        const lines = addresses.trim().split("\n")

        for (const line of lines) {
          const address = line.trim()
          if (!address) continue

          // 验证地址格式
          if (!address.startsWith("0x") || address.length !== 42) {
            throw new Error(`Invalid Ethereum address: ${address}`)
          }

          userAddresses.push(address)
          userAmounts.push(defaultAmount)
        }
      }

      if (userAddresses.length === 0) {
        throw new Error("No valid addresses found")
      }

      // 调用合约设置资格
      const result = await setEligibility(userAddresses, userAmounts, Number.parseInt(selectedAirdropId))

      toast({
        title: "Eligibility set successfully",
        description: `Set eligibility for ${userAddresses.length} addresses`,
        variant: "default",
      })

      // 清空表单
      setAddresses("")

      // 跳转回管理页面
      router.push("/admin")
    } catch (err) {
      console.error("Error setting eligibility:", err)
      toast({
        title: "Failed to set eligibility",
        description: err.message || "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F9F5EA] via-[#EACC91]/20 to-[#F9F5EA]">
      <Navbar />
      <div className="container mx-auto py-10 px-4 pt-32">
        <div className="mb-6">
          <Button variant="outline" asChild className="mb-4 border-[#EACC91] text-[#523805] hover:bg-[#EACC91]/20">
            <Link href="/admin">
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回管理面板
            </Link>
          </Button>
          <h1 className="text-3xl font-bold text-[#523805]">设置空投资格</h1>
          <p className="text-[#987A3F]">添加有资格参与空投的地址</p>
        </div>

        <Card className="max-w-4xl mx-auto border-[#EACC91]">
          <CardHeader className="bg-gradient-to-r from-[#F9F5EA] to-transparent">
            <CardTitle className="text-[#523805]">空投资格设置</CardTitle>
            <CardDescription>添加有资格从特定空投中领取代币的地址</CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-6">
              {/* 选择空投 */}
              <div className="space-y-2">
                <Label htmlFor="airdropId" className="text-[#523805]">
                  选择空投
                </Label>
                <Select value={selectedAirdropId} onValueChange={setSelectedAirdropId}>
                  <SelectTrigger id="airdropId" className="border-[#EACC91] focus-visible:ring-[#987A3F]">
                    <SelectValue placeholder="选择一个空投" />
                  </SelectTrigger>
                  <SelectContent>
                    {airdrops.length > 0 ? (
                      airdrops.map((airdrop) => (
                        <SelectItem key={airdrop.id} value={airdrop.id.toString()}>
                          空投 #{airdrop.id + 1} - {airdrop.tokenSymbol || "Token"}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="none" disabled>
                        没有可用的空投
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* 模式切换 */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Label htmlFor="advanced-mode" className="text-[#523805]">
                    高级模式
                  </Label>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <HelpCircle className="h-4 w-4 text-[#987A3F]" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          简单模式: 每行输入一个地址，所有地址获得相同数量的代币。
                          <br />
                          高级模式: 每行输入"地址,数量"，可以为不同地址指定不同数量。
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Switch id="advanced-mode" checked={isAdvancedMode} onCheckedChange={setIsAdvancedMode} />
              </div>

              {/* 简单模式下的默认金额 */}
              {!isAdvancedMode && (
                <div className="space-y-2">
                  <Label htmlFor="defaultAmount" className="text-[#523805]">
                    每用户默认数量
                  </Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="defaultAmount"
                      type="number"
                      step="0.000000000000000001"
                      min="0"
                      value={defaultAmount}
                      onChange={(e) => setDefaultAmount(e.target.value)}
                      className="max-w-[200px] border-[#EACC91] focus-visible:ring-[#987A3F]"
                    />
                    <span className="text-sm text-[#987A3F]">每个地址的代币数量</span>
                  </div>
                  <p className="text-sm text-[#987A3F]">此数量将分配给列表中的每个地址。</p>
                </div>
              )}

              {/* 地址输入 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="addresses" className="text-[#523805]">
                    {isAdvancedMode ? "地址和数量" : "符合条件的地址"}
                  </Label>
                  <span className="text-xs text-[#987A3F]">每行一个</span>
                </div>
                <Textarea
                  id="addresses"
                  value={addresses}
                  onChange={(e) => setAddresses(e.target.value)}
                  placeholder={isAdvancedMode ? "0x123...abc,1.5\n0x456...def,2.75" : "0x123...abc\n0x456...def"}
                  rows={10}
                  className="font-mono text-sm border-[#EACC91] focus-visible:ring-[#987A3F]"
                />
                <p className="text-sm text-[#987A3F]">
                  {isAdvancedMode
                    ? "每行输入一个地址和数量对，用逗号分隔。"
                    : "每行输入一个以太坊地址。每个地址将收到相同数量的代币。"}
                </p>
              </div>

              {/* 提示信息 */}
              <div className="bg-[#F9F5EA] p-4 rounded-md flex items-start space-x-3">
                <Info className="h-5 w-5 text-[#987A3F] flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium text-[#523805]">重要信息</h4>
                  <ul className="text-sm text-[#987A3F] mt-1 list-disc list-inside space-y-1">
                    <li>确保地址是有效的以太坊地址。</li>
                    <li>用户被添加到资格列表后，需要手动领取他们的代币。</li>
                    <li>您可以随时向现有空投添加更多地址。</li>
                    {isAdvancedMode && <li>在高级模式下，数量应为正数（例如，1.5、0.01、100）。</li>}
                  </ul>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex justify-between border-t border-[#EACC91]/50 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push("/admin")}
                className="border-[#EACC91] text-[#523805] hover:bg-[#EACC91]/20"
              >
                取消
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || isLoading || !walletState.connected}
                className="bg-[#987A3F] hover:bg-[#523805] text-white"
              >
                {isSubmitting ? "设置资格中..." : "设置资格"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}
