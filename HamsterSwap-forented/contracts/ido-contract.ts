import { ethers } from "ethers"
import { getContractAddress } from "@/utils/contract-addresses"

export const IDO_ABI = [
  // Project management
  "function createProject(address owner, address tokenAddress, uint256 tokenPrice, uint256 softCap, uint256 hardCap, uint256 minAllocation, uint256 maxAllocation, uint256 startTime, uint256 endTime) external returns (uint256)",
  "function finalizeProject(uint256 projectId) external",
  "function cancelProject(uint256 projectId) external",

  // Whitelist management
  "function addToWhitelist(uint256 projectId, address[] calldata users) external",
  "function removeFromWhitelist(uint256 projectId, address[] calldata users) external",
  "function isWhitelisted(uint256 projectId, address user) external view returns (bool)",

  // Participation
  "function participate(uint256 projectId) external payable",
  "function claimTokens(uint256 projectId) external",
  "function requestRefund(uint256 projectId) external",

  // View functions
  "function projectCount() external view returns (uint256)",
  "function projects(uint256 projectId) external view returns (address owner, address tokenAddress, uint256 tokenPrice, uint256 softCap, uint256 hardCap, uint256 minAllocation, uint256 maxAllocation, uint256 startTime, uint256 endTime, uint256 totalRaised, bool isFinalized, bool isCancelled)",
  "function userAllocations(uint256 projectId, address user) external view returns (uint256 amount, bool claimed)",
  "function getParticipantCount(uint256 projectId) external view returns (uint256)",
  "function projectParticipants(uint256 projectId, uint256 index) external view returns (address)",

  // Events
  "event ProjectCreated(uint256 indexed projectId, address indexed owner, address tokenAddress)",
  "event ProjectFinalized(uint256 indexed projectId)",
  "event ProjectCancelled(uint256 indexed projectId)",
  "event UserParticipated(uint256 indexed projectId, address indexed user, uint256 amount)",
  "event TokensClaimed(uint256 indexed projectId, address indexed user, uint256 amount)",
  "event RefundRequested(uint256 indexed projectId, address indexed user, uint256 amount)",
]

// 获取IDO合约地址
export async function getIdoContractAddress() {
  return getContractAddress("IDO")
}

// 获取所有项目
export async function getAllProjects(provider: ethers.providers.Provider) {
  const address = await getIdoContractAddress()
  const idoContract = new ethers.Contract(address, IDO_ABI, provider)

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
}

// 获取用户分配
export async function getUserAllocation(provider: ethers.providers.Provider, projectId: number, userAddress: string) {
  const address = await getIdoContractAddress()
  const idoContract = new ethers.Contract(address, IDO_ABI, provider)

  const allocation = await idoContract.userAllocations(projectId, userAddress)

  return {
    amount: ethers.utils.formatEther(allocation.amount),
    claimed: allocation.claimed,
  }
}

// 参与IDO
export async function participateInIdo(
  provider: ethers.providers.Provider,
  signer: ethers.Signer,
  projectId: number,
  amount: string,
) {
  const address = await getIdoContractAddress()
  const idoContract = new ethers.Contract(address, IDO_ABI, signer)

  const tx = await idoContract.participate(projectId, { value: ethers.utils.parseEther(amount) })
  await tx.wait()
}

// 领取代币
export async function claimTokens(provider: ethers.providers.Provider, signer: ethers.Signer, projectId: number) {
  const address = await getIdoContractAddress()
  const idoContract = new ethers.Contract(address, IDO_ABI, signer)

  const tx = await idoContract.claimTokens(projectId)
  await tx.wait()
}

// 申请退款
export async function requestRefund(provider: ethers.providers.Provider, signer: ethers.Signer, projectId: number) {
  const address = await getIdoContractAddress()
  const idoContract = new ethers.Contract(address, IDO_ABI, signer)

  const tx = await idoContract.requestRefund(projectId)
  await tx.wait()
}

// 获取代币信息
export async function getTokenInfo(provider: ethers.providers.Provider, tokenAddress: string) {
  try {
    const tokenAbi = [
      "function name() view returns (string)",
      "function symbol() view returns (string)",
      "function decimals() view returns (uint8)",
    ]

    const tokenContract = new ethers.Contract(tokenAddress, tokenAbi, provider)

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
}

// 获取CAKE余额
export async function getCakeBalance(provider: ethers.providers.Provider, address: string) {
  try {
    const cakeAddress = await getContractAddress("CAKE")

    const tokenAbi = ["function balanceOf(address) view returns (uint256)"]
    const tokenContract = new ethers.Contract(cakeAddress, tokenAbi, provider)

    const balance = await tokenContract.balanceOf(address)
    return ethers.utils.formatEther(balance)
  } catch (error) {
    console.error("Error fetching CAKE balance:", error)
    return "0"
  }
}
