"use client"

import { useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import {
  ChevronDown,
  ChevronUp,
  Info,
  ExternalLink,
  Search,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { useWallet } from "@/contexts/wallet-context"
import { useIdoContract } from "@/hooks/use-ido-contract"
import Navbar from "@/components/navbar"

export default function IdoPage() {
  const { walletState, setIsWalletModalOpen } = useWallet()
  const { idoProjects, userAllocations, isLoading, participate, claim } = useIdoContract()

  const [activeTab, setActiveTab] = useState("active")
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedProject, setExpandedProject] = useState<number | null>(null)

  // 处理项目展开/折叠
  const toggleProjectExpand = (id: number) => {
    if (expandedProject === id) {
      setExpandedProject(null)
    } else {
      setExpandedProject(id)
    }
  }

  // 过滤项目
  const filteredProjects = idoProjects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.tokenSymbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.description.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesTab =
      (activeTab === "active" && project.status === "active") ||
      (activeTab === "upcoming" && project.status === "upcoming") ||
      (activeTab === "ended" && project.status === "ended") ||
      activeTab === "all"

    return matchesSearch && matchesTab
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
              Hamster IDO
            </h1>
            <p className="text-lg text-[#523805]/80 max-w-2xl mx-auto">
              Participate in Initial DEX Offerings of promising projects. Get early access to new tokens before they hit
              the market.
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
                    value="upcoming"
                    className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#523805] data-[state=active]:shadow-sm text-[#523805]/70"
                  >
                    Upcoming
                  </TabsTrigger>
                  <TabsTrigger
                    value="ended"
                    className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#523805] data-[state=active]:shadow-sm text-[#523805]/70"
                  >
                    Ended
                  </TabsTrigger>
                  <TabsTrigger
                    value="all"
                    className="rounded-lg data-[state=active]:bg-white data-[state=active]:text-[#523805] data-[state=active]:shadow-sm text-[#523805]/70"
                  >
                    All
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#523805]/50" />
              <Input
                placeholder="Search IDO projects"
                className="pl-10 border-[#EACC91] text-[#523805] rounded-xl"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* IDO项目列表 */}
            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#987A3F]"></div>
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="bg-[#F9F5EA] rounded-2xl p-8 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="p-3 bg-[#EACC91]/30 rounded-full">
                    <Info className="h-8 w-8 text-[#523805]/50" />
                  </div>
                  <h3 className="text-xl font-bold text-[#523805]">No IDO Projects Found</h3>
                  <p className="text-[#523805]/70">
                    No IDO projects match your search criteria or there are no active projects at the moment.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredProjects.map((project) => (
                  <IdoProjectCard
                    key={project.id}
                    project={project}
                    isExpanded={expandedProject === project.id}
                    toggleExpand={() => toggleProjectExpand(project.id)}
                    userAllocation={userAllocations[project.id] || null}
                    onParticipate={(amount) => participate(project.id, amount)}
                    onClaim={() => claim(project.id)}
                    isWalletConnected={walletState.connected}
                    onConnectWallet={() => setIsWalletModalOpen(true)}
                  />
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </main>
    </div>
  )
}

// IDO项目卡片组件
interface IdoProjectCardProps {
  project: {
    id: number
    name: string
    description: string
    tokenSymbol: string
    tokenLogo: string
    status: "upcoming" | "active" | "ended"
    startTime: string
    endTime: string
    hardCap: number
    softCap: number
    totalRaised: number
    price: number
    minAllocation: number
    maxAllocation: number
    tokenDistribution: string
    website: string
    whitepaper: string
    socials: {
      twitter?: string
      telegram?: string
      discord?: string
      medium?: string
    }
  }
  isExpanded: boolean
  toggleExpand: () => void
  userAllocation: {
    amount: string
    claimed: boolean
  } | null
  onParticipate: (amount: string) => void
  onClaim: () => void
  isWalletConnected: boolean
  onConnectWallet: () => void
}

function IdoProjectCard({
  project,
  isExpanded,
  toggleExpand,
  userAllocation,
  onParticipate,
  onClaim,
  isWalletConnected,
  onConnectWallet,
}: IdoProjectCardProps) {
  const [participateAmount, setParticipateAmount] = useState("")
  const [isParticipateDialogOpen, setIsParticipateDialogOpen] = useState(false)

  // 处理参与IDO
  const handleParticipate = () => {
    if (!participateAmount || Number.parseFloat(participateAmount) <= 0) return
    onParticipate(participateAmount)
    setParticipateAmount("")
    setIsParticipateDialogOpen(false)
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // 计算进度百分比
  const calculateProgress = () => {
    return (project.totalRaised / project.hardCap) * 100
  }

  // 格式化数字
  const formatNumber = (num: number, decimals = 2) => {
    return num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  }

  // 获取状态标签
  const getStatusLabel = () => {
    switch (project.status) {
      case "upcoming":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Upcoming
          </span>
        )
      case "active":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Active
          </span>
        )
      case "ended":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            Ended
          </span>
        )
    }
  }

  // 获取时间信息
  const getTimeInfo = () => {
    const now = new Date()
    const startTime = new Date(project.startTime)
    const endTime = new Date(project.endTime)

    if (project.status === "upcoming") {
      const diffTime = startTime.getTime() - now.getTime()
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

      return `Starts in ${diffDays}d ${diffHours}h`
    } else if (project.status === "active") {
      const diffTime = endTime.getTime() - now.getTime()
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
      const diffHours = Math.floor((diffTime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))

      return `Ends in ${diffDays}d ${diffHours}h`
    } else {
      return `Ended on ${formatDate(project.endTime)}`
    }
  }

  return (
    <motion.div
      className="bg-white rounded-2xl shadow-md border border-[#EACC91] overflow-hidden"
      whileHover={{ y: -2 }}
      transition={{ type: "spring", stiffness: 400 }}
    >
      {/* 项目卡片头部 */}
      <div className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* 项目信息 */}
          <div className="flex-1">
            <div className="flex items-start gap-4">
              <div className="relative h-16 w-16 rounded-full overflow-hidden border-2 border-[#EACC91] flex-shrink-0">
                <Image
                  src={project.tokenLogo || "/placeholder.svg"}
                  alt={project.name}
                  width={64}
                  height={64}
                  className="object-cover"
                />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-xl font-bold text-[#523805]">{project.name}</h3>
                  {getStatusLabel()}
                </div>
                <div className="text-sm text-[#523805]/70 mb-2">{project.tokenSymbol}</div>
                <p className="text-sm text-[#523805]/80 line-clamp-2">{project.description}</p>
              </div>
            </div>
          </div>

          {/* 项目状态 */}
          <div className="flex flex-col md:items-end justify-between gap-2 md:min-w-[200px]">
            <div className="flex items-center gap-2 text-sm text-[#523805]/70">
              <Clock className="h-4 w-4" />
              <span>{getTimeInfo()}</span>
            </div>

            <div className="w-full">
              <div className="flex justify-between text-xs text-[#523805]/70 mb-1">
                <span>Progress</span>
                <span>
                  {formatNumber(project.totalRaised)} / {formatNumber(project.hardCap)} ETH
                </span>
              </div>
              <Progress
                value={calculateProgress()}
                className="h-2 bg-[#EACC91]/30"
                indicatorClassName="bg-gradient-to-r from-[#EACC91] to-[#987A3F]"
              />
            </div>

            {/* 展开/折叠按钮 */}
            <Button
              variant="ghost"
              size="sm"
              className="rounded-full hover:bg-[#EACC91]/20 text-[#523805]"
              onClick={toggleExpand}
            >
              {isExpanded ? (
                <span className="flex items-center gap-1">
                  Hide Details <ChevronUp className="h-4 w-4" />
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  View Details <ChevronDown className="h-4 w-4" />
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* 展开的详情部分 */}
      {isExpanded && (
        <div className="p-6 border-t border-[#EACC91]/30 bg-[#F9F5EA]/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 左侧 - 项目详情 */}
            <div>
              <h4 className="font-medium text-[#523805] mb-4">Project Details</h4>

              <div className="bg-white rounded-xl p-4 border border-[#EACC91] mb-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-[#523805]/70">Token Price</span>
                    <span className="text-sm font-medium text-[#523805]">
                      1 {project.tokenSymbol} = ${formatNumber(project.price, 4)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-[#523805]/70">Fundraising Goal</span>
                    <span className="text-sm font-medium text-[#523805]">{formatNumber(project.hardCap)} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-[#523805]/70">Minimum Goal</span>
                    <span className="text-sm font-medium text-[#523805]">{formatNumber(project.softCap)} ETH</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-[#523805]/70">Allocation</span>
                    <span className="text-sm font-medium text-[#523805]">
                      {formatNumber(project.minAllocation)} - {formatNumber(project.maxAllocation)} ETH
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-[#523805]/70">Token Distribution</span>
                    <span className="text-sm font-medium text-[#523805]">{project.tokenDistribution}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                <a
                  href={project.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium bg-white rounded-full px-3 py-1.5 border border-[#EACC91] text-[#523805] hover:bg-[#EACC91]/20"
                >
                  Website <ExternalLink className="h-3 w-3 ml-1" />
                </a>
                <a
                  href={project.whitepaper}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium bg-white rounded-full px-3 py-1.5 border border-[#EACC91] text-[#523805] hover:bg-[#EACC91]/20"
                >
                  Whitepaper <ExternalLink className="h-3 w-3 ml-1" />
                </a>
                {project.socials.twitter && (
                  <a
                    href={project.socials.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium bg-white rounded-full px-3 py-1.5 border border-[#EACC91] text-[#523805] hover:bg-[#EACC91]/20"
                  >
                    Twitter <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                )}
                {project.socials.telegram && (
                  <a
                    href={project.socials.telegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium bg-white rounded-full px-3 py-1.5 border border-[#EACC91] text-[#523805] hover:bg-[#EACC91]/20"
                  >
                    Telegram <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                )}
                {project.socials.discord && (
                  <a
                    href={project.socials.discord}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium bg-white rounded-full px-3 py-1.5 border border-[#EACC91] text-[#523805] hover:bg-[#EACC91]/20"
                  >
                    Discord <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                )}
              </div>

              <div className="bg-[#EACC91]/20 rounded-xl p-4 border border-[#EACC91]/40">
                <div className="flex items-start gap-2">
                  <Info className="h-5 w-5 text-[#523805] flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[#523805] mb-1">Important Information</p>
                    <p className="text-xs text-[#523805]/80">
                      Participating in IDOs involves risks. Please do your own research before investing. The tokens
                      purchased during the IDO will be distributed according to the vesting schedule.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 右侧 - 参与信息 */}
            <div>
              <h4 className="font-medium text-[#523805] mb-4">Participation</h4>

              <div className="bg-white rounded-xl p-4 border border-[#EACC91] mb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-[#523805]">IDO Timeline</span>
                </div>
                <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-6 h-6 rounded-full bg-[#987A3F] flex items-center justify-center text-white">
                        <Calendar className="h-3 w-3" />
                      </div>
                      <div className="w-0.5 h-full bg-[#EACC91]"></div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#523805]">IDO Starts</p>
                      <p className="text-xs text-[#523805]/70">{formatDate(project.startTime)}</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-6 h-6 rounded-full bg-[#987A3F] flex items-center justify-center text-white">
                        <Calendar className="h-3 w-3" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#523805]">IDO Ends</p>
                      <p className="text-xs text-[#523805]/70">{formatDate(project.endTime)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {userAllocation ? (
                <div className="bg-white rounded-xl p-4 border border-[#EACC91] mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-medium text-[#523805]">Your Allocation</span>
                    {userAllocation.claimed ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" /> Claimed
                      </span>
                    ) : project.status === "ended" ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Ready to Claim
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <Clock className="h-3 w-3 mr-1" /> Pending
                      </span>
                    )}
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-[#523805]/70">Contributed</span>
                      <span className="text-sm font-medium text-[#523805]">
                        {formatNumber(Number.parseFloat(userAllocation.amount))} ETH
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-[#523805]/70">Token Allocation</span>
                      <span className="text-sm font-medium text-[#523805]">
                        {formatNumber(Number.parseFloat(userAllocation.amount) / project.price)} {project.tokenSymbol}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl p-4 border border-[#EACC91] mb-4 text-center">
                  <p className="text-[#523805]/70 text-sm">You haven't participated in this IDO yet.</p>
                </div>
              )}

              {project.status === "active" && (
                <Dialog open={isParticipateDialogOpen} onOpenChange={setIsParticipateDialogOpen}>
                  <DialogTrigger asChild>
                    <Button
                      className="w-full bg-gradient-to-r from-[#EACC91] to-[#987A3F] hover:from-[#987A3F] hover:to-[#523805] text-[#523805] hover:text-white"
                      disabled={!isWalletConnected}
                      onClick={() => (isWalletConnected ? undefined : onConnectWallet())}
                    >
                      Participate in IDO
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md rounded-2xl border border-[#EACC91]">
                    <DialogHeader>
                      <DialogTitle className="text-[#523805]">Participate in {project.name} IDO</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                      <div className="bg-[#F9F5EA] rounded-xl p-4 mb-4">
                        <div className="flex justify-between mb-2">
                          <span className="text-[#523805]/70">Amount to Contribute</span>
                          <span className="text-sm text-[#523805]/70">
                            Min: {project.minAllocation} ETH | Max: {project.maxAllocation} ETH
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            value={participateAmount}
                            onChange={(e) => setParticipateAmount(e.target.value)}
                            className="border-0 bg-transparent text-xl font-medium focus-visible:ring-0 focus-visible:ring-offset-0 p-0 text-[#523805]"
                            placeholder="0.0"
                          />
                          <div className="flex items-center gap-2 bg-white rounded-full px-3 py-1.5 border border-[#EACC91]">
                            <div className="relative h-5 w-5">
                              <Image src="/eth-logo.svg" alt="ETH" width={20} height={20} className="rounded-full" />
                            </div>
                            <span className="text-sm font-medium text-[#523805]">ETH</span>
                          </div>
                        </div>
                        <div className="flex justify-between mt-2">
                          <span className="text-xs text-[#523805]/70">You will receive approximately:</span>
                          <span className="text-xs font-medium text-[#523805]">
                            {participateAmount
                              ? formatNumber(Number.parseFloat(participateAmount) / project.price)
                              : "0"}{" "}
                            {project.tokenSymbol}
                          </span>
                        </div>
                      </div>

                      <div className="text-xs text-[#523805]/70 mb-4">
                        By participating in this IDO, you agree to the terms and conditions. Tokens will be distributed
                        according to the vesting schedule after the IDO ends.
                      </div>
                    </div>
                    <DialogFooter>
                      <Button
                        variant="outline"
                        onClick={() => setIsParticipateDialogOpen(false)}
                        className="border-[#EACC91] text-[#523805]"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleParticipate}
                        className="bg-gradient-to-r from-[#EACC91] to-[#987A3F] hover:from-[#987A3F] hover:to-[#523805] text-[#523805] hover:text-white"
                        disabled={
                          !participateAmount ||
                          Number.parseFloat(participateAmount) < project.minAllocation ||
                          Number.parseFloat(participateAmount) > project.maxAllocation
                        }
                      >
                        Confirm
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}

              {project.status === "ended" && userAllocation && !userAllocation.claimed && (
                <Button
                  className="w-full bg-gradient-to-r from-[#EACC91] to-[#987A3F] hover:from-[#987A3F] hover:to-[#523805] text-[#523805] hover:text-white"
                  onClick={onClaim}
                >
                  Claim Tokens
                </Button>
              )}

              {project.status === "upcoming" && (
                <div className="bg-[#EACC91]/20 rounded-xl p-4 border border-[#EACC91]/40">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-[#523805] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-[#523805] mb-1">Coming Soon</p>
                      <p className="text-xs text-[#523805]/80">
                        This IDO will start on {formatDate(project.startTime)}. Make sure you have ETH in your wallet to
                        participate.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {project.status === "ended" && (!userAllocation || userAllocation.claimed) && (
                <div className="bg-[#EACC91]/20 rounded-xl p-4 border border-[#EACC91]/40">
                  <div className="flex items-start gap-2">
                    <XCircle className="h-5 w-5 text-[#523805] flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-[#523805] mb-1">IDO Ended</p>
                      <p className="text-xs text-[#523805]/80">
                        This IDO has ended.{" "}
                        {userAllocation?.claimed
                          ? "You have already claimed your tokens."
                          : "You did not participate in this IDO."}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </motion.div>
  )
}
