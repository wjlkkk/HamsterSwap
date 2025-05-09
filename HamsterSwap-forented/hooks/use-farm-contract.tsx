"use client"

import { useState, useEffect, useCallback } from "react"
import { ethers } from "ethers"
import { useWallet } from "@/contexts/wallet-context"
import { FARM_ABI } from "@/contracts/farm-contract"
import { useToast } from "@/hooks/use-toast"
import { getContractAddress } from "@/utils/contract-addresses"

export function useFarmContract() {
  const { walletState } = useWallet()
  const { toast } = useToast()
  const [farms, setFarms] = useState<any[]>([])
  const [userStakes, setUserStakes] = useState<Record<number, string>>({})
  const [userRewards, setUserRewards] = useState<Record<number, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [farmContract, setFarmContract] = useState<ethers.Contract | null>(null)
  const [contractAddress, setContractAddress] = useState<string | null>(null)
  const [isAddressLoading, setIsAddressLoading] = useState(true)

  // Load contract address
  useEffect(() => {
    const loadContractAddress = async () => {
      try {
        console.log("Loading Farm contract address...")
        setIsAddressLoading(true)
        const address = await getContractAddress("Farm")
        console.log("Loaded Farm contract address:", address)
        setContractAddress(address)
      } catch (error) {
        console.error("Error loading Farm contract address:", error)
      } finally {
        setIsAddressLoading(false)
      }
    }

    loadContractAddress()
  }, [])

  // Initialize contract when provider and address are available
  useEffect(() => {
    if (!walletState.provider || !contractAddress || isAddressLoading) return

    const setupContract = async () => {
      try {
        console.log("Setting up Farm contract with address:", contractAddress)
        const provider = new ethers.BrowserProvider(walletState.provider)

        // Read-only contract
        const contract = new ethers.Contract(contractAddress, FARM_ABI, provider)
        setFarmContract(contract)
      } catch (error) {
        console.error("Error setting up farm contract:", error)
      }
    }

    setupContract()
  }, [walletState.provider, contractAddress, isAddressLoading])

  // Get signed contract for transactions
  const getSignedContract = useCallback(async () => {
    if (!walletState.provider || !walletState.connected) {
      throw new Error("Wallet not connected")
    }

    if (!contractAddress) {
      throw new Error("Contract address not loaded")
    }

    const provider = new ethers.BrowserProvider(walletState.provider)
    const signer = await provider.getSigner()
    return new ethers.Contract(contractAddress, FARM_ABI, signer)
  }, [walletState.provider, walletState.connected, contractAddress])

  // Convert between big numbers and human-readable formats
  const formatAmount = (amount: bigint, decimals = 18) => {
    return ethers.formatUnits(amount, decimals)
  }

  const parseAmount = (amount: string, decimals = 18) => {
    return ethers.parseUnits(amount, decimals)
  }

  // Helper to get token info
  const getTokenSymbol = async (tokenAddress: string, provider: ethers.Provider) => {
    try {
      const tokenContract = new ethers.Contract(tokenAddress, ["function symbol() view returns (string)"], provider)
      return await tokenContract.symbol()
    } catch (error) {
      console.error("Error getting token symbol:", error)
      return "Unknown"
    }
  }

  // Fetch all farms data
  const fetchFarms = useCallback(async () => {
    if (!farmContract) {
      console.log("Farm contract not initialized yet")
      return
    }

    setIsLoading(true)
    try {
      const provider = new ethers.BrowserProvider(walletState.provider)

      // Get farm count
      const poolLength = await farmContract.poolLength()
      const rewardPerBlock = await farmContract.getRewardPerBlock()
      const totalAllocPoint = await farmContract.getTotalAllocPoint()

      // Get CAX token info for APR calculations
      const cakeAddress = await farmContract.Cake()
      const cakeSymbol = await getTokenSymbol(cakeAddress, provider)

      // 假设的CAKE代币价格（美元）
      const cakePrice = 2.5

      // 假设的区块时间（秒）
      const blockTimeInSeconds = 3

      // 一年的秒数
      const secondsInYear = 365 * 24 * 60 * 60

      // 一年的区块数
      const blocksPerYear = secondsInYear / blockTimeInSeconds

      // Process each farm
      const farmsData = []
      for (let i = 0; i < poolLength; i++) {
        const farmInfo = await farmContract.getFarmInfo(i)

        // Get token symbols
        const lpTokenSymbol = await getTokenSymbol(farmInfo[0], provider)

        // Parse token symbols to get the pair
        let token0Symbol = "Unknown"
        let token1Symbol = "Unknown"

        if (lpTokenSymbol.includes("-")) {
          const parts = lpTokenSymbol.split("-")
          token0Symbol = parts[0].trim()
          token1Symbol = parts[1].trim().replace(" LP", "")
        }

        // 获取LP代币的总质押量（以代币数量为单位）
        const totalStaked = Number(formatAmount(farmInfo[4]))

        // 假设的LP代币价格（美元）- 在实际应用中，这应该从价格预言机或API获取
        // 这里我们假设每个LP代币价值20美元
        const lpTokenPrice = 20

        // 计算总质押价值（美元）
        const totalStakedUSD = totalStaked * lpTokenPrice

        // 计算分配点数比例
        const allocPoint = Number(farmInfo[1])
        const totalAllocPointNum = Number(totalAllocPoint)
        const poolAllocationRatio = allocPoint / totalAllocPointNum

        // 计算每年分配给该池的奖励代币数量
        const rewardPerBlockNum = Number(formatAmount(rewardPerBlock))
        const yearlyRewardTokens = rewardPerBlockNum * blocksPerYear * poolAllocationRatio

        // 计算年度奖励价值（美元）
        const yearlyRewardValueUSD = yearlyRewardTokens * cakePrice

        // 计算APR
        let apr = 0
        if (totalStakedUSD > 0) {
          apr = (yearlyRewardValueUSD / totalStakedUSD) * 100
        }

        farmsData.push({
          id: i,
          name: lpTokenSymbol,
          lpToken: lpTokenSymbol,
          rewardToken: cakeSymbol,
          apr: apr,
          totalStaked: totalStaked,
          totalStakedUSD: totalStakedUSD,
          multiplier: `${allocPoint / 10}`,
          isActive: true, // You might want to add a way to check if a farm is active
          token0: {
            symbol: token0Symbol,
            logo: `/placeholder.svg?height=32&width=32&query=${token0Symbol} token logo`,
          },
          token1: {
            symbol: token1Symbol,
            logo: `/placeholder.svg?height=32&width=32&query=${token1Symbol} token logo`,
          },
        })
      }

      setFarms(farmsData)

      // If wallet is connected, get user data
      if (walletState.connected && walletState.address) {
        await fetchUserData(farmsData)
      }
    } catch (error) {
      console.error("Error fetching farms:", error)
      toast({
        title: "Error",
        description: "Failed to fetch farm data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [farmContract, walletState.provider, walletState.connected, walletState.address, toast])

  // Fetch user's stakes and rewards for all farms
  const fetchUserData = useCallback(
    async (farmsData: any[]) => {
      if (!farmContract || !walletState.address) return

      try {
        const userStakesData: Record<number, string> = {}
        const userRewardsData: Record<number, string> = {}

        for (const farm of farmsData) {
          // Get user info for this farm
          const userInfo = await farmContract.getUserInfo(farm.id, walletState.address)
          userStakesData[farm.id] = formatAmount(userInfo[0])

          // Calculate pending rewards
          const pendingReward = await calculatePendingReward(farm.id)
          userRewardsData[farm.id] = pendingReward
        }

        setUserStakes(userStakesData)
        setUserRewards(userRewardsData)
      } catch (error) {
        console.error("Error fetching user data:", error)
      }
    },
    [farmContract, walletState.address],
  )

  // Calculate pending rewards for a farm
  const calculatePendingReward = async (farmId: number) => {
    if (!farmContract || !walletState.address) return "0"

    try {
      // This is a manual calculation since your contract doesn't have pendingReward function
      const farmInfo = await farmContract.getFarmInfo(farmId)
      const userInfo = await farmContract.getUserInfo(farmId, walletState.address)

      const userAmount = userInfo[0]
      const userRewardDebt = userInfo[1]
      const accRewardPerShare = farmInfo[3]

      if (userAmount === 0n) return "0"

      // Calculate pending: (userAmount * accRewardPerShare / 1e12) - userRewardDebt
      // Note: Using 1e12 here because accRewardPerShare is typically stored with 12 decimals of precision
      // in MasterChef-style contracts (this may vary depending on your specific contract implementation)
      const pendingBigInt = (userAmount * accRewardPerShare) / BigInt(1e12) - userRewardDebt
      return formatAmount(pendingBigInt > 0n ? pendingBigInt : 0n)
    } catch (error) {
      console.error("Error calculating pending reward:", error)
      return "0"
    }
  }

  // Stake LP tokens to a farm
  const stake = async (farmId: number, amount: string) => {
    if (!walletState.connected || !contractAddress) return

    try {
      toast({
        title: "Processing",
        description: "Approving and staking tokens...",
      })

      const contract = await getSignedContract()

      // First get the LP token address
      const farmInfo = await contract.getFarmInfo(farmId)
      const lpTokenAddress = farmInfo[0]

      // Create LP token contract to approve
      const provider = new ethers.BrowserProvider(walletState.provider)
      const signer = await provider.getSigner()
      const lpTokenContract = new ethers.Contract(
        lpTokenAddress,
        ["function approve(address spender, uint256 amount) returns (bool)"],
        signer,
      )

      // Approve the farm contract to spend LP tokens
      const amountToStake = parseAmount(amount)
      const approveTx = await lpTokenContract.approve(contractAddress, amountToStake)
      await approveTx.wait()

      // Now stake the tokens
      const tx = await contract.deposit(farmId, amountToStake)
      await tx.wait()

      toast({
        title: "Success",
        description: `Successfully staked ${amount} LP tokens`,
      })

      // Refresh data
      await fetchFarms()
    } catch (error) {
      console.error("Error staking:", error)
      toast({
        title: "Error",
        description: `Failed to stake: ${(error as Error).message}`,
        variant: "destructive",
      })
    }
  }

  // Unstake LP tokens from a farm
  const unstake = async (farmId: number, amount: string) => {
    if (!walletState.connected) return

    try {
      toast({
        title: "Processing",
        description: "Unstaking tokens...",
      })

      const contract = await getSignedContract()
      const amountToUnstake = parseAmount(amount)

      const tx = await contract.withdraw(farmId, amountToUnstake)
      await tx.wait()

      toast({
        title: "Success",
        description: `Successfully unstaked ${amount} LP tokens`,
      })

      // Refresh data
      await fetchFarms()
    } catch (error) {
      console.error("Error unstaking:", error)
      toast({
        title: "Error",
        description: `Failed to unstake: ${(error as Error).message}`,
        variant: "destructive",
      })
    }
  }

  // Harvest rewards from a farm
  const harvest = async (farmId: number) => {
    if (!walletState.connected) return

    try {
      toast({
        title: "Processing",
        description: "Harvesting rewards...",
      })

      const contract = await getSignedContract()

      // 使用 deposit 函数并传入 0 作为金额来收获奖励
      // 这是因为很多 MasterChef 风格的合约使用这种方式来收获奖励
      const tx = await contract.deposit(farmId, 0)
      await tx.wait()

      toast({
        title: "Success",
        description: "Successfully harvested rewards",
      })

      // Refresh data
      await fetchFarms()
    } catch (error) {
      console.error("Error harvesting:", error)
      toast({
        title: "Error",
        description: `Failed to harvest: ${(error as Error).message}`,
        variant: "destructive",
      })
    }
  }

  // Admin functions

  // Add a new farm pool
  const addFarm = async (allocPoint: number, stakingToken: string, withUpdate = true) => {
    if (!walletState.connected) return

    try {
      const contract = await getSignedContract()

      const tx = await contract.add(allocPoint, stakingToken, withUpdate)
      await tx.wait()

      toast({
        title: "Success",
        description: "New farm pool added successfully",
      })

      await fetchFarms()
      return true
    } catch (error) {
      console.error("Error adding farm:", error)
      toast({
        title: "Error",
        description: `Failed to add farm: ${(error as Error).message}`,
        variant: "destructive",
      })
      return false
    }
  }

  // Update farm allocation points
  const updateFarmAllocation = async (pid: number, allocPoint: number, withUpdate = true) => {
    if (!walletState.connected) return

    try {
      const contract = await getSignedContract()

      const tx = await contract.set(pid, allocPoint, withUpdate)
      await tx.wait()

      toast({
        title: "Success",
        description: `Farm #${pid} updated successfully`,
      })

      await fetchFarms()
      return true
    } catch (error) {
      console.error("Error updating farm:", error)
      toast({
        title: "Error",
        description: `Failed to update farm: ${(error as Error).message}`,
        variant: "destructive",
      })
      return false
    }
  }

  // Update reward per block
  const updateRewardPerBlock = async (amount: string) => {
    if (!walletState.connected) return

    try {
      const contract = await getSignedContract()
      const rewardAmount = parseAmount(amount)

      const tx = await contract.setRewardPerBlock(rewardAmount)
      await tx.wait()

      toast({
        title: "Success",
        description: `Reward per block updated to ${amount}`,
      })

      await fetchFarms()
      return true
    } catch (error) {
      console.error("Error updating reward per block:", error)
      toast({
        title: "Error",
        description: `Failed to update reward: ${(error as Error).message}`,
        variant: "destructive",
      })
      return false
    }
  }

  // Fund the farm contract with more reward tokens
  const fundRewards = async (amount: string) => {
    if (!walletState.connected || !contractAddress) return

    try {
      const contract = await getSignedContract()

      // First get the reward token address
      const cakeAddress = await contract.Cake()

      // Create reward token contract to approve
      const provider = new ethers.BrowserProvider(walletState.provider)
      const signer = await provider.getSigner()
      const cakeContract = new ethers.Contract(
        cakeAddress,
        ["function approve(address spender, uint256 amount) returns (bool)"],
        signer,
      )

      // Approve the farm contract to spend reward tokens
      const fundAmount = parseAmount(amount)
      const approveTx = await cakeContract.approve(contractAddress, fundAmount)
      await approveTx.wait()

      // Now fund the contract
      const tx = await contract.fund(fundAmount)
      await tx.wait()

      toast({
        title: "Success",
        description: `Successfully funded ${amount} reward tokens`,
      })

      return true
    } catch (error) {
      console.error("Error funding rewards:", error)
      toast({
        title: "Error",
        description: `Failed to fund rewards: ${(error as Error).message}`,
        variant: "destructive",
      })
      return false
    }
  }

  // 添加获取用户总奖励的函数
  const getUserTotalRewards = async (farmId: number) => {
    if (!farmContract || !walletState.address) return "0"

    try {
      // 获取用户在此农场的信息
      const userInfo = await farmContract.getUserInfo(farmId, walletState.address)

      // 获取农场信息
      const farmInfo = await farmContract.getFarmInfo(farmId)

      // 计算待领取的奖励
      const userAmount = userInfo[0]
      const userRewardDebt = userInfo[1]
      const accRewardPerShare = farmInfo[3]

      // 计算待领取奖励: (userAmount * accRewardPerShare / 1e12) - userRewardDebt
      let pendingReward = 0n
      if (userAmount > 0n) {
        pendingReward = (userAmount * accRewardPerShare) / BigInt(1e12) - userRewardDebt
        if (pendingReward < 0n) pendingReward = 0n
      }

      // 由于合约可能没有历史奖励跟踪功能，我们使用一个估算值
      // 这里我们假设总奖励是当前待领取奖励的2倍（仅作为示例）
      // 在实际应用中，您可能需要在前端存储用户的收获历史
      const estimatedTotalReward = pendingReward * 2n

      return formatAmount(estimatedTotalReward > pendingReward ? estimatedTotalReward : pendingReward)
    } catch (error) {
      console.error("Error getting total rewards:", error)
      return "0"
    }
  }

  // Initialize data when contract is ready
  useEffect(() => {
    if (farmContract) {
      fetchFarms()
    }
  }, [farmContract, fetchFarms])

  // Update data when wallet connection changes
  useEffect(() => {
    if (farmContract && walletState.connected) {
      fetchFarms()
    }
  }, [walletState.connected, farmContract, fetchFarms])

  return {
    farms,
    userStakes,
    userRewards,
    isLoading,
    contractAddress,
    isAddressLoading,
    fetchFarms,
    stake,
    unstake,
    harvest,
    getUserTotalRewards,
    // Admin functions
    addFarm,
    updateFarmAllocation,
    updateRewardPerBlock,
    fundRewards,
  }
}
