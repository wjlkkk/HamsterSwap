"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { Gift, Clock, CheckCircle, XCircle, ChevronDown, ChevronUp, ExternalLink, Info, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import Navbar from "@/components/navbar"
import { useWallet } from "@/contexts/wallet-context"
import { useToast } from "@/hooks/use-toast"
import { ethers } from "ethers"
import { getAllAirdrops, getUserEligibility, claimAirdrop } from "@/contracts/airdrop-contract"
import { AIRDROP_CONTRACT_ADDRESS } from "@/constants"

// 定义空投类型
interface Airdrop {
  id: number
  title: string
  description: string
  tokenSymbol: string
  tokenLogo: string
  amount: string
  totalAmount: string
  claimed: string
  startDate: string
  endDate: string
  status: "active" | "upcoming" | "ended"
  eligibility: {
    required: boolean
    criteria: string[]
    eligible: boolean
  }
  tokenAddress: string
}

// 定义领取历史类型
interface ClaimHistory {
  id: number
  title: string
  tokenSymbol: string
  tokenLogo: string
  amount: string
  claimDate: string
  transactionHash: string
  status: "completed" | "pending" | "failed"
}

// 默认空投描述
const defaultDescriptions = [
  "Celebrate the launch of HamsterSwap by claiming your tokens!",
  "Special rewards for early adopters of the HamsterSwap platform.",
  "Help grow our community and earn tokens as rewards.",
  "Special bonus for users who provided liquidity during our beta phase.",
  "Rewards for participants in our first trading competition.",
]

// 默认资格条件
const defaultCriteria = [
  ["Hold at least 0.01 ETH in your wallet", "Have at least 1 transaction on Ethereum", "Complete wallet verification"],
  ["Used HamsterSwap before December 1st", "Completed at least 3 swaps", "Have at least 10 tokens in your wallet"],
  ["Follow HamsterSwap on social media", "Refer at least 2 friends", "Participate in community events"],
  ["Provided at least $100 in liquidity", "Maintained liquidity for at least 14 days", "Participated in beta testing"],
  ["Participated in the trading competition", "Traded at least $500 in volume", "Ranked in the top 1000 traders"],
]

// 获取代币Logo
const getTokenLogo = (tokenAddress: string): string => {
  // 这里可以根据代币地址返回对应的logo
  // 简单起见，我们使用一些默认logo
  const logos = [
    "/cake-logo.svg",
    "/eth-logo.svg",
    "/usdt-logo.svg",
    "/usdc-logo.svg",
    "/dai-logo.svg",
    "/wbtc-logo.svg",
    "/link-logo.svg",
    "/uni-logo.svg",
    "/aave-logo.svg",
    "/comp-logo.svg",
    "/ltc-logo.svg",
    "/hamster-logo.svg",
  ]

  // 使用地址的最后几位作为索引
  const index = Number.parseInt(tokenAddress.slice(-2), 16) % logos.length
  return logos[index]
}

// 获取代币符号
const getTokenSymbol = (tokenAddress: string): string => {
  // 这里可以根据代币地址返回对应的符号
  // 简单起见，我们使用一些默认符号
  const symbols = ["CAKE", "ETH", "USDT", "USDC", "DAI", "WBTC", "LINK", "UNI", "AAVE", "COMP", "LTC", "HAM"]

  // 使用地址的最后几位作为索引
  const index = Number.parseInt(tokenAddress.slice(-2), 16) % symbols.length
  return symbols[index]
}

export default function AirdropPage() {
  const [activeTab, setActiveTab] = useState("active")
  const [searchQuery, setSearchQuery] = useState("")
  const [expandedAirdrop, setExpandedAirdrop] = useState<number | null>(null)
  const { walletState, setIsWalletModalOpen } = useWallet()
  const { toast } = useToast()
  const [claimingAirdropId, setClaimingAirdropId] = useState<number | null>(null)
  const [claimedAirdrops, setClaimedAirdrops] = useState<number[]>([])

  // 添加状态用于存储从区块链获取的空投数据
  const [airdrops, setAirdrops] = useState<Airdrop[]>([])
  const [claimHistory, setClaimHistory] = useState<ClaimHistory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 从区块链获取空投数据
  useEffect(() => {
    const fetchAirdrops = async () => {
      if (!walletState.provider) return

      setIsLoading(true)
      setError(null)

      try {
        const provider = new ethers.BrowserProvider(walletState.provider)
        const fetchedAirdrops = await getAllAirdrops(provider)

        // 转换为UI友好的格式
        const formattedAirdrops: Airdrop[] = await Promise.all(
          fetchedAirdrops.map(async (airdrop, index) => {
            // 获取用户资格信息（如果已连接钱包）
            const eligibility = {
              required: true,
              criteria: defaultCriteria[index % defaultCriteria.length],
              eligible: false,
            }

            if (walletState.address) {
              try {
                const userEligibility = await getUserEligibility(provider, airdrop.airdropId, walletState.address)
                eligibility.eligible = userEligibility.isEligible

                // 如果已领取，添加到已领取列表
                if (userEligibility.claimed) {
                  setClaimedAirdrops((prev) => [...prev, airdrop.airdropId])
                }
              } catch (err) {
                console.error("Error checking eligibility:", err)
              }
            }

            // 确定空投状态
            const now = Math.floor(Date.now() / 1000)
            const startTime = new Date(airdrop.startTime).getTime() / 1000
            const endTime = new Date(airdrop.endTime).getTime() / 1000

            let status: "active" | "upcoming" | "ended" = "active"
            if (now < startTime) {
              status = "upcoming"
            } else if (now > endTime || !airdrop.isActive) {
              status = "ended"
            }

            // 获取代币符号和logo
            const tokenSymbol = getTokenSymbol(airdrop.tokenAddress)
            const tokenLogo = getTokenLogo(airdrop.tokenAddress)

            return {
              id: airdrop.airdropId,
              title: `HamsterSwap ${tokenSymbol} Airdrop #${airdrop.airdropId + 1}`,
              description: defaultDescriptions[index % defaultDescriptions.length],
              tokenSymbol,
              tokenLogo,
              amount: ethers.formatEther(ethers.parseEther(airdrop.totalAmount) / BigInt(100)), // 假设每个用户可以领取总量的1%
              totalAmount: airdrop.totalAmount,
              claimed: airdrop.claimedAmount,
              startDate: new Date(airdrop.startTime).toISOString().split("T")[0],
              endDate: new Date(airdrop.endTime).toISOString().split("T")[0],
              status,
              eligibility,
              tokenAddress: airdrop.tokenAddress,
            }
          }),
        )

        setAirdrops(formattedAirdrops)

        // 如果有已领取的空投，生成领取历史
        if (claimedAirdrops.length > 0) {
          const history: ClaimHistory[] = claimedAirdrops
            .map((id) => {
              const airdrop = formattedAirdrops.find((a) => a.id === id)
              if (!airdrop) return null

              return {
                id: 100 + id,
                title: airdrop.title,
                tokenSymbol: airdrop.tokenSymbol,
                tokenLogo: airdrop.tokenLogo,
                amount: airdrop.amount,
                claimDate: new Date().toISOString(),
                transactionHash:
                  "0x" +
                  Array(40)
                    .fill(0)
                    .map(() => Math.floor(Math.random() * 16).toString(16))
                    .join(""),
                status: "completed",
              }
            })
            .filter(Boolean) as ClaimHistory[]

          setClaimHistory(history)
        }
      } catch (err) {
        console.error("Error fetching airdrops:", err)
        setError("获取空投列表失败")
      } finally {
        setIsLoading(false)
      }
    }

    fetchAirdrops()
  }, [walletState.provider, walletState.address])

  // 过滤空投列表
  const filteredAirdrops = airdrops.filter((airdrop) => {
    const matchesSearch =
      airdrop.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      airdrop.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      airdrop.tokenSymbol.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = activeTab === "all" || airdrop.status === activeTab

    return matchesSearch && matchesStatus
  })

  // 处理空投展开/折叠
  const toggleAirdropExpand = (id: number) => {
    if (expandedAirdrop === id) {
      setExpandedAirdrop(null)
    } else {
      setExpandedAirdrop(id)
    }
  }

  // 处理领取空投
  const handleClaimAirdrop = async (airdropId: number) => {
    if (!walletState.connected || !walletState.provider || !walletState.signer) {
      toast({
        title: "Wallet not connected",
        description: "Please connect your wallet to claim airdrops",
        variant: "destructive",
      })
      return
    }

    const airdrop = airdrops.find((a) => a.id === airdropId)
    if (!airdrop) return

    if (airdrop.eligibility.required && !airdrop.eligibility.eligible) {
      toast({
        title: "Not eligible",
        description: "You are not eligible for this airdrop",
        variant: "destructive",
      })
      return
    }

    // 设置正在领取状态
    setClaimingAirdropId(airdropId)

    try {
      // 调用合约领取空投
      const provider = new ethers.BrowserProvider(walletState.provider)

      // 先检查用户资格和状态
      console.log(`Checking eligibility for airdrop ${airdropId}...`)
      const userEligibility = await getUserEligibility(provider, airdropId, walletState.address)

      if (!userEligibility.isEligible) {
        toast({
          title: "Not eligible",
          description: "You are not eligible for this airdrop",
          variant: "destructive",
        })
        return
      }

      if (userEligibility.claimed) {
        toast({
          title: "Already claimed",
          description: "You have already claimed this airdrop",
          variant: "destructive",
        })
        setClaimedAirdrops((prev) => [...prev, airdropId])
        return
      }

      // 添加详细日志
      console.log("Attempting to claim airdrop with parameters:", {
        airdropId,
        userAddress: walletState.address,
        contractAddress: AIRDROP_CONTRACT_ADDRESS,
      })

      // 直接尝试领取，不进行 estimateGas 预检查
      const tx = await claimAirdrop(provider, walletState.signer, airdropId)
      console.log("Claim transaction successful:", tx)

      // 添加到已领取列表
      setClaimedAirdrops((prev) => [...prev, airdropId])

      // 添加到领取历史
      const newClaim: ClaimHistory = {
        id: 100 + airdropId,
        title: airdrop.title,
        tokenSymbol: airdrop.tokenSymbol,
        tokenLogo: airdrop.tokenLogo,
        amount: userEligibility.amount,
        claimDate: new Date().toISOString(),
        transactionHash: tx.hash,
        status: "completed",
      }

      setClaimHistory((prev) => [newClaim, ...prev])

      // 显示成功消息
      toast({
        title: "Airdrop claimed successfully!",
        description: `You have claimed ${userEligibility.amount} ${airdrop.tokenSymbol}`,
        variant: "default",
      })
    } catch (error: any) {
      console.error("Claim error:", error)

      // 打印更详细的错误信息
      if (error.transaction) {
        console.error("Transaction details:", error.transaction)
      }
      if (error.data) {
        console.error("Error data:", error.data)
      }
      if (error.code) {
        console.error("Error code:", error.code)
      }

      // 提取更友好的错误信息
      let errorMessage = "There was an error claiming your airdrop. Please try again."

      if (error.message) {
        if (error.message.includes("not eligible")) {
          errorMessage = "You are not eligible for this airdrop."
        } else if (error.message.includes("already claimed")) {
          errorMessage = "You have already claimed this airdrop."
          setClaimedAirdrops((prev) => [...prev, airdropId])
        } else if (error.message.includes("not active")) {
          errorMessage = "This airdrop is not currently active."
        } else if (error.message.includes("not started")) {
          errorMessage = "This airdrop has not started yet."
        } else if (error.message.includes("ended")) {
          errorMessage = "This airdrop has already ended."
        } else if (error.message.includes("insufficient funds")) {
          errorMessage = "You don't have enough ETH to pay for the transaction fee."
        } else {
          errorMessage = `Error: ${error.message}`
        }
      }

      toast({
        title: "Failed to claim",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      // 重置领取状态
      setClaimingAirdropId(null)
    }
  }

  // 计算进度百分比
  const calculateProgress = (claimed: string, total: string) => {
    const claimedNum = Number.parseFloat(claimed.replace(/,/g, ""))
    const totalNum = Number.parseFloat(total.replace(/,/g, ""))
    return (claimedNum / totalNum) * 100
  }

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#F9F5EA] via-[#EACC91]/20 to-[#F9F5EA] font-sans pb-20">
      <Navbar />

      <main className="container mx-auto px-4 pt-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          {/* 页面标题 */}
          <div className="text-center mb-10">
            <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#523805] to-[#987A3F] mb-4">
              Hamster Airdrops
            </h1>
            <p className="text-lg text-[#523805]/80 max-w-2xl mx-auto">
              Claim free tokens and rewards from the cutest DeFi platform in the galaxy! Check your eligibility and
              never miss an airdrop.
            </p>
          </div>

          {/* 钱包连接提示 */}
          {!walletState.connected && (
            <motion.div
              className="bg-white rounded-2xl p-6 shadow-md border border-[#EACC91] mb-8 text-center"
              whileHover={{ y: -5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="flex flex-col items-center gap-4">
                <div className="p-3 bg-[#EACC91]/30 rounded-full">
                  <Gift className="h-8 w-8 text-[#523805]" />
                </div>
                <h3 className="text-xl font-bold text-[#523805]">Connect Wallet to View Airdrops</h3>
                <p className="text-[#523805]/70 mb-4">
                  Connect your wallet to check eligibility and claim available airdrops.
                </p>
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button
                    onClick={() => setIsWalletModalOpen(true)}
                    className="rounded-full bg-gradient-to-r from-[#EACC91] to-[#987A3F] hover:from-[#987A3F] hover:to-[#523805] text-[#523805] hover:text-white font-medium shadow-md hover:shadow-lg transition-all duration-300 px-8 py-2 border-2 border-white"
                  >
                    <span className="flex items-center gap-2">
                      <span>🐹</span> Connect Wallet
                    </span>
                  </Button>
                </motion.div>
              </div>
            </motion.div>
          )}

          {/* 加载状态 */}
          {isLoading && (
            <div className="bg-white rounded-2xl p-8 shadow-md border border-[#EACC91] text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="p-3 bg-[#EACC91]/30 rounded-full">
                  <svg
                    className="animate-spin h-8 w-8 text-[#523805]"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-[#523805]">Loading Airdrops</h3>
                <p className="text-[#523805]/70">Please wait while we fetch the latest airdrops...</p>
              </div>
            </div>
          )}

          {/* 错误状态 */}
          {error && !isLoading && (
            <div className="bg-white rounded-2xl p-8 shadow-md border border-red-200 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="p-3 bg-red-100 rounded-full">
                  <XCircle className="h-8 w-8 text-red-500" />
                </div>
                <h3 className="text-xl font-bold text-red-700">Error Loading Airdrops</h3>
                <p className="text-red-600">{error}</p>
                <Button
                  onClick={() => window.location.reload()}
                  className="rounded-full bg-red-100 hover:bg-red-200 text-red-700 font-medium px-8 py-2"
                >
                  Retry
                </Button>
              </div>
            </div>
          )}

          {/* 主要内容区 */}
          {!isLoading && !error && (
            <Tabs defaultValue="active" className="w-full" onValueChange={setActiveTab}>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
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

                <div className="relative w-full sm:w-auto">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#523805]/50" />
                  <Input
                    placeholder="Search airdrops..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 border-[#EACC91] text-[#523805] rounded-full w-full sm:w-64"
                  />
                </div>
              </div>

              <TabsContent value="active" className="mt-0">
                <AirdropList
                  airdrops={filteredAirdrops}
                  expandedAirdrop={expandedAirdrop}
                  toggleAirdropExpand={toggleAirdropExpand}
                  handleClaimAirdrop={handleClaimAirdrop}
                  calculateProgress={calculateProgress}
                  formatDate={formatDate}
                  walletConnected={walletState.connected}
                  claimingAirdropId={claimingAirdropId}
                  claimedAirdrops={claimedAirdrops}
                />
              </TabsContent>

              <TabsContent value="upcoming" className="mt-0">
                <AirdropList
                  airdrops={filteredAirdrops}
                  expandedAirdrop={expandedAirdrop}
                  toggleAirdropExpand={toggleAirdropExpand}
                  handleClaimAirdrop={handleClaimAirdrop}
                  calculateProgress={calculateProgress}
                  formatDate={formatDate}
                  walletConnected={walletState.connected}
                  claimingAirdropId={claimingAirdropId}
                  claimedAirdrops={claimedAirdrops}
                />
              </TabsContent>

              <TabsContent value="ended" className="mt-0">
                <AirdropList
                  airdrops={filteredAirdrops}
                  expandedAirdrop={expandedAirdrop}
                  toggleAirdropExpand={toggleAirdropExpand}
                  handleClaimAirdrop={handleClaimAirdrop}
                  calculateProgress={calculateProgress}
                  formatDate={formatDate}
                  walletConnected={walletState.connected}
                  claimingAirdropId={claimingAirdropId}
                  claimedAirdrops={claimedAirdrops}
                />
              </TabsContent>

              <TabsContent value="all" className="mt-0">
                <AirdropList
                  airdrops={filteredAirdrops}
                  expandedAirdrop={expandedAirdrop}
                  toggleAirdropExpand={toggleAirdropExpand}
                  handleClaimAirdrop={handleClaimAirdrop}
                  calculateProgress={calculateProgress}
                  formatDate={formatDate}
                  walletConnected={walletState.connected}
                  claimingAirdropId={claimingAirdropId}
                  claimedAirdrops={claimedAirdrops}
                />
              </TabsContent>
            </Tabs>
          )}

          {/* 历史记录部分 */}
          {walletState.connected && claimHistory.length > 0 && !isLoading && !error && (
            <div className="mt-12">
              <h2 className="text-2xl font-bold text-[#523805] mb-6">Your Claim History</h2>
              <div className="bg-white rounded-2xl shadow-md border border-[#EACC91] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#EACC91]/50">
                        <th className="px-6 py-4 text-left text-sm font-medium text-[#523805]">Airdrop</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-[#523805]">Amount</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-[#523805]">Date</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-[#523805]">Status</th>
                        <th className="px-6 py-4 text-left text-sm font-medium text-[#523805]">Transaction</th>
                      </tr>
                    </thead>
                    <tbody>
                      {claimHistory.map((claim) => (
                        <tr key={claim.id} className="border-b border-[#EACC91]/30 hover:bg-[#F9F5EA]/50">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="relative h-8 w-8">
                                <Image
                                  src={claim.tokenLogo || "/placeholder.svg"}
                                  alt={claim.tokenSymbol}
                                  width={32}
                                  height={32}
                                  className="rounded-full"
                                />
                              </div>
                              <div>
                                <div className="font-medium text-[#523805]">{claim.title}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="font-medium text-[#523805]">
                              {claim.amount} {claim.tokenSymbol}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-[#523805]/70">
                            {new Date(claim.claimDate).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                claim.status === "completed"
                                  ? "bg-green-100 text-green-800"
                                  : claim.status === "pending"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-red-100 text-red-800"
                              }`}
                            >
                              {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <a
                              href={`https://etherscan.io/tx/${claim.transactionHash}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#987A3F] hover:text-[#523805] inline-flex items-center gap-1"
                            >
                              <span className="truncate w-16 sm:w-32">
                                {claim.transactionHash.substring(0, 6)}...
                                {claim.transactionHash.substring(claim.transactionHash.length - 4)}
                              </span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  )
}

// 空投列表组件
function AirdropList({
  airdrops,
  expandedAirdrop,
  toggleAirdropExpand,
  handleClaimAirdrop,
  calculateProgress,
  formatDate,
  walletConnected,
  claimingAirdropId,
  claimedAirdrops,
}: {
  airdrops: Airdrop[]
  expandedAirdrop: number | null
  toggleAirdropExpand: (id: number) => void
  handleClaimAirdrop: (id: number) => void
  calculateProgress: (claimed: string, total: string) => number
  formatDate: (date: string) => string
  walletConnected: boolean
  claimingAirdropId: number | null
  claimedAirdrops: number[]
}) {
  if (airdrops.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-8 shadow-md border border-[#EACC91] text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="p-3 bg-[#EACC91]/30 rounded-full">
            <Gift className="h-8 w-8 text-[#523805]/50" />
          </div>
          <h3 className="text-xl font-bold text-[#523805]">No Airdrops Found</h3>
          <p className="text-[#523805]/70">There are no airdrops matching your search criteria at the moment.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {airdrops.map((airdrop) => (
        <motion.div
          key={airdrop.id}
          className="bg-white rounded-2xl shadow-md border border-[#EACC91] overflow-hidden"
          whileHover={{ y: -2 }}
          transition={{ type: "spring", stiffness: 400 }}
        >
          {/* 空投卡片头部 */}
          <div className="p-6">
            <div className="flex flex-col sm:flex-row justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-[#EACC91]/30 rounded-full flex-shrink-0">
                  <Image
                    src={airdrop.tokenLogo || "/placeholder.svg"}
                    alt={airdrop.tokenSymbol}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-[#523805]">{airdrop.title}</h3>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        airdrop.status === "active"
                          ? "bg-green-100 text-green-800"
                          : airdrop.status === "upcoming"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {airdrop.status.charAt(0).toUpperCase() + airdrop.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-[#523805]/70 text-sm mb-2">{airdrop.description}</p>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-[#523805]/70">
                      <Clock className="h-4 w-4" />
                      <span>
                        {formatDate(airdrop.startDate)} - {formatDate(airdrop.endDate)}
                      </span>
                    </div>
                    {airdrop.eligibility.required && (
                      <div className="flex items-center gap-1">
                        {airdrop.eligibility.eligible ? (
                          <div className="flex items-center text-green-600">
                            <CheckCircle className="h-4 w-4 mr-1" />
                            <span>Eligible</span>
                          </div>
                        ) : (
                          <div className="flex items-center text-red-500">
                            <XCircle className="h-4 w-4 mr-1" />
                            <span>Not Eligible</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex flex-col items-end justify-between gap-2">
                <div className="text-right">
                  <div className="text-2xl font-bold text-[#523805]">
                    {airdrop.amount} {airdrop.tokenSymbol}
                  </div>
                  <div className="text-sm text-[#523805]/70">Available to claim</div>
                </div>
                {/* 更新按钮部分，添加加载状态 */}
                <motion.div
                  whileHover={{ scale: claimedAirdrops.includes(airdrop.id) ? 1 : 1.05 }}
                  whileTap={{ scale: claimedAirdrops.includes(airdrop.id) ? 1 : 0.95 }}
                >
                  <Button
                    onClick={() => handleClaimAirdrop(airdrop.id)}
                    disabled={
                      !walletConnected ||
                      airdrop.status !== "active" ||
                      (airdrop.eligibility.required && !airdrop.eligibility.eligible) ||
                      claimingAirdropId === airdrop.id ||
                      claimedAirdrops.includes(airdrop.id)
                    }
                    className={`rounded-full px-6 py-2 ${
                      !walletConnected ||
                      airdrop.status !== "active" ||
                      (airdrop.eligibility.required && !airdrop.eligibility.eligible) ||
                      claimedAirdrops.includes(airdrop.id)
                        ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                        : "bg-gradient-to-r from-[#EACC91] to-[#987A3F] hover:from-[#987A3F] hover:to-[#523805] text-[#523805] hover:text-white shadow-md hover:shadow-lg"
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      {claimingAirdropId === airdrop.id ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-2 h-4 w-4 text-[#523805]"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Claiming...
                        </>
                      ) : claimedAirdrops.includes(airdrop.id) ? (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" /> Claimed
                        </>
                      ) : airdrop.status === "active" ? (
                        <>
                          <span>🐹</span> Claim Now
                        </>
                      ) : airdrop.status === "upcoming" ? (
                        "Coming Soon"
                      ) : (
                        "Ended"
                      )}
                    </span>
                  </Button>
                </motion.div>
              </div>
            </div>

            {/* 进度条 */}
            <div className="mt-4">
              <div className="flex justify-between text-xs text-[#523805]/70 mb-1">
                <span>Progress</span>
                <span>
                  {airdrop.claimed} / {airdrop.totalAmount} claimed
                </span>
              </div>
              <Progress
                value={calculateProgress(airdrop.claimed, airdrop.totalAmount)}
                className="h-2 bg-[#EACC91]/30"
                indicatorClassName="bg-gradient-to-r from-[#EACC91] to-[#987A3F]"
              />
            </div>

            {/* 展开/折叠按钮 */}
            <button
              onClick={() => toggleAirdropExpand(airdrop.id)}
              className="flex items-center justify-center w-full mt-4 text-[#523805]/70 hover:text-[#523805] text-sm"
            >
              {expandedAirdrop === airdrop.id ? (
                <>
                  <span>Hide Details</span>
                  <ChevronUp className="h-4 w-4 ml-1" />
                </>
              ) : (
                <>
                  <span>Show Details</span>
                  <ChevronDown className="h-4 w-4 ml-1" />
                </>
              )}
            </button>
          </div>

          {/* 展开的详情部分 */}
          {expandedAirdrop === airdrop.id && (
            <div className="px-6 pb-6 pt-2 border-t border-[#EACC91]/30">
              <div className="bg-[#F9F5EA]/70 rounded-xl p-4">
                <h4 className="font-medium text-[#523805] mb-3">Eligibility Criteria</h4>
                <ul className="space-y-2">
                  {airdrop.eligibility.criteria.map((criterion, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      {airdrop.eligibility.eligible ? (
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                      ) : (
                        <Info className="h-4 w-4 text-[#523805]/70 mt-0.5 flex-shrink-0" />
                      )}
                      <span className="text-[#523805]/80">{criterion}</span>
                    </li>
                  ))}
                </ul>

                {!airdrop.eligibility.eligible && airdrop.eligibility.required && (
                  <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-100">
                    <div className="flex items-start gap-2">
                      <XCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-red-700 font-medium">You are not eligible for this airdrop</p>
                        <p className="text-xs text-red-600 mt-1">
                          Please make sure you meet all the criteria above to be eligible for this airdrop.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {airdrop.status === "upcoming" && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                    <div className="flex items-start gap-2">
                      <Clock className="h-5 w-5 text-blue-500 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-blue-700 font-medium">This airdrop hasn't started yet</p>
                        <p className="text-xs text-blue-600 mt-1">
                          The airdrop will be available for claiming from {formatDate(airdrop.startDate)}. Check back
                          later!
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {airdrop.status === "ended" && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="flex items-start gap-2">
                      <Info className="h-5 w-5 text-gray-500 flex-shrink-0" />
                      <div>
                        <p className="text-sm text-gray-700 font-medium">This airdrop has ended</p>
                        <p className="text-xs text-gray-600 mt-1">
                          The airdrop was available until {formatDate(airdrop.endDate)} and is no longer claimable.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  )
}
