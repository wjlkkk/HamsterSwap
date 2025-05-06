"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import {
  ChevronDown,
  ChevronUp,
  Info,
  Calculator,
  ExternalLink,
  Search,
  Filter,
  RefreshCw,
  Lock,
  Unlock,
  Award,
  History,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Slider } from "@/components/ui/slider"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { useWallet } from "@/contexts/wallet-context"
import Navbar from "@/components/navbar"
import { useFarmContract } from "@/hooks/use-farm-contract"

export default function FarmPage() {
  const { walletState, setIsWalletModalOpen } = useWallet()
  const { farms, userStakes, userRewards, isLoading, fetchFarms, stake, unstake, harvest, getUserTotalRewards } =
    useFarmContract()

  const [activeTab, setActiveTab] = useState("active")
  const [searchQuery, setSearchQuery] = useState("")
  const [showStakedOnly, setShowStakedOnly] = useState(false)
  const [sortBy, setSortBy] = useState("apr")
  const [expandedFarm, setExpandedFarm] = useState<number | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [totalRewards, setTotalRewards] = useState<Record<number, string>>({})
  const [isRewardsHistoryOpen, setIsRewardsHistoryOpen] = useState(false)
  const [selectedFarmForHistory, setSelectedFarmForHistory] = useState<number | null>(null)

  // 处理刷新
  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchFarms()
    setTimeout(() => setRefreshing(false), 1000)
  }

  // 处理农场展开/折叠
  const toggleFarmExpand = (id: number) => {
    if (expandedFarm === id) {
      setExpandedFarm(null)
    } else {
      setExpandedFarm(id)
    }
  }

  // 获取用户总奖励
  useEffect(() => {
    const fetchTotalRewards = async () => {
      if (!walletState.connected || farms.length === 0) return

      try {
        const totalRewardsData: Record<number, string> = {}

        for (const farm of farms) {
          const total = await getUserTotalRewards(farm.id)
          totalRewardsData[farm.id] = total
        }

        setTotalRewards(totalRewardsData)
      } catch (error) {
        console.error("Error fetching total rewards:", error)
        // 出错时设置为空对象，避免未定义错误
        setTotalRewards({})
      }
    }

    fetchTotalRewards()
  }, [farms, walletState.connected, getUserTotalRewards])

  // 打开奖励历史对话框
  const openRewardsHistory = (farmId: number) => {
    setSelectedFarmForHistory(farmId)
    setIsRewardsHistoryOpen(true)
  }

  // 过滤和排序农场
  const filteredFarms = farms
    .filter((farm) => {
      const matchesSearch =
        farm.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        farm.lpToken.toLowerCase().includes(searchQuery.toLowerCase()) ||
        farm.rewardToken.toLowerCase().includes(searchQuery.toLowerCase())

      const matchesTab =
        (activeTab === "active" && farm.isActive) || (activeTab === "inactive" && !farm.isActive) || activeTab === "all"

      const matchesStaked = !showStakedOnly || (userStakes[farm.id] && Number.parseFloat(userStakes[farm.id]) > 0)

      return matchesSearch && matchesTab && matchesStaked
    })
    .sort((a, b) => {
      if (sortBy === "apr") {
        return b.apr - a.apr
      } else if (sortBy === "liquidity") {
        return b.totalStaked - a.totalStaked
      } else if (sortBy === "earned") {
        const aEarned = userRewards[a.id] ? Number.parseFloat(userRewards[a.id]) : 0
        const bEarned = userRewards[b.id] ? Number.parseFloat(userRewards[b.id]) : 0
        return bEarned - aEarned
      }
      return 0
    })

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F9F5EA] via-[#EACC91]/20 to-[#F9F5EA] font-sans pb-20">
      <Navbar />

      <main className="container mx-auto px-4 pt-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-5xl mx-auto"
        >
          {/* 页面标题 */}
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#523805] to-[#987A3F] mb-4">
              Hamster Farms
            </h1>
            <p className="text-lg text-[#523805]/80 max-w-2xl mx-auto">
              Stake LP tokens to earn rewards. You can unstake at any time and claim your rewards.
            </p>
          </div>

          {/* 主要内容区 */}
          <div className="bg-white rounded-3xl shadow-xl border border-[#EACC91] p-6 mb-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <Tabs defaultValue="active" className="w-full" onValueChange={setActiveTab}>
                <TabsList className="bg-[#EACC91]/30 p-1 rounded-xl">
                  <TabsTrigger
                    value="active"
                    className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#523805] data-[state=active]:shadow-sm text-[#523805]/70"
                  >
                    Active
                  </TabsTrigger>
                  <TabsTrigger
                    value="inactive"
                    className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#523805] data-[state=active]:shadow-sm text-[#523805]/70"
                  >
                    Inactive
                  </TabsTrigger>
                  <TabsTrigger
                    value="all"
                    className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#523805] data-[state=active]:shadow-sm text-[#523805]/70"
                  >
                    All
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  className="rounded-full border-[#EACC91] hover:bg-[#EACC91]/20 text-[#523805]"
                  onClick={handleRefresh}
                >
                  <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-full border-[#EACC91] hover:bg-[#EACC91]/20 text-[#523805]"
                    >
                      <Filter className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md rounded-2xl border border-[#EACC91]">
                    <DialogHeader>
                      <DialogTitle className="text-[#523805]">Filter Farms</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-[#523805]">Staked only</span>
                        <Switch
                          checked={showStakedOnly}
                          onCheckedChange={setShowStakedOnly}
                          className="data-[state=checked]:bg-[#987A3F]"
                        />
                      </div>
                      <div className="space-y-2">
                        <span className="text-[#523805]">Sort by</span>
                        <div className="grid grid-cols-3 gap-2">
                          <Button
                            variant={sortBy === "apr" ? "default" : "outline"}
                            onClick={() => setSortBy("apr")}
                            className={
                              sortBy === "apr"
                                ? "bg-[#987A3F] hover:bg-[#523805] text-white"
                                : "border-[#EACC91] text-[#523805]"
                            }
                          >
                            APR
                          </Button>
                          <Button
                            variant={sortBy === "liquidity" ? "default" : "outline"}
                            onClick={() => setSortBy("liquidity")}
                            className={
                              sortBy === "liquidity"
                                ? "bg-[#987A3F] hover:bg-[#523805] text-white"
                                : "border-[#EACC91] text-[#523805]"
                            }
                          >
                            Liquidity
                          </Button>
                          <Button
                            variant={sortBy === "earned" ? "default" : "outline"}
                            onClick={() => setSortBy("earned")}
                            className={
                              sortBy === "earned"
                                ? "bg-[#987A3F] hover:bg-[#523805] text-white"
                                : "border-[#EACC91] text-[#523805]"
                            }
                          >
                            Earned
                          </Button>
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </div>

            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#523805]/50" />
              <Input
                placeholder="Search farms"
                className="pl-10 border-[#EACC91] text-[#523805] rounded-xl"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* 农场列表 */}
            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#987A3F]"></div>
              </div>
            ) : filteredFarms.length === 0 ? (
              <div className="bg-[#F9F5EA] rounded-2xl p-8 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-3 bg-[#EACC91]/30 rounded-full">
                    <Info className="h-8 w-8 text-[#523805]/50" />
                  </div>
                  <h3 className="text-xl font-bold text-[#523805]">No Farms Found</h3>
                  <p className="text-[#523805]/70">
                    No farms match your search criteria or there are no active farms at the moment.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* 表头 */}
                <div className="hidden md:grid grid-cols-7 gap-4 px-6 py-3 text-sm font-medium text-[#523805]/70">
                  <div className="col-span-3">Farm</div>
                  <div className="text-right">Earned</div>
                  <div className="text-right">APR</div>
                  <div className="text-right">Liquidity</div>
                  <div className="text-right">Multiplier</div>
                </div>

                {filteredFarms.map((farm) => (
                  <FarmCard
                    key={farm.id}
                    farm={farm}
                    isExpanded={expandedFarm === farm.id}
                    toggleExpand={() => toggleFarmExpand(farm.id)}
                    userStake={userStakes[farm.id] || "0"}
                    userReward={userRewards[farm.id] || "0"}
                    totalReward={totalRewards[farm.id] || "0"}
                    onStake={(amount) => stake(farm.id, amount)}
                    onUnstake={(amount) => unstake(farm.id, amount)}
                    onHarvest={() => harvest(farm.id)}
                    onViewRewardsHistory={() => openRewardsHistory(farm.id)}
                    isWalletConnected={walletState.connected}
                    onConnectWallet={() => setIsWalletModalOpen(true)}
                  />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </main>

      {/* 奖励历史对话框 */}
      <Dialog open={isRewardsHistoryOpen} onOpenChange={setIsRewardsHistoryOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl border border-[#EACC91]">
          <DialogHeader>
            <DialogTitle className="text-[#523805]">Rewards History</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {selectedFarmForHistory !== null && (
              <div className="space-y-4">
                <div className="bg-[#F9F5EA] rounded-xl p-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-[#523805]/70">Farm</span>
                    <span className="font-medium text-[#523805]">
                      {farms.find((f) => f.id === selectedFarmForHistory)?.name}
                    </span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-[#523805]/70">Total Earned</span>
                    <span className="font-medium text-[#523805]">
                      {formatNumber(Number.parseFloat(totalRewards[selectedFarmForHistory] || "0"))}{" "}
                      {farms.find((f) => f.id === selectedFarmForHistory)?.rewardToken}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#523805]/70">Pending Rewards</span>
                    <span className="font-medium text-[#523805]">
                      {formatNumber(Number.parseFloat(userRewards[selectedFarmForHistory] || "0"))}{" "}
                      {farms.find((f) => f.id === selectedFarmForHistory)?.rewardToken}
                    </span>
                  </div>
                </div>

                <div className="text-center text-sm text-[#523805]/70">
                  <p>Detailed reward history is not available on-chain.</p>
                  <p>The total earned represents all rewards you've earned in this farm.</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              onClick={() => setIsRewardsHistoryOpen(false)}
              className="bg-gradient-to-r from-[#EACC91] to-[#987A3F] hover:from-[#987A3F] hover:to-[#523805] text-[#523805] hover:text-white"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// 农场卡片组件
interface FarmCardProps {
  farm: {
    id: number
    name: string
    lpToken: string
    rewardToken: string
    apr: number
    totalStaked: number
    multiplier: string
    isActive: boolean
    token0: {
      symbol: string
      logo: string
    }
    token1: {
      symbol: string
      logo: string
    }
  }
  isExpanded: boolean
  toggleExpand: () => void
  userStake: string
  userReward: string
  totalReward: string
  onStake: (amount: string) => void
  onUnstake: (amount: string) => void
  onHarvest: () => void
  onViewRewardsHistory: () => void
  isWalletConnected: boolean
  onConnectWallet: () => void
}

function FarmCard({
  farm,
  isExpanded,
  toggleExpand,
  userStake,
  userReward,
  totalReward,
  onStake,
  onUnstake,
  onHarvest,
  onViewRewardsHistory,
  isWalletConnected,
  onConnectWallet,
}: FarmCardProps) {
  const [stakeAmount, setStakeAmount] = useState("")
  const [unstakeAmount, setUnstakeAmount] = useState("")
  const [unstakePercent, setUnstakePercent] = useState(0)
  const [isStakeDialogOpen, setIsStakeDialogOpen] = useState(false)
  const [isUnstakeDialogOpen, setIsUnstakeDialogOpen] = useState(false)

  // 处理质押
  const handleStake = () => {
    if (!stakeAmount || Number.parseFloat(stakeAmount) <= 0) return
    onStake(stakeAmount)
    setStakeAmount("")
    setIsStakeDialogOpen(false)
  }

  // 处理解质押
  const handleUnstake = () => {
    if (!unstakeAmount || Number.parseFloat(unstakeAmount) <= 0) return
    onUnstake(unstakeAmount)
    setUnstakeAmount("")
    setUnstakePercent(0)
    setIsUnstakeDialogOpen(false)
  }

  // 处理解质押百分比滑块
  const handleUnstakePercentChange = (value: number[]) => {
    const percent = value[0]
    setUnstakePercent(percent)
    if (userStake) {
      // 确保精度正确
      const amount = ((Number.parseFloat(userStake) * percent) / 100).toFixed(18)
      setUnstakeAmount(amount)
    }
  }

  // 格式化数字
  const formatNumber = (num: number, decimals = 2) => {
    if (isNaN(num)) return "0.00"
    return num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  }

  // 格式化美元金额
  const formatUSD = (num: number) => {
    if (num >= 1e9) {
      return `$${(num / 1e9).toFixed(2)}B`
    } else if (num >= 1e6) {
      return `$${(num / 1e6).toFixed(2)}M`
    } else if (num >= 1e3) {
      return `$${(num / 1e3).toFixed(2)}K`
    }
    return `$${num.toFixed(2)}`
  }

  return (
    <motion.div
      className="bg-white rounded-2xl shadow-md border border-[#EACC91] overflow-hidden"
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400 }}
    >
      {/* 农场卡片头部 */}
      <div className="p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
          {/* 农场名称和图标 */}
          <div className="col-span-1 md:col-span-3 flex items-center gap-3">
            <div className="relative h-12 w-12">
              <div className="absolute top-0 left-0 h-8 w-8 rounded-full overflow-hidden border-2 border-white z-10">
                <Image
                  src={farm.token0.logo || "/placeholder.svg"}
                  alt={farm.token0.symbol}
                  width={32}
                  height={32}
                  className="object-cover"
                />
              </div>
              <div className="absolute bottom-0 right-0 h-8 w-8 rounded-full overflow-hidden border-2 border-white">
                <Image
                  src={farm.token1.logo || "/placeholder.svg"}
                  alt={farm.token1.symbol}
                  width={32}
                  height={32}
                  className="object-cover"
                />
              </div>
            </div>
            <div>
              <h3 className="font-bold text-[#523805]">{farm.name}</h3>
              <div className="flex items-center gap-1 text-xs text-[#523805]/70">
                {farm.isActive ? (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    Inactive
                  </span>
                )}
                <span>•</span>
                <span>Earn {farm.rewardToken}</span>
              </div>
            </div>
          </div>

          {/* 已赚取 */}
          <div className="md:text-right">
            <div className="text-sm text-[#523805]/70 md:hidden">Earned</div>
            <div className="font-medium text-[#523805]">
              {formatNumber(Number(userReward) || 0)} {farm.rewardToken}
            </div>
            <div className="text-xs text-[#523805]/70">~${((Number(userReward) || 0) * 2.5).toFixed(2)}</div>
          </div>

          {/* APR */}
          <div className="md:text-right">
            <div className="text-sm text-[#523805]/70 md:hidden">APR</div>
            <div className="flex items-center justify-end gap-1">
              <span className="font-medium text-[#523805]">{formatNumber(farm.apr)}%</span>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full text-[#523805]/70">
                    <Calculator className="h-3.5 w-3.5" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md rounded-2xl border border-[#EACC91]">
                  <DialogHeader>
                    <DialogTitle className="text-[#523805]">ROI Calculator</DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    <div className="space-y-4">
                      <div className="bg-[#F9F5EA] rounded-xl p-4">
                        <div className="text-sm text-[#523805]/70 mb-2">APR</div>
                        <div className="text-2xl font-bold text-[#523805]">{formatNumber(farm.apr)}%</div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-[#523805]/70">Timeframe</span>
                          <span className="font-medium text-[#523805]">1 Year</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[#523805]/70">ROI at current rates</span>
                          <span className="font-medium text-[#523805]">${formatNumber(farm.apr)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-[#523805]/70">ROI in {farm.rewardToken}</span>
                          <span className="font-medium text-[#523805]">
                            {formatNumber(farm.apr / 2.5)} {farm.rewardToken}
                          </span>
                        </div>
                      </div>

                      <div className="text-xs text-[#523805]/70">
                        Calculated based on current rates. Compounding once daily. Rates are estimates provided for your
                        convenience only, and by no means represent guaranteed returns.
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* 流动性 */}
          <div className="md:text-right">
            <div className="text-sm text-[#523805]/70 md:hidden">Liquidity</div>
            <div className="font-medium text-[#523805]">{formatUSD(farm.totalStaked)}</div>
          </div>

          {/* 乘数 */}
          <div className="md:text-right">
            <div className="text-sm text-[#523805]/70 md:hidden">Multiplier</div>
            <div className="font-medium text-[#523805]">{farm.multiplier}x</div>
          </div>

          {/* 展开/折叠按钮 */}
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-[#EACC91]/20 text-[#523805]"
              onClick={toggleExpand}
            >
              {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* 展开的详情部分 */}
      {isExpanded && (
        <div className="p-6 border-t border-[#EACC91]/30 bg-[#F9F5EA]/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 左侧 - 质押信息 */}
            <div>
              <div className="mb-4">
                <h4 className="font-medium text-[#523805] mb-2">Stake LP Tokens</h4>
                <div className="flex items-center gap-2 text-sm text-[#523805]/70">
                  <a
                    href="#"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#987A3F] hover:underline flex items-center gap-1"
                  >
                    Get {farm.token0.symbol}-{farm.token1.symbol} LP <ExternalLink className="h-3 w-3" />
                  </a>
                  <span>•</span>
                  <a
                    href="#"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#987A3F] hover:underline flex items-center gap-1"
                  >
                    View Contract <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>

              {Number.parseFloat(userStake) > 0 ? (
                <div className="bg-white rounded-xl p-4 border border-[#EACC91] mb-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-[#523805]/70">Staked</span>
                    <span className="text-sm font-medium text-[#523805]">
                      {formatNumber(Number.parseFloat(userStake))} LP
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-[#523805]/70">
                      ~${(Number.parseFloat(userStake) * 10).toFixed(2)}
                    </span>
                    <a
                      href="#"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-[#987A3F] hover:underline flex items-center gap-1"
                    >
                      View on Explorer <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl p-4 border border-[#EACC91] mb-4 text-center">
                  <p className="text-[#523805]/70 text-sm">You have no LP tokens staked in this farm yet.</p>
                </div>
              )}

              <div className="flex gap-2">
                {isWalletConnected ? (
                  <>
                    <Dialog open={isStakeDialogOpen} onOpenChange={setIsStakeDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="flex-1 bg-gradient-to-r from-[#EACC91] to-[#987A3F] hover:from-[#987A3F] hover:to-[#523805] text-[#523805] hover:text-white">
                          <Lock className="h-4 w-4 mr-2" />
                          Stake
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md rounded-2xl border border-[#EACC91]">
                        <DialogHeader>
                          <DialogTitle className="text-[#523805]">Stake LP Tokens</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                          <div className="bg-[#F9F5EA] rounded-xl p-4 mb-4">
                            <div className="flex justify-between mb-2">
                              <span className="text-[#523805]/70">Stake</span>
                              <span className="text-sm text-[#523805]/70">Balance: 10.0 LP</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={stakeAmount}
                                onChange={(e) => setStakeAmount(e.target.value)}
                                className="border-0 bg-transparent text-xl font-medium focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-[#523805]"
                                placeholder="0.0"
                              />
                              <div className="flex items-center gap-2 bg-white rounded-full px-3 py-1.5 border border-[#EACC91]">
                                <div className="relative h-5 w-5">
                                  <div className="absolute top-0 left-0 h-4 w-4 rounded-full overflow-hidden z-10">
                                    <Image
                                      src={farm.token0.logo || "/placeholder.svg"}
                                      alt={farm.token0.symbol}
                                      width={16}
                                      height={16}
                                      className="object-cover"
                                    />
                                  </div>
                                  <div className="absolute bottom-0 right-0 h-4 w-4 rounded-full overflow-hidden">
                                    <Image
                                      src={farm.token1.logo || "/placeholder.svg"}
                                      alt={farm.token1.symbol}
                                      width={16}
                                      height={16}
                                      className="object-cover"
                                    />
                                  </div>
                                </div>
                                <span className="text-sm font-medium text-[#523805]">LP</span>
                              </div>
                            </div>
                            <div className="flex justify-between mt-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="text-xs text-[#987A3F] hover:text-[#523805] hover:bg-[#EACC91]/30 px-2 py-1 h-auto"
                                onClick={() => setStakeAmount("10.0")}
                              >
                                MAX
                              </Button>
                              <span className="text-xs text-[#523805]/70">
                                ~${stakeAmount ? (Number.parseFloat(stakeAmount) * 10).toFixed(2) : "0.00"}
                              </span>
                            </div>
                          </div>

                          <div className="text-xs text-[#523805]/70 mb-4">
                            By staking your LP tokens, you'll earn {farm.rewardToken} rewards. You can unstake at any
                            time.
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setIsStakeDialogOpen(false)}
                            className="border-[#EACC91] text-[#523805]"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleStake}
                            className="bg-gradient-to-r from-[#EACC91] to-[#987A3F] hover:from-[#987A3F] hover:to-[#523805] text-[#523805] hover:text-white"
                          >
                            Confirm
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={isUnstakeDialogOpen} onOpenChange={setIsUnstakeDialogOpen}>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          className="flex-1 border-[#EACC91] text-[#523805] hover:bg-[#EACC91]/20"
                          disabled={Number.parseFloat(userStake) <= 0}
                        >
                          <Unlock className="h-4 w-4 mr-2" />
                          Unstake
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md rounded-2xl border border-[#EACC91]">
                        <DialogHeader>
                          <DialogTitle className="text-[#523805]">Unstake LP Tokens</DialogTitle>
                        </DialogHeader>
                        <div className="py-4">
                          <div className="bg-[#F9F5EA] rounded-xl p-4 mb-4">
                            <div className="flex justify-between mb-2">
                              <span className="text-[#523805]/70">Unstake</span>
                              <span className="text-sm text-[#523805]/70">
                                Staked: {formatNumber(Number.parseFloat(userStake))} LP
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={unstakeAmount}
                                onChange={(e) => {
                                  setUnstakeAmount(e.target.value)
                                  if (Number.parseFloat(userStake) > 0 && e.target.value) {
                                    const percent =
                                      (Number.parseFloat(e.target.value) / Number.parseFloat(userStake)) * 100
                                    setUnstakePercent(Math.min(percent, 100))
                                  } else {
                                    setUnstakePercent(0)
                                  }
                                }}
                                className="border-0 bg-transparent text-xl font-medium focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-[#523805]"
                                placeholder="0.0"
                              />
                              <div className="flex items-center gap-2 bg-white rounded-full px-3 py-1.5 border border-[#EACC91]">
                                <div className="relative h-5 w-5">
                                  <div className="absolute top-0 left-0 h-4 w-4 rounded-full overflow-hidden z-10">
                                    <Image
                                      src={farm.token0.logo || "/placeholder.svg"}
                                      alt={farm.token0.symbol}
                                      width={16}
                                      height={16}
                                      className="object-cover"
                                    />
                                  </div>
                                  <div className="absolute bottom-0 right-0 h-4 w-4 rounded-full overflow-hidden">
                                    <Image
                                      src={farm.token1.logo || "/placeholder.svg"}
                                      alt={farm.token1.symbol}
                                      width={16}
                                      height={16}
                                      className="object-cover"
                                    />
                                  </div>
                                </div>
                                <span className="text-sm font-medium text-[#523805]">LP</span>
                              </div>
                            </div>
                            <div className="mt-4">
                              <Slider
                                value={[unstakePercent]}
                                min={0}
                                max={100}
                                step={1}
                                onValueChange={handleUnstakePercentChange}
                                className="[&_[role=slider]]:bg-[#987A3F]"
                              />
                              <div className="flex justify-between mt-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUnstakePercentChange([25])}
                                  className="text-xs border-[#EACC91] text-[#523805] hover:bg-[#EACC91]/20 px-2 py-1 h-auto"
                                >
                                  25%
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUnstakePercentChange([50])}
                                  className="text-xs border-[#EACC91] text-[#523805] hover:bg-[#EACC91]/20 px-2 py-1 h-auto"
                                >
                                  50%
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUnstakePercentChange([75])}
                                  className="text-xs border-[#EACC91] text-[#523805] hover:bg-[#EACC91]/20 px-2 py-1 h-auto"
                                >
                                  75%
                                </Button>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleUnstakePercentChange([100])}
                                  className="text-xs border-[#EACC91] text-[#523805] hover:bg-[#EACC91]/20 px-2 py-1 h-auto"
                                >
                                  MAX
                                </Button>
                              </div>
                            </div>
                          </div>

                          <div className="text-xs text-[#523805]/70 mb-4">
                            Unstaking your LP tokens will also harvest any earned rewards.
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setIsUnstakeDialogOpen(false)}
                            className="border-[#EACC91] text-[#523805]"
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleUnstake}
                            className="bg-gradient-to-r from-[#EACC91] to-[#987A3F] hover:from-[#987A3F] hover:to-[#523805] text-[#523805] hover:text-white"
                          >
                            Confirm
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </>
                ) : (
                  <Button
                    className="flex-1 bg-gradient-to-r from-[#EACC91] to-[#987A3F] hover:from-[#987A3F] hover:to-[#523805] text-[#523805] hover:text-white"
                    onClick={onConnectWallet}
                  >
                    Connect Wallet
                  </Button>
                )}
              </div>
            </div>

            {/* 右侧 - 收益信息 */}
            <div>
              <div className="mb-4">
                <h4 className="font-medium text-[#523805] mb-2">{farm.rewardToken} Earned</h4>
                <div className="flex items-center gap-2 text-sm text-[#523805]/70">
                  <Button
                    variant="link"
                    onClick={onViewRewardsHistory}
                    className="p-0 h-auto text-[#987A3F] hover:text-[#523805] flex items-center gap-1"
                  >
                    <History className="h-3 w-3" /> View Rewards History
                  </Button>
                </div>
              </div>

              <div className="bg-white rounded-xl p-4 border border-[#EACC91] mb-4">
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-[#523805]/70">Pending Rewards</span>
                  <span className="text-sm font-medium text-[#523805]">
                    {formatNumber(Number.parseFloat(userReward))} {farm.rewardToken}
                  </span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-[#523805]/70">Total Earned</span>
                  <span className="text-sm font-medium text-[#523805]">
                    {formatNumber(Number.parseFloat(totalReward))} {farm.rewardToken}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-[#523805]/70">
                    ~${(Number.parseFloat(userReward) * 2.5).toFixed(2)}
                  </span>
                  <span className="text-xs text-[#523805]/70">
                    {farm.isActive ? "Earning in progress" : "Farm inactive"}
                  </span>
                </div>
              </div>

              <Button
                className="w-full bg-gradient-to-r from-[#EACC91] to-[#987A3F] hover:from-[#987A3F] hover:to-[#523805] text-[#523805] hover:text-white"
                disabled={!isWalletConnected || Number.parseFloat(userReward) <= 0}
                onClick={onHarvest}
              >
                <Award className="h-4 w-4 mr-2" />
                Harvest
              </Button>
            </div>
          </div>

          {/* 详细信息 */}
          <div className="mt-6 pt-6 border-t border-[#EACC91]/30">
            <h4 className="font-medium text-[#523805] mb-4">Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#523805]/70">Total staked:</span>
                  <span className="text-[#523805]">{formatUSD(farm.totalStaked)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#523805]/70">Stake:</span>
                  <span className="text-[#523805]">
                    {farm.token0.symbol}-{farm.token1.symbol} LP
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#523805]/70">Earn:</span>
                  <span className="text-[#523805]">{farm.rewardToken}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-[#523805]/70">APR:</span>
                  <span className="text-[#523805]">{formatNumber(farm.apr)}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#523805]/70">Multiplier:</span>
                  <span className="text-[#523805]">{farm.multiplier}x</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#523805]/70">Harvest lockup:</span>
                  <span className="text-[#523805]">None</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}

// 辅助函数 - 格式化数字
function formatNumber(num: number, decimals = 2) {
  if (isNaN(num)) return "0.00"
  return num.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}
