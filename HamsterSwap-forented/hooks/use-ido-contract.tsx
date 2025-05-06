"use client"

import { useState, useEffect, useCallback } from "react"
import { useWallet } from "@/contexts/wallet-context"

// 模拟的IDO项目数据
const mockIdoProjects = [
  {
    id: 1,
    name: "HamsterSwap Token",
    description: "The native token of the HamsterSwap platform, powering the cutest DeFi ecosystem in the galaxy.",
    tokenSymbol: "HAMSTER",
    tokenLogo: "/hamster-logo.svg",
    status: "active" as const,
    startTime: "2023-12-01T10:00:00Z",
    endTime: "2023-12-15T10:00:00Z",
    hardCap: 1000,
    softCap: 500,
    totalRaised: 750,
    price: 0.05,
    minAllocation: 0.1,
    maxAllocation: 5,
    tokenDistribution: "After IDO ends",
    website: "https://hamsterswap.example",
    whitepaper: "https://hamsterswap.example/whitepaper",
    socials: {
      twitter: "https://twitter.com/hamsterswap",
      telegram: "https://t.me/hamsterswap",
      discord: "https://discord.gg/hamsterswap",
    },
  },
  {
    id: 2,
    name: "CheeseFi",
    description:
      "A yield farming protocol designed for hamsters and other small rodents to maximize their cheese yields.",
    tokenSymbol: "CHEESE",
    tokenLogo: "/cake-logo.svg",
    status: "upcoming" as const,
    startTime: "2023-12-20T14:00:00Z",
    endTime: "2024-01-05T14:00:00Z",
    hardCap: 800,
    softCap: 300,
    totalRaised: 0,
    price: 0.02,
    minAllocation: 0.1,
    maxAllocation: 3,
    tokenDistribution: "7 days after IDO ends",
    website: "https://cheesefi.example",
    whitepaper: "https://cheesefi.example/whitepaper",
    socials: {
      twitter: "https://twitter.com/cheesefi",
      telegram: "https://t.me/cheesefi",
    },
  },
  {
    id: 3,
    name: "NutStorage",
    description: "Decentralized storage solution for hamsters to safely store their nuts and seeds for winter.",
    tokenSymbol: "NUT",
    tokenLogo: "/ltc-logo.svg",
    status: "ended" as const,
    startTime: "2023-11-01T09:00:00Z",
    endTime: "2023-11-15T09:00:00Z",
    hardCap: 500,
    softCap: 200,
    totalRaised: 500,
    price: 0.01,
    minAllocation: 0.1,
    maxAllocation: 2,
    tokenDistribution: "Immediate",
    website: "https://nutstorage.example",
    whitepaper: "https://nutstorage.example/whitepaper",
    socials: {
      twitter: "https://twitter.com/nutstorage",
      telegram: "https://t.me/nutstorage",
      discord: "https://discord.gg/nutstorage",
      medium: "https://medium.com/nutstorage",
    },
  },
  {
    id: 4,
    name: "WheelRunner",
    description: "Gamified fitness platform where hamsters can earn tokens by running on their wheels.",
    tokenSymbol: "WHEEL",
    tokenLogo: "/eth-logo.svg",
    status: "ended" as const,
    startTime: "2023-10-10T12:00:00Z",
    endTime: "2023-10-25T12:00:00Z",
    hardCap: 300,
    softCap: 100,
    totalRaised: 250,
    price: 0.008,
    minAllocation: 0.05,
    maxAllocation: 1.5,
    tokenDistribution: "30 days vesting",
    website: "https://wheelrunner.example",
    whitepaper: "https://wheelrunner.example/whitepaper",
    socials: {
      twitter: "https://twitter.com/wheelrunner",
      telegram: "https://t.me/wheelrunner",
    },
  },
]

export function useIdoContract() {
  const { walletState } = useWallet()
  const [idoProjects, setIdoProjects] = useState(mockIdoProjects)
  const [userAllocations, setUserAllocations] = useState<Record<number, { amount: string; claimed: boolean } | null>>(
    {},
  )
  const [isLoading, setIsLoading] = useState(true)

  // 模拟获取IDO项目数据
  const fetchIdoProjects = useCallback(async () => {
    setIsLoading(true)

    // 模拟API调用延迟
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // 如果钱包已连接，模拟获取用户分配数据
    if (walletState.connected) {
      // 模拟用户分配数据
      const mockUserAllocations: Record<number, { amount: string; claimed: boolean } | null> = {
        1: { amount: "2.5", claimed: false },
        3: { amount: "1.0", claimed: true },
        4: { amount: "0.5", claimed: false },
      }

      setUserAllocations(mockUserAllocations)
    } else {
      // 如果钱包未连接，清空用户数据
      setUserAllocations({})
    }

    setIsLoading(false)
  }, [walletState.connected])

  // 初始加载和钱包连接状态变化时获取数据
  useEffect(() => {
    fetchIdoProjects()
  }, [fetchIdoProjects])

  // 参与IDO
  const participate = async (projectId: number, amount: string) => {
    if (!walletState.connected) return

    // 模拟参与过程
    console.log(`Participating in IDO ${projectId} with ${amount} ETH`)

    // 模拟交易延迟
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // 更新用户分配数据
    setUserAllocations((prev) => ({
      ...prev,
      [projectId]: { amount, claimed: false },
    }))

    // 更新项目总筹集金额
    setIdoProjects((prev) =>
      prev.map((project) =>
        project.id === projectId
          ? { ...project, totalRaised: project.totalRaised + Number.parseFloat(amount) }
          : project,
      ),
    )

    // 模拟成功消息
    alert(`Successfully participated in ${idoProjects.find((p) => p.id === projectId)?.name} IDO with ${amount} ETH`)
  }

  // 领取代币
  const claim = async (projectId: number) => {
    if (!walletState.connected) return

    // 模拟领取过程
    console.log(`Claiming tokens from IDO ${projectId}`)

    // 模拟交易延迟
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // 更新用户分配数据
    setUserAllocations((prev) => {
      const userAllocation = prev[projectId]
      if (!userAllocation) return prev

      return {
        ...prev,
        [projectId]: { ...userAllocation, claimed: true },
      }
    })

    // 获取项目和用户分配
    const project = idoProjects.find((p) => p.id === projectId)
    const allocation = userAllocations[projectId]

    if (project && allocation) {
      const tokenAmount = Number.parseFloat(allocation.amount) / project.price

      // 模拟成功消息
      alert(`Successfully claimed ${tokenAmount.toFixed(2)} ${project.tokenSymbol} tokens from ${project.name} IDO`)
    }
  }

  return {
    idoProjects,
    userAllocations,
    isLoading,
    participate,
    claim,
  }
}
