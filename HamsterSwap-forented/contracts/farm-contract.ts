import { ethers } from "ethers"
import { getContractAddress } from "@/utils/contract-addresses"

// Farm contract ABI - updated to match your contract
export const FARM_ABI = [
  // Read functions
  "function getFarmInfo(uint256 _pid) external view returns (address lpToken, uint256 allocPoint, uint256 lastRewardBlock, uint256 accRewardPerShare, uint256 totalStaked)",
  "function poolLength() external view returns (uint256)",
  "function getRewardPerBlock() external view returns (uint256)",
  "function getTotalAllocPoint() external view returns (uint256)",
  "function getUserInfo(uint256 _pid, address _user) external view returns (uint256 amount, uint256 rewardDebt)",
  "function Cake() external view returns (address)",
  "function totalsupply() external view returns (uint256)",
  "function paidout() external view returns (uint256)",
  "function endTime() external view returns (uint256)",
  "function owner() external view returns (address)",

  // Write functions
  "function deposit(uint256 _pid, uint256 _amount) external",
  "function withdraw(uint256 _pid, uint256 _amount) external",
  "function emergencyWithdraw(uint256 _pid) external",
  "function harvest(uint256 _pid) external",

  // Admin functions
  "function add(uint256 _allocPoint, address _stakingToken, bool _withUpdate) external",
  "function set(uint256 _pid, uint256 _allocPoint, bool _withUpdate) external",
  "function setRewardPerBlock(uint256 _rewardPerBlock) external",
  "function fund(uint256 _amount) external",
  "function massUpdatePools() external",

  // Events
  "event Deposit(address indexed user, uint256 indexed pid, uint256 amount)",
  "event Withdraw(address indexed user, uint256 indexed pid, uint256 amount)",
  "event EmergencyWithdraw(address indexed user, uint256 indexed pid, uint256 amount)",
  "event Harvest(address indexed user, uint256 indexed pid, uint256 amount)",
  "event PoolAdded(uint256 indexed pid, address indexed stakingToken, uint256 allocPoint)",
  "event PoolSet(uint256 indexed pid, uint256 allocPoint)",
  "event RewardPerBlockUpdated(uint256 oldValue, uint256 newValue)",
]

// Get Farm contract address
export const getFarmContractAddress = async () => {
  return await getContractAddress("Farm")
}

// Connect to Farm contract (read-only)
export const connectToFarmContract = async (provider: ethers.Provider) => {
  const contractAddress = await getFarmContractAddress()
  return new ethers.Contract(contractAddress, FARM_ABI, provider)
}

// Connect to Farm contract with signer (for transactions)
export const connectToFarmContractWithSigner = async (signer: ethers.Signer) => {
  const contractAddress = await getFarmContractAddress()
  return new ethers.Contract(contractAddress, FARM_ABI, signer)
}

// Get farms information
export const getAllFarms = async (provider: ethers.Provider) => {
  const contract = await connectToFarmContract(provider)
  const poolLength = await contract.poolLength()

  const farms = []
  for (let i = 0; i < poolLength; i++) {
    const farmInfo = await contract.getFarmInfo(i)
    farms.push({
      pid: i,
      lpToken: farmInfo[0],
      allocPoint: farmInfo[1].toString(),
      lastRewardBlock: farmInfo[2].toString(),
      accRewardPerShare: farmInfo[3].toString(),
      totalStaked: farmInfo[4].toString(),
    })
  }

  return farms
}

// Get user information for a specific farm
export const getUserStakeInfo = async (provider: ethers.Provider, pid: number, userAddress: string) => {
  const contract = await connectToFarmContract(provider)
  const userInfo = await contract.getUserInfo(pid, userAddress)

  return {
    stakedAmount: userInfo[0].toString(),
    rewardDebt: userInfo[1].toString(),
  }
}

// Deposit (stake) LP tokens
export const stakeLpTokens = async (signer: ethers.Signer, pid: number, amount: string) => {
  const contract = await connectToFarmContractWithSigner(signer)
  const amountWei = ethers.parseEther(amount)

  const tx = await contract.deposit(pid, amountWei)
  return await tx.wait()
}

// Withdraw (unstake) LP tokens
export const unstakeLpTokens = async (signer: ethers.Signer, pid: number, amount: string) => {
  const contract = await connectToFarmContractWithSigner(signer)
  const amountWei = ethers.parseEther(amount)

  const tx = await contract.withdraw(pid, amountWei)
  return await tx.wait()
}

// Harvest rewards
export const harvestRewards = async (signer: ethers.Signer, pid: number) => {
  const contract = await connectToFarmContractWithSigner(signer)

  const tx = await contract.harvest(pid)
  return await tx.wait()
}

// Emergency withdraw
export const emergencyWithdraw = async (signer: ethers.Signer, pid: number) => {
  const contract = await connectToFarmContractWithSigner(signer)

  const tx = await contract.emergencyWithdraw(pid)
  return await tx.wait()
}

// Admin functions
// Add new farm pool
export const addFarmPool = async (
  signer: ethers.Signer,
  allocPoint: number,
  stakingToken: string,
  withUpdate = true,
) => {
  const contract = await connectToFarmContractWithSigner(signer)

  const tx = await contract.add(allocPoint, stakingToken, withUpdate)
  return await tx.wait()
}

// Update farm allocation
export const updateFarmAllocation = async (
  signer: ethers.Signer,
  pid: number,
  allocPoint: number,
  withUpdate = true,
) => {
  const contract = await connectToFarmContractWithSigner(signer)

  const tx = await contract.set(pid, allocPoint, withUpdate)
  return await tx.wait()
}

// Update reward per block
export const updateRewardPerBlock = async (signer: ethers.Signer, rewardPerBlock: string) => {
  const contract = await connectToFarmContractWithSigner(signer)
  const rewardAmount = ethers.parseEther(rewardPerBlock)

  const tx = await contract.setRewardPerBlock(rewardAmount)
  return await tx.wait()
}

// Fund the contract with more reward tokens
export const fundContract = async (signer: ethers.Signer, amount: string) => {
  const contract = await connectToFarmContractWithSigner(signer)
  const fundAmount = ethers.parseEther(amount)

  const tx = await contract.fund(fundAmount)
  return await tx.wait()
}
