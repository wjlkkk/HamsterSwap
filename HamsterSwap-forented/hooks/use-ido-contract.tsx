"use client"

import { useState, useEffect, useCallback } from "react"
import { useWallet } from "@/contexts/wallet-context"
import {
  getAllProjects,
  getUserAllocation,
  participateInIdo,
  claimTokens,
  requestRefund,
  getCakeBalance,
  getTokenInfo,
  getIdoContractAddress,
} from "@/contracts/ido-contract"

// 定义项目类型
export interface IdoProject {
  id: number
  name: string
  description: string
  tokenSymbol: string
  tokenLogo: string
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

// Add these interfaces after the IdoProject interface
export interface IdoTask {
  id: string
  type: "twitter" | "telegram" | "discord"
  description: string
  url: string
  completed: boolean
}

export interface IdoProjectWithTasks extends IdoProject {
  tasks: IdoTask[]
  isWhitelisted: boolean
}

export function useIdoContract() {
  const { walletState } = useWallet()
  // Update the state in the useIdoContract function to include tasks and whitelist status
  const [idoProjects, setIdoProjects] = useState<IdoProjectWithTasks[]>([])
  const [userAllocations, setUserAllocations] = useState<Record<number, { amount: string; claimed: boolean } | null>>(
    {},
  )
  const [isLoading, setIsLoading] = useState(true)
  const [cakeBalance, setCakeBalance] = useState<string>("0")
  const [contractAddress, setContractAddress] = useState<string | null>(null)
  const [isAddressLoading, setIsAddressLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Add these new states inside the useIdoContract function
  const [completedTasks, setCompletedTasks] = useState<Record<string, string[]>>({})
  const [whitelistedProjects, setWhitelistedProjects] = useState<number[]>([])

  // 添加一个标志来跟踪是否已经从localStorage加载了数据
  const [localDataLoaded, setLocalDataLoaded] = useState(false)

  // 加载合约地址
  useEffect(() => {
    const loadContractAddress = async () => {
      try {
        setIsAddressLoading(true)
        const address = await getIdoContractAddress()
        setContractAddress(address)
        setError(null)
      } catch (error) {
        console.error("Error loading IDO contract address:", error)
        setError("无法加载IDO合约地址")
      } finally {
        setIsAddressLoading(false)
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

  // 获取项目描述
  const getProjectDescription = useCallback((name: string, symbol: string): string => {
    return `${name} (${symbol}) is a token launching through the PancakeSwap IDO platform.`
  }, [])

  // 获取项目网站和社交媒体
  const getProjectLinks = useCallback((symbol: string) => {
    return {
      website: `https://pancakeswap.finance`,
      whitepaper: `https://docs.pancakeswap.finance`,
      socials: {
        twitter: `https://twitter.com/pancakeswap`,
        telegram: `https://t.me/pancakeswap`,
        discord: `https://discord.gg/pancakeswap`,
      },
    }
  }, [])

  // 获取用户在所有项目中的分配
  const fetchUserAllocations = useCallback(async (projects: any[], signerOrProvider: any, userAddress: string) => {
    const allocations: Record<number, { amount: string; claimed: boolean } | null> = {}

    for (const project of projects) {
      try {
        const allocation = await getUserAllocation(signerOrProvider, project.projectId, userAddress)
        allocations[project.projectId] = allocation
      } catch (error) {
        console.error(`Error fetching allocation for project ${project.projectId}:`, error)
        allocations[project.projectId] = null
      }
    }

    return allocations
  }, [])

  // 获取IDO项目数据
  const fetchIdoProjects = useCallback(async () => {
    if (!walletState.signer && !walletState.provider) {
      console.log("Cannot fetch IDO projects: no signer or provider available")
      return
    }

    if (isAddressLoading) {
      console.log("Cannot fetch IDO projects: contract address still loading")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // 使用signer或provider获取项目数据
      const signerOrProvider = walletState.signer || walletState.provider
      const projects = await getAllProjects(signerOrProvider)

      if (projects.length === 0) {
        setIdoProjects([])
        setIsLoading(false)
        return
      }

      // Modify the fetchIdoProjects function to include tasks and whitelist status
      // Inside the formattedProjects mapping, add these properties:
      const formattedProjects: IdoProjectWithTasks[] = await Promise.all(
        projects.map(async (project, index) => {
          // 获取代币信息
          let tokenInfo
          try {
            tokenInfo = await getTokenInfo(signerOrProvider, project.tokenAddress)
          } catch (error) {
            console.error("Error fetching token info:", error)
            throw new Error(`无法获取代币信息: ${error.message}`)
          }

          const status = getProjectStatus(project.startTime, project.endTime, project.isCancelled)

          // Add tasks for each project
          const tasks: IdoTask[] = [
            {
              id: `twitter_${project.projectId}`,
              type: "twitter",
              description: `Follow ${tokenInfo.symbol} on Twitter`,
              url: `https://twitter.com/pancakeswap`,
              completed: false,
            },
            {
              id: `telegram_${project.projectId}`,
              type: "telegram",
              description: `Join ${tokenInfo.symbol} Telegram group`,
              url: `https://t.me/pancakeswap`,
              completed: false,
            },
          ]

          // Check if user has completed tasks
          const projectKey = `project_${project.projectId}`
          const userCompletedTasks = completedTasks[projectKey] || []

          // Mark completed tasks
          const updatedTasks = tasks.map((task) => ({
            ...task,
            completed: userCompletedTasks.includes(task.id),
          }))

          // Check if project is whitelisted
          const isWhitelisted = whitelistedProjects.includes(project.projectId)

          return {
            id: project.projectId,
            name: tokenInfo.name || `Project ${index + 1}`,
            description: getProjectDescription(tokenInfo.name || `Project ${index + 1}`, tokenInfo.symbol),
            tokenSymbol: tokenInfo.symbol,
            tokenLogo: getTokenLogo(tokenInfo.symbol),
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
            ...getProjectLinks(tokenInfo.symbol),
            tasks: updatedTasks,
            isWhitelisted,
          }
        }),
      )

      setIdoProjects(formattedProjects)

      // 如果钱包已连接，获取用户分配数据
      if (walletState.connected && walletState.address) {
        // 获取用户在所有项目中的分配
        const allocations = await fetchUserAllocations(projects, signerOrProvider, walletState.address)
        setUserAllocations(allocations)

        // 获取Cake余额
        try {
          const balance = await getCakeBalance(signerOrProvider, walletState.address)
          setCakeBalance(balance)
        } catch (error) {
          console.error("Error fetching Cake balance:", error)
          throw new Error(`无法获取Cake余额: ${error.message}`)
        }
      } else {
        // 如果钱包未连接，清空用户数据
        setUserAllocations({})
        setCakeBalance("0")
      }
    } catch (error) {
      console.error("Error fetching IDO projects:", error)
      setError(error.message || "获取IDO项目失败")
      setIdoProjects([])
    } finally {
      setIsLoading(false)
    }
  }, [
    walletState.signer,
    walletState.provider,
    walletState.connected,
    walletState.address,
    getProjectStatus,
    getTokenLogo,
    getProjectDescription,
    getProjectLinks,
    isAddressLoading,
    fetchUserAllocations,
    completedTasks,
    whitelistedProjects,
  ])

  // 刷新数据 - 移到fetchIdoProjects定义之后
  const refreshData = useCallback(() => {
    fetchIdoProjects()
  }, [fetchIdoProjects])

  // 初始加载和钱包连接状态变化时获取数据
  useEffect(() => {
    if (!isAddressLoading) {
      fetchIdoProjects()
    }
  }, [fetchIdoProjects, isAddressLoading])

  // 修改这个useEffect，只在连接钱包后加载一次数据
  useEffect(() => {
    if (walletState.connected && walletState.address && !localDataLoaded) {
      // Load completed tasks from localStorage
      const loadedTasks: Record<string, string[]> = {}
      const loadedWhitelist: number[] = []

      try {
        // Load whitelist status
        const whitelistData = localStorage.getItem(`ido_whitelist_${walletState.address}`)
        if (whitelistData) {
          const parsed = JSON.parse(whitelistData)
          if (Array.isArray(parsed)) {
            loadedWhitelist.push(...parsed)
          }
        }

        // Load tasks for each project
        idoProjects.forEach((project) => {
          const projectKey = `project_${project.id}`
          const tasksData = localStorage.getItem(`ido_tasks_${walletState.address}_${projectKey}`)

          if (tasksData) {
            const parsed = JSON.parse(tasksData)
            if (Array.isArray(parsed)) {
              loadedTasks[projectKey] = parsed
            }
          }
        })
      } catch (error) {
        console.error("Error loading tasks from localStorage:", error)
      }

      setCompletedTasks(loadedTasks)
      setWhitelistedProjects(loadedWhitelist)
      setLocalDataLoaded(true)
    }
  }, [walletState.connected, walletState.address, idoProjects, localDataLoaded])

  // 参与IDO
  const participate = async (projectId: number, amount: string) => {
    if (!walletState.connected || !walletState.signer || !walletState.address) {
      throw new Error("钱包未连接")
    }

    try {
      // 执行参与交易
      await participateInIdo(walletState.signer, projectId, amount)

      // 从合约中查询最新的用户分配数据
      const updatedAllocation = await getUserAllocation(walletState.signer, projectId, walletState.address)

      // 更新用户分配数据
      setUserAllocations((prev) => ({
        ...prev,
        [projectId]: updatedAllocation,
      }))

      // 重新获取项目数据以更新总筹集金额
      fetchIdoProjects()

      // 更新Cake余额
      const balance = await getCakeBalance(walletState.signer, walletState.address)
      setCakeBalance(balance)

      return true
    } catch (error) {
      console.error("Error participating in IDO:", error)
      throw new Error(`参与IDO失败: ${error.message}`)
    }
  }

  // 领取代币
  const claim = async (projectId: number) => {
    if (!walletState.connected || !walletState.signer || !walletState.address) {
      throw new Error("钱包未连接")
    }

    try {
      // 执行领取交易
      await claimTokens(walletState.signer, projectId)

      // 从合约中查询最新的用户分配数据
      const updatedAllocation = await getUserAllocation(walletState.signer, projectId, walletState.address)

      // 更新用户分配数据
      setUserAllocations((prev) => ({
        ...prev,
        [projectId]: updatedAllocation,
      }))

      return true
    } catch (error) {
      console.error("Error claiming tokens:", error)
      throw new Error(`领取代币失败: ${error.message}`)
    }
  }

  // 申请退款
  const refund = async (projectId: number) => {
    if (!walletState.connected || !walletState.signer || !walletState.address) {
      throw new Error("钱包未连接")
    }

    try {
      // 执行退款交易
      await requestRefund(walletState.signer, projectId)

      // 从合约中查询最新的用户分配数据
      const updatedAllocation = await getUserAllocation(walletState.signer, projectId, walletState.address)

      // 更新用户分配数据
      setUserAllocations((prev) => ({
        ...prev,
        [projectId]: updatedAllocation,
      }))

      // 更新Cake余额
      const balance = await getCakeBalance(walletState.signer, walletState.address)
      setCakeBalance(balance)

      // 重新获取项目数据以更新总筹集金额
      fetchIdoProjects()

      return true
    } catch (error) {
      console.error("Error requesting refund:", error)
      throw new Error(`申请退款失败: ${error.message}`)
    }
  }

  // Add this function inside useIdoContract to handle task completion
  const completeTask = useCallback(
    (projectId: number, taskId: string) => {
      if (!walletState.connected || !walletState.address) {
        throw new Error("Wallet not connected")
      }

      // Update completed tasks in state
      setCompletedTasks((prev) => {
        const projectKey = `project_${projectId}`
        const projectTasks = prev[projectKey] || []

        if (!projectTasks.includes(taskId)) {
          const updatedTasks = [...projectTasks, taskId]

          // Save to localStorage
          localStorage.setItem(`ido_tasks_${walletState.address}_${projectKey}`, JSON.stringify(updatedTasks))

          // Check if all tasks are completed to grant whitelist
          const project = idoProjects.find((p) => p.id === projectId)
          if (project && project.tasks.length === updatedTasks.length) {
            // Grant whitelist status
            setWhitelistedProjects((prev) => {
              const updated = [...prev, projectId]
              localStorage.setItem(`ido_whitelist_${walletState.address}`, JSON.stringify(updated))
              return updated
            })
          }

          return {
            ...prev,
            [projectKey]: updatedTasks,
          }
        }

        return prev
      })

      // 在任务完成后触发一次数据刷新
      setTimeout(() => {
        refreshData()
      }, 500)

      return true
    },
    [walletState.connected, walletState.address, idoProjects, refreshData],
  )

  // Add completeTask to the return value of the hook
  return {
    idoProjects,
    userAllocations,
    isLoading,
    cakeBalance,
    contractAddress,
    isAddressLoading,
    error,
    participate,
    claim,
    refund,
    refreshData,
    completeTask,
  }
}
