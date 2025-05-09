"use client"

import { useState, useEffect, useCallback } from "react"
import { ethers } from "ethers"
import { useWallet } from "@/contexts/wallet-context"
import { getContractAddress } from "@/utils/contract-addresses"
import { IDO_ABI } from "@/contracts/ido-contract"

// 定义项目类型
export interface IdoProject {
  id: number
  name: string
  description: string
  tokenSymbol: string
  tokenLogo: string
  tokenAddress: string
  status: "upcoming" | "active" | "ended" | "cancelled"
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

export function useIdoContract() {
  const { walletState } = useWallet()
  const [idoProjects, setIdoProjects] = useState<IdoProject[]>([])
  const [userAllocations, setUserAllocations] = useState<Record<number, { amount: string; claimed: boolean } | null>>(
    {},
  )
  const [isLoading, setIsLoading] = useState(true)
  const [cakeBalance, setCakeBalance] = useState<string>("0")
  const [contractAddress, setContractAddress] = useState<string | null>(null)

  // 加载合约地址
  useEffect(() => {
    const loadContractAddress = async () => {
      try {
        const address = await getContractAddress("IDO")
        setContractAddress(address)
      } catch (error) {
        console.error("Error loading IDO contract address:", error)
      }
    }

    loadContractAddress()
  }, [])

  // 获取项目状态
  const getProjectStatus = useCallback(
    (startTime: string, endTime: string, isCancelled: boolean): "upcoming" | "active" | "ended" | "cancelled" => {
      if (isCancelled) return "cancelled"

      const now = new Date()
      const start = new Date(startTime)
      const end = new Date(endTime)

      if (now < start) return "upcoming"
      if (now > end) return "ended"
      return "active"
    },
    [],
  )

  // 获取代币Logo
  const getTokenLogo = useCallback((symbol: string): string => {
    const logos: Record<string, string> = {
      HAMSTER: "/hamster-logo.svg",
      CAKE: "/cake-logo.svg",
      ETH: "/eth-logo.svg",
      USDT: "/usdt-logo.svg",
      USDC: "/usdc-logo.svg",
      DAI: "/dai-logo.svg",
      WBTC: "/wbtc-logo.svg",
      LINK: "/link-logo.svg",
      UNI: "/uni-logo.svg",
      AAVE: "/aave-logo.svg",
      COMP: "/comp-logo.svg",
      LTC: "/ltc-logo.svg",
    }
    return logos[symbol] || "/digital-token.png"
  }, [])

  // 获取IDO合约实例
  const getIdoContract = useCallback(
    async (withSigner = false) => {
      if (!walletState.provider) throw new Error("Provider not available")

      const address = await getContractAddress("IDO")
      if (!address) throw new Error("IDO contract address not found")

      return new ethers.Contract(
        address,
        IDO_ABI,
        withSigner && walletState.signer ? walletState.signer : walletState.provider,
      )
    },
    [walletState.provider, walletState.signer],
  )

  // 获取代币信息
  const getTokenInfo = useCallback(
    async (tokenAddress: string) => {
      if (!walletState.provider) throw new Error("Provider not available")

      try {
        const tokenAbi = [
          "function name() view returns (string)",
          "function symbol() view returns (string)",
          "function decimals() view returns (uint8)",
        ]

        const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, walletState.provider)

        const [name, symbol, decimals] = await Promise.all([
          tokenContract.name(),
          tokenContract.symbol(),
          tokenContract.decimals(),
        ])

        return { name, symbol, decimals }
      } catch (error) {
        console.error("Error fetching token info:", error)
        return { name: "Unknown Token", symbol: "UNKNOWN", decimals: 18 }
      }
    },
    [walletState.provider],
  )

  // 获取CAKE余额
  const getCakeBalance = useCallback(
    async (address: string) => {
      if (!walletState.provider) throw new Error("Provider not available")

      try {
        const cakeAddress = await getContractAddress("CAKE")
        if (!cakeAddress) throw new Error("CAKE token address not found")

        const tokenAbi = ["function balanceOf(address) view returns (uint256)"]
        const tokenContract = new ethers.Contract(cakeAddress, tokenAbi, walletState.provider)

        const balance = await tokenContract.balanceOf(address)
        return ethers.utils.formatEther(balance)
      } catch (error) {
        console.error("Error fetching CAKE balance:", error)
        return "0"
      }
    },
    [walletState.provider],
  )

  // 获取用户分配
  const getUserAllocation = useCallback(
    async (projectId: number, userAddress: string) => {
      try {
        const idoContract = await getIdoContract()
        const allocation = await idoContract.userAllocations(projectId, userAddress)

        return {
          amount: ethers.utils.formatEther(allocation.amount),
          claimed: allocation.claimed,
        }
      } catch (error) {
        console.error(`Error fetching allocation for project ${projectId}:`, error)
        return null
      }
    },
    [getIdoContract],
  )

  // 获取所有项目
  const getAllProjects = useCallback(async () => {
    try {
      const idoContract = await getIdoContract()
      const projectCount = await idoContract.projectCount()

      const projects = []
      for (let i = 1; i <= projectCount.toNumber(); i++) {
        try {
          const projectData = await idoContract.projects(i)
          projects.push({
            projectId: i,
            owner: projectData.owner,
            tokenAddress: projectData.tokenAddress,
            tokenPrice: ethers.utils.formatEther(projectData.tokenPrice),
            softCap: ethers.utils.formatEther(projectData.softCap),
            hardCap: ethers.utils.formatEther(projectData.hardCap),
            minAllocation: ethers.utils.formatEther(projectData.minAllocation),
            maxAllocation: ethers.utils.formatEther(projectData.maxAllocation),
            startTime: new Date(projectData.startTime.toNumber() * 1000).toISOString(),
            endTime: new Date(projectData.endTime.toNumber() * 1000).toISOString(),
            totalRaised: ethers.utils.formatEther(projectData.totalRaised),
            isFinalized: projectData.isFinalized,
            isCancelled: projectData.isCancelled,
          })
        } catch (error) {
          console.error(`Error fetching project ${i}:`, error)
        }
      }

      return projects
    } catch (error) {
      console.error("Error fetching all projects:", error)
      return []
    }
  }, [getIdoContract])

  // 获取项目参与者
  const getProjectParticipants = useCallback(
    async (projectId: number) => {
      try {
        const idoContract = await getIdoContract()
        const participantCount = await idoContract.getParticipantCount(projectId)

        const participants = []
        for (let i = 0; i < participantCount.toNumber(); i++) {
          const address = await idoContract.projectParticipants(projectId, i)
          const allocation = await idoContract.userAllocations(projectId, address)

          participants.push({
            address,
            amount: ethers.utils.formatEther(allocation.amount),
            claimed: allocation.claimed,
          })
        }

        return participants
      } catch (error) {
        console.error(`Error fetching participants for project ${projectId}:`, error)
        return []
      }
    },
    [getIdoContract],
  )

  // 参与IDO
  const participate = useCallback(
    async (projectId: number, amount: string) => {
      if (!walletState.signer) throw new Error("Signer not available")

      try {
        const idoContract = await getIdoContract(true)
        const tx = await idoContract.participate(projectId, { value: ethers.utils.parseEther(amount) })
        await tx.wait()
        return true
      } catch (error) {
        console.error("Error participating in IDO:", error)
        throw error
      }
    },
    [getIdoContract, walletState.signer],
  )

  // 领取代币
  const claim = useCallback(
    async (projectId: number) => {
      if (!walletState.signer) throw new Error("Signer not available")

      try {
        const idoContract = await getIdoContract(true)
        const tx = await idoContract.claimTokens(projectId)
        await tx.wait()
        return true
      } catch (error) {
        console.error("Error claiming tokens:", error)
        throw error
      }
    },
    [getIdoContract, walletState.signer],
  )

  // 申请退款
  const refund = useCallback(
    async (projectId: number) => {
      if (!walletState.signer) throw new Error("Signer not available")

      try {
        const idoContract = await getIdoContract(true)
        const tx = await idoContract.requestRefund(projectId)
        await tx.wait()
        return true
      } catch (error) {
        console.error("Error requesting refund:", error)
        throw error
      }
    },
    [getIdoContract, walletState.signer],
  )

  // 创建项目
  const createProject = useCallback(
    async (
      owner: string,
      tokenAddress: string,
      tokenPrice: string,
      softCap: string,
      hardCap: string,
      minAllocation: string,
      maxAllocation: string,
      startTime: number,
      endTime: number,
    ) => {
      if (!walletState.signer) throw new Error("Signer not available")

      try {
        const idoContract = await getIdoContract(true)
        const tx = await idoContract.createProject(
          owner,
          tokenAddress,
          ethers.utils.parseEther(tokenPrice),
          ethers.utils.parseEther(softCap),
          ethers.utils.parseEther(hardCap),
          ethers.utils.parseEther(minAllocation),
          ethers.utils.parseEther(maxAllocation),
          startTime,
          endTime,
        )
        const receipt = await tx.wait()

        // Get project ID from event
        const event = receipt.events?.find((e) => e.event === "ProjectCreated")
        const projectId = event?.args?.projectId.toNumber()

        return projectId
      } catch (error) {
        console.error("Error creating project:", error)
        throw error
      }
    },
    [getIdoContract, walletState.signer],
  )

  // 添加到白名单
  const addToWhitelist = useCallback(
    async (projectId: number, addresses: string[]) => {
      if (!walletState.signer) throw new Error("Signer not available")

      try {
        const idoContract = await getIdoContract(true)
        const tx = await idoContract.addToWhitelist(projectId, addresses)
        await tx.wait()
        return true
      } catch (error) {
        console.error("Error adding to whitelist:", error)
        throw error
      }
    },
    [getIdoContract, walletState.signer],
  )

  // 从白名单移除
  const removeFromWhitelist = useCallback(
    async (projectId: number, addresses: string[]) => {
      if (!walletState.signer) throw new Error("Signer not available")

      try {
        const idoContract = await getIdoContract(true)
        const tx = await idoContract.removeFromWhitelist(projectId, addresses)
        await tx.wait()
        return true
      } catch (error) {
        console.error("Error removing from whitelist:", error)
        throw error
      }
    },
    [getIdoContract, walletState.signer],
  )

  // 完成项目
  const finalizeProject = useCallback(
    async (projectId: number) => {
      if (!walletState.signer) throw new Error("Signer not available")

      try {
        const idoContract = await getIdoContract(true)
        const tx = await idoContract.finalizeProject(projectId)
        await tx.wait()
        return true
      } catch (error) {
        console.error("Error finalizing project:", error)
        throw error
      }
    },
    [getIdoContract, walletState.signer],
  )

  // 取消项目
  const cancelProject = useCallback(
    async (projectId: number) => {
      if (!walletState.signer) throw new Error("Signer not available")

      try {
        const idoContract = await getIdoContract(true)
        const tx = await idoContract.cancelProject(projectId)
        await tx.wait()
        return true
      } catch (error) {
        console.error("Error cancelling project:", error)
        throw error
      }
    },
    [getIdoContract, walletState.signer],
  )

  // 获取项目数据
  const fetchIdoProjects = useCallback(async () => {
    if (!walletState.provider) {
      console.log("Cannot fetch IDO projects: provider missing")
      return
    }

    setIsLoading(true)

    try {
      // 获取链上项目数据
      const projects = await getAllProjects()

      // 转换为前端需要的格式
      const formattedProjects: IdoProject[] = await Promise.all(
        projects.map(async (project) => {
          // 获取代币信息
          let tokenInfo
          try {
            tokenInfo = await getTokenInfo(project.tokenAddress)
          } catch (error) {
            console.error("Error fetching token info:", error)
            tokenInfo = { symbol: "UNKNOWN", name: "Unknown Token" }
          }

          const status = getProjectStatus(project.startTime, project.endTime, project.isCancelled)

          return {
            id: project.projectId,
            name: tokenInfo.name || `Project ${project.projectId}`,
            description: `${tokenInfo.name || `Project ${project.projectId}`} is launching through our IDO platform.`,
            tokenSymbol: tokenInfo.symbol,
            tokenLogo: getTokenLogo(tokenInfo.symbol),
            tokenAddress: project.tokenAddress,
            status,
            startTime: project.startTime,
            endTime: project.endTime,
            hardCap: Number.parseFloat(project.hardCap),
            softCap: Number.parseFloat(project.softCap),
            totalRaised: Number.parseFloat(project.totalRaised),
            price: Number.parseFloat(project.tokenPrice),
            minAllocation: Number.parseFloat(project.minAllocation),
            maxAllocation: Number.parseFloat(project.maxAllocation),
            tokenDistribution: status === "ended" ? "Immediate" : "After IDO ends",
            website: `https://example.com/projects/${project.projectId}`,
            whitepaper: `https://example.com/projects/${project.projectId}/whitepaper`,
            socials: {
              twitter: `https://twitter.com/example`,
              telegram: `https://t.me/example`,
              discord: `https://discord.gg/example`,
            },
          }
        }),
      )

      setIdoProjects(formattedProjects)

      // 如果钱包已连接，获取用户分配数据
      if (walletState.connected && walletState.address) {
        const allocations: Record<number, { amount: string; claimed: boolean } | null> = {}

        for (const project of projects) {
          try {
            const allocation = await getUserAllocation(project.projectId, walletState.address)
            allocations[project.projectId] = allocation
          } catch (error) {
            console.error(`Error fetching allocation for project ${project.projectId}:`, error)
            allocations[project.projectId] = null
          }
        }

        setUserAllocations(allocations)

        // 获取Cake余额
        try {
          const balance = await getCakeBalance(walletState.address)
          setCakeBalance(balance)
        } catch (error) {
          console.error("Error fetching Cake balance:", error)
          setCakeBalance("0")
        }
      } else {
        // 如果钱包未连接，清空用户数据
        setUserAllocations({})
        setCakeBalance("0")
      }
    } catch (error) {
      console.error("Error fetching IDO projects:", error)
      setIdoProjects([])
    } finally {
      setIsLoading(false)
    }
  }, [
    walletState.provider,
    walletState.connected,
    walletState.address,
    getProjectStatus,
    getTokenLogo,
    getTokenInfo,
    getAllProjects,
    getUserAllocation,
    getCakeBalance,
  ])

  // 初始加载和钱包连接状态变化时获取数据
  useEffect(() => {
    if (walletState.provider) {
      fetchIdoProjects()
    }
  }, [fetchIdoProjects, walletState.provider, walletState.connected])

  // 刷新数据
  const refreshData = useCallback(() => {
    return fetchIdoProjects()
  }, [fetchIdoProjects])

  return {
    idoProjects,
    userAllocations,
    isLoading,
    cakeBalance,
    contractAddress,
    participate,
    claim,
    refund,
    refreshData,
    createProject,
    addToWhitelist,
    removeFromWhitelist,
    finalizeProject,
    cancelProject,
    getProjectParticipants,
  }
}
