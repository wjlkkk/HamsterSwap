"use client"

import { useState } from "react"
import { useWallet } from "@/contexts/wallet-context"
import { useAdmin } from "@/contexts/admin-context"
import { useFarmContract } from "@/hooks/use-farm-contract"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { AlertCircle, Tractor, Plus, Pencil, RefreshCw, Coins, Calculator, Info, Settings, Wallet } from "lucide-react"
import Navbar from "@/components/navbar"
import ClientOnly from "@/components/client-only"

export default function FarmManagementPage() {
  return (
    <ClientOnly>
      <div className="min-h-screen bg-gradient-to-b from-[#F9F5EA] via-[#EACC91]/20 to-[#F9F5EA]">
        <Navbar />
        <div className="pt-24 pb-16">
          <FarmManagement />
        </div>
      </div>
    </ClientOnly>
  )
}

function FarmManagement() {
  const { walletState } = useWallet()
  const { isAdmin } = useAdmin()
  const [activeTab, setActiveTab] = useState("farms")
  const [isAddFarmDialogOpen, setIsAddFarmDialogOpen] = useState(false)
  const [isUpdateRewardDialogOpen, setIsUpdateRewardDialogOpen] = useState(false)
  const [isFundRewardsDialogOpen, setIsFundRewardsDialogOpen] = useState(false)
  const [selectedFarm, setSelectedFarm] = useState<any>(null)

  // Form states
  const [stakingToken, setStakingToken] = useState("")
  const [allocPoint, setAllocPoint] = useState("")
  const [updateAllocPoint, setUpdateAllocPoint] = useState("")
  const [rewardPerBlock, setRewardPerBlock] = useState("")
  const [fundAmount, setFundAmount] = useState("")

  const { farms, isLoading, fetchFarms, addFarm, updateFarmAllocation, updateRewardPerBlock, fundRewards } =
    useFarmContract()

  // Handle admin actions
  const handleAddFarm = async () => {
    if (!stakingToken || !allocPoint) return

    const success = await addFarm(Number(allocPoint), stakingToken, true)
    if (success) {
      setStakingToken("")
      setAllocPoint("")
      setIsAddFarmDialogOpen(false)
    }
  }

  const handleUpdateFarm = async () => {
    if (!selectedFarm || !updateAllocPoint) return

    const success = await updateFarmAllocation(selectedFarm.id, Number(updateAllocPoint), true)
    if (success) {
      setUpdateAllocPoint("")
      setSelectedFarm(null)
    }
  }

  const handleUpdateReward = async () => {
    if (!rewardPerBlock) return

    const success = await updateRewardPerBlock(rewardPerBlock)
    if (success) {
      setRewardPerBlock("")
      setIsUpdateRewardDialogOpen(false)
    }
  }

  const handleFundRewards = async () => {
    if (!fundAmount) return

    const success = await fundRewards(fundAmount)
    if (success) {
      setFundAmount("")
      setIsFundRewardsDialogOpen(false)
    }
  }

  // If not admin, display unauthorized message
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

  // If wallet not connected, display connect message
  if (!walletState.connected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Wallet className="mr-2 h-5 w-5" />
              农场管理
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

  return (
    <div className="container mx-auto px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#523805]">农场管理</h1>
          <p className="text-[#987A3F]">管理您的流动性挖矿农场</p>
        </div>
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-2 w-full bg-[#F9F5EA] p-1 rounded-xl">
          <TabsTrigger
            value="farms"
            className="flex items-center data-[state=active]:bg-white data-[state=active]:text-[#523805] data-[state=active]:shadow-sm text-[#523805]/70"
          >
            <Tractor className="mr-2 h-4 w-4" />
            <span>农场列表</span>
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="flex items-center data-[state=active]:bg-white data-[state=active]:text-[#523805] data-[state=active]:shadow-sm text-[#523805]/70"
          >
            <Settings className="mr-2 h-4 w-4" />
            <span>全局设置</span>
          </TabsTrigger>
        </TabsList>

        {/* 农场列表标签 */}
        <TabsContent value="farms">
          <Card className="border-[#EACC91]">
            <CardHeader className="bg-gradient-to-r from-[#F9F5EA] to-transparent">
              <CardTitle className="flex items-center text-[#523805]">
                <Tractor className="mr-2 h-5 w-5 text-[#987A3F]" />
                农场列表
              </CardTitle>
              <CardDescription>管理所有农场池</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
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
        </TabsContent>

        {/* 全局设置标签 */}
        <TabsContent value="settings">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                    {isLoading ? (
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
                          <p className="text-xs text-[#987A3F]">设置较高的奖励会提高 APR，但会更快地消耗奖励代币池。</p>
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
              </CardContent>
            </Card>

            <Card className="border-[#EACC91]">
              <CardHeader className="bg-gradient-to-r from-[#F9F5EA] to-transparent">
                <CardTitle className="flex items-center text-[#523805]">
                  <Info className="mr-2 h-5 w-5 text-[#987A3F]" />
                  农场说明
                </CardTitle>
                <CardDescription>了解如何管理农场池</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h3 className="font-medium text-[#523805]">分配点数</h3>
                  <p className="text-sm text-[#987A3F]">
                    分配点数决定了每个农场池获得的奖励比例。例如，如果有两个农场，分配点数分别为 100 和
                    300，那么第一个农场将获得 25% 的奖励，第二个农场将获得 75% 的奖励。
                  </p>
                </div>

                <Separator className="my-2 bg-[#EACC91]" />

                <div className="space-y-2">
                  <h3 className="font-medium text-[#523805]">每区块奖励</h3>
                  <p className="text-sm text-[#987A3F]">
                    每区块奖励是指每个区块分配给所有农场的代币总量。如果设置为 1 CAKE，并且有多个农场，这 1 CAKE
                    将根据分配点数按比例分配给每个农场。
                  </p>
                </div>

                <Separator className="my-2 bg-[#EACC91]" />

                <div className="space-y-2">
                  <h3 className="font-medium text-[#523805]">添加新农场</h3>
                  <p className="text-sm text-[#987A3F]">
                    添加新农场时，需要提供 LP 代币合约地址和分配点数。LP 代币必须是符合 ERC20 标准的合约地址。
                  </p>
                </div>

                <Separator className="my-2 bg-[#EACC91]" />

                <div className="space-y-2">
                  <h3 className="font-medium text-[#523805]">添加奖励资金</h3>
                  <p className="text-sm text-[#987A3F]">
                    通过添加更多奖励代币到合约中，可以延长挖矿的持续时间。确保您拥有足够的代币，并且已经授权合约使用这些代币。
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
