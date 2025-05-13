"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { useWallet } from "@/contexts/wallet-context"
import { useAdmin } from "@/contexts/admin-context"
import { useAirdropContract } from "@/hooks/use-airdrop-contract"
import { useTokenContract } from "@/hooks/use-token-contract"
import { useFarmContract } from "@/hooks/use-farm-contract"
import { useIdoContract } from "@/hooks/use-ido-contract"
import { ERC20_ABI, getDeployedTokens, getTokenInfo } from "@/contracts/token-contract"
import { ethers } from "ethers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import {
  AlertCircle,
  BarChart4,
  Gift,
  Calendar,
  Coins,
  RefreshCw,
  Wallet,
  Tractor,
  Rocket,
  Settings,
  ExternalLink,
  Home,
  PieChart,
  Clock,
  ChevronRight,
  Users,
  XCircle,
  CheckCircle,
  Edit,
  Search,
  Plus,
  Info,
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useToast } from "@/hooks/use-toast"
import ClientOnly from "@/components/client-only"
import Navbar from "@/components/navbar"
import { Progress } from "@/components/ui/progress"

export default function AdminPage() {
  const router = useRouter()

  return (
    <ClientOnly>
      <div className="min-h-screen bg-gradient-to-b from-[#F9F5EA] via-[#EACC91]/20 to-[#F9F5EA]">
        <Navbar />
        <div className="pt-24 pb-16">
          <AdminDashboard router={router} />
        </div>
      </div>
    </ClientOnly>
  )
}

function AdminDashboard({ router }) {
  const { walletState } = useWallet()
  const { isAdmin } = useAdmin()
  const [activeTab, setActiveTab] = useState("dashboard")
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)

  // 空投合约钩子
  const {
    isLoading: isAirdropLoading,
    error,
    createAirdrop,
    setEligibility,
    getAllAirdrops,
    activateAirdrop,
    deactivateAirdrop,
    refreshAirdrops,
    isInitialized: isAirdropInitialized,
  } = useAirdropContract()

  // IDO合约钩子
  const { idoProjects, isLoading: isIdoLoading, refreshData: refreshIdoData } = useIdoContract()

  // 创建空投表单状态
  const [selectedToken, setSelectedToken] = useState("")
  const [amount, setAmount] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [eligibilityInput, setEligibilityInput] = useState("")
  const [selectedAirdropId, setSelectedAirdropId] = useState<number | null>(null)
  const [eligibilityFormat, setEligibilityFormat] = useState<"simple" | "advanced">("simple")

  // 代币管理状态
  const [tokenAddress, setTokenAddress] = useState("")
  const [recipientAddress, setRecipientAddress] = useState("")
  const [transferAmount, setTransferAmount] = useState("")
  const [spenderAddress, setSpenderAddress] = useState("")
  const [approveAmount, setApproveAmount] = useState("")
  const [mintAmount, setMintAmount] = useState("")
  const [mintToAddress, setMintToAddress] = useState("")
  const [burnAmount, setBurnAmount] = useState("")
  const [customTokenAddress, setCustomTokenAddress] = useState("")
  const [tokenList, setTokenList] = useState<any[]>([])
  const [selectedTokenForManagement, setSelectedTokenForManagement] = useState("")
  const [isTokensLoading, setIsTokensLoading] = useState(true)

  // 查询功能状态
  const [queryBalanceAddress, setQueryBalanceAddress] = useState("")
  const [queryBalanceResult, setQueryBalanceResult] = useState<string | null>(null)
  const [queryAllowanceOwner, setQueryAllowanceOwner] = useState("")
  const [queryAllowanceSpender, setQueryAllowanceSpender] = useState("")
  const [queryAllowanceResult, setQueryAllowanceResult] = useState<string | null>(null)

  // 代币合约钩子
  const {
    tokenInfo,
    balance,
    allowance,
    approve,
    transfer,
    mint,
    burn,
    pause,
    unpause,
    isPaused,
    fetchBalance,
    fetchAllowance,
    isLoading: isTokenLoading,
    error: tokenError,
    owner,
  } = useTokenContract(selectedTokenForManagement)

  // 获取所有空投
  const airdrops = getAllAirdrops()

  // 农场管理状态
  const [isAddFarmDialogOpen, setIsAddFarmDialogOpen] = useState(false)
  const [isUpdateRewardDialogOpen, setIsUpdateRewardDialogOpen] = useState(false)
  const [isFundRewardsDialogOpen, setIsFundRewardsDialogOpen] = useState(false)
  const [selectedFarm, setSelectedFarm] = useState<any>(null)
  const [stakingToken, setStakingToken] = useState("")
  const [allocPoint, setAllocPoint] = useState("")
  const [updateAllocPoint, setUpdateAllocPoint] = useState("")
  const [rewardPerBlock, setRewardPerBlock] = useState("")
  const [fundAmount, setFundAmount] = useState("")

  // 农场合约钩子
  const {
    farms,
    isLoading: isFarmLoading,
    fetchFarms,
    addFarm,
    updateFarmAllocation,
    updateRewardPerBlock,
    fundRewards,
  } = useFarmContract()

  // IDO管理状态
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  // 仪表盘统计数据
  const [dashboardStats, setDashboardStats] = useState({
    totalTokens: 0,
    totalAirdrops: 0,
    activeAirdrops: 0,
    totalFarms: 0,
    totalUsers: 0,
    totalTransactions: 0,
    totalIdoProjects: 0,
    activeIdoProjects: 0,
  })

  // 加载仪表盘数据
  useEffect(() => {
    const loadDashboardData = async () => {
      setDashboardStats({
        totalTokens: tokenList.length,
        totalAirdrops: airdrops.length,
        activeAirdrops: airdrops.filter((a) => a.active).length,
        totalFarms: farms.length,
        totalUsers: new Set(airdrops.flatMap((a) => a.eligibleUsers)).size,
        totalTransactions: Math.floor(Math.random() * 1000) + 100, // 模拟数据
        totalIdoProjects: idoProjects.length,
        activeIdoProjects: idoProjects.filter((p) => p.status === "active").length,
      })
    }

    loadDashboardData()
  }, [tokenList, airdrops, farms, idoProjects])

  // Load deployed tokens
  useEffect(() => {
    const loadTokens = async () => {
      setIsTokensLoading(true)
      try {
        const tokens = await getDeployedTokens()
        setTokenList(tokens)
        if (tokens.length > 0) {
          setSelectedTokenForManagement(tokens[0].address)
        }
      } catch (error) {
        console.error("Failed to load deployed tokens:", error)
        toast({
          title: "加载代币失败",
          description: "无法加载已部署的代币列表",
          variant: "destructive",
        })
      } finally {
        setIsTokensLoading(false)
      }
    }

    loadTokens()
  }, [])

  // 当空投标签被激活时，刷新空投列表
  useEffect(() => {
    if (activeTab === "airdrops" && walletState.provider) {
      refreshAirdrops()
    }
  }, [activeTab, walletState.provider, refreshAirdrops])

  // 当农场标签被激活时，刷新农场列表
  useEffect(() => {
    if (activeTab === "farms" && walletState.provider) {
      fetchFarms()
    }
  }, [activeTab, walletState.provider, fetchFarms])

  // 当IDO标签被激活时，刷新IDO列表
  useEffect(() => {
    if (activeTab === "ido" && walletState.provider) {
      refreshIdoData()
    }
  }, [activeTab, walletState.provider, refreshIdoData])

  // 复制到剪贴板
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "已复制到剪贴板",
      description: "文本已成功复制到剪贴板。",
      duration: 2000,
    })
  }

  // 处理创建空投
  const handleCreateAirdrop = async () => {
    if (!selectedToken || !amount || !startDate || !endDate) {
      toast({
        title: "输入错误",
        description: "请填写所有必填字段",
        variant: "destructive",
      })
      return
    }

    try {
      // 转换日期为时间戳
      const startTimestamp = Math.floor(new Date(startDate).getTime() / 1000)
      const endTimestamp = Math.floor(new Date(endDate).getTime() / 1000)

      // 检查授权额度
      if (Number.parseFloat(allowance) < Number.parseFloat(amount)) {
        // 请求授权
        await approve(amount)
      }

      // 创建空投
      await createAirdrop(selectedToken, amount, startTimestamp, endTimestamp)

      // 重置表单
      setSelectedToken("")
      setAmount("")
      setStartDate("")
      setEndDate("")

      toast({
        title: "空投创建成功",
        description: "新的空投活动已成功创建",
      })

      // 刷新空投列表
      await refreshAirdrops()

      // 切换到空投列表标签
      setActiveTab("airdrops")
    } catch (error) {
      console.error("创建空投失败:", error)
      toast({
        title: "创建失败",
        description: `创建空投时发生错误: ${error.message || "未知错误"}`,
        variant: "destructive",
      })
    }
  }

  // 解析用户资格输入
  const parseEligibilityInput = () => {
    if (eligibilityFormat === "simple") {
      // 简单模式：每行一个地址，所有地址分配相同数量
      const addresses = eligibilityInput
        .split("\n")
        .map((addr) => addr.trim())
        .filter((addr) => addr.length > 0 && addr.startsWith("0x"))

      // 默认每个地址分配1个代币
      const amounts = addresses.map(() => "1")

      return { addresses, amounts }
    } else {
      // 高级模式：每行格式为 "地址,数量"
      const lines = eligibilityInput
        .split("\n")
        .map((line) => line.trim())
        .filter((line) => line.length > 0)

      const addresses: string[] = []
      const amounts: string[] = []

      lines.forEach((line) => {
        const parts = line.split(",")
        if (parts.length >= 2) {
          const address = parts[0].trim()
          const amount = parts[1].trim()

          if (address.startsWith("0x") && !isNaN(Number(amount))) {
            addresses.push(address)
            amounts.push(amount)
          }
        }
      })

      return { addresses, amounts }
    }
  }

  // 处理设置资格
  const handleSetEligibility = async () => {
    if (!selectedAirdropId) {
      toast({
        title: "输入错误",
        description: "请选择空投",
        variant: "destructive",
      })
      return
    }

    try {
      // 解析输入
      const { addresses, amounts } = parseEligibilityInput()

      if (addresses.length === 0) {
        toast({
          title: "输入错误",
          description: "请输入至少一个有效地址",
          variant: "destructive",
        })
        return
      }

      // 设置资格
      await setEligibility(addresses, amounts, selectedAirdropId)

      // 重置表单
      setEligibilityInput("")
      setSelectedAirdropId(null)

      toast({
        title: "设置成功",
        description: `已成功为${addresses.length}个地址设置资格`,
      })
    } catch (error) {
      console.error("设置资格失败:", error)
      toast({
        title: "设置失败",
        description: `设置资格时发生错误: ${error.message || "未知错误"}`,
        variant: "destructive",
      })
    }
  }

  // 处理激活/停用空投
  const handleToggleAirdropStatus = async (airdropId: number, currentStatus: boolean) => {
    try {
      if (currentStatus) {
        await deactivateAirdrop(airdropId)
        toast({
          title: "空投已停用",
          description: `空投 #${airdropId} 已成功停用`,
        })
      } else {
        await activateAirdrop(airdropId)
        toast({
          title: "空投已激活",
          description: `空投 #${airdropId} 已成功激活`,
        })
      }

      // 刷新空投列表
      await refreshAirdrops()
    } catch (error) {
      console.error("更改空投状态失败:", error)
      toast({
        title: "操作失败",
        description: `更改空投状态时发生错误: ${error.message || "未知错误"}`,
        variant: "destructive",
      })
    }
  }

  // 处理代币转账
  const handleTransferToken = async () => {
    if (!selectedTokenForManagement || !recipientAddress || !transferAmount) {
      toast({
        title: "输入错误",
        description: "请填写所有必填字段",
        variant: "destructive",
      })
      return
    }

    try {
      await transfer(recipientAddress, transferAmount)
      toast({
        title: "转账成功",
        description: `已成功转账 ${transferAmount} ${tokenInfo?.symbol} 到 ${recipientAddress.substring(0, 6)}...`,
      })
      setRecipientAddress("")
      setTransferAmount("")
      fetchBalance()
    } catch (error) {
      console.error("转账失败:", error)
      toast({
        title: "转账失败",
        description: `转账时发生错误: ${error.message || "未知错误"}`,
        variant: "destructive",
      })
    }
  }

  // 处理代币授权
  const handleApproveToken = async () => {
    if (!selectedTokenForManagement || !spenderAddress || !approveAmount) {
      toast({
        title: "输入错误",
        description: "请填写所有必填字段",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      console.log("开始授权代币:", {
        token: selectedTokenForManagement,
        spender: spenderAddress,
        amount: approveAmount,
      })

      const receipt = await approve(approveAmount, spenderAddress)
      console.log("授权交易收据:", receipt)

      toast({
        title: "授权成功",
        description: `已成功授权 ${approveAmount} ${tokenInfo?.symbol} 给 ${spenderAddress.substring(0, 6)}...`,
      })

      // 清空输入字段
      setSpenderAddress("")
      setApproveAmount("")

      // 重新获取授权额度
      await fetchAllowance(spenderAddress)
    } catch (error) {
      console.error("授权失败:", error)
      toast({
        title: "授权失败",
        description: `错误: ${error.message || "未知错误"}`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 处理代币铸造
  const handleMintToken = async () => {
    if (!selectedTokenForManagement || !mintToAddress || !mintAmount) {
      toast({
        title: "输入错误",
        description: "请填写所有必填字段",
        variant: "destructive",
      })
      return
    }

    try {
      console.log("开始铸造代币:", {
        token: selectedTokenForManagement,
        to: mintToAddress,
        amount: mintAmount,
      })

      await mint(mintToAddress, mintAmount)

      toast({
        title: "铸造成功",
        description: `已成功铸造 ${mintAmount} ${tokenInfo?.symbol} 到 ${mintToAddress.substring(0, 6)}...`,
      })
      setMintToAddress("")
      setMintAmount("")
      fetchBalance()
    } catch (error) {
      console.error("铸造失败:", error)
      toast({
        title: "铸造失败",
        description: `铸造代币时发生错误: ${error.message || "未知错误"}`,
        variant: "destructive",
      })
    }
  }

  // 处理代币销毁
  const handleBurnToken = async () => {
    if (!selectedTokenForManagement || !burnAmount) {
      toast({
        title: "输入错误",
        description: "请填写所有必填字段",
        variant: "destructive",
      })
      return
    }

    try {
      await burn(burnAmount)
      toast({
        title: "销毁成功",
        description: `已成功销毁 ${burnAmount} ${tokenInfo?.symbol}`,
      })
      setBurnAmount("")
      fetchBalance()
    } catch (error) {
      console.error("销毁失败:", error)
      toast({
        title: "销毁失败",
        description: `销毁代币时发生错误: ${error.message || "未知错误"}`,
        variant: "destructive",
      })
    }
  }

  // 处理代币暂停/恢复
  const handleTogglePause = async () => {
    try {
      if (isPaused) {
        await unpause()
        toast({
          title: "代币已恢复",
          description: `${tokenInfo?.symbol} 代币已成功恢复转账功能`,
        })
      } else {
        await pause()
        toast({
          title: "代币已暂停",
          description: `${tokenInfo?.symbol} 代币已成功暂停转账功能`,
        })
      }
    } catch (error) {
      console.error("操作失败:", error)
      toast({
        title: "操作失败",
        description: `更改代币状态时发生错误: ${error.message || "未知错误"}`,
        variant: "destructive",
      })
    }
  }

  // 添加自定义代币
  const handleAddCustomToken = async () => {
    if (!customTokenAddress) {
      toast({
        title: "输入错误",
        description: "请输入代币地址",
        variant: "destructive",
      })
      return
    }

    // 检查地址格式
    let formattedAddress = customTokenAddress.trim()
    if (!formattedAddress.startsWith("0x")) {
      formattedAddress = "0x" + formattedAddress
    }

    // 验证地址格式
    try {
      // 使用 ethers 验证地址格式
      ethers.getAddress(formattedAddress)
    } catch (error) {
      console.error("地址格式无效:", error)
      toast({
        title: "地址格式无效",
        description: "请输入有效的以太坊合约地址",
        variant: "destructive",
      })
      return
    }

    if (!walletState.provider) {
      toast({
        title: "钱包未连接",
        description: "请先连接您的钱包",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    try {
      console.log("尝试添加代币:", formattedAddress)

      // 检查是否已存在
      if (tokenList.some((token) => token.address.toLowerCase() === formattedAddress.toLowerCase())) {
        toast({
          title: "代币已存在",
          description: "该代币已在列表中",
          variant: "destructive",
        })
        setIsLoading(false)
        return
      }

      // 创建provider
      const provider = new ethers.BrowserProvider(walletState.provider)

      // 直接从合约获取代币信息
      const tokenInfo = await getTokenInfo(formattedAddress, provider)
      console.log("获取到代币信息:", tokenInfo)

      // 添加到列表
      const newToken = {
        address: formattedAddress,
        name: tokenInfo.name,
        symbol: tokenInfo.symbol,
        decimals: tokenInfo.decimals,
        logo: `/placeholder.svg?height=32&width=32&query=${tokenInfo.symbol} token logo`,
        owner: tokenInfo.owner || null,
      }

      setTokenList([...tokenList, newToken])
      setSelectedTokenForManagement(formattedAddress)
      setCustomTokenAddress("")

      toast({
        title: "代币已添加",
        description: `${tokenInfo.name} (${tokenInfo.symbol}) 已成功添加到列表`,
      })
    } catch (error) {
      console.error("添加代币失败:", error)
      toast({
        title: "添加失败",
        description: `错误: ${error.message || "未知错误"}`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 处理查询余额
  const handleQueryBalance = async () => {
    if (!selectedTokenForManagement || !queryBalanceAddress || !walletState.provider) {
      toast({
        title: "输入错误",
        description: "请输入有效的地址",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setQueryBalanceResult(null)

    try {
      const provider = new ethers.BrowserProvider(walletState.provider)
      const tokenContract = new ethers.Contract(selectedTokenForManagement, ERC20_ABI, provider)
      const balance = await tokenContract.balanceOf(queryBalanceAddress)
      const decimals = await tokenContract.decimals()

      const formattedBalance = ethers.formatUnits(balance, decimals)
      setQueryBalanceResult(formattedBalance)
    } catch (error) {
      console.error("查询余额失败:", error)
      toast({
        title: "查询失败",
        description: "查询余额时发生错误，请确保地址格式正确",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 处理查询授权额度
  const handleQueryAllowance = async () => {
    if (!selectedTokenForManagement || !queryAllowanceOwner || !queryAllowanceSpender || !walletState.provider) {
      toast({
        title: "输入错误",
        description: "请输入有效的地址",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setQueryAllowanceResult(null)

    try {
      console.log("查询授权额度:", {
        token: selectedTokenForManagement,
        owner: queryAllowanceOwner,
        spender: queryAllowanceSpender,
      })

      const provider = new ethers.BrowserProvider(walletState.provider)
      const tokenContract = new ethers.Contract(selectedTokenForManagement, ERC20_ABI, provider)

      // 获取代币小数位
      const decimals = await tokenContract.decimals()
      console.log("代币小数位:", decimals)

      // 获取授权额度
      const allowance = await tokenContract.allowance(queryAllowanceOwner, queryAllowanceSpender)
      console.log("原始授权额度:", allowance.toString())

      const formattedAllowance = ethers.formatUnits(allowance, decimals)
      console.log("格式化后授权额度:", formattedAllowance)

      setQueryAllowanceResult(formattedAllowance)
    } catch (error) {
      console.error("查询授权额度失败:", error)
      toast({
        title: "查询失败",
        description: `错误: ${error.message || "未知错误"}`,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // 处理添加农场
  const handleAddFarm = async () => {
    if (!stakingToken || !allocPoint) {
      toast({
        title: "输入错误",
        description: "请填写所有必填字段",
        variant: "destructive",
      })
      return
    }

    try {
      const success = await addFarm(Number(allocPoint), stakingToken, true)
      if (success) {
        toast({
          title: "农场添加成功",
          description: "新的农场池已成功创建",
        })
        setStakingToken("")
        setAllocPoint("")
        setIsAddFarmDialogOpen(false)
        fetchFarms()
      }
    } catch (error) {
      console.error("添加农场失败:", error)
      toast({
        title: "添加失败",
        description: `添加农场时发生错误: ${error.message || "未知错误"}`,
        variant: "destructive",
      })
    }
  }

  // 处理更新农场
  const handleUpdateFarm = async () => {
    if (!selectedFarm || !updateAllocPoint) {
      toast({
        title: "输入错误",
        description: "请填写所有必填字段",
        variant: "destructive",
      })
      return
    }

    try {
      const success = await updateFarmAllocation(selectedFarm.id, Number(updateAllocPoint), true)
      if (success) {
        toast({
          title: "农场更新成功",
          description: `农场 #${selectedFarm.id} 的分配点数已更新`,
        })
        setUpdateAllocPoint("")
        setSelectedFarm(null)
        fetchFarms()
      }
    } catch (error) {
      console.error("更新农场失败:", error)
      toast({
        title: "更新失败",
        description: `更新农场时发生错误: ${error.message || "未知错误"}`,
        variant: "destructive",
      })
    }
  }

  // 处理更新奖励
  const handleUpdateReward = async () => {
    if (!rewardPerBlock) {
      toast({
        title: "输入错误",
        description: "请填写奖励数量",
        variant: "destructive",
      })
      return
    }

    try {
      const success = await updateRewardPerBlock(rewardPerBlock)
      if (success) {
        toast({
          title: "奖励更新成功",
          description: `每区块奖励已更新为 ${rewardPerBlock} CAKE`,
        })
        setRewardPerBlock("")
        setIsUpdateRewardDialogOpen(false)
        fetchFarms()
      }
    } catch (error) {
      console.error("更新奖励失败:", error)
      toast({
        title: "更新失败",
        description: `更新奖励时发生错误: ${error.message || "未知错误"}`,
        variant: "destructive",
      })
    }
  }

  // 处理添加奖励资金
  const handleFundRewards = async () => {
    if (!fundAmount) {
      toast({
        title: "输入错误",
        description: "请填写资金数量",
        variant: "destructive",
      })
      return
    }

    try {
      const success = await fundRewards(fundAmount)
      if (success) {
        toast({
          title: "资金添加成功",
          description: `已成功添加 ${fundAmount} CAKE 到奖励池`,
        })
        setFundAmount("")
        setIsFundRewardsDialogOpen(false)
      }
    } catch (error) {
      console.error("添加资金失败:", error)
      toast({
        title: "添加失败",
        description: `添加资金时发生错误: ${error.message || "未知错误"}`,
        variant: "destructive",
      })
    }
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

  // 格式化数字
  const formatNumber = (num: number, decimals = 2) => {
    return num.toLocaleString(undefined, {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    })
  }

  // 计算进度
  const calculateProgress = (project: any) => {
    return (project.totalRaised / project.hardCap) * 100
  }

  // 获取状态徽章
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "upcoming":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 border-blue-200">
            Upcoming
          </Badge>
        )
      case "active":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
            Active
          </Badge>
        )
      case "ended":
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
            Ended
          </Badge>
        )
      case "cancelled":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
            Cancelled
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  // 过滤IDO项目
  const filteredIdoProjects = idoProjects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.tokenSymbol.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === "all" || project.status === statusFilter

    return matchesSearch && matchesStatus
  })

  // 如果不是管理员，显示未授权消息
  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>未授权访问</AlertTitle>
          <AlertDescription>您没有管理员权限，无法访问此页面。</AlertDescription>
        </Alert>
        <Button variant="outline" onClick={() => window.history.back()}>
          返回
        </Button>
      </div>
    )
  }

  // 如果钱包未连接，显示连接钱包提示
  if (!walletState.connected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Wallet className="mr-2 h-5 w-5" />
              管理员面板
            </CardTitle>
            <CardDescription>请先连接您的钱包</CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>需要连接钱包</AlertTitle>
              <AlertDescription>您需要连接钱包才能使用管理员功能。请点击右上角的"连接钱包"按钮。</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 管理员面板
  return (
    <div className="container mx-auto px-4">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <div className="bg-[#EACC91] p-3 rounded-full mr-4">
            <Image src="/hamster-logo.svg" alt="Hamster Admin" width={40} height={40} />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-[#523805]">Hamster 管理员面板</h1>
            <p className="text-[#987A3F]">管理您的代币、空投、农场和IDO</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline" className="px-3 py-1 border-[#EACC91] text-[#523805]">
            <Wallet className="mr-2 h-4 w-4 text-[#987A3F]" />
            {walletState.address?.substring(0, 6)}...{walletState.address?.substring(38)}
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-8 w-full bg-[#F9F5EA] p-1 rounded-xl">
          <TabsTrigger
            value="dashboard"
            className="flex items-center data-[state=active]:bg-white data-[state=active]:text-[#523805] data-[state=active]:shadow-sm text-[#523805]/70"
          >
            <Home className="mr-2 h-4 w-4" />
            <span>仪表盘</span>
          </TabsTrigger>
          <TabsTrigger
            value="overview"
            className="flex items-center data-[state=active]:bg-white data-[state=active]:text-[#523805] data-[state=active]:shadow-sm text-[#523805]/70"
          >
            <BarChart4 className="mr-2 h-4 w-4" />
            <span>概览</span>
          </TabsTrigger>
          <TabsTrigger
            value="tokens"
            className="flex items-center data-[state=active]:bg-white data-[state=active]:text-[#523805] data-[state=active]:shadow-sm text-[#523805]/70"
          >
            <Coins className="mr-2 h-4 w-4" />
            <span>代币</span>
          </TabsTrigger>
          <TabsTrigger
            value="airdrops"
            className="flex items-center data-[state=active]:bg-white data-[state=active]:text-[#523805] data-[state=active]:shadow-sm text-[#523805]/70"
          >
            <Gift className="mr-2 h-4 w-4" />
            <span>空投</span>
          </TabsTrigger>
          <TabsTrigger
            value="farms"
            className="flex items-center data-[state=active]:bg-white data-[state=active]:text-[#523805] data-[state=active]:shadow-sm text-[#523805]/70"
          >
            <Tractor className="mr-2 h-4 w-4" />
            <span>农场</span>
          </TabsTrigger>
          <TabsTrigger
            value="ido"
            className="flex items-center data-[state=active]:bg-white data-[state=active]:text-[#523805] data-[state=active]:shadow-sm text-[#523805]/70"
          >
            <Rocket className="mr-2 h-4 w-4" />
            <span>IDO</span>
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="flex items-center data-[state=active]:bg-white data-[state=active]:text-[#523805] data-[state=active]:shadow-sm text-[#523805]/70"
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>设置</span>
          </TabsTrigger>
          <TabsTrigger
            value="dashboard-page"
            className="flex items-center data-[state=active]:bg-white data-[state=active]:text-[#523805] data-[state=active]:shadow-sm text-[#523805]/70"
            onClick={() => router.push("/admin/dashboard")}
          >
            <PieChart className="mr-2 h-4 w-4" />
            <span>高级仪表盘</span>
          </TabsTrigger>
        </TabsList>

        {/* 仪表盘标签 */}
        <TabsContent value="dashboard">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="border-[#EACC91] bg-gradient-to-br from-[#F9F5EA] to-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-[#523805] flex items-center">
                  <Coins className="mr-2 h-4 w-4 text-[#987A3F]" />
                  代币管理
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#523805]">{dashboardStats.totalTokens}</div>
                <p className="text-xs text-[#987A3F] mt-1">已添加的代币数量</p>
                <Progress value={dashboardStats.totalTokens * 10} className="h-1 mt-3" />
              </CardContent>
              <CardFooter className="pt-0">
                <Button
                  variant="link"
                  className="p-0 h-auto text-[#987A3F] hover:text-[#523805]"
                  onClick={() => setActiveTab("tokens")}
                >
                  管理代币 <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardFooter>
            </Card>

            <Card className="border-[#EACC91] bg-gradient-to-br from-[#F9F5EA] to-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-[#523805] flex items-center">
                  <Gift className="mr-2 h-4 w-4 text-[#987A3F]" />
                  空投活动
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#523805]">
                  {dashboardStats.activeAirdrops}/{dashboardStats.totalAirdrops}
                </div>
                <p className="text-xs text-[#987A3F] mt-1">活跃/总空投数量</p>
                <Progress
                  value={
                    dashboardStats.totalAirdrops > 0
                      ? (dashboardStats.activeAirdrops / dashboardStats.totalAirdrops) * 100
                      : 0
                  }
                  className="h-1 mt-3"
                />
              </CardContent>
              <CardFooter className="pt-0">
                <Button
                  variant="link"
                  className="p-0 h-auto text-[#987A3F] hover:text-[#523805]"
                  onClick={() => setActiveTab("airdrops")}
                >
                  管理空投 <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardFooter>
            </Card>

            <Card className="border-[#EACC91] bg-gradient-to-br from-[#F9F5EA] to-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-[#523805] flex items-center">
                  <Tractor className="mr-2 h-4 w-4 text-[#987A3F]" />
                  农场池
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#523805]">{dashboardStats.totalFarms}</div>
                <p className="text-xs text-[#987A3F] mt-1">活跃的流动性挖矿农场</p>
                <Progress value={dashboardStats.totalFarms * 20} className="h-1 mt-3" />
              </CardContent>
              <CardFooter className="pt-0">
                <Button
                  variant="link"
                  className="p-0 h-auto text-[#987A3F] hover:text-[#523805]"
                  onClick={() => setActiveTab("farms")}
                >
                  管理农场 <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardFooter>
            </Card>

            <Card className="border-[#EACC91] bg-gradient-to-br from-[#F9F5EA] to-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-[#523805] flex items-center">
                  <Rocket className="mr-2 h-4 w-4 text-[#987A3F]" />
                  IDO项目
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#523805]">
                  {dashboardStats.activeIdoProjects}/{dashboardStats.totalIdoProjects}
                </div>
                <p className="text-xs text-[#987A3F] mt-1">活跃/总IDO项目</p>
                <Progress
                  value={
                    dashboardStats.totalIdoProjects > 0
                      ? (dashboardStats.activeIdoProjects / dashboardStats.totalIdoProjects) * 100
                      : 0
                  }
                  className="h-1 mt-3"
                />
              </CardContent>
              <CardFooter className="pt-0">
                <Button
                  variant="link"
                  className="p-0 h-auto text-[#987A3F] hover:text-[#523805]"
                  onClick={() => setActiveTab("ido")}
                >
                  管理IDO <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* 其他仪表盘内容 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <Card className="border-[#EACC91]">
              <CardHeader>
                <CardTitle className="text-xl text-[#523805]">快速操作</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Button
                    className="bg-gradient-to-r from-[#EACC91] to-[#987A3F] hover:from-[#987A3F] hover:to-[#523805] text-[#523805] hover:text-white h-auto py-4 justify-start"
                    onClick={() => router.push("/admin/create-ido")}
                  >
                    <div className="flex flex-col items-start">
                      <div className="flex items-center">
                        <Rocket className="h-5 w-5 mr-2" />
                        <span className="font-medium">创建IDO</span>
                      </div>
                      <span className="text-xs mt-1 text-[#523805]/80">发布新的IDO项目</span>
                    </div>
                  </Button>

                  <Button
                    className="bg-gradient-to-r from-[#EACC91] to-[#987A3F] hover:from-[#987A3F] hover:to-[#523805] text-[#523805] hover:text-white h-auto py-4 justify-start"
                    onClick={() => setActiveTab("airdrops")}
                  >
                    <div className="flex flex-col items-start">
                      <div className="flex items-center">
                        <Gift className="h-5 w-5 mr-2" />
                        <span className="font-medium">创建空投</span>
                      </div>
                      <span className="text-xs mt-1 text-[#523805]/80">发起新的代币空投</span>
                    </div>
                  </Button>

                  <Button
                    className="bg-gradient-to-r from-[#EACC91] to-[#987A3F] hover:from-[#987A3F] hover:to-[#523805] text-[#523805] hover:text-white h-auto py-4 justify-start"
                    onClick={() => setActiveTab("farms")}
                  >
                    <div className="flex flex-col items-start">
                      <div className="flex items-center">
                        <Tractor className="h-5 w-5 mr-2" />
                        <span className="font-medium">添加农场</span>
                      </div>
                      <span className="text-xs mt-1 text-[#523805]/80">创建新的流动性挖矿农场</span>
                    </div>
                  </Button>

                  <Button
                    className="bg-gradient-to-r from-[#EACC91] to-[#987A3F] hover:from-[#987A3F] hover:to-[#523805] text-[#523805] hover:text-white h-auto py-4 justify-start"
                    onClick={() => router.push("/admin/dashboard")}
                  >
                    <div className="flex flex-col items-start">
                      <div className="flex items-center">
                        <BarChart4 className="h-5 w-5 mr-2" />
                        <span className="font-medium">查看统计</span>
                      </div>
                      <span className="text-xs mt-1 text-[#523805]/80">查看平台详细统计数据</span>
                    </div>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#EACC91]">
              <CardHeader>
                <CardTitle className="text-xl text-[#523805]">最近活动</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* 模拟活动数据 */}
                  <div className="flex items-start gap-3 p-3 bg-[#F9F5EA] rounded-lg">
                    <div className="bg-[#EACC91] p-2 rounded-full">
                      <Rocket className="h-4 w-4 text-[#523805]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#523805]">新IDO项目已创建</p>
                      <p className="text-xs text-[#523805]/70">项目 "Hamster Finance" 已成功创建</p>
                      <p className="text-xs text-[#523805]/50 mt-1">2小时前</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-[#F9F5EA] rounded-lg">
                    <div className="bg-[#EACC91] p-2 rounded-full">
                      <Gift className="h-4 w-4 text-[#523805]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#523805]">空投已激活</p>
                      <p className="text-xs text-[#523805]/70">CAKE 代币空投 #3 已激活</p>
                      <p className="text-xs text-[#523805]/50 mt-1">1天前</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-[#F9F5EA] rounded-lg">
                    <div className="bg-[#EACC91] p-2 rounded-full">
                      <Tractor className="h-4 w-4 text-[#523805]" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#523805]">农场奖励已更新</p>
                      <p className="text-xs text-[#523805]/70">CAKE-ETH 农场的奖励已更新</p>
                      <p className="text-xs text-[#523805]/50 mt-1">2天前</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 概览标签 */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-[#EACC91]">
              <CardHeader>
                <CardTitle className="text-xl text-[#523805]">平台概览</CardTitle>
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

            <Card className="border-[#EACC91]">
              <CardHeader>
                <CardTitle className="text-xl text-[#523805]">最新项目</CardTitle>
                <CardDescription>最近创建的项目</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {idoProjects.slice(0, 3).map((project, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-[#F9F5EA] rounded-lg">
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
                          <div className="text-xs text-[#523805]/70">{project.tokenSymbol}</div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-[#EACC91] text-[#523805]"
                        onClick={() => router.push(`/admin/ido-management?projectId=${project.id}`)}
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  {idoProjects.length === 0 && (
                    <div className="text-center py-6 text-[#523805]/70">
                      <p>暂无IDO项目</p>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    className="w-full border-[#EACC91] text-[#523805] hover:bg-[#F9F5EA]"
                    onClick={() => setActiveTab("ido")}
                  >
                    查看所有项目
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 代币标签 */}
        <TabsContent value="tokens">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card className="border-[#EACC91]">
                <CardHeader>
                  <CardTitle className="text-xl text-[#523805]">代币管理</CardTitle>
                  <CardDescription>管理您的代币</CardDescription>
                </CardHeader>
                <CardContent>
                  {isTokensLoading ? (
                    <div className="flex justify-center items-center py-10">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#987A3F]"></div>
                    </div>
                  ) : tokenList.length === 0 ? (
                    <div className="bg-[#F9F5EA] rounded-xl p-6 border border-[#EACC91]/40 text-center">
                      <p className="text-[#523805]">暂无代币。</p>
                      <p className="text-[#523805]/70 text-sm mt-2">添加自定义代币或创建新代币。</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex flex-col sm:flex-row gap-2 mb-4">
                        <select
                          value={selectedTokenForManagement}
                          onChange={(e) => setSelectedTokenForManagement(e.target.value)}
                          className="flex-1 px-3 py-2 rounded-md border border-[#EACC91] text-[#523805] bg-white"
                        >
                          {tokenList.map((token) => (
                            <option key={token.address} value={token.address}>
                              {token.name} ({token.symbol})
                            </option>
                          ))}
                        </select>
                        <Button
                          variant="outline"
                          className="border-[#EACC91] text-[#523805]"
                          onClick={() => fetchBalance()}
                        >
                          <RefreshCw className="h-4 w-4 mr-2" />
                          刷新
                        </Button>
                      </div>

                      {tokenInfo && (
                        <div className="bg-[#F9F5EA] rounded-xl p-4 border border-[#EACC91]/40 space-y-3">
                          <div className="flex justify-between">
                            <span className="text-[#523805]/70">代币名称</span>
                            <span className="font-medium text-[#523805]">{tokenInfo.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#523805]/70">代币符号</span>
                            <span className="font-medium text-[#523805]">{tokenInfo.symbol}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#523805]/70">小数位数</span>
                            <span className="font-medium text-[#523805]">{tokenInfo.decimals}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#523805]/70">总供应量</span>
                            <span className="font-medium text-[#523805]">
                              {tokenInfo.totalSupply} {tokenInfo.symbol}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#523805]/70">您的余额</span>
                            <span className="font-medium text-[#523805]">
                              {balance} {tokenInfo.symbol}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#523805]/70">合约地址</span>
                            <span
                              className="font-medium text-[#523805] cursor-pointer hover:text-[#987A3F]"
                              onClick={() => copyToClipboard(selectedTokenForManagement)}
                            >
                              {selectedTokenForManagement.substring(0, 6)}...
                              {selectedTokenForManagement.substring(38)} (点击复制)
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-[#523805]/70">状态</span>
                            <span className="font-medium text-[#523805]">
                              {isPaused ? (
                                <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
                                  已暂停
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                                  活跃
                                </Badge>
                              )}
                            </span>
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                        <div>
                          <h3 className="text-lg font-medium text-[#523805] mb-3">转账代币</h3>
                          <div className="space-y-2">
                            <Input
                              placeholder="接收地址"
                              value={recipientAddress}
                              onChange={(e) => setRecipientAddress(e.target.value)}
                              className="border-[#EACC91] focus-visible:ring-[#987A3F]"
                            />
                            <Input
                              placeholder="转账数量"
                              value={transferAmount}
                              onChange={(e) => setTransferAmount(e.target.value)}
                              className="border-[#EACC91] focus-visible:ring-[#987A3F]"
                            />
                            <Button
                              className="w-full bg-[#987A3F] hover:bg-[#523805] text-white"
                              onClick={handleTransferToken}
                              disabled={isTokenLoading}
                            >
                              转账
                            </Button>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-lg font-medium text-[#523805] mb-3">授权代币</h3>
                          <div className="space-y-2">
                            <Input
                              placeholder="授权地址"
                              value={spenderAddress}
                              onChange={(e) => setSpenderAddress(e.target.value)}
                              className="border-[#EACC91] focus-visible:ring-[#987A3F]"
                            />
                            <Input
                              placeholder="授权数量"
                              value={approveAmount}
                              onChange={(e) => setApproveAmount(e.target.value)}
                              className="border-[#EACC91] focus-visible:ring-[#987A3F]"
                            />
                            <Button
                              className="w-full bg-[#987A3F] hover:bg-[#523805] text-white"
                              onClick={handleApproveToken}
                              disabled={isTokenLoading}
                            >
                              授权
                            </Button>
                          </div>
                        </div>

                        {owner === walletState.address && (
                          <>
                            <div>
                              <h3 className="text-lg font-medium text-[#523805] mb-3">铸造代币</h3>
                              <div className="space-y-2">
                                <Input
                                  placeholder="接收地址"
                                  value={mintToAddress}
                                  onChange={(e) => setMintToAddress(e.target.value)}
                                  className="border-[#EACC91] focus-visible:ring-[#987A3F]"
                                />
                                <Input
                                  placeholder="铸造数量"
                                  value={mintAmount}
                                  onChange={(e) => setMintAmount(e.target.value)}
                                  className="border-[#EACC91] focus-visible:ring-[#987A3F]"
                                />
                                <Button
                                  className="w-full bg-[#987A3F] hover:bg-[#523805] text-white"
                                  onClick={handleMintToken}
                                  disabled={isTokenLoading}
                                >
                                  铸造
                                </Button>
                              </div>
                            </div>

                            <div>
                              <h3 className="text-lg font-medium text-[#523805] mb-3">销毁代币</h3>
                              <div className="space-y-2">
                                <Input
                                  placeholder="销毁数量"
                                  value={burnAmount}
                                  onChange={(e) => setBurnAmount(e.target.value)}
                                  className="border-[#EACC91] focus-visible:ring-[#987A3F]"
                                />
                                <Button
                                  className="w-full bg-[#987A3F] hover:bg-[#523805] text-white"
                                  onClick={handleBurnToken}
                                  disabled={isTokenLoading}
                                >
                                  销毁
                                </Button>
                              </div>
                            </div>

                            <div className="sm:col-span-2">
                              <Button
                                className="w-full bg-gradient-to-r from-[#EACC91] to-[#987A3F] hover:from-[#987A3F] hover:to-[#523805] text-[#523805] hover:text-white"
                                onClick={handleTogglePause}
                                disabled={isTokenLoading}
                              >
                                {isPaused ? "恢复代币" : "暂停代币"}
                              </Button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="border-[#EACC91]">
                <CardHeader>
                  <CardTitle className="text-xl text-[#523805]">添加代币</CardTitle>
                  <CardDescription>添加自定义代币</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="customTokenAddress" className="text-sm font-medium text-[#523805]">
                        代币合约地址
                      </label>
                      <Input
                        id="customTokenAddress"
                        placeholder="输入代币合约地址"
                        value={customTokenAddress}
                        onChange={(e) => setCustomTokenAddress(e.target.value)}
                        className="border-[#EACC91] focus-visible:ring-[#987A3F]"
                      />
                    </div>
                    <Button
                      className="w-full bg-[#987A3F] hover:bg-[#523805] text-white"
                      onClick={handleAddCustomToken}
                      disabled={isTokensLoading}
                    >
                      添加代币
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-[#EACC91] mt-6">
                <CardHeader>
                  <CardTitle className="text-xl text-[#523805]">查询功能</CardTitle>
                  <CardDescription>查询代币信息</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label htmlFor="queryBalanceAddress" className="text-sm font-medium text-[#523805]">
                        查询余额
                      </label>
                      <div className="flex gap-2">
                        <Input
                          id="queryBalanceAddress"
                          placeholder="输入地址"
                          value={queryBalanceAddress}
                          onChange={(e) => setQueryBalanceAddress(e.target.value)}
                          className="border-[#EACC91] focus-visible:ring-[#987A3F]"
                        />
                        <Button
                          variant="outline"
                          className="border-[#EACC91] text-[#523805]"
                          onClick={handleQueryBalance}
                          disabled={isLoading}
                        >
                          查询
                        </Button>
                      </div>
                      {queryBalanceResult !== null && (
                        <div className="p-2 bg-[#F9F5EA] rounded-md text-sm text-[#523805]">
                          余额: {queryBalanceResult} {tokenInfo?.symbol}
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="queryAllowanceOwner" className="text-sm font-medium text-[#523805]">
                        查询授权额度
                      </label>
                      <Input
                        id="queryAllowanceOwner"
                        placeholder="所有者地址"
                        value={queryAllowanceOwner}
                        onChange={(e) => setQueryAllowanceOwner(e.target.value)}
                        className="border-[#EACC91] focus-visible:ring-[#987A3F]"
                      />
                      <Input
                        placeholder="授权地址"
                        value={queryAllowanceSpender}
                        onChange={(e) => setQueryAllowanceSpender(e.target.value)}
                        className="border-[#EACC91] focus-visible:ring-[#987A3F]"
                      />
                      <Button
                        variant="outline"
                        className="w-full border-[#EACC91] text-[#523805]"
                        onClick={handleQueryAllowance}
                        disabled={isLoading}
                      >
                        查询授权额度
                      </Button>
                      {queryAllowanceResult !== null && (
                        <div className="p-2 bg-[#F9F5EA] rounded-md text-sm text-[#523805]">
                          授权额度: {queryAllowanceResult} {tokenInfo?.symbol}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* 空投标签 */}
        <TabsContent value="airdrops">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card className="border-[#EACC91]">
                <CardHeader>
                  <CardTitle className="text-xl text-[#523805]">空投列表</CardTitle>
                  <CardDescription>管理您的空投活动</CardDescription>
                </CardHeader>
                <CardContent>
                  {isAirdropLoading ? (
                    <div className="flex justify-center items-center py-10">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#987A3F]"></div>
                    </div>
                  ) : airdrops.length === 0 ? (
                    <div className="bg-[#F9F5EA] rounded-xl p-6 border border-[#EACC91]/40 text-center">
                      <p className="text-[#523805]">暂无空投活动。</p>
                      <p className="text-[#523805]/70 text-sm mt-2">创建您的第一个空投活动。</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-[#523805]">ID</TableHead>
                            <TableHead className="text-[#523805]">代币</TableHead>
                            <TableHead className="text-[#523805]">总量</TableHead>
                            <TableHead className="text-[#523805]">时间</TableHead>
                            <TableHead className="text-[#523805]">状态</TableHead>
                            <TableHead className="text-[#523805]">操作</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {airdrops.map((airdrop) => (
                            <TableRow key={airdrop.id}>
                              <TableCell className="font-medium">{airdrop.id}</TableCell>
                              <TableCell>
                                <div className="flex items-center">
                                  <div className="h-6 w-6 rounded-full overflow-hidden mr-2">
                                    <Image
                                      src={`/abstract-geometric-shapes.png?key=8bhoz&height=24&width=24&query=${airdrop.tokenSymbol} token`}
                                      alt={airdrop.tokenSymbol}
                                      width={24}
                                      height={24}
                                      className="object-cover"
                                    />
                                  </div>
                                  <span>{airdrop.tokenSymbol}</span>
                                </div>
                              </TableCell>
                              <TableCell>{airdrop.amount}</TableCell>
                              <TableCell>
                                <div className="text-xs">
                                  <div className="flex items-center">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {new Date(airdrop.startTime * 1000).toLocaleDateString()}
                                  </div>
                                  <div className="flex items-center mt-1">
                                    <Clock className="h-3 w-3 mr-1" />
                                    {new Date(airdrop.endTime * 1000).toLocaleDateString()}
                                  </div>
                                </div>
                              </TableCell>
                              <TableCell>
                                {airdrop.active ? (
                                  <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
                                    活跃
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="bg-gray-100 text-gray-800 border-gray-200">
                                    未激活
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0 border-[#EACC91]"
                                    onClick={() => setSelectedAirdropId(airdrop.id)}
                                  >
                                    <Users className="h-4 w-4 text-[#523805]" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-8 w-8 p-0 border-[#EACC91]"
                                    onClick={() => handleToggleAirdropStatus(airdrop.id, airdrop.active)}
                                  >
                                    {airdrop.active ? (
                                      <XCircle className="h-4 w-4 text-red-500" />
                                    ) : (
                                      <CheckCircle className="h-4 w-4 text-green-500" />
                                    )}
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="border-[#EACC91]">
                <CardHeader>
                  <CardTitle className="text-xl text-[#523805]">创建空投</CardTitle>
                  <CardDescription>创建新的空投活动</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="selectedToken" className="text-sm font-medium text-[#523805]">
                        代币
                      </label>
                      <select
                        id="selectedToken"
                        value={selectedToken}
                        onChange={(e) => setSelectedToken(e.target.value)}
                        className="w-full px-3 py-2 rounded-md border border-[#EACC91] text-[#523805] bg-white"
                      >
                        <option value="">选择代币</option>
                        {tokenList.map((token) => (
                          <option key={token.address} value={token.address}>
                            {token.name} ({token.symbol})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="amount" className="text-sm font-medium text-[#523805]">
                        空投总量
                      </label>
                      <Input
                        id="amount"
                        placeholder="输入空投总量"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="border-[#EACC91] focus-visible:ring-[#987A3F]"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="startDate" className="text-sm font-medium text-[#523805]">
                        开始时间
                      </label>
                      <Input
                        id="startDate"
                        type="datetime-local"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="border-[#EACC91] focus-visible:ring-[#987A3F]"
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="endDate" className="text-sm font-medium text-[#523805]">
                        结束时间
                      </label>
                      <Input
                        id="endDate"
                        type="datetime-local"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="border-[#EACC91] focus-visible:ring-[#987A3F]"
                      />
                    </div>

                    <Button
                      className="w-full bg-[#987A3F] hover:bg-[#523805] text-white"
                      onClick={handleCreateAirdrop}
                      disabled={isAirdropLoading}
                    >
                      创建空投
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-[#EACC91] mt-6">
                <CardHeader>
                  <CardTitle className="text-xl text-[#523805]">设置资格</CardTitle>
                  <CardDescription>设置用户领取资格</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label htmlFor="selectedAirdropId" className="text-sm font-medium text-[#523805]">
                        选择空投
                      </label>
                      <select
                        id="selectedAirdropId"
                        value={selectedAirdropId || ""}
                        onChange={(e) => setSelectedAirdropId(e.target.value ? Number(e.target.value) : null)}
                        className="w-full px-3 py-2 rounded-md border border-[#EACC91] text-[#523805] bg-white"
                      >
                        <option value="">选择空投</option>
                        {airdrops.map((airdrop) => (
                          <option key={airdrop.id} value={airdrop.id}>
                            #{airdrop.id} - {airdrop.tokenSymbol}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <label htmlFor="eligibilityInput" className="text-sm font-medium text-[#523805]">
                          用户地址
                        </label>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            className={`text-xs px-2 py-1 rounded ${
                              eligibilityFormat === "simple" ? "bg-[#987A3F] text-white" : "bg-[#F9F5EA] text-[#523805]"
                            }`}
                            onClick={() => setEligibilityFormat("simple")}
                          >
                            简单模式
                          </button>
                          <button
                            type="button"
                            className={`text-xs px-2 py-1 rounded ${
                              eligibilityFormat === "advanced"
                                ? "bg-[#987A3F] text-white"
                                : "bg-[#F9F5EA] text-[#523805]"
                            }`}
                            onClick={() => setEligibilityFormat("advanced")}
                          >
                            高级模式
                          </button>
                        </div>
                      </div>
                      <textarea
                        id="eligibilityInput"
                        placeholder={
                          eligibilityFormat === "simple"
                            ? "每行一个地址\n0x...\n0x..."
                            : "每行格式: 地址,数量\n0x...,10\n0x...,20"
                        }
                        value={eligibilityInput}
                        onChange={(e) => setEligibilityInput(e.target.value)}
                        className="w-full min-h-[120px] px-3 py-2 rounded-md border border-[#EACC91] text-[#523805] bg-white"
                      />
                    </div>

                    <Button
                      className="w-full bg-[#987A3F] hover:bg-[#523805] text-white"
                      onClick={handleSetEligibility}
                      disabled={isAirdropLoading}
                    >
                      设置资格
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* 农场标签 */}
        <TabsContent value="farms">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-[#523805]">农场管理</h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => fetchFarms()}
                className="border-[#EACC91] text-[#987A3F] hover:bg-[#F9F5EA]"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                刷新数据
              </Button>
              <Button
                className="bg-[#987A3F] hover:bg-[#523805] text-white"
                onClick={() => router.push("/admin/farm-management")}
              >
                <Tractor className="mr-2 h-4 w-4" />
                高级农场管理
              </Button>
            </div>
          </div>

          <Card className="border-[#EACC91]">
            <CardHeader className="bg-gradient-to-r from-[#F9F5EA] to-transparent">
              <CardTitle className="flex items-center text-[#523805]">
                <Tractor className="mr-2 h-5 w-5 text-[#987A3F]" />
                农场列表
              </CardTitle>
              <CardDescription>管理所有农场池</CardDescription>
            </CardHeader>
            <CardContent>
              {isFarmLoading ? (
                <div className="flex justify-center items-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#987A3F]"></div>
                </div>
              ) : farms.length === 0 ? (
                <div className="text-center py-10">
                  <Tractor className="h-12 w-12 mx-auto text-[#EACC91]" />
                  <h3 className="mt-4 text-xl font-medium text-[#523805]">暂无农场</h3>
                  <p className="mt-2 text-[#987A3F]">点击"添加农场"按钮创建您的第一个农场。</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[80px]">ID</TableHead>
                      <TableHead>农场</TableHead>
                      <TableHead>分配点数</TableHead>
                      <TableHead>总质押量</TableHead>
                      <TableHead>乘数</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {farms.map((farm) => (
                      <TableRow key={farm.id}>
                        <TableCell className="font-medium">{farm.id}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <div className="relative h-8 w-8 mr-2">
                              <div className="absolute top-0 left-0 h-6 w-6 rounded-full overflow-hidden z-10">
                                <img
                                  src={farm.token0?.logo || "/placeholder.svg"}
                                  alt={farm.token0?.symbol}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                              <div className="absolute bottom-0 right-0 h-6 w-6 rounded-full overflow-hidden border border-white">
                                <img
                                  src={farm.token1?.logo || "/placeholder.svg"}
                                  alt={farm.token1?.symbol}
                                  className="h-full w-full object-cover"
                                />
                              </div>
                            </div>
                            <div>
                              <div className="font-medium text-[#523805]">{farm.name}</div>
                              <div className="text-xs text-[#987A3F]">奖励: {farm.rewardToken}</div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{farm.multiplier}0 点</TableCell>
                        <TableCell>{farm.totalStaked?.toFixed(4)}</TableCell>
                        <TableCell>{farm.multiplier}x</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-[#EACC91] text-[#987A3F] hover:bg-[#F9F5EA]"
                            onClick={() => router.push(`/admin/farm-management`)}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            编辑
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* IDO管理标签 */}
        <TabsContent value="ido">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-[#523805]">IDO管理</h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="border-[#EACC91] text-[#523805] hover:bg-[#F9F5EA]"
                onClick={refreshIdoData}
                disabled={isIdoLoading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isIdoLoading ? "animate-spin" : ""}`} />
                刷新数据
              </Button>
              <Button
                className="bg-[#987A3F] hover:bg-[#523805] text-white"
                onClick={() => router.push("/admin/create-ido")}
              >
                <Plus className="h-4 w-4 mr-2" />
                创建IDO
              </Button>
              <Button
                variant="outline"
                className="border-[#EACC91] text-[#523805] hover:bg-[#F9F5EA]"
                onClick={() => router.push("/admin/ido-management")}
              >
                <Settings className="h-4 w-4 mr-2" />
                高级管理
              </Button>
            </div>
          </div>

          <Card className="border-[#EACC91] shadow-md">
            <CardHeader>
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <CardTitle className="text-xl text-[#523805]">IDO项目列表</CardTitle>

                <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#523805]/50" />
                    <Input
                      placeholder="搜索项目..."
                      className="pl-10 border-[#EACC91] text-[#523805] rounded-lg"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent>
              {isIdoLoading ? (
                <div className="flex justify-center items-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#987A3F]"></div>
                </div>
              ) : filteredIdoProjects.length === 0 ? (
                <div className="bg-[#F9F5EA] rounded-2xl p-8 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-3 bg-[#EACC91]/30 rounded-full">
                      <Info className="h-8 w-8 text-[#523805]/50" />
                    </div>
                    <h3 className="text-xl font-bold text-[#523805]">未找到IDO项目</h3>
                    <p className="text-[#523805]/70">没有符合您搜索条件的IDO项目，或者尚未创建任何项目。</p>
                    <Button
                      className="mt-2 bg-[#987A3F] hover:bg-[#523805] text-white"
                      onClick={() => router.push("/admin/create-ido")}
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      创建第一个IDO项目
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-[#523805]">项目</TableHead>
                        <TableHead className="text-[#523805]">状态</TableHead>
                        <TableHead className="text-[#523805]">时间线</TableHead>
                        <TableHead className="text-[#523805]">进度</TableHead>
                        <TableHead className="text-[#523805]">操作</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredIdoProjects.map((project) => (
                        <TableRow key={project.id}>
                          <TableCell>
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
                          </TableCell>
                          <TableCell>{getStatusBadge(project.status)}</TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <div className="text-sm text-[#523805]/70 flex items-center">
                                <Calendar className="h-3 w-3 mr-1" /> {formatDate(project.startTime)}
                              </div>
                              <div className="text-sm text-[#523805]/70 flex items-center">
                                <Clock className="h-3 w-3 mr-1" /> {formatDate(project.endTime)}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="w-full max-w-[200px]">
                              <div className="flex justify-between text-xs text-[#523805]/70 mb-1">
                                <span>{formatNumber(project.totalRaised)} CAKE</span>
                                <span>{formatNumber(project.hardCap)} CAKE</span>
                              </div>
                              <Progress value={calculateProgress(project)} className="h-2 bg-[#EACC91]/30" />
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-[#EACC91] text-[#523805]"
                                onClick={() => router.push(`/admin/ido-management?projectId=${project.id}`)}
                              >
                                <ExternalLink className="h-4 w-4 mr-1" />
                                详情
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="border-[#EACC91] text-[#523805]"
                                onClick={() => router.push(`/admin/edit-ido/${project.id}`)}
                              >
                                <Edit className="h-4 w-4 mr-1" />
                                编辑
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 设置标签 */}
        <TabsContent value="settings">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-[#EACC91]">
              <CardHeader>
                <CardTitle className="text-xl text-[#523805]">系统设置</CardTitle>
                <CardDescription>管理系统配置</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-[#F9F5EA] rounded-lg">
                    <h3 className="font-medium text-[#523805] mb-2">合约地址</h3>
                    <Button
                      variant="outline"
                      className="w-full border-[#EACC91] text-[#523805] hover:bg-[#F9F5EA]"
                      onClick={() => router.push("/admin/contract-addresses")}
                    >
                      管理合约地址
                    </Button>
                  </div>

                  <div className="p-4 bg-[#F9F5EA] rounded-lg">
                    <h3 className="font-medium text-[#523805] mb-2">管理员权限</h3>
                    <Button
                      variant="outline"
                      className="w-full border-[#EACC91] text-[#523805] hover:bg-[#F9F5EA]"
                      onClick={() => router.push("/admin/manage-addresses")}
                    >
                      管理管理员地址
                    </Button>
                  </div>

                  <div className="p-4 bg-[#F9F5EA] rounded-lg">
                    <h3 className="font-medium text-[#523805] mb-2">调试工具</h3>
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        className="border-[#EACC91] text-[#523805] hover:bg-[#F9F5EA]"
                        onClick={() => router.push("/admin/debug-addresses")}
                      >
                        调试地址
                      </Button>
                      <Button
                        variant="outline"
                        className="border-[#EACC91] text-[#523805] hover:bg-[#F9F5EA]"
                        onClick={() => router.push("/admin/debug-approve")}
                      >
                        调试授权
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#EACC91]">
              <CardHeader>
                <CardTitle className="text-xl text-[#523805]">账户信息</CardTitle>
                <CardDescription>您的账户信息</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-[#F9F5EA] rounded-lg">
                    <h3 className="font-medium text-[#523805] mb-2">钱包地址</h3>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-[#523805]/70 font-mono">
                        {walletState.address?.substring(0, 10)}...{walletState.address?.substring(36)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        onClick={() => copyToClipboard(walletState.address || "")}
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4 text-[#987A3F]"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
