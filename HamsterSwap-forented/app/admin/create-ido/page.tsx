"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ethers } from "ethers"
import { Calendar, Info, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { useWallet } from "@/contexts/wallet-context"
import Navbar from "@/components/navbar"
import { getContractAddress } from "@/utils/contract-addresses"
import { IDO_ABI } from "@/contracts/ido-contract"

export default function CreateIdoPage() {
  const router = useRouter()
  const { walletState, setIsWalletModalOpen } = useWallet()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  // 表单状态
  const [formData, setFormData] = useState({
    projectOwner: "",
    tokenAddress: "",
    tokenPrice: "",
    softCap: "",
    hardCap: "",
    minAllocation: "",
    maxAllocation: "",
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    whitelistAddresses: "",
  })

  // 处理表单输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // 创建IDO项目
  const handleCreateProject = async () => {
    if (!walletState.connected || !walletState.provider || !walletState.signer) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to create an IDO project.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    try {
      // 验证表单数据
      if (
        !formData.projectOwner ||
        !formData.tokenAddress ||
        !formData.tokenPrice ||
        !formData.softCap ||
        !formData.hardCap ||
        !formData.minAllocation ||
        !formData.maxAllocation ||
        !formData.startDate ||
        !formData.startTime ||
        !formData.endDate ||
        !formData.endTime
      ) {
        throw new Error("Please fill in all required fields")
      }

      // 验证地址格式
      if (!ethers.isAddress(formData.projectOwner) || !ethers.isAddress(formData.tokenAddress)) {
        throw new Error("Invalid address format")
      }

      // 计算开始和结束时间戳
      const startTimestamp = Math.floor(new Date(`${formData.startDate}T${formData.startTime}`).getTime() / 1000)
      const endTimestamp = Math.floor(new Date(`${formData.endDate}T${formData.endTime}`).getTime() / 1000)

      // 验证时间
      if (startTimestamp >= endTimestamp) {
        throw new Error("End time must be after start time")
      }

      // 验证金额 - 使用 ethers.js v6 的 parseEther 方法
      const softCap = ethers.parseEther(formData.softCap)
      const hardCap = ethers.parseEther(formData.hardCap)
      const minAllocation = ethers.parseEther(formData.minAllocation)
      const maxAllocation = ethers.parseEther(formData.maxAllocation)
      const tokenPrice = ethers.parseEther(formData.tokenPrice)

      // 在 ethers.js v6 中，BigNumber 被替换为原生 BigInt
      // 使用原生比较操作符而不是 .gte() 方法
      if (softCap >= hardCap) {
        throw new Error("Soft cap must be less than hard cap")
      }

      if (minAllocation >= maxAllocation) {
        throw new Error("Minimum allocation must be less than maximum allocation")
      }

      // 获取IDO合约地址
      const idoContractAddress = await getContractAddress("IDO")

      // 连接到IDO合约
      const idoContract = new ethers.Contract(idoContractAddress, IDO_ABI, walletState.signer)

      // 创建项目
      const tx = await idoContract.createProject(
        formData.projectOwner,
        formData.tokenAddress,
        tokenPrice,
        softCap,
        hardCap,
        minAllocation,
        maxAllocation,
        startTimestamp,
        endTimestamp,
      )

      // 等待交易确认
      const receipt = await tx.wait()

      // 获取项目ID - 在 ethers.js v6 中，事件处理也有所不同
      let projectId
      if (receipt && receipt.logs) {
        const iface = new ethers.Interface(IDO_ABI)
        for (const log of receipt.logs) {
          try {
            const parsedLog = iface.parseLog({
              topics: log.topics as string[],
              data: log.data,
            })
            if (parsedLog && parsedLog.name === "ProjectCreated") {
              projectId = parsedLog.args.projectId
              break
            }
          } catch (e) {
            // 如果解析失败，继续尝试下一个日志
            continue
          }
        }
      }

      // 如果有白名单地址，添加到白名单
      if (formData.whitelistAddresses.trim() && projectId !== undefined) {
        const addresses = formData.whitelistAddresses
          .split(/[\n,]/)
          .map((addr) => addr.trim())
          .filter((addr) => ethers.isAddress(addr))

        if (addresses.length > 0) {
          const whitelistTx = await idoContract.addToWhitelist(projectId, addresses)
          await whitelistTx.wait()
        }
      }

      toast({
        title: "IDO project created",
        description: `Project ID: ${projectId !== undefined ? projectId.toString() : "Unknown"}. The project has been successfully created.`,
      })

      // 重置表单
      setFormData({
        projectOwner: "",
        tokenAddress: "",
        tokenPrice: "",
        softCap: "",
        hardCap: "",
        minAllocation: "",
        maxAllocation: "",
        startDate: "",
        startTime: "",
        endDate: "",
        endTime: "",
        whitelistAddresses: "",
      })

      // 跳转到IDO页面
      router.push("/ido")
    } catch (error: any) {
      console.error("Error creating IDO project:", error)
      toast({
        title: "Failed to create IDO project",
        description: error.message || "An error occurred while creating the IDO project.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F9F5EA] via-[#EACC91]/20 to-[#F9F5EA] font-sans pb-20">
      <Navbar />

      <main className="container mx-auto px-4 pt-32">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#523805] to-[#987A3F] mb-4">
              Create IDO Project
            </h1>
            <p className="text-lg text-[#523805]/80 max-w-2xl mx-auto">
              Launch your token through our IDO platform. Fill in the details below to create a new IDO project.
            </p>
          </div>

          {!walletState.connected ? (
            <Card className="border-[#EACC91] shadow-md">
              <CardHeader>
                <CardTitle className="text-[#523805]">Connect Wallet</CardTitle>
                <CardDescription>You need to connect your wallet to create an IDO project.</CardDescription>
              </CardHeader>
              <CardFooter>
                <Button
                  className="w-full bg-gradient-to-r from-[#EACC91] to-[#987A3F] hover:from-[#987A3F] hover:to-[#523805] text-[#523805] hover:text-white"
                  onClick={() => setIsWalletModalOpen(true)}
                >
                  Connect Wallet
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-[#EACC91]/30 p-1 rounded-xl mb-6">
                <TabsTrigger
                  value="basic"
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#523805] data-[state=active]:shadow-sm text-[#523805]/70"
                >
                  Basic Information
                </TabsTrigger>
                <TabsTrigger
                  value="whitelist"
                  className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#523805] data-[state=active]:shadow-sm text-[#523805]/70"
                >
                  Whitelist
                </TabsTrigger>
              </TabsList>

              <Card className="border-[#EACC91] shadow-md">
                <TabsContent value="basic" className="mt-0">
                  <CardHeader>
                    <CardTitle className="text-[#523805]">Project Details</CardTitle>
                    <CardDescription>
                      Enter the basic information about your IDO project. All fields are required.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="projectOwner" className="text-[#523805]">
                          Project Owner Address
                        </Label>
                        <Input
                          id="projectOwner"
                          name="projectOwner"
                          placeholder="0x..."
                          value={formData.projectOwner}
                          onChange={handleInputChange}
                          className="border-[#EACC91] text-[#523805]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tokenAddress" className="text-[#523805]">
                          Token Address
                        </Label>
                        <Input
                          id="tokenAddress"
                          name="tokenAddress"
                          placeholder="0x..."
                          value={formData.tokenAddress}
                          onChange={handleInputChange}
                          className="border-[#EACC91] text-[#523805]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="tokenPrice" className="text-[#523805]">
                          Token Price (CAKE)
                        </Label>
                        <Input
                          id="tokenPrice"
                          name="tokenPrice"
                          type="number"
                          placeholder="0.01"
                          value={formData.tokenPrice}
                          onChange={handleInputChange}
                          className="border-[#EACC91] text-[#523805]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="softCap" className="text-[#523805]">
                          Soft Cap (CAKE)
                        </Label>
                        <Input
                          id="softCap"
                          name="softCap"
                          type="number"
                          placeholder="100"
                          value={formData.softCap}
                          onChange={handleInputChange}
                          className="border-[#EACC91] text-[#523805]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="hardCap" className="text-[#523805]">
                          Hard Cap (CAKE)
                        </Label>
                        <Input
                          id="hardCap"
                          name="hardCap"
                          type="number"
                          placeholder="500"
                          value={formData.hardCap}
                          onChange={handleInputChange}
                          className="border-[#EACC91] text-[#523805]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="minAllocation" className="text-[#523805]">
                          Minimum Allocation (CAKE)
                        </Label>
                        <Input
                          id="minAllocation"
                          name="minAllocation"
                          type="number"
                          placeholder="0.1"
                          value={formData.minAllocation}
                          onChange={handleInputChange}
                          className="border-[#EACC91] text-[#523805]"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="maxAllocation" className="text-[#523805]">
                          Maximum Allocation (CAKE)
                        </Label>
                        <Input
                          id="maxAllocation"
                          name="maxAllocation"
                          type="number"
                          placeholder="5"
                          value={formData.maxAllocation}
                          onChange={handleInputChange}
                          className="border-[#EACC91] text-[#523805]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label className="text-[#523805]">Start Date & Time</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#523805]/50" />
                            <Input
                              id="startDate"
                              name="startDate"
                              type="date"
                              value={formData.startDate}
                              onChange={handleInputChange}
                              className="pl-10 border-[#EACC91] text-[#523805]"
                            />
                          </div>
                          <Input
                            id="startTime"
                            name="startTime"
                            type="time"
                            value={formData.startTime}
                            onChange={handleInputChange}
                            className="border-[#EACC91] text-[#523805]"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[#523805]">End Date & Time</Label>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#523805]/50" />
                            <Input
                              id="endDate"
                              name="endDate"
                              type="date"
                              value={formData.endDate}
                              onChange={handleInputChange}
                              className="pl-10 border-[#EACC91] text-[#523805]"
                            />
                          </div>
                          <Input
                            id="endTime"
                            name="endTime"
                            type="time"
                            value={formData.endTime}
                            onChange={handleInputChange}
                            className="border-[#EACC91] text-[#523805]"
                          />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </TabsContent>

                <TabsContent value="whitelist" className="mt-0">
                  <CardHeader>
                    <CardTitle className="text-[#523805]">Whitelist Settings</CardTitle>
                    <CardDescription>
                      Add addresses to the whitelist. Only whitelisted addresses will be able to participate in the IDO.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="whitelistAddresses" className="text-[#523805]">
                          Whitelist Addresses
                        </Label>
                        <textarea
                          id="whitelistAddresses"
                          name="whitelistAddresses"
                          placeholder="Enter addresses, one per line or comma separated"
                          value={formData.whitelistAddresses}
                          onChange={(e) => setFormData((prev) => ({ ...prev, whitelistAddresses: e.target.value }))}
                          className="w-full min-h-[200px] p-3 rounded-md border border-[#EACC91] text-[#523805] bg-white"
                        />
                      </div>

                      <div className="bg-[#EACC91]/20 rounded-xl p-4 border border-[#EACC91]/40">
                        <div className="flex items-start gap-2">
                          <Info className="h-5 w-5 text-[#523805] flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-medium text-[#523805] mb-1">Whitelist Information</p>
                            <p className="text-xs text-[#523805]/80">
                              You can add addresses to the whitelist now or later. Only whitelisted addresses will be
                              able to participate in the IDO. You can add or remove addresses from the whitelist after
                              creating the project.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </TabsContent>

                <CardFooter className="flex justify-between">
                  <Button
                    variant="outline"
                    className="border-[#EACC91] text-[#523805]"
                    onClick={() => router.push("/admin")}
                  >
                    Cancel
                  </Button>
                  <Button
                    className="bg-gradient-to-r from-[#EACC91] to-[#987A3F] hover:from-[#987A3F] hover:to-[#523805] text-[#523805] hover:text-white"
                    onClick={handleCreateProject}
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      "Create IDO Project"
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </Tabs>
          )}
        </div>
      </main>
    </div>
  )
}
