// 这个文件定义了与Airdrop合约交互所需的接口和函数

import { ethers } from "ethers"

// Airdrop合约ABI - 这是与合约交互所需的接口定义
export const AIRDROP_ABI = [
  // 只读函数
  "function getAirdropInfo(uint256 _airdropId) external view returns (address tokenAddress, uint256 totalAmount, uint256 claimedAmount, uint256 startTime, uint256 endTime, bool isActive, bool isCancelled)",
  "function airdropsCount() external view returns (uint256)",
  "function getUserEligibility(uint256 _airdropId, address _user) external view returns (bool isEligible, uint256 amount, bool claimed)",
  "function checkEligibilityCriteria(uint256 _airdropId, address _user) external view returns (bool[])",

  // 写入函数
  "function claimAirdrop(uint256 _airdropId) external",
  "function batchClaim(uint256[] calldata _airdropIds) external",

  // 管理员函数
  "function createAirdrop(address _tokenAddress, uint256 _totalAmount, uint256 _startTime, uint256 _endTime, bytes32 _merkleRoot) external returns (uint256)",
  "function setEligibilityList(uint256 _airdropId, address[] calldata _users, uint256[] calldata _amounts) external",
  "function activateAirdrop(uint256 _airdropId) external",
  "function deactivateAirdrop(uint256 _airdropId) external",
  "function cancelAirdrop(uint256 _airdropId) external",
  "function withdrawUnclaimedTokens(uint256 _airdropId) external",

  // 事件
  "event AirdropCreated(uint256 indexed airdropId, address tokenAddress, uint256 totalAmount)",
  "event AirdropClaimed(uint256 indexed airdropId, address indexed user, uint256 amount)",
  "event AirdropActivated(uint256 indexed airdropId)",
  "event AirdropDeactivated(uint256 indexed airdropId)",
  "event AirdropCancelled(uint256 indexed airdropId)",
  "event UnclaimedTokensWithdrawn(uint256 indexed airdropId, uint256 amount)",
]

// Airdrop合约地址 - 更新为实际部署的合约地址
export const AIRDROP_CONTRACT_ADDRESS = "0x99bbA657f2BbC93c02D617f8bA121cB8Fc104Acf" // 正确的合约地址

// 连接到Airdrop合约
export const connectToAirdropContract = (provider: ethers.Provider, signer?: ethers.Signer) => {
  const contract = new ethers.Contract(AIRDROP_CONTRACT_ADDRESS, AIRDROP_ABI, signer || provider)
  return contract
}

// 获取所有空投活动信息
export const getAllAirdrops = async (provider: ethers.Provider) => {
  const contract = connectToAirdropContract(provider)
  const airdropsCount = await contract.airdropsCount()

  const airdrops = []
  for (let i = 0; i < Number(airdropsCount); i++) {
    const airdropInfo = await contract.getAirdropInfo(i)
    airdrops.push({
      airdropId: i,
      tokenAddress: airdropInfo[0], // 使用索引访问返回的元组
      totalAmount: ethers.formatEther(airdropInfo[1]),
      claimedAmount: ethers.formatEther(airdropInfo[2]),
      startTime: new Date(Number(airdropInfo[3]) * 1000).toISOString(),
      endTime: new Date(Number(airdropInfo[4]) * 1000).toISOString(),
      isActive: airdropInfo[5],
      isCancelled: airdropInfo[6],
    })
  }

  return airdrops
}

// 获取用户在特定空投活动的资格信息
export const getUserEligibility = async (provider: ethers.Provider, airdropId: number, userAddress: string) => {
  const contract = connectToAirdropContract(provider)
  const eligibility = await contract.getUserEligibility(airdropId, userAddress)

  return {
    isEligible: eligibility[0], // 使用索引访问返回的元组
    amount: ethers.formatEther(eligibility[1]),
    claimed: eligibility[2],
  }
}

// 检查用户是否满足特定空投的资格条件
export const checkEligibilityCriteria = async (provider: ethers.Provider, airdropId: number, userAddress: string) => {
  const contract = connectToAirdropContract(provider)
  return await contract.checkEligibilityCriteria(airdropId, userAddress)
}

// 领取空投代币
export const claimAirdrop = async (provider: ethers.Provider, signer: ethers.Signer, airdropId: number) => {
  const contract = connectToAirdropContract(provider, signer)

  // 直接使用数字类型，不转换为BigInt
  console.log(`Claiming airdrop with ID: ${airdropId}`)

  // 执行领取交易
  const tx = await contract.claimAirdrop(airdropId)
  return await tx.wait()
}

// 批量领取多个空投
export const batchClaimAirdrops = async (provider: ethers.Provider, signer: ethers.Signer, airdropIds: number[]) => {
  const contract = connectToAirdropContract(provider, signer)

  // 执行批量领取交易
  const tx = await contract.batchClaim(airdropIds)
  return await tx.wait()
}

// 设置用户资格
export const setEligibility = async (
  provider: ethers.Provider,
  signer: ethers.Signer,
  airdropId: number,
  addresses: string[],
  amounts: string[],
) => {
  const contract = connectToAirdropContract(provider, signer)

  // 将金额转换为wei
  const amountsInWei = amounts.map((amount) => ethers.parseEther(amount))

  // 执行设置资格交易
  const tx = await contract.setEligibilityList(airdropId, addresses, amountsInWei)
  return await tx.wait()
}

// 创建新的空投
export const createAirdrop = async (
  provider: ethers.Provider,
  signer: ethers.Signer,
  tokenAddress: string,
  totalAmount: string,
  startTime: number,
  endTime: number,
  merkleRoot: string = ethers.ZeroHash, // 默认为空merkle root
) => {
  const contract = connectToAirdropContract(provider, signer)

  // 将金额转换为wei
  const totalAmountInWei = ethers.parseEther(totalAmount)

  // 执行创建空投交易
  const tx = await contract.createAirdrop(tokenAddress, totalAmountInWei, startTime, endTime, merkleRoot)

  const receipt = await tx.wait()

  // 从事件中获取创建的空投ID
  const airdropCreatedEvent = receipt?.logs
    .filter((log) => {
      try {
        const parsedLog = contract.interface.parseLog({
          topics: log.topics as string[],
          data: log.data,
        })
        return parsedLog?.name === "AirdropCreated"
      } catch (e) {
        return false
      }
    })
    .map((log) => {
      const parsedLog = contract.interface.parseLog({
        topics: log.topics as string[],
        data: log.data,
      })
      return {
        airdropId: Number(parsedLog.args[0]),
        tokenAddress: parsedLog.args[1],
        totalAmount: parsedLog.args[2],
      }
    })[0]

  return {
    transactionHash: receipt?.hash,
    airdropId: airdropCreatedEvent?.airdropId,
  }
}

// 激活空投
export const activateAirdrop = async (provider: ethers.Provider, signer: ethers.Signer, airdropId: number) => {
  const contract = connectToAirdropContract(provider, signer)
  const tx = await contract.activateAirdrop(airdropId)
  return await tx.wait()
}

// 停用空投
export const deactivateAirdrop = async (provider: ethers.Provider, signer: ethers.Signer, airdropId: number) => {
  const contract = connectToAirdropContract(provider, signer)
  const tx = await contract.deactivateAirdrop(airdropId)
  return await tx.wait()
}

// 取消空投
export const cancelAirdrop = async (provider: ethers.Provider, signer: ethers.Signer, airdropId: number) => {
  const contract = connectToAirdropContract(provider, signer)
  const tx = await contract.cancelAirdrop(airdropId)
  return await tx.wait()
}

// 提取未领取的代币
export const withdrawUnclaimedTokens = async (provider: ethers.Provider, signer: ethers.Signer, airdropId: number) => {
  const contract = connectToAirdropContract(provider, signer)
  const tx = await contract.withdrawUnclaimedTokens(airdropId)
  return await tx.wait()
}
