"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import {
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  Layers,
  Activity,
  DollarSign,
  Plus,
  Clock,
  Calendar,
  RefreshCw,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/components/ui/use-toast"
import { useWallet } from "@/contexts/wallet-context"
import { useIdoContract } from "@/hooks/use-ido-contract"
import { useTokenContract } from "@/hooks/use-token-contract"
import { useFarmContract } from "@/hooks/use-farm-contract"
import Navbar from "@/components/navbar"

export default function AdminDashboardPage() {
  const router = useRouter()
  const { walletState, setIsWalletModalOpen } = useWallet()
  const { toast } = useToast()
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Get contract data
  const { idoProjects, isLoading: isIdoLoading, refreshData: refreshIdoData } = useIdoContract()
  const { tokenInfo, isLoading: isTokenLoading, refreshData: refreshTokenData } = useTokenContract()
  const { farms, isLoading: isFarmLoading, refreshData: refreshFarmData } = useFarmContract()

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([refreshIdoData(), refreshTokenData(), refreshFarmData()])
      toast({
        title: "Data refreshed",
        description: "The latest platform information has been loaded.",
      })
    } catch (error) {
      console.error("Error refreshing data:", error)
      toast({
        title: "Refresh failed",
        description: "Could not refresh data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  // Format number
  const formatNumber = (num: number, decimals = 2) => {
    return num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  }

  // Calculate statistics
  const totalIdoRaised = idoProjects.reduce((acc, project) => acc + project.totalRaised, 0)
  const activeIdoProjects = idoProjects.filter((p) => p.status === "active").length
  const totalFarmsTvl = farms.reduce((acc, farm) => acc + farm.tvl, 0)
  const activeFarms = farms.filter((f) => f.isActive).length

  // Check if wallet is connected
  if (!walletState.connected) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#F9F5EA] via-[#EACC91]/20 to-[#F9F5EA] font-sans pb-20">
        <Navbar />
        <main className="container mx-auto px-4 pt-32">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#523805] to-[#987A3F] mb-4">
                Admin Dashboard
              </h1>
              <p className="text-lg text-[#523805]/80 max-w-2xl mx-auto">
                Connect your wallet to access the admin dashboard.
              </p>
            </div>

            <Card className="border-[#EACC91] shadow-md">
              <CardHeader>
                <CardTitle className="text-[#523805]">Connect Wallet</CardTitle>
                <CardDescription>You need to connect your wallet to access the admin dashboard.</CardDescription>
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
                Admin Dashboard
              </h1>
              <p className="text-[#523805]/70">Overview of your platform performance</p>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="border-[#EACC91] text-[#523805] hover:bg-[#EACC91]/20"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                Refresh
              </Button>
            </div>
          </div>

          {/* Platform Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="border-[#EACC91] shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-[#523805]">Total IDO Raised</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div className="text-3xl font-bold text-[#523805]">{formatNumber(totalIdoRaised)} CAKE</div>
                  <DollarSign className="h-8 w-8 text-[#987A3F]" />
                </div>
                <div className="text-sm text-green-600 mt-2 flex items-center">
                  <ArrowUpRight className="h-4 w-4 mr-1" />
                  <span>+{formatNumber(totalIdoRaised * 0.05)} (5%) from last week</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#EACC91] shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-[#523805]">Active IDOs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div className="text-3xl font-bold text-[#523805]">{activeIdoProjects}</div>
                  <Activity className="h-8 w-8 text-[#987A3F]" />
                </div>
                <div className="text-sm text-[#523805]/70 mt-2 flex items-center">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>Next IDO in 3 days</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#EACC91] shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-[#523805]">Farms TVL</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div className="text-3xl font-bold text-[#523805]">${formatNumber(totalFarmsTvl)}</div>
                  <Layers className="h-8 w-8 text-[#987A3F]" />
                </div>
                <div className="text-sm text-red-600 mt-2 flex items-center">
                  <ArrowDownRight className="h-4 w-4 mr-1" />
                  <span>-{formatNumber(totalFarmsTvl * 0.02)} (2%) from last week</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#EACC91] shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg text-[#523805]">Active Farms</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end justify-between">
                  <div className="text-3xl font-bold text-[#523805]">{activeFarms}</div>
                  <PieChart className="h-8 w-8 text-[#987A3F]" />
                </div>
                <div className="text-sm text-[#523805]/70 mt-2 flex items-center">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>Last updated today</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="border-[#EACC91] shadow-md md:col-span-2">
              <CardHeader>
                <CardTitle className="text-xl text-[#523805]">Token Management</CardTitle>
                <CardDescription>Manage your platform tokens</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {isTokenLoading ? (
                    <div className="flex justify-center items-center py-10">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#987A3F]"></div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-[#EACC91]">
                          <Image
                            src="/hamster-logo.svg"
                            alt="HAMSTER"
                            width={48}
                            height={48}
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-[#523805]">{tokenInfo.name || "HAMSTER Token"}</h3>
                          <p className="text-sm text-[#523805]/70">{tokenInfo.symbol || "HAMSTER"}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-[#F9F5EA] rounded-xl p-4 border border-[#EACC91]/40">
                          <p className="text-sm text-[#523805]/70 mb-1">Total Supply</p>
                          <p className="text-lg font-medium text-[#523805]">
                            {formatNumber(Number(tokenInfo.totalSupply) || 1000000)}
                          </p>
                        </div>
                        <div className="bg-[#F9F5EA] rounded-xl p-4 border border-[#EACC91]/40">
                          <p className="text-sm text-[#523805]/70 mb-1">Circulating Supply</p>
                          <p className="text-lg font-medium text-[#523805]">
                            {formatNumber(Number(tokenInfo.circulatingSupply) || 750000)}
                          </p>
                        </div>
                        <div className="bg-[#F9F5EA] rounded-xl p-4 border border-[#EACC91]/40">
                          <p className="text-sm text-[#523805]/70 mb-1">Your Balance</p>
                          <p className="text-lg font-medium text-[#523805]">
                            {formatNumber(Number(tokenInfo.balance) || 100000)}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-2">
                        <Button
                          className="bg-gradient-to-r from-[#EACC91] to-[#987A3F] hover:from-[#987A3F] hover:to-[#523805] text-[#523805] hover:text-white flex-1"
                          onClick={() => router.push("/admin/token-management")}
                        >
                          Manage Token
                        </Button>
                        <Button
                          variant="outline"
                          className="border-[#EACC91] text-[#523805] hover:bg-[#EACC91]/20 flex-1"
                          onClick={() => router.push("/admin/token-distribution")}
                        >
                          Token Distribution
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#EACC91] shadow-md">
              <CardHeader>
                <CardTitle className="text-xl text-[#523805]">Quick Actions</CardTitle>
                <CardDescription>Common admin tasks</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Button
                    className="w-full bg-gradient-to-r from-[#EACC91] to-[#987A3F] hover:from-[#987A3F] hover:to-[#523805] text-[#523805] hover:text-white justify-start"
                    onClick={() => router.push("/admin/create-ido")}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create New IDO
                  </Button>
                  <Button
                    className="w-full bg-gradient-to-r from-[#EACC91] to-[#987A3F] hover:from-[#987A3F] hover:to-[#523805] text-[#523805] hover:text-white justify-start"
                    onClick={() => router.push("/admin/farm-management")}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Farm
                  </Button>
                  <Button
                    className="w-full bg-gradient-to-r from-[#EACC91] to-[#987A3F] hover:from-[#987A3F] hover:to-[#523805] text-[#523805] hover:text-white justify-start"
                    onClick={() => router.push("/admin/create-airdrop")}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Create Airdrop
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-[#EACC91] text-[#523805] hover:bg-[#EACC91]/20 justify-start"
                    onClick={() => router.push("/admin/contract-addresses")}
                  >
                    <Wallet className="h-4 w-4 mr-2" />
                    Manage Contracts
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="ido" className="w-full">
            <TabsList className="bg-[#EACC91]/30 p-1 rounded-xl mb-6">
              <TabsTrigger
                value="ido"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#523805] data-[state=active]:shadow-sm text-[#523805]/70"
              >
                IDO Projects
              </TabsTrigger>
              <TabsTrigger
                value="farms"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#523805] data-[state=active]:shadow-sm text-[#523805]/70"
              >
                Farms
              </TabsTrigger>
              <TabsTrigger
                value="analytics"
                className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#523805] data-[state=active]:shadow-sm text-[#523805]/70"
              >
                Analytics
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ido" className="mt-0">
              <Card className="border-[#EACC91] shadow-md">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xl text-[#523805]">Recent IDO Projects</CardTitle>
                  <Button
                    variant="ghost"
                    className="text-[#523805] hover:bg-[#EACC91]/20"
                    onClick={() => router.push("/admin/ido-management")}
                  >
                    View All
                  </Button>
                </CardHeader>
                <CardContent>
                  {isIdoLoading ? (
                    <div className="flex justify-center items-center py-10">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#987A3F]"></div>
                    </div>
                  ) : idoProjects.length === 0 ? (
                    <div className="bg-[#F9F5EA] rounded-xl p-6 border border-[#EACC91]/40 text-center">
                      <p className="text-[#523805]">No IDO projects found.</p>
                      <Button
                        className="mt-4 bg-gradient-to-r from-[#EACC91] to-[#987A3F] hover:from-[#987A3F] hover:to-[#523805] text-[#523805] hover:text-white"
                        onClick={() => router.push("/admin/create-ido")}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First IDO
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {idoProjects.slice(0, 3).map((project) => (
                        <div
                          key={project.id}
                          className="flex items-center justify-between p-4 bg-[#F9F5EA] rounded-xl border border-[#EACC91]/40"
                        >
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
                              <div className="text-sm text-[#523805]/70">
                                {project.status.charAt(0).toUpperCase() + project.status.slice(1)} •{" "}
                                {formatNumber(project.totalRaised)} CAKE
                              </div>
                            </div>
                          </div>
                          <div className="w-24">
                            <div className="text-xs text-[#523805]/70 mb-1 text-right">
                              {formatNumber(calculateProgress(project))}%
                            </div>
                            <Progress
                              value={calculateProgress(project)}
                              className="h-2 bg-[#EACC91]/30"
                              indicatorClassName="bg-gradient-to-r from-[#EACC91] to-[#987A3F]"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="farms" className="mt-0">
              <Card className="border-[#EACC91] shadow-md">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xl text-[#523805]">Active Farms</CardTitle>
                  <Button
                    variant="ghost"
                    className="text-[#523805] hover:bg-[#EACC91]/20"
                    onClick={() => router.push("/admin/farm-management")}
                  >
                    View All
                  </Button>
                </CardHeader>
                <CardContent>
                  {isFarmLoading ? (
                    <div className="flex justify-center items-center py-10">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#987A3F]"></div>
                    </div>
                  ) : farms.length === 0 ? (
                    <div className="bg-[#F9F5EA] rounded-xl p-6 border border-[#EACC91]/40 text-center">
                      <p className="text-[#523805]">No farms found.</p>
                      <Button
                        className="mt-4 bg-gradient-to-r from-[#EACC91] to-[#987A3F] hover:from-[#987A3F] hover:to-[#523805] text-[#523805] hover:text-white"
                        onClick={() => router.push("/admin/farm-management")}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Farm
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {farms.slice(0, 3).map((farm, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-4 bg-[#F9F5EA] rounded-xl border border-[#EACC91]/40"
                        >
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div className="h-10 w-10 rounded-full overflow-hidden border border-[#EACC91]">
                                <Image
                                  src={farm.token1Logo || "/cake-logo.svg"}
                                  alt={farm.token1Symbol || "CAKE"}
                                  width={40}
                                  height={40}
                                  className="object-cover"
                                />
                              </div>
                              <div className="h-6 w-6 rounded-full overflow-hidden border border-[#EACC91] absolute -bottom-1 -right-1 bg-white">
                                <Image
                                  src={farm.token2Logo || "/hamster-logo.svg"}
                                  alt={farm.token2Symbol || "HAMSTER"}
                                  width={24}
                                  height={24}
                                  className="object-cover"
                                />
                              </div>
                            </div>
                            <div>
                              <div className="font-medium text-[#523805]">
                                {farm.token1Symbol || "CAKE"}-{farm.token2Symbol || "HAMSTER"}
                              </div>
                              <div className="text-sm text-[#523805]/70">
                                APR: {farm.apr || "120"}% • TVL: ${formatNumber(farm.tvl || 250000)}
                              </div>
                            </div>
                          </div>
                          <div className="text-sm font-medium text-[#523805]">
                            {farm.isActive ? "Active" : "Inactive"}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="analytics" className="mt-0">
              <Card className="border-[#EACC91] shadow-md">
                <CardHeader>
                  <CardTitle className="text-xl text-[#523805]">Platform Analytics</CardTitle>
                  <CardDescription>Overview of your platform performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-[#F9F5EA] rounded-xl p-6 border border-[#EACC91]/40">
                      <h3 className="text-lg font-medium text-[#523805] mb-4">User Statistics</h3>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-[#523805]/70">Total Users</span>
                          <span className="font-medium text-[#523805]">1,245</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#523805]/70">Active Users (24h)</span>
                          <span className="font-medium text-[#523805]">328</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#523805]/70">New Users (7d)</span>
                          <span className="font-medium text-[#523805]">156</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#523805]/70">Retention Rate</span>
                          <span className="font-medium text-[#523805]">68%</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#F9F5EA] rounded-xl p-6 border border-[#EACC91]/40">
                      <h3 className="text-lg font-medium text-[#523805] mb-4">Transaction Volume</h3>
                      <div className="space-y-4">
                        <div className="flex justify-between">
                          <span className="text-[#523805]/70">24h Volume</span>
                          <span className="font-medium text-[#523805]">$124,567</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#523805]/70">7d Volume</span>
                          <span className="font-medium text-[#523805]">$876,432</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#523805]/70">30d Volume</span>
                          <span className="font-medium text-[#523805]">$3,245,678</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-[#523805]/70">Avg. Transaction Size</span>
                          <span className="font-medium text-[#523805]">$345</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 text-center">
                    <Button
                      className="bg-gradient-to-r from-[#EACC91] to-[#987A3F] hover:from-[#987A3F] hover:to-[#523805] text-[#523805] hover:text-white"
                      onClick={() => router.push("/admin/analytics")}
                    >
                      View Detailed Analytics
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  )
}

// Helper function to calculate progress
function calculateProgress(project: any) {
  return (project.totalRaised / project.hardCap) * 100
}
