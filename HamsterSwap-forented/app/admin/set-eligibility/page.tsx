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
import { Info, HelpCircle } from "lucide-react"

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
    <div className="container mx-auto py-10 px-4">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-2xl">Set Airdrop Eligibility</CardTitle>
          <CardDescription>Add addresses that are eligible to claim tokens from a specific airdrop</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {/* 选择空投 */}
            <div className="space-y-2">
              <Label htmlFor="airdropId">Select Airdrop</Label>
              <Select value={selectedAirdropId} onValueChange={setSelectedAirdropId}>
                <SelectTrigger id="airdropId">
                  <SelectValue placeholder="Select an airdrop" />
                </SelectTrigger>
                <SelectContent>
                  {airdrops.length > 0 ? (
                    airdrops.map((airdrop) => (
                      <SelectItem key={airdrop.id} value={airdrop.id.toString()}>
                        Airdrop #{airdrop.id + 1} - {airdrop.tokenSymbol || "Token"}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="none" disabled>
                      No airdrops available
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* 模式切换 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Label htmlFor="advanced-mode">Advanced Mode</Label>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="h-4 w-4 text-gray-400" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">
                        Simple mode: Enter one address per line, all addresses get the same amount.
                        <br />
                        Advanced mode: Enter "address,amount" per line to specify different amounts.
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
                <Label htmlFor="defaultAmount">Default Amount Per User</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="defaultAmount"
                    type="number"
                    step="0.000000000000000001"
                    min="0"
                    value={defaultAmount}
                    onChange={(e) => setDefaultAmount(e.target.value)}
                    className="max-w-[200px]"
                  />
                  <span className="text-sm text-gray-500">tokens per address</span>
                </div>
                <p className="text-sm text-gray-500">This amount will be assigned to each address in the list.</p>
              </div>
            )}

            {/* 地址输入 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="addresses">{isAdvancedMode ? "Addresses and Amounts" : "Eligible Addresses"}</Label>
                <span className="text-xs text-gray-500">One per line</span>
              </div>
              <Textarea
                id="addresses"
                value={addresses}
                onChange={(e) => setAddresses(e.target.value)}
                placeholder={isAdvancedMode ? "0x123...abc,1.5\n0x456...def,2.75" : "0x123...abc\n0x456...def"}
                rows={10}
                className="font-mono text-sm"
              />
              <p className="text-sm text-gray-500">
                {isAdvancedMode
                  ? "Enter one address and amount pair per line, separated by a comma."
                  : "Enter one Ethereum address per line. Each address will receive the same amount."}
              </p>
            </div>

            {/* 提示信息 */}
            <div className="bg-blue-50 p-4 rounded-md flex items-start space-x-3">
              <Info className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium text-blue-800">Important Information</h4>
                <ul className="text-sm text-blue-700 mt-1 list-disc list-inside space-y-1">
                  <li>Make sure the addresses are valid Ethereum addresses.</li>
                  <li>Users will need to manually claim their tokens after being added to the eligibility list.</li>
                  <li>You can add more addresses to an existing airdrop at any time.</li>
                  {isAdvancedMode && (
                    <li>In advanced mode, amounts should be positive numbers (e.g., 1.5, 0.01, 100).</li>
                  )}
                </ul>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex justify-between">
            <Button type="button" variant="outline" onClick={() => router.push("/admin")}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || isLoading || !walletState.connected}>
              {isSubmitting ? "Setting Eligibility..." : "Set Eligibility"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
