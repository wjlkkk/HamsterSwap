"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useWallet } from "@/contexts/wallet-context"
import { useAdmin } from "@/contexts/admin-context"
import { useAirdropContract } from "@/hooks/use-airdrop-contract"
import { useTokenContract } from "@/hooks/use-token-contract"
import { useFarmContract } from "@/hooks/use-farm-contract"
import { getTokenInfo, ERC20_ABI, getDeployedTokens } from "@/contracts/token-contract"
import { ethers } from "ethers"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  AlertCircle,
  BarChart4,
  Gift,
  Calendar,
  Coins,
  Plus,
  RefreshCw,
  Wallet,
  Tractor,
  Rocket,
  Settings,
  Info,
  Calculator,
  Pencil,
  Users,
  Pause,
  Play,
  Search,
  ExternalLink,
  Copy,
  ArrowUpRight,
  Check,
  Flame,
  Home,
  PieChart,
  Activity,
  DollarSign,
  TrendingUp,
  Clock,
  Shield,
  ChevronRight,
  BarChart,
  Zap,
  Award,
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import ClientOnly from "@/components/client-only"
import Navbar from "@/components/navbar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Progress } from "@/components/ui/progress"

export default function AdminPage() {
  return (
    <ClientOnly>
      <div className="min-h-screen bg-gradient-to-b from-[#F9F5EA] via-[#EACC91]/20 to-[#F9F5EA]">
        <Navbar />
        <div className="pt-24 pb-16">
          <AdminDashboard />
        </div>
      </div>
    </ClientOnly>
  )
}

function AdminDashboard() {
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

  // 仪表盘统计数据
  const [dashboardStats, setDashboardStats] = useState({
    totalTokens: 0,
    totalAirdrops: 0,
    activeAirdrops: 0,
    totalFarms: 0,
    totalUsers: 0,
    totalTransactions: 0,
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
      })
    }

    loadDashboardData()
  }, [tokenList, airdrops, farms])

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
    if (!customTokenAddress || !walletState.provider) {
      toast({
        title: "输入错误",
        description: "请输入有效的代币地址",
        variant: "destructive",
      })
      return
    }

    try {
      const provider = new ethers.BrowserProvider(walletState.provider)
      const tokenInfo = await getTokenInfo(customTokenAddress, provider)

      // 检查是否已存在
      if (tokenList.some((token) => token.address.toLowerCase() === customTokenAddress.toLowerCase())) {
        toast({
          title: "代币已存在",
          description: "该代币已在列表中",
          variant: "destructive",
        })
        return
      }

      // 添加到列表
      const newToken = {
        address: customTokenAddress,
        name: tokenInfo.name,
        symbol: tokenInfo.symbol,
        decimals: tokenInfo.decimals,
        logo: `/placeholder.svg?height=32&width=32&query=${tokenInfo.symbol} token logo`,
        owner: tokenInfo.owner || null,
      }

      setTokenList([...tokenList, newToken])
      setSelectedTokenForManagement(customTokenAddress)
      setCustomTokenAddress("")

      toast({
        title: "代币已添加",
        description: `${tokenInfo.name} (${tokenInfo.symbol}) 已成功添加到列表`,
      })
    } catch (error) {
      console.error("添加代币失败:", error)
      toast({
        title: "添加失败",
        description: "无法添加代币，请确保地址有效",
        variant: "destructive",
      })
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
        <TabsList className="grid grid-cols-7 w-full bg-[#F9F5EA] p-1 rounded-xl">
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
        </TabsList>

        {/* 仪表盘标签 */}
        <TabsContent value="dashboard">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <Card className="border-[#EACC91]">
                <CardHeader>
                  <CardTitle className="flex items-center text-[#523805]">
                    <Activity className="mr-2 h-5 w-5 text-[#987A3F]" />
                    平台活动概览
                  </CardTitle>
                  <CardDescription>最近的平台活动和统计数据</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-8">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-[#523805]">用户参与度</h4>
                        <span className="text-xs text-[#987A3F]">过去30天</span>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[#987A3F]">空投参与用户</span>
                          <span className="text-xs font-medium text-[#523805]">{dashboardStats.totalUsers}</span>
                        </div>
                        <Progress value={75} className="h-1" />

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[#987A3F]">农场质押用户</span>
                          <span className="text-xs font-medium text-[#523805]">
                            {Math.floor(dashboardStats.totalUsers * 0.6)}
                          </span>
                        </div>
                        <Progress value={45} className="h-1" />

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[#987A3F]">IDO参与用户</span>
                          <span className="text-xs font-medium text-[#523805]">
                            {Math.floor(dashboardStats.totalUsers * 0.3)}
                          </span>
                        </div>
                        <Progress value={30} className="h-1" />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-[#523805]">交易活动</h4>
                        <span className="text-xs text-[#987A3F]">过去7天</span>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-[#F9F5EA] rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-[#987A3F]">总交易量</span>
                            <TrendingUp className="h-3 w-3 text-green-500" />
                          </div>
                          <div className="text-lg font-bold text-[#523805]">{dashboardStats.totalTransactions}</div>
                        </div>
                        <div className="bg-[#F9F5EA] rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-[#987A3F]">平均交易额</span>
                            <TrendingUp className="h-3 w-3 text-green-500" />
                          </div>
                          <div className="text-lg font-bold text-[#523805]">$1,245</div>
                        </div>
                        <div className="bg-[#F9F5EA] rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-[#987A3F]">活跃钱包</span>
                            <TrendingUp className="h-3 w-3 text-green-500" />
                          </div>
                          <div className="text-lg font-bold text-[#523805]">{dashboardStats.totalUsers}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="border-[#EACC91] mb-6">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-[#523805]">
                    <Clock className="mr-2 h-5 w-5 text-[#987A3F]" />
                    即将到期的活动
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {airdrops.slice(0, 3).map((airdrop, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between border-b border-[#EACC91]/30 pb-3 last:border-0 last:pb-0"
                      >
                        <div>
                          <h4 className="text-sm font-medium text-[#523805]">
                            {airdrop.tokenSymbol} 空投 #{airdrop.id}
                          </h4>
                          <p className="text-xs text-[#987A3F]">
                            结束于: {new Date(airdrop.endTime * 1000).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge
                          variant={airdrop.active ? "default" : "outline"}
                          className={airdrop.active ? "bg-[#987A3F] text-white" : "border-[#987A3F] text-[#987A3F]"}
                        >
                          {airdrop.active ? "活跃" : "未激活"}
                        </Badge>
                      </div>
                    ))}

                    {airdrops.length === 0 && (
                      <div className="text-center py-4">
                        <p className="text-[#987A3F]">暂无空投活动</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-[#EACC91]">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center text-[#523805]">
                    <Shield className="mr-2 h-5 w-5 text-[#987A3F]" />
                    安全状态
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                        <span className="text-sm text-[#523805]">合约安全</span>
                      </div>
                      <Badge variant="outline" className="border-green-500 text-green-500">
                        正常
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                        <span className="text-sm text-[#523805]">管理员权限</span>
                      </div>
                      <Badge variant="outline" className="border-green-500 text-green-500">
                        安全
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
                        <span className="text-sm text-[#523805]">资金安全</span>
                      </div>
                      <Badge variant="outline" className="border-green-500 text-green-500">
                        正常
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-[#EACC91]">
              <CardHeader>
                <CardTitle className="flex items-center text-[#523805]">
                  <Zap className="mr-2 h-5 w-5 text-[#987A3F]" />
                  快速操作
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Button
                    className="bg-[#987A3F] hover:bg-[#523805] text-white h-auto py-4 flex flex-col items-center justify-center"
                    onClick={() => setActiveTab("tokens")}
                  >
                    <Coins className="h-6 w-6 mb-2" />
                    <span>添加代币</span>
                  </Button>
                  <Button
                    className="bg-[#987A3F] hover:bg-[#523805] text-white h-auto py-4 flex flex-col items-center justify-center"
                    onClick={() => setActiveTab("airdrops")}
                  >
                    <Gift className="h-6 w-6 mb-2" />
                    <span>创建空投</span>
                  </Button>
                  <Button
                    className="bg-[#987A3F] hover:bg-[#523805] text-white h-auto py-4 flex flex-col items-center justify-center"
                    onClick={() => setActiveTab("farms")}
                  >
                    <Tractor className="h-6 w-6 mb-2" />
                    <span>添加农场</span>
                  </Button>
                  <Button
                    className="bg-[#987A3F] hover:bg-[#523805] text-white h-auto py-4 flex flex-col items-center justify-center"
                    onClick={() => setActiveTab("ido")}
                  >
                    <Rocket className="h-6 w-6 mb-2" />
                    <span>创建IDO</span>
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#EACC91]">
              <CardHeader>
                <CardTitle className="flex items-center text-[#523805]">
                  <Award className="mr-2 h-5 w-5 text-[#987A3F]" />
                  平台统计
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <BarChart className="h-5 w-5 text-[#987A3F] mr-2" />
                      <span className="text-sm text-[#523805]">总锁仓价值 (TVL)</span>
                    </div>
                    <span className="font-medium text-[#523805]">$1,234,567</span>
                  </div>
                  <Separator className="bg-[#EACC91]/50" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <PieChart className="h-5 w-5 text-[#987A3F] mr-2" />
                      <span className="text-sm text-[#523805]">总交易量</span>
                    </div>
                    <span className="font-medium text-[#523805]">$9,876,543</span>
                  </div>
                  <Separator className="bg-[#EACC91]/50" />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 text-[#987A3F] mr-2" />
                      <span className="text-sm text-[#523805]">平台手续费收入</span>
                    </div>
                    <span className="font-medium text-[#523805]">$123,456</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 概览标签 */}
        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-[#EACC91] bg-gradient-to-br from-[#F9F5EA] to-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-[#523805]">总空投数量</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#523805]">{airdrops.length}</div>
                <p className="text-xs text-[#987A3F] mt-1">所有创建的空投活动</p>
              </CardContent>
            </Card>

            <Card className="border-[#EACC91] bg-gradient-to-br from-[#F9F5EA] to-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-[#523805]">活跃空投</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#523805]">{airdrops.filter((a) => a.active).length}</div>
                <p className="text-xs text-[#987A3F] mt-1">当前正在进行的空投</p>
              </CardContent>
            </Card>

            <Card className="border-[#EACC91] bg-gradient-to-br from-[#F9F5EA] to-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-[#523805]">已分发代币</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#523805]">
                  {airdrops
                    .reduce((total, airdrop) => {
                      return total + airdrop.claimedUsers.length * Number.parseFloat(airdrop.amount)
                    }, 0)
                    .toLocaleString()}
                </div>
                <p className="text-xs text-[#987A3F] mt-1">已被用户领取的代币总量</p>
              </CardContent>
            </Card>

            <Card className="border-[#EACC91] bg-gradient-to-br from-[#F9F5EA] to-white">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-[#523805]">参与用户</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-[#523805]">
                  {new Set(airdrops.flatMap((a) => a.eligibleUsers)).size}
                </div>
                <p className="text-xs text-[#987A3F] mt-1">有资格参与空投的用户数量</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border-[#EACC91]">
              <CardHeader>
                <CardTitle className="flex items-center text-[#523805]">
                  <Gift className="mr-2 h-5 w-5 text-[#987A3F]" />
                  最近空投
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {airdrops.slice(0, 3).map((airdrop) => (
                    <div
                      key={airdrop.id}
                      className="flex items-center justify-between border-b border-[#EACC91]/30 pb-4"
                    >
                      <div>
                        <h3 className="font-medium flex items-center text-[#523805]">
                          <Coins className="mr-2 h-4 w-4 text-[#987A3F]" />
                          {airdrop.tokenSymbol} 空投 #{airdrop.id}
                        </h3>
                        <p className="text-sm text-[#987A3F] flex items-center mt-1">
                          <Calendar className="mr-1 h-3 w-3" />
                          {new Date(airdrop.startTime * 1000).toLocaleDateString()} -
                          {new Date(airdrop.endTime * 1000).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge
                        variant={airdrop.active ? "default" : "outline"}
                        className={
                          airdrop.active
                            ? "bg-[#987A3F] hover:bg-[#523805] text-white"
                            : "border-[#987A3F] text-[#987A3F]"
                        }
                      >
                        {airdrop.active ? "活跃" : "未激活"}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-[#EACC91]">
              <CardHeader>
                <CardTitle className="flex items-center text-[#523805]">
                  <Coins className="mr-2 h-5 w-5 text-[#987A3F]" />
                  代币余额
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isTokensLoading
                    ? // Loading skeleton for token balances
                      Array(3)
                        .fill(0)
                        .map((_, index) => (
                          <div
                            key={`balance-skeleton-${index}`}
                            className="flex items-center justify-between border-b border-[#EACC91]/30 pb-4"
                          >
                            <div className="flex items-center">
                              <div className="w-8 h-8 rounded-full bg-[#EACC91]/50 animate-pulse mr-3"></div>
                              <div>
                                <div className="w-24 h-5 bg-[#EACC91]/50 animate-pulse rounded-md mb-1"></div>
                                <div className="w-16 h-4 bg-[#EACC91]/50 animate-pulse rounded-md"></div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="w-16 h-5 bg-[#EACC91]/50 animate-pulse rounded-md mb-1 ml-auto"></div>
                              <div className="w-12 h-4 bg-[#EACC91]/50 animate-pulse rounded-md ml-auto"></div>
                            </div>
                          </div>
                        ))
                    : tokenList.slice(0, 5).map((token) => (
                        // Existing token balance display
                        <div
                          key={token.address}
                          className="flex items-center justify-between border-b border-[#EACC91]/30 pb-4"
                        >
                          <div className="flex items-center">
                            <div className="w-8 h-8 rounded-full bg-[#EACC91]/50 flex items-center justify-center mr-3">
                              <span className="text-xs font-bold text-[#523805]">{token.symbol.substring(0, 2)}</span>
                            </div>
                            <div>
                              <h3 className="font-medium text-[#523805]">{token.name}</h3>
                              <p className="text-sm text-[#987A3F]">{token.symbol}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-[#523805]">
                              {selectedTokenForManagement === token.address ? balance : "?"}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs text-[#987A3F] hover:text-[#523805] hover:bg-[#EACC91]/20"
                              onClick={() => setSelectedTokenForManagement(token.address)}
                            >
                              <RefreshCw className="h-3 w-3 mr-1" />
                              刷新
                            </Button>
                          </div>
                        </div>
                      ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 代币管理标签 */}
        <TabsContent value="tokens">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Card className="border-[#EACC91] h-full">
                <CardHeader className="bg-gradient-to-r from-[#F9F5EA] to-transparent">
                  <CardTitle className="flex items-center text-[#523805]">
                    <Coins className="mr-2 h-5 w-5 text-[#987A3F]" />
                    代币列表
                  </CardTitle>
                  <CardDescription>管理您的ERC20代币</CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-[#987A3F]" />
                      <Input placeholder="搜索代币..." className="pl-8 border-[#EACC91] focus-visible:ring-[#987A3F]" />
                    </div>

                    <div className="mt-4 space-y-2 max-h-[400px] overflow-y-auto pr-2">
                      {isTokensLoading ? (
                        // Loading skeleton UI
                        Array(5)
                          .fill(0)
                          .map((_, index) => (
                            <div
                              key={`skeleton-${index}`}
                              className="w-full h-12 bg-[#F9F5EA] animate-pulse rounded-md mb-2"
                            />
                          ))
                      ) : tokenList.length === 0 ? (
                        <div className="text-center py-4">
                          <p className="text-[#987A3F]">暂无代币</p>
                          <p className="text-xs text-[#987A3F] mt-1">请添加自定义代币</p>
                        </div>
                      ) : (
                        tokenList.map((token) => (
                          <Button
                            key={token.address}
                            variant="outline"
                            className={`w-full justify-start border-[#EACC91] hover:bg-[#F9F5EA] ${
                              selectedTokenForManagement === token.address ? "bg-[#EACC91]/30 border-[#987A3F]" : ""
                            }`}
                            onClick={() => setSelectedTokenForManagement(token.address)}
                          >
                            <div className="w-6 h-6 rounded-full bg-[#EACC91]/50 flex items-center justify-center mr-2">
                              <span className="text-xs font-bold text-[#523805]">{token.symbol.substring(0, 2)}</span>
                            </div>
                            <div className="text-left flex-grow">
                              <div className="font-medium text-sm text-[#523805]">{token.symbol}</div>
                              <div className="text-xs text-[#987A3F]">{token.name}</div>
                            </div>
                            {token.owner === walletState.address && (
                              <Badge className="ml-2 bg-[#987A3F] text-white text-xs px-1.5 py-0">所有者</Badge>
                            )}
                          </Button>
                        ))
                      )}
                    </div>

                    <Separator className="my-4 bg-[#EACC91]" />

                    <div className="space-y-2">
                      <Label htmlFor="customTokenAddress" className="text-[#523805]">
                        添加自定义代币
                      </Label>
                      <div className="flex space-x-2">
                        <Input
                          id="customTokenAddress"
                          placeholder="代币合约地址"
                          value={customTokenAddress}
                          onChange={(e) => setCustomTokenAddress(e.target.value)}
                          className="border-[#EACC91] focus-visible:ring-[#987A3F]"
                        />
                        <Button
                          onClick={handleAddCustomToken}
                          disabled={isTokenLoading}
                          className="bg-[#987A3F] hover:bg-[#523805] text-white"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2">
              {isTokensLoading ? (
                <Card className="border-[#EACC91]">
                  <CardHeader>
                    <div className="w-48 h-7 bg-[#F9F5EA] animate-pulse rounded-md mb-2"></div>
                    <div className="w-64 h-5 bg-[#F9F5EA] animate-pulse rounded-md"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 mb-6">
                      <div className="bg-[#F9F5EA] rounded-lg p-4">
                        <div className="w-20 h-5 bg-[#EACC91]/50 animate-pulse rounded-md mb-2"></div>
                        <div className="w-32 h-8 bg-[#EACC91]/50 animate-pulse rounded-md"></div>
                      </div>
                      <div className="bg-[#F9F5EA] rounded-lg p-4">
                        <div className="w-20 h-5 bg-[#EACC91]/50 animate-pulse rounded-md mb-2"></div>
                        <div className="w-32 h-8 bg-[#EACC91]/50 animate-pulse rounded-md"></div>
                      </div>
                    </div>
                    <div className="w-full h-40 bg-[#F9F5EA] animate-pulse rounded-lg"></div>
                  </CardContent>
                </Card>
              ) : tokenInfo ? (
                <div className="space-y-6">
                  <Card className="border-[#EACC91]">
                    <CardHeader className="bg-gradient-to-r from-[#F9F5EA] to-transparent">
                      <div className="flex justify-between items-center">
                        <CardTitle className="flex items-center text-[#523805]">
                          <Coins className="mr-2 h-5 w-5 text-[#987A3F]" />
                          {tokenInfo.name} ({tokenInfo.symbol})
                        </CardTitle>
                        <Badge variant="outline" className="font-mono text-xs border-[#EACC91] text-[#523805]">
                          {selectedTokenForManagement.substring(0, 6)}...{selectedTokenForManagement.substring(38)}
                        </Badge>
                      </div>
                      <CardDescription className="flex items-center">
                        <Button
                          variant="link"
                          className="p-0 h-auto text-[#987A3F]"
                          onClick={() =>
                            window.open(`https://etherscan.io/token/${selectedTokenForManagement}`, "_blank")
                          }
                        >
                          在区块浏览器中查看 <ExternalLink className="ml-1 h-3 w-3" />
                        </Button>
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-[#F9F5EA] rounded-lg p-4">
                          <div className="text-sm text-[#987A3F]">余额</div>
                          <div className="text-2xl font-bold text-[#523805]">{balance}</div>
                          <div className="text-xs text-[#987A3F]">{tokenInfo.symbol}</div>
                        </div>
                        <div className="bg-[#F9F5EA] rounded-lg p-4">
                          <div className="text-sm text-[#987A3F]">精度</div>
                          <div className="text-2xl font-bold text-[#523805]">{tokenInfo.decimals}</div>
                          <div className="text-xs text-[#987A3F]">小数位</div>
                        </div>
                      </div>

                      <div className="bg-[#F9F5EA] rounded-lg p-4 mb-6">
                        <div className="flex justify-between items-center">
                          <div className="text-sm text-[#987A3F]">合约所有者</div>
                          {owner === walletState.address && (
                            <Badge className="bg-[#987A3F] text-white">您是所有者</Badge>
                          )}
                        </div>
                        <div className="flex items-center mt-1">
                          <div className="font-mono text-sm text-[#523805] truncate">{owner || "未知"}</div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 ml-1 text-[#987A3F] hover:text-[#523805] hover:bg-[#EACC91]/20"
                            onClick={() => owner && copyToClipboard(owner)}
                            disabled={!owner}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <div className="text-xs text-[#987A3F] mt-1">
                          {owner === walletState.address
                            ? "您可以执行铸造、销毁和暂停等所有者操作"
                            : "只有所有者可以执行特权操作"}
                        </div>
                      </div>

                      <Tabs defaultValue="transfer" className="w-full">
                        <TabsList className="w-full bg-[#F9F5EA] p-1 rounded-xl">
                          <TabsTrigger
                            value="transfer"
                            className="flex-1 data-[state=active]:bg-white data-[state=active]:text-[#523805] data-[state=active]:shadow-sm text-[#523805]/70"
                          >
                            <ArrowUpRight className="mr-2 h-4 w-4" />
                            转账
                          </TabsTrigger>
                          <TabsTrigger
                            value="approve"
                            className="flex-1 data-[state=active]:bg-white data-[state=active]:text-[#523805] data-[state=active]:shadow-sm text-[#523805]/70"
                          >
                            <Check className="mr-2 h-4 w-4" />
                            授权
                          </TabsTrigger>
                          <TabsTrigger
                            value="query"
                            className="flex-1 data-[state=active]:bg-white data-[state=active]:text-[#523805] data-[state=active]:shadow-sm text-[#523805]/70"
                          >
                            <Search className="mr-2 h-4 w-4" />
                            查询
                          </TabsTrigger>
                          <TabsTrigger
                            value="mint"
                            className="flex-1 data-[state=active]:bg-white data-[state=active]:text-[#523805] data-[state=active]:shadow-sm text-[#523805]/70"
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            铸造
                          </TabsTrigger>
                          <TabsTrigger
                            value="burn"
                            className="flex-1 data-[state=active]:bg-white data-[state=active]:text-[#523805] data-[state=active]:shadow-sm text-[#523805]/70"
                          >
                            <Flame className="mr-2 h-4 w-4" />
                            销毁
                          </TabsTrigger>
                        </TabsList>

                        {/* 转账表单 */}
                        <TabsContent value="transfer" className="mt-4 space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="recipientAddress" className="text-[#523805]">
                              收款地址
                            </Label>
                            <Input
                              id="recipientAddress"
                              placeholder="输入收款地址"
                              value={recipientAddress}
                              onChange={(e) => setRecipientAddress(e.target.value)}
                              className="border-[#EACC91] focus-visible:ring-[#987A3F]"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="transferAmount" className="text-[#523805]">
                              转账数量
                            </Label>
                            <Input
                              id="transferAmount"
                              type="number"
                              placeholder="输入转账数量"
                              value={transferAmount}
                              onChange={(e) => setTransferAmount(e.target.value)}
                              className="border-[#EACC91] focus-visible:ring-[#987A3F]"
                            />
                          </div>
                          <Button
                            onClick={handleTransferToken}
                            disabled={isTokenLoading}
                            className="w-full bg-[#987A3F] hover:bg-[#523805] text-white"
                          >
                            转账
                          </Button>
                        </TabsContent>

                        {/* 授权表单 */}
                        <TabsContent value="approve" className="mt-4 space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="spenderAddress" className="text-[#523805]">
                              授权地址
                            </Label>
                            <Input
                              id="spenderAddress"
                              placeholder="输入被授权地址"
                              value={spenderAddress}
                              onChange={(e) => setSpenderAddress(e.target.value)}
                              className="border-[#EACC91] focus-visible:ring-[#987A3F]"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="approveAmount" className="text-[#523805]">
                              授权数量
                            </Label>
                            <Input
                              id="approveAmount"
                              type="number"
                              placeholder="输入授权数量"
                              value={approveAmount}
                              onChange={(e) => setApproveAmount(e.target.value)}
                              className="border-[#EACC91] focus-visible:ring-[#987A3F]"
                            />
                          </div>
                          <Button
                            onClick={handleApproveToken}
                            disabled={isTokenLoading || isLoading}
                            className="w-full bg-[#987A3F] hover:bg-[#523805] text-white"
                          >
                            授权
                          </Button>
                        </TabsContent>

                        {/* 查询表单 - 已在下方卡片中实现 */}
                        <TabsContent value="query" className="mt-4">
                          <div className="p-4 bg-[#F9F5EA] rounded-lg">
                            <p className="text-[#523805]">查询功能已在下方卡片中提供，请向下滚动使用查询功能。</p>
                          </div>
                        </TabsContent>

                        {/* 铸造表单 */}
                        <TabsContent value="mint" className="mt-4 space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="mintToAddress" className="text-[#523805]">
                              接收地址
                            </Label>
                            <Input
                              id="mintToAddress"
                              placeholder="输入接收铸造代币的地址"
                              value={mintToAddress}
                              onChange={(e) => setMintToAddress(e.target.value)}
                              className="border-[#EACC91] focus-visible:ring-[#987A3F]"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="mintAmount" className="text-[#523805]">
                              铸造数量
                            </Label>
                            <Input
                              id="mintAmount"
                              type="number"
                              placeholder="输入铸造数量"
                              value={mintAmount}
                              onChange={(e) => setMintAmount(e.target.value)}
                              className="border-[#EACC91] focus-visible:ring-[#987A3F]"
                            />
                          </div>
                          <Button
                            onClick={handleMintToken}
                            disabled={isTokenLoading}
                            className="w-full bg-[#987A3F] hover:bg-[#523805] text-white"
                          >
                            铸造
                          </Button>
                          {owner !== walletState.address && (
                            <Alert variant="destructive">
                              <AlertCircle className="h-4 w-4" />
                              <AlertTitle>权限提示</AlertTitle>
                              <AlertDescription>
                                您不是代币所有者，铸造操作可能会失败。只有代币所有者才能执行铸造操作。
                              </AlertDescription>
                            </Alert>
                          )}
                        </TabsContent>

                        {/* 销毁表单 */}
                        <TabsContent value="burn" className="mt-4 space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="burnAmount" className="text-[#523805]">
                              销毁数量
                            </Label>
                            <Input
                              id="burnAmount"
                              type="number"
                              placeholder="输入销毁数量"
                              value={burnAmount}
                              onChange={(e) => setBurnAmount(e.target.value)}
                              className="border-[#EACC91] focus-visible:ring-[#987A3F]"
                            />
                          </div>
                          <Button
                            onClick={handleBurnToken}
                            disabled={isTokenLoading}
                            className="w-full bg-[#987A3F] hover:bg-[#523805] text-white"
                          >
                            销毁
                          </Button>
                          <div className="mt-2">
                            <Alert variant="outline" className="border-[#EACC91]">
                              <AlertCircle className="h-4 w-4 text-[#987A3F]" />
                              <AlertTitle className="text-[#523805]">警告</AlertTitle>
                              <AlertDescription className="text-[#987A3F]">
                                销毁操作不可逆，请确认销毁数量后再操作。
                              </AlertDescription>
                            </Alert>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </CardContent>
                  </Card>

                  <Card className="border-[#EACC91]">
                    <CardHeader className="bg-gradient-to-r from-[#F9F5EA] to-transparent">
                      <CardTitle className="flex items-center text-[#523805]">
                        <Search className="mr-2 h-5 w-5 text-[#987A3F]" />
                        查询功能
                      </CardTitle>
                      <CardDescription>查询代币余额和授权额度</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* 查询余额 */}
                      <div>
                        <h4 className="text-sm font-medium text-[#523805] mb-2">查询余额</h4>
                        <div className="flex space-x-2">
                          <Input
                            placeholder="地址"
                            value={queryBalanceAddress}
                            onChange={(e) => setQueryBalanceAddress(e.target.value)}
                            className="border-[#EACC91] focus-visible:ring-[#987A3F]"
                          />
                          <Button
                            onClick={handleQueryBalance}
                            disabled={isTokenLoading}
                            className="bg-[#987A3F] hover:bg-[#523805] text-white"
                          >
                            查询
                          </Button>
                        </div>
                        {queryBalanceResult && (
                          <div className="mt-2">
                            <span className="text-sm text-[#987A3F]">余额:</span>
                            <span className="font-medium text-[#523805]">{queryBalanceResult}</span>
                            <span className="text-xs text-[#987A3F]"> {tokenInfo.symbol}</span>
                          </div>
                        )}
                      </div>

                      {/* 查询授权额度 */}
                      <div>
                        <h4 className="text-sm font-medium text-[#523805] mb-2">查询授权额度</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          <Input
                            placeholder="所有者地址"
                            value={queryAllowanceOwner}
                            onChange={(e) => setQueryAllowanceOwner(e.target.value)}
                            className="border-[#EACC91] focus-visible:ring-[#987A3F]"
                          />
                          <Input
                            placeholder="授权者地址"
                            value={queryAllowanceSpender}
                            onChange={(e) => setQueryAllowanceSpender(e.target.value)}
                            className="border-[#EACC91] focus-visible:ring-[#987A3F]"
                          />
                        </div>
                        <Button
                          onClick={handleQueryAllowance}
                          disabled={isTokenLoading}
                          className="mt-2 bg-[#987A3F] hover:bg-[#523805] text-white"
                        >
                          查询
                        </Button>
                        {queryAllowanceResult && (
                          <div className="mt-2">
                            <span className="text-sm text-[#987A3F]">授权额度:</span>
                            <span className="font-medium text-[#523805]">{queryAllowanceResult}</span>
                            <span className="text-xs text-[#987A3F]"> {tokenInfo.symbol}</span>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card className="border-[#EACC91]">
                  <CardHeader>
                    <CardTitle className="text-[#523805]">请选择一个代币</CardTitle>
                    <CardDescription>从左侧列表中选择一个代币以进行管理</CardDescription>
                  </CardHeader>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* 空投管理标签 */}
        <TabsContent value="airdrops">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-[#523805]">空投管理</h2>
            <div className="flex gap-2">
              <Button
                className="bg-[#987A3F] hover:bg-[#523805] text-white"
                onClick={() => setActiveTab("create-airdrop")}
              >
                <Gift className="mr-2 h-4 w-4" />
                创建空投
              </Button>
              <Button variant="outline" className="border-[#987A3F] text-[#987A3F] hover:bg-[#F9F5EA]">
                <Settings className="mr-2 h-4 w-4" />
                高级空投创建
              </Button>
            </div>
          </div>

          {isAirdropLoading && !isAirdropInitialized ? (
            <Card className="border-[#EACC91] p-8">
              <div className="flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#987A3F] mb-4"></div>
                <p className="text-[#523805]">正在加载空投数据...</p>
              </div>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 创建空投 */}
                <Card className="border-[#EACC91]">
                  <CardHeader className="bg-gradient-to-r from-[#F9F5EA] to-transparent">
                    <CardTitle className="flex items-center text-[#523805]">
                      <Gift className="mr-2 h-5 w-5 text-[#987A3F]" />
                      快速创建空投
                    </CardTitle>
                    <CardDescription>创建新的代币空投活动</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="token-select">选择代币</Label>
                        <select
                          id="token-select"
                          value={selectedToken}
                          onChange={(e) => setSelectedToken(e.target.value)}
                          className="w-full p-2 border border-[#EACC91] rounded-md focus:outline-none focus:ring-2 focus:ring-[#987A3F]"
                        >
                          <option value="">选择代币</option>
                          {tokenList.map((token) => (
                            <option key={token.address} value={token.address}>
                              {token.name} ({token.symbol})
                            </option>
                          ))}
                        </select>
                      </div>
                      <Input
                        type="number"
                        placeholder="空投数量"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        className="border-[#EACC91] focus-visible:ring-[#987A3F]"
                      />
                      <Input
                        type="datetime-local"
                        placeholder="开始时间"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="border-[#EACC91] focus-visible:ring-[#987A3F]"
                      />
                      <Input
                        type="datetime-local"
                        placeholder="结束时间"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="border-[#EACC91] focus-visible:ring-[#987A3F]"
                      />
                      <Button
                        onClick={handleCreateAirdrop}
                        disabled={isAirdropLoading}
                        className="bg-[#987A3F] hover:bg-[#523805] text-white"
                      >
                        创建空投
                      </Button>
                    </div>
                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>创建失败</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>

                {/* 设置资格 */}
                <Card className="border-[#EACC91]">
                  <CardHeader className="bg-gradient-to-r from-[#F9F5EA] to-transparent">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="flex items-center text-[#523805]">
                          <Users className="mr-2 h-5 w-5 text-[#987A3F]" />
                          设置用户资格和金额
                        </CardTitle>
                        <CardDescription>设置有资格参与空投的地址及其可领取的代币数量</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="airdrop-select">选择空投</Label>
                      <select
                        id="airdrop-select"
                        value={selectedAirdropId?.toString() || ""}
                        onChange={(e) => setSelectedAirdropId(Number(e.target.value))}
                        className="w-full p-2 border border-[#EACC91] rounded-md focus:outline-none focus:ring-2 focus:ring-[#987A3F]"
                      >
                        <option value="">选择空投</option>
                        {airdrops.map((airdrop) => (
                          <option key={airdrop.id} value={String(airdrop.id)}>
                            空投 #{airdrop.id}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-[#523805]">输入格式</Label>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant={eligibilityFormat === "simple" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setEligibilityFormat("simple")}
                          className={
                            eligibilityFormat === "simple"
                              ? "bg-[#987A3F] hover:bg-[#523805] text-white"
                              : "border-[#EACC91] text-[#987A3F]"
                          }
                        >
                          简单模式
                        </Button>
                        <Button
                          variant={eligibilityFormat === "advanced" ? "default" : "outline"}
                          size="sm"
                          onClick={() => setEligibilityFormat("advanced")}
                          className={
                            eligibilityFormat === "advanced"
                              ? "bg-[#987A3F] hover:bg-[#523805] text-white"
                              : "border-[#EACC91] text-[#987A3F]"
                          }
                        >
                          高级模式
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="eligibilityInput" className="text-[#523805]">
                          {eligibilityFormat === "simple" ? "用户地址列表" : "用户地址和金额列表"}
                        </Label>
                        <span className="text-xs text-[#987A3F]">
                          {eligibilityFormat === "simple" ? "每行一个地址" : "格式: 地址,数量"}
                        </span>
                      </div>
                      <Textarea
                        id="eligibilityInput"
                        placeholder={eligibilityFormat === "simple" ? "0x123...\n0x456..." : "0x123...,10\n0x456...,5"}
                        value={eligibilityInput}
                        onChange={(e) => setEligibilityInput(e.target.value)}
                        className="border-[#EACC91] focus-visible:ring-[#987A3F] min-h-[150px]"
                      />
                    </div>

                    {eligibilityFormat === "simple" && (
                      <div className="p-3 bg-[#F9F5EA] rounded-lg">
                        <div className="flex items-start gap-2">
                          <Info className="h-4 w-4 text-[#987A3F] mt-0.5" />
                          <p className="text-sm text-[#523805]">
                            在简单模式下，每个地址将默认分配 1 个代币。如需为不同地址分配不同数量，请切换到高级模式。
                          </p>
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={handleSetEligibility}
                      disabled={isAirdropLoading}
                      className="bg-[#987A3F] hover:bg-[#523805] text-white"
                    >
                      设置资格
                    </Button>
                    {error && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertTitle>设置失败</AlertTitle>
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* 空投列表 */}
              <Card className="border-[#EACC91] mt-6">
                <CardHeader className="bg-gradient-to-r from-[#F9F5EA] to-transparent">
                  <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center text-[#523805]">
                      <Gift className="mr-2 h-5 w-5 text-[#987A3F]" />
                      空投列表
                    </CardTitle>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={refreshAirdrops}
                      className="border-[#EACC91] text-[#987A3F] hover:bg-[#F9F5EA]"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      刷新列表
                    </Button>
                  </div>
                  <CardDescription>查看和管理现有的空投活动</CardDescription>
                </CardHeader>
                <CardContent>
                  {airdrops.length === 0 ? (
                    <div className="text-center py-8">
                      <Gift className="mx-auto h-12 w-12 text-[#EACC91]" />
                      <h3 className="mt-4 text-lg font-medium text-[#523805]">暂无空投</h3>
                      <p className="mt-2 text-sm text-[#987A3F]">您还没有创建任何空投活动</p>
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[80px]">ID</TableHead>
                          <TableHead>代币</TableHead>
                          <TableHead>数量</TableHead>
                          <TableHead>开始时间</TableHead>
                          <TableHead>结束时间</TableHead>
                          <TableHead>状态</TableHead>
                          <TableHead className="text-right">操作</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {airdrops.map((airdrop) => (
                          <TableRow key={airdrop.id}>
                            <TableCell className="font-medium">{airdrop.id}</TableCell>
                            <TableCell>{airdrop.tokenSymbol}</TableCell>
                            <TableCell>{airdrop.amount}</TableCell>
                            <TableCell>{new Date(airdrop.startTime * 1000).toLocaleDateString()}</TableCell>
                            <TableCell>{new Date(airdrop.endTime * 1000).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Badge variant={airdrop.active ? "default" : "outline"}>
                                {airdrop.active ? "活跃" : "未激活"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleToggleAirdropStatus(airdrop.id, airdrop.active)}
                              >
                                {airdrop.active ? (
                                  <>
                                    <Pause className="mr-2 h-4 w-4" />
                                    停用
                                  </>
                                ) : (
                                  <>
                                    <Play className="mr-2 h-4 w-4" />
                                    激活
                                  </>
                                )}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* 农场管理标签 */}
        <TabsContent value="farms">
          <div className="flex justify-between items-center mb-4">
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
              <Dialog open={isAddFarmDialogOpen} onOpenChange={setIsAddFarmDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-[#987A3F] hover:bg-[#523805] text-white">
                    <Plus className="mr-2 h-4 w-4" />
                    添加农场
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md rounded-2xl border border-[#EACC91]">
                  <DialogHeader>
                    <DialogTitle className="text-[#523805]">添加新农场</DialogTitle>
                    <DialogDescription>创建一个新的流动性挖矿农场池。</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="stakingToken" className="text-[#523805]">
                        质押代币地址
                      </Label>
                      <Input
                        id="stakingToken"
                        placeholder="输入LP代币合约地址"
                        value={stakingToken}
                        onChange={(e) => setStakingToken(e.target.value)}
                        className="border-[#EACC91] focus-visible:ring-[#987A3F]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="allocPoint" className="text-[#523805]">
                        分配点数
                      </Label>
                      <Input
                        id="allocPoint"
                        type="number"
                        placeholder="输入分配点数"
                        value={allocPoint}
                        onChange={(e) => setAllocPoint(e.target.value)}
                        className="border-[#EACC91] focus-visible:ring-[#987A3F]"
                      />
                      <p className="text-xs text-[#987A3F]">分配点数决定了该农场获得的奖励比例。</p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsAddFarmDialogOpen(false)}
                      className="border-[#EACC91] text-[#523805]"
                    >
                      取消
                    </Button>
                    <Button onClick={handleAddFarm} className="bg-[#987A3F] hover:bg-[#523805] text-white">
                      添加
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
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
                                      src={farm.token0.logo || "/placeholder.svg"}
                                      alt={farm.token0.symbol}
                                      className="h-full w-full object-cover"
                                    />
                                  </div>
                                  <div className="absolute bottom-0 right-0 h-6 w-6 rounded-full overflow-hidden border border-white">
                                    <img
                                      src={farm.token1.logo || "/placeholder.svg"}
                                      alt={farm.token1.symbol}
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
                            <TableCell>{farm.totalStaked.toFixed(4)}</TableCell>
                            <TableCell>{farm.multiplier}x</TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="border-[#EACC91] text-[#987A3F] hover:bg-[#F9F5EA]"
                                      onClick={() => {
                                        setSelectedFarm(farm)
                                        setUpdateAllocPoint((Number(farm.multiplier) * 10).toString())
                                      }}
                                    >
                                      <Pencil className="h-4 w-4 mr-1" />
                                      编辑
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="sm:max-w-md rounded-2xl border border-[#EACC91]">
                                    <DialogHeader>
                                      <DialogTitle className="text-[#523805]">更新农场</DialogTitle>
                                      <DialogDescription>修改 {selectedFarm?.name} 农场的配置。</DialogDescription>
                                    </DialogHeader>
                                    <div className="space-y-4 py-4">
                                      <div className="space-y-2">
                                        <Label htmlFor="updateAllocPoint" className="text-[#523805]">
                                          分配点数
                                        </Label>
                                        <Input
                                          id="updateAllocPoint"
                                          type="number"
                                          placeholder="输入新的分配点数"
                                          value={updateAllocPoint}
                                          onChange={(e) => setUpdateAllocPoint(e.target.value)}
                                          className="border-[#EACC91] focus-visible:ring-[#987A3F]"
                                        />
                                        <p className="text-xs text-[#987A3F]">当前值: {selectedFarm?.multiplier}0 点</p>
                                      </div>
                                    </div>
                                    <DialogFooter>
                                      <Button
                                        variant="outline"
                                        onClick={() => setSelectedFarm(null)}
                                        className="border-[#EACC91] text-[#523805]"
                                      >
                                        取消
                                      </Button>
                                      <Button
                                        onClick={handleUpdateFarm}
                                        className="bg-[#987A3F] hover:bg-[#523805] text-white"
                                      >
                                        更新
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card className="border-[#EACC91]">
                <CardHeader className="bg-gradient-to-r from-[#F9F5EA] to-transparent">
                  <CardTitle className="flex items-center text-[#523805]">
                    <Coins className="mr-2 h-5 w-5 text-[#987A3F]" />
                    奖励设置
                  </CardTitle>
                  <CardDescription>管理全局奖励参数</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-[#F9F5EA] rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-[#987A3F]">每区块奖励</span>
                      <Badge className="bg-[#987A3F] text-white">全局设置</Badge>
                    </div>
                    <div className="text-2xl font-bold text-[#523805]">
                      {isFarmLoading ? (
                        <div className="animate-pulse h-8 w-24 bg-[#EACC91]/50 rounded"></div>
                      ) : farms.length > 0 ? (
                        `${Number(farms[0].apr / 100).toFixed(4)} CAKE`
                      ) : (
                        "0 CAKE"
                      )}
                    </div>
                    <div className="text-xs text-[#987A3F] mt-1">每个区块分配给所有农场的奖励代币数量</div>
                  </div>

                  <div className="flex flex-col space-y-2">
                    <Dialog open={isUpdateRewardDialogOpen} onOpenChange={setIsUpdateRewardDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="bg-[#987A3F] hover:bg-[#523805] text-white">
                          <Calculator className="mr-2 h-4 w-4" />
                          更新每区块奖励
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md rounded-2xl border border-[#EACC91]">
                        <DialogHeader>
                          <DialogTitle className="text-[#523805]">更新每区块奖励</DialogTitle>
                          <DialogDescription>设置每个区块分配的奖励代币数量</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="rewardPerBlock" className="text-[#523805]">
                              每区块奖励
                            </Label>
                            <Input
                              id="rewardPerBlock"
                              type="number"
                              placeholder="输入每区块奖励数量"
                              value={rewardPerBlock}
                              onChange={(e) => setRewardPerBlock(e.target.value)}
                              className="border-[#EACC91] focus-visible:ring-[#987A3F]"
                            />
                            <p className="text-xs text-[#987A3F]">
                              设置较高的奖励会提高 APR，但会更快地消耗奖励代币池。
                            </p>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setIsUpdateRewardDialogOpen(false)}
                            className="border-[#EACC91] text-[#523805]"
                          >
                            取消
                          </Button>
                          <Button onClick={handleUpdateReward} className="bg-[#987A3F] hover:bg-[#523805] text-white">
                            更新
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>

                    <Dialog open={isFundRewardsDialogOpen} onOpenChange={setIsFundRewardsDialogOpen}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="border-[#EACC91] text-[#987A3F] hover:bg-[#F9F5EA]">
                          <Coins className="mr-2 h-4 w-4" />
                          添加奖励资金
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-md rounded-2xl border border-[#EACC91]">
                        <DialogHeader>
                          <DialogTitle className="text-[#523805]">添加奖励资金</DialogTitle>
                          <DialogDescription>向奖励池添加更多代币以延长挖矿期限</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="fundAmount" className="text-[#523805]">
                              奖励代币数量
                            </Label>
                            <Input
                              id="fundAmount"
                              type="number"
                              placeholder="输入添加的奖励代币数量"
                              value={fundAmount}
                              onChange={(e) => setFundAmount(e.target.value)}
                              className="border-[#EACC91] focus-visible:ring-[#987A3F]"
                            />
                            <p className="text-xs text-[#987A3F]">
                              添加的代币将用于农场奖励，需要先授权合约使用您的代币。
                            </p>
                          </div>
                        </div>
                        <DialogFooter>
                          <Button
                            variant="outline"
                            onClick={() => setIsFundRewardsDialogOpen(false)}
                            className="border-[#EACC91] text-[#523805]"
                          >
                            取消
                          </Button>
                          <Button onClick={handleFundRewards} className="bg-[#987A3F] hover:bg-[#523805] text-white">
                            添加资金
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <Alert className="bg-[#F9F5EA] border-[#EACC91]">
                    <Info className="h-4 w-4 text-[#987A3F]" />
                    <AlertTitle className="text-[#523805]">奖励池信息</AlertTitle>
                    <AlertDescription className="text-[#987A3F]">
                      确保您的合约中有足够的奖励代币。更新每区块奖励会影响所有农场的 APR。
                    </AlertDescription>
                  </Alert>

                  <Separator className="my-2 bg-[#EACC91]" />

                  <div className="space-y-2">
                    <h3 className="font-medium text-[#523805]">分配点数说明</h3>
                    <p className="text-sm text-[#987A3F]">
                      分配点数决定了每个农场池获得的奖励比例。例如，如果有两个农场，分配点数分别为 100 和
                      300，那么第一个农场将获得 25% 的奖励，第二个农场将获得 75% 的奖励。
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* IDO管理标签 */}
        <TabsContent value="ido">
          <Card className="border-[#EACC91]">
            <CardHeader>
              <CardTitle className="text-[#523805]">IDO管理</CardTitle>
              <CardDescription>设置和管理您的首次代币发行</CardDescription>
            </CardHeader>
            <CardContent>
              <p>此功能正在开发中...</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 设置标签 */}
        <TabsContent value="settings">
          <Card className="border-[#EACC91]">
            <CardHeader>
              <CardTitle className="text-[#523805]">设置</CardTitle>
              <CardDescription>配置您的管理员面板</CardDescription>
            </CardHeader>
            <CardContent>
              <p>此功能正在开发中...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
