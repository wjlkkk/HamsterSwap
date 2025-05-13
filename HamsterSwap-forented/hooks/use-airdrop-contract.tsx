"use client"

import { useState, useCallback, useEffect } from "react"
import { useWallet } from "@/contexts/wallet-context"
import { ethers } from "ethers"
import {
  AIRDROP_ABI,
  getAllAirdrops as fetchAllAirdrops,
  getUserEligibility,
  getAirdropContractAddress,
} from "@/contracts/airdrop-contract"

// 初始空数组，将从链上获取实际数据
const initialAirdrops = []

export function useAirdropContract() {
  const { walletState } = useWallet()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [airdrops, setAirdrops] = useState(initialAirdrops)
  const [isInitialized, setIsInitialized] = useState(false)
  const [contractAddress, setContractAddress] = useState<string | null>(null)

  // 初始化时获取合约地址
  useEffect(() => {
    async function loadContractAddress() {
      try {
        const address = await getAirdropContractAddress()
        console.log("Loaded Airdrop contract address:", address)
        setContractAddress(address)
      } catch (err) {
        console.error("Error loading Airdrop contract address:", err)
        setError("获取空投合约地址失败")
      }
    }

    loadContractAddress()
  }, [])

  // 从区块链获取实际空投数据
  const fetchAirdrops = useCallback(async () => {
    if (!walletState.provider || !contractAddress) {
      console.log("Cannot fetch airdrops: provider or contract address missing", {
        provider: !!walletState.provider,
        contractAddress,
      })
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const provider = new ethers.BrowserProvider(walletState.provider)
      const fetchedAirdrops = await fetchAllAirdrops(provider)

      // 转换为UI友好的格式
      const formattedAirdrops = fetchedAirdrops.map((airdrop) => ({
        id: airdrop.airdropId,
        tokenAddress: airdrop.tokenAddress,
        tokenName: "Token", // 这里可以通过tokenAddress获取实际名称
        tokenSymbol: "TKN", // 这里可以通过tokenAddress获取实际符号
        amount: airdrop.totalAmount,
        startTime: new Date(airdrop.startTime).getTime() / 1000,
        endTime: new Date(airdrop.endTime).getTime() / 1000,
        active: airdrop.isActive,
        cancelled: airdrop.isCancelled,
        eligibleUsers: [],
        claimedUsers: [],
      }))

      setAirdrops(formattedAirdrops)
      setIsInitialized(true)
    } catch (err) {
      console.error("Error fetching airdrops:", err)
      setError("获取空投列表失败")
    } finally {
      setIsLoading(false)
    }
  }, [walletState.provider, contractAddress])

  // 初始化时获取空投列表
  useEffect(() => {
    if (walletState.provider && contractAddress && !isInitialized) {
      fetchAirdrops()
    }
  }, [walletState.provider, fetchAirdrops, isInitialized, contractAddress])

  // 创建空投
  const createAirdrop = async (tokenAddress: string, amount: string, startTime: number, endTime: number) => {
    if (!walletState.provider || !walletState.signer || !walletState.address || !contractAddress) {
      setError("请先连接钱包或合约地址未加载")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const provider = new ethers.BrowserProvider(walletState.provider)
      const airdropContract = new ethers.Contract(contractAddress, AIRDROP_ABI, provider)
      const airdropWithSigner = airdropContract.connect(walletState.signer)

      // 添加默认的merkleRoot参数 (ethers.ZeroHash)
      const merkleRoot = ethers.ZeroHash // 默认空merkle root

      console.log("Creating airdrop with params:", {
        tokenAddress,
        amount: ethers.parseUnits(amount, 18).toString(),
        startTime,
        endTime,
        merkleRoot,
      })

      const tx = await airdropWithSigner.createAirdrop(
        tokenAddress,
        ethers.parseUnits(amount, 18),
        startTime,
        endTime,
        merkleRoot,
      )

      console.log("Transaction sent:", tx.hash)
      const receipt = await tx.wait()
      console.log("Transaction confirmed:", receipt)

      // 重新获取空投列表以包含新创建的空投
      await fetchAirdrops()

      return { success: true, transactionHash: receipt.hash }
    } catch (err) {
      console.error("Error creating airdrop:", err)
      setError("创建空投失败: " + (err.message || String(err)))
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // 设置用户资格和金额
  const setEligibility = async (users: string[], amounts: string[], airdropId: number) => {
    if (!walletState.provider || !walletState.signer || !walletState.address || !contractAddress) {
      setError("请先连接钱包或合约地址未加载")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // 检查空投ID是否存在
      const airdropExists = airdrops.some((a) => a.id === airdropId)
      if (!airdropExists) {
        throw new Error(`空投ID ${airdropId} 不存在`)
      }

      // 验证用户地址和金额数组长度相同
      if (users.length !== amounts.length) {
        throw new Error("用户地址和金额数组长度必须相同")
      }

      const provider = new ethers.BrowserProvider(walletState.provider)
      const airdropContract = new ethers.Contract(contractAddress, AIRDROP_ABI, provider)
      const airdropWithSigner = airdropContract.connect(walletState.signer)

      // 将金额转换为wei
      const amountsInWei = amounts.map((amount) => ethers.parseUnits(amount, 18))

      console.log("Setting eligibility with params:", {
        airdropId,
        users,
        amounts,
        amountsInWei: amountsInWei.map((a) => a.toString()),
      })

      // 调用合约设置资格列表
      const tx = await airdropWithSigner.setEligibilityList(airdropId, users, amountsInWei)
      const receipt = await tx.wait()
      console.log("Transaction confirmed:", receipt)

      // 更新本地状态
      setAirdrops(
        airdrops.map((airdrop) => {
          if (airdrop.id === airdropId) {
            const updatedEligibleUsers = [...new Set([...airdrop.eligibleUsers, ...users])]

            return {
              ...airdrop,
              eligibleUsers: updatedEligibleUsers,
            }
          }
          return airdrop
        }),
      )

      return { success: true, transactionHash: receipt.hash }
    } catch (err) {
      console.error("Error setting eligibility:", err)
      setError("设置资格失败: " + (err.message || String(err)))
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // 领取空投
  const claim = async (airdropId: number) => {
    if (!walletState.provider || !walletState.signer || !walletState.address || !contractAddress) {
      setError("请先连接钱包或合约地址未加载")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // 检查空投ID是否存在
      const airdrop = airdrops.find((a) => a.id === airdropId)
      if (!airdrop) {
        throw new Error(`空投ID ${airdropId} 不存在`)
      }

      const provider = new ethers.BrowserProvider(walletState.provider)

      // 先检查用户资格
      console.log(`Checking eligibility for airdrop ${airdropId} and user ${walletState.address}`)
      const eligibility = await getUserEligibility(provider, airdropId, walletState.address)
      console.log("Eligibility result:", eligibility)

      if (!eligibility.isEligible) {
        throw new Error("您没有资格领取此空投")
      }

      if (eligibility.claimed) {
        throw new Error("您已经领取过此空投")
      }

      // 检查空投是否激活
      const airdropContract = new ethers.Contract(contractAddress, AIRDROP_ABI, provider)
      const airdropInfo = await airdropContract.getAirdropInfo(airdropId)
      if (!airdropInfo[5]) {
        // isActive 在返回元组中的索引是5
        throw new Error("此空投当前未激活")
      }

      // 检查空投是否在有效期内
      const now = Math.floor(Date.now() / 1000)
      if (now < Number(airdropInfo[3])) {
        // startTime 在返回元组中的索引是3
        throw new Error("此空投尚未开始")
      }
      if (now > Number(airdropInfo[4])) {
        // endTime 在返回元组中的索引是4
        throw new Error("此空投已经结束")
      }

      console.log("All checks passed, proceeding with claim")

      // 直接执行领取交易，不进行 estimateGas 预检查
      const airdropWithSigner = airdropContract.connect(walletState.signer)
      console.log(`Claiming airdrop ${airdropId}...`)

      // 直接使用数字类型，不转换为BigInt
      const tx = await airdropWithSigner.claimAirdrop(airdropId)
      console.log("Transaction sent:", tx.hash)
      const receipt = await tx.wait()
      console.log("Transaction confirmed:", receipt)

      // 更新本地状态
      setAirdrops(
        airdrops.map((a) => {
          if (a.id === airdropId) {
            return {
              ...a,
              claimedUsers: [...a.claimedUsers, walletState.address],
            }
          }
          return a
        }),
      )

      return {
        success: true,
        amount: ethers.formatEther(eligibility.amount),
        transactionHash: receipt.hash,
      }
    } catch (err) {
      console.error("Error claiming airdrop:", err)
      setError("领取空投失败: " + (err.message || String(err)))
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // 激活空投
  const activateAirdrop = async (airdropId: number) => {
    if (!walletState.provider || !walletState.signer || !walletState.address || !contractAddress) {
      setError("请先连接钱包或合约地址未加载")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // 检查空投ID是否存在
      const airdropExists = airdrops.some((a) => a.id === airdropId)
      if (!airdropExists) {
        throw new Error(`空投ID ${airdropId} 不存在`)
      }

      console.log(`Activating airdrop with ID: ${airdropId}`)

      const provider = new ethers.BrowserProvider(walletState.provider)
      const airdropContract = new ethers.Contract(contractAddress, AIRDROP_ABI, provider)
      const airdropWithSigner = airdropContract.connect(walletState.signer)

      // 估算Gas以检查是否会失败
      try {
        await airdropWithSigner.activateAirdrop.estimateGas(airdropId)
      } catch (gasError) {
        console.error("Gas estimation failed:", gasError)
        throw new Error(`激活空投前检查失败: ${gasError.message || String(gasError)}`)
      }

      const tx = await airdropWithSigner.activateAirdrop(airdropId)
      console.log("Transaction sent:", tx.hash)
      const receipt = await tx.wait()
      console.log("Transaction confirmed:", receipt)

      // 更新本地状态
      setAirdrops(
        airdrops.map((a) => {
          if (a.id === airdropId) {
            return { ...a, active: true }
          }
          return a
        }),
      )

      // 重新获取空投列表以确保数据最新
      await fetchAirdrops()

      return { success: true, transactionHash: receipt.hash }
    } catch (err) {
      console.error("Error activating airdrop:", err)
      setError("激活空投失败: " + (err.message || String(err)))
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // 停用空投
  const deactivateAirdrop = async (airdropId: number) => {
    if (!walletState.provider || !walletState.signer || !walletState.address || !contractAddress) {
      setError("请先连接钱包或合约地址未加载")
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      // 检查空投ID是否存在
      const airdropExists = airdrops.some((a) => a.id === airdropId)
      if (!airdropExists) {
        throw new Error(`空投ID ${airdropId} 不存在`)
      }

      console.log(`Deactivating airdrop with ID: ${airdropId}`)

      const provider = new ethers.BrowserProvider(walletState.provider)
      const airdropContract = new ethers.Contract(contractAddress, AIRDROP_ABI, provider)
      const airdropWithSigner = airdropContract.connect(walletState.signer)

      // 估算Gas以检查是否会失败
      try {
        await airdropWithSigner.deactivateAirdrop.estimateGas(airdropId)
      } catch (gasError) {
        console.error("Gas estimation failed:", gasError)
        throw new Error(`停用空投前检查失败: ${gasError.message || String(gasError)}`)
      }

      const tx = await airdropWithSigner.deactivateAirdrop(airdropId)
      console.log("Transaction sent:", tx.hash)
      const receipt = await tx.wait()
      console.log("Transaction confirmed:", receipt)

      // 更新本地状态
      setAirdrops(
        airdrops.map((a) => {
          if (a.id === airdropId) {
            return { ...a, active: false }
          }
          return a
        }),
      )

      // 重新获取空投列表以确保数据最新
      await fetchAirdrops()

      return { success: true, transactionHash: receipt.hash }
    } catch (err) {
      console.error("Error deactivating airdrop:", err)
      setError("停用空投失败: " + (err.message || String(err)))
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  // 获取空投信息
  const getAirdropInfo = useCallback(
    (airdropId: number) => {
      const airdrop = airdrops.find((a) => a.id === airdropId)
      return airdrop || null
    },
    [airdrops],
  )

  // 检查用户是否有资格
  const isEligible = useCallback(
    (userAddress: string, airdropId: number) => {
      const airdrop = airdrops.find((a) => a.id === airdropId)
      return airdrop ? airdrop.eligibleUsers.includes(userAddress) : false
    },
    [airdrops],
  )

  // 检查用户是否已领取
  const hasClaimed = useCallback(
    (userAddress: string, airdropId: number) => {
      const airdrop = airdrops.find((a) => a.id === airdropId)
      return airdrop ? airdrop.claimedUsers.includes(userAddress) : false
    },
    [airdrops],
  )

  // 获取所有空投
  const getAllAirdrops = useCallback(() => {
    return airdrops
  }, [airdrops])

  // 刷新空投列表
  const refreshAirdrops = useCallback(() => {
    return fetchAirdrops()
  }, [fetchAirdrops])

  return {
    isLoading,
    error,
    createAirdrop,
    setEligibility,
    claim,
    activateAirdrop,
    deactivateAirdrop,
    getAirdropInfo,
    isEligible,
    hasClaimed,
    getAllAirdrops,
    refreshAirdrops,
    isInitialized,
    contractAddress,
  }
}
