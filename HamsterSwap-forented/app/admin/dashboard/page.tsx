"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  Users,
  Calendar,
  Clock,
  RefreshCw,
  Coins,
  Gift,
  Tractor,
  Rocket,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  DollarSign,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { useWallet } from "@/contexts/wallet-context"
import { useIdoContract } from "@/hooks/use-ido-contract"
import { useFarmContract } from "@/hooks/use-farm-contract"
import { useAirdropContract } from "@/hooks/use-airdrop-contract"
import Navbar from "@/components/navbar"
import ClientOnly from "@/components/client-only"

export default function AdminDashboardPage() {
  return (
    <ClientOnly>
      <AdminDashboard />
    </ClientOnly>
  )
}

function AdminDashboard() {
  const router = useRouter()
  const { walletState, setIsWalletModalOpen } = useWallet()
  const { toast } = useToast()
  const [isRefreshing, setIsRefreshing] = useState(false)

  // 获取合约数据
  const { idoProjects, isLoading: isIdoLoading, refreshData: refreshIdoData } = useIdoContract()
  const { farms, isLoading: isFarmLoading, fetchFarms } = useFarmContract()
  const { getAllAirdrops, refreshAirdrops, isLoading: isAirdropLoading } = useAirdropContract()

  // 获取所有空投
  const airdrops = getAllAirdrops()

  // 刷新所有数据
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([refreshIdoData(), fetchFarms(), refreshAirdrops()])
      toast({
        title: "数据已刷新",
        description: "已加载最新的平台信息。",
      })
    } catch (error) {
      console.error("刷新数据失败:", error)
      toast({
        title: "刷新失败",
        description: "无法刷新数据。请重试。",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  // 格式化数字
  const formatNumber = (num: number, decimals = 2) => {
    return num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  }

  // 计算统计数据
  const totalIdoRaised = idoProjects.reduce((acc, project) => acc + project.totalRaised, 0)
  const activeIdoProjects = idoProjects.filter((p) => p.status === "active").length
  const totalFarmsTvl = farms.reduce((acc, farm) => acc + (farm.tvl || 0), 0)
  const activeFarms = farms.filter((f) => f.isActive).length

  // 检查钱包是否已连接
  if (!walletState.connected) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F9F5EA] via-[#EACC91]/20 to-[#F9F5EA] font-sans pb-20">
        <Navbar />
        <main className="container mx-auto px-4 pt-32">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#523805] to-[#987A3F] mb-4">
                管理员仪表盘
              </h1>
              <p className="text-lg text-[#523805]/80 max-w-2xl mx-auto">请连接您的钱包以访问管理员仪表盘。</p>
            </div>

            <Card className="border-[#EACC91] shadow-md">
              <CardHeader>
                <CardTitle className="text-[#523805]">连接钱包</CardTitle>
                <CardDescription>您需要连接钱包才能访问管理员仪表盘。</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  className="w-full bg-gradient-to-r from-[#EACC91] to-[#987A3F] hover:from-[#987A3F] hover:to-[#523805] text-[#523805] hover:text-white"
                  onClick={() => setIsWalletModalOpen(true)}
                >
                  连接钱包
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F9F5EA] via-[#EACC91]/20 to-[#F9F5EA] font-sans pb-20">
      <Navbar />

      <main className="container mx-auto px-4 pt-32">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#523805] to-[#987A3F]">
                管理员仪表盘
              </h1>
              <p className="text-[#523805]/70">平台性能概览</p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="border-[#EACC91] text-[#523805] hover:bg-[#EACC91]/20"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                刷新
              </Button>
              <Button
                variant="outline"
                className="border-[#EACC91] text-[#523805] hover:bg-[#EACC91]/20"
                onClick={() => router.push("/admin")}
              >
                返回管理面板
              </Button>
            </div>
          </div>

          {/* 平台概览 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="border-[#EACC91] shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-[#523805]">IDO总筹集</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div className="text-3xl font-bold text-[#523805]">{formatNumber(totalIdoRaised)} CAKE</div>
                  <DollarSign className="h-8 w-8 text-[#987A3F]" />
                </div>
                <div className="text-sm text-green-600 mt-2 flex items-center">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  <span>+{formatNumber(totalIdoRaised * 0.05)} (5%) 相比上周</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#EACC91] shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-[#523805]">活跃IDO</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div className="text-3xl font-bold text-[#523805]">{activeIdoProjects}</div>
                  <Activity className="h-8 w-8 text-[#987A3F]" />
                </div>
                <div className="text-sm text-[#523805]/70 mt-2 flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>下一个IDO在3天后</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#EACC91] shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-[#523805]">农场TVL</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div className="text-3xl font-bold text-[#523805]">${formatNumber(totalFarmsTvl || 1000000)}</div>
                  <Tractor className="h-8 w-8 text-[#987A3F]" />
                </div>
                <div className="text-sm text-red-600 mt-2 flex items-center">
                  <ArrowDownRight className="h-4 w-4 mr-1" />
                  <span>-{formatNumber((totalFarmsTvl || 1000000) * 0.02)} (2%) 相比上周</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#EACC91] shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-[#523805]">活跃空投</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div className="text-3xl font-bold text-[#523805]">{airdrops.filter((a) => a.active).length}</div>
                  <Gift className="h-8 w-8 text-[#987A3F]" />
                </div>
                <div className="text-sm text-[#523805]/70 mt-2 flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>今日更新</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border-[#EACC91] shadow-md md:col-span-2">
              <CardHeader>
                <CardTitle className="text-xl text-[#523805]">IDO项目概览</CardTitle>
                <CardDescription>所有IDO项目的状态和进度</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {isIdoLoading ? (
                    <div className="flex justify-center items-center py-10">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#987A3F]"></div>
                    </div>
                  ) : idoProjects.length === 0 ? (
                    <div className="bg-[#F9F5EA] rounded-xl p-6 border border-[#EACC91]/40 text-center">
                      <p className="text-[#523805]">暂无IDO项目。</p>
                      <Button
                        className="mt-4 bg-gradient-to-r from-[#EACC91] to-[#987A3F] hover:from-[#987A3F] hover:to-[#523805] text-[#523805] hover:text-white"
                        onClick={() => router.push("/admin/create-ido")}
                      >
                        创建您的第一个IDO
                      </Button>
                    </div>
                  ) : (
                    <>
                      {idoProjects.slice(0, 5).map((project) => (
                        <div key={project.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-full overflow-hidden border border-[#EACC91]">
                                <Image
                                  src={project.tokenLogo || "/placeholder.svg"}
                                  alt={project.name}
                                  width={40}
                                  height={40}
                                  className="object-cover"
                                />
                              </div>
                              <div>
                                <div className="font-medium text-[#523805]">{project.name}</div>
                                <div className="text-sm text-[#523805]/70">{project.tokenSymbol}</div>
                              </div>
                            </div>
                            <div className="text-sm font-medium">
                              {project.status === "active" ? (
                                <span className="text-green-600">活跃</span>
                              ) : project.status === "upcoming" ? (
                                <span className="text-blue-600">即将开始</span>
                              ) : project.status === "ended" ? (
                                <span className="text-gray-600">已结束</span>
                              ) : (
                                <span className="text-red-600">已取消</span>
                              )}
                            </div>
                          </div>
                          <div className="w-full">
                            <div className="flex justify-between text-xs text-[#523805]/70 mb-1">
                              <span>{formatNumber(project.totalRaised)} CAKE</span>
                              <span>
                                {formatNumber((project.totalRaised / project.hardCap) * 100)}% (
                                {formatNumber(project.hardCap)} CAKE)
                              </span>
                            </div>
                            <Progress
                              value={(project.totalRaised / project.hardCap) * 100}
                              className="h-2 bg-[#EACC91]/30"
                            />
                          </div>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        className="w-full border-[#EACC91] text-[#523805] hover:bg-[#EACC91]/20"
                        onClick={() => router.push("/admin/ido-management")}
                      >
                        查看所有IDO项目
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#EACC91] shadow-md">
              <CardHeader>
                <CardTitle className="text-xl text-[#523805]">空投概览</CardTitle>
                <CardDescription>所有空投活动的状态</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {isAirdropLoading ? (
                    <div className="flex justify-center items-center py-10">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#987A3F]"></div>
                    </div>
                  ) : airdrops.length === 0 ? (
                    <div className="bg-[#F9F5EA] rounded-xl p-6 border border-[#EACC91]/40 text-center">
                      <p className="text-[#523805]">暂无空投活动。</p>
                      <Button
                        className="mt-4 bg-gradient-to-r from-[#EACC91] to-[#987A3F] hover:from-[#987A3F] hover:to-[#523805] text-[#523805] hover:text-white"
                        onClick={() => router.push("/admin/create-airdrop")}
                      >
                        创建您的第一个空投
                      </Button>
                    </div>
                  ) : (
                    <>
                      {airdrops.slice(0, 5).map((airdrop, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-[#F9F5EA] rounded-lg">
                          <div>
                            <div className="font-medium text-[#523805]">
                              {airdrop.tokenSymbol} 空投 #{airdrop.id}
                            </div>
                            <div className="text-xs text-[#523805]/70">
                              {airdrop.claimedUsers.length}/{airdrop.eligibleUsers.length} 已领取
                            </div>
                          </div>
                          <div>
                            {airdrop.active ? (
                              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                活跃
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                                未激活
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        className="w-full border-[#EACC91] text-[#523805] hover:bg-[#EACC91]/20"
                        onClick={() => router.push("/admin")}
                      >
                        管理空投
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-[#EACC91] shadow-md">
              <CardHeader>
                <CardTitle className="text-xl text-[#523805]">农场概览</CardTitle>
                <CardDescription>所有农场的状态和TVL</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {isFarmLoading ? (
                    <div className="flex justify-center items-center py-10">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#987A3F]"></div>
                    </div>
                  ) : farms.length === 0 ? (
                    <div className="bg-[#F9F5EA] rounded-xl p-6 border border-[#EACC91]/40 text-center">
                      <p className="text-[#523805]">暂无农场。</p>
                      <Button
                        className="mt-4 bg-gradient-to-r from-[#EACC91] to-[#987A3F] hover:from-[#987A3F] hover:to-[#523805] text-[#523805] hover:text-white"
                        onClick={() => router.push("/admin")}
                      >
                        创建您的第一个农场
                      </Button>
                    </div>
                  ) : (
                    <>
                      {farms.slice(0, 5).map((farm, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-[#F9F5EA] rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="h-10 w-10 rounded-full overflow-hidden border border-[#EACC91]">
                                <Image
                                  src={farm.token0?.logo || "/cake-logo.svg"}
                                  alt={farm.token0?.symbol || "CAKE"}
                                  width={40}
                                  height={40}
                                  className="object-cover"
                                />
                              </div>
                              <div className="h-6 w-6 rounded-full overflow-hidden border border-white absolute -bottom-1 -right-1 bg-white">
                                <Image
                                  src={farm.token1?.logo || "/hamster-logo.svg"}
                                  alt={farm.token1?.symbol || "HAMSTER"}
                                  width={24}
                                  height={24}
                                  className="object-cover"
                                />
                              </div>
                            </div>
                            <div>
                              <div className="font-medium text-[#523805]">
                                {farm.name || `${farm.token0?.symbol || "CAKE"}-${farm.token1?.symbol || "HAMSTER"}`}
                              </div>
                              <div className="text-xs text-[#523805]/70">
                                APR: {farm.apr || 0}% • TVL: ${formatNumber(farm.tvl || 0)}
                              </div>
                            </div>
                          </div>
                          <div>
                            {farm.isActive ? (
                              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                                活跃
                              </span>
                            ) : (
                              <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                                未激活
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                      <Button
                        variant="outline"
                        className="w-full border-[#EACC91] text-[#523805] hover:bg-[#EACC91]/20"
                        onClick={() => router.push("/admin")}
                      >
                        管理农场
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#EACC91] shadow-md">
              <CardHeader>
                <CardTitle className="text-xl text-[#523805]">平台统计</CardTitle>
                <CardDescription>平台关键指标</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-[#F9F5EA] rounded-lg">
                    <div className="flex items-center gap-2">
                      <Users className="h-5 w-5 text-[#987A3F]" />
                      <span className="text-[#523805]">总用户数</span>
                    </div>
                    <span className="font-medium text-[#523805]">
                      {new Set(airdrops.flatMap((a) => a.eligibleUsers)).size}
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-[#F9F5EA] rounded-lg">
                    <div className="flex items-center gap-2">
                      <Gift className="h-5 w-5 text-[#987A3F]" />
                      <span className="text-[#523805]">空投总数</span>
                    </div>
                    <span className="font-medium text-[#523805]">{airdrops.length}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-[#F9F5EA] rounded-lg">
                    <div className="flex items-center gap-2">
                      <Rocket className="h-5 w-5 text-[#987A3F]" />
                      <span className="text-[#523805]">IDO总数</span>
                    </div>
                    <span className="font-medium text-[#523805]">{idoProjects.length}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-[#F9F5EA] rounded-lg">
                    <div className="flex items-center gap-2">
                      <Tractor className="h-5 w-5 text-[#987A3F]" />
                      <span className="text-[#523805]">农场总数</span>
                    </div>
                    <span className="font-medium text-[#523805]">{farms.length}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-[#F9F5EA] rounded-lg">
                    <div className="flex items-center gap-2">
                      <Coins className="h-5 w-5 text-[#987A3F]" />
                      <span className="text-[#523805]">平台总交易量</span>
                    </div>
                    <span className="font-medium text-[#523805]">$1,234,567</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
