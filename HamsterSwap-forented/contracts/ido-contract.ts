// 这个文件定义了与IDO合约交互所需的接口和函数

import { ethers } from "ethers"
import { getContractAddress } from "@/utils/contract-addresses"

// IDO合约ABI - 这是与合约交互所需的接口定义
export const IDO_ABI = [
  // 只读函数
  "function getProjectInfo(uint256 _projectId) external view returns (address projectOwner, address tokenAddress, uint256 tokenPrice, uint256 softCap, uint256 hardCap, uint256 minAllocation, uint256 maxAllocation, uint256 startTime, uint256 endTime, uint256 totalRaised, bool isCancelled, bool isFinalized)",
  "function projectsCount() external view returns (uint256)",
  "function getUserAllocation(uint256 _projectId, address _user) external view returns (uint256 amount, bool claimed)",
  "function isWhitelisted(uint256 _projectId, address _user) external view returns (bool)",
  "function Cake() external view returns (address)",

  // 写入函数
  "function participate(uint256 _projectId, uint256 _amount) external",
  "function claim(uint256 _projectId) external",
  "function refund(uint256 _projectId) external",
]

// ERC20 Token ABI for approvals
export const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function decimals() external view returns (uint8)",
  "function symbol() external view returns (string)",
  "function name() external view returns (string)",
]

// 获取IDO合约地址
export const getIdoContractAddress = async () => {
  const address = await getContractAddress("IDO")
  console.log("IDO contract address:", address)
  return address
}

// 连接到IDO合约 - 优先使用signer
export const getIdoContract = async (signerOrProvider: ethers.Signer | ethers.Provider) => {
  const contractAddress = await getIdoContractAddress()
  return new ethers.Contract(contractAddress, IDO_ABI, signerOrProvider)
}

// 获取所有IDO项目信息
export const getAllProjects = async (signerOrProvider: ethers.Signer | ethers.Provider) => {
  const contract = await getIdoContract(signerOrProvider)

  // 获取项目总数
  const projectsCount = await contract.projectsCount()
  const count = Number(projectsCount)
  console.log(`Found ${count} IDO projects`)

  // 获取每个项目的详细信息
  const projects = []
  for (let i = 0; i < count; i++) {
    try {
      const projectInfo = await contract.getProjectInfo(i)

      projects.push({
        projectId: i,
        projectOwner: projectInfo[0],
        tokenAddress: projectInfo[1],
        tokenPrice: ethers.formatEther(projectInfo[2]),
        softCap: ethers.formatEther(projectInfo[3]),
        hardCap: ethers.formatEther(projectInfo[4]),
        minAllocation: ethers.formatEther(projectInfo[5]),
        maxAllocation: ethers.formatEther(projectInfo[6]),
        startTime: new Date(Number(projectInfo[7]) * 1000).toISOString(),
        endTime: new Date(Number(projectInfo[8]) * 1000).toISOString(),
        totalRaised: ethers.formatEther(projectInfo[9]),
        isCancelled: projectInfo[10],
        isFinalized: projectInfo[11],
      })
    } catch (error) {
      console.error(`Error fetching project ${i}:`, error)
    }
  }

  return projects
}

// 获取用户在特定IDO项目的分配信息
export const getUserAllocation = async (
  signerOrProvider: ethers.Signer | ethers.Provider,
  projectId: number,
  userAddress: string,
) => {
  const contract = await getIdoContract(signerOrProvider)
  const allocation = await contract.getUserAllocation(projectId, userAddress)

  return {
    amount: ethers.formatEther(allocation[0]),
    claimed: allocation[1],
  }
}

// 获取Cake代币地址
export const getCakeTokenAddress = async (signerOrProvider: ethers.Signer | ethers.Provider) => {
  const contract = await getIdoContract(signerOrProvider)
  return await contract.Cake()
}

// 获取代币信息
export const getTokenInfo = async (signerOrProvider: ethers.Signer | ethers.Provider, tokenAddress: string) => {
  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signerOrProvider)

  const [symbol, name, decimals] = await Promise.all([
    tokenContract.symbol(),
    tokenContract.name(),
    tokenContract.decimals(),
  ])

  return {
    address: tokenAddress,
    symbol,
    name,
    decimals,
  }
}

// 获取代币余额
export const getTokenBalance = async (
  signerOrProvider: ethers.Signer | ethers.Provider,
  tokenAddress: string,
  userAddress: string,
) => {
  const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, signerOrProvider)

  const balance = await tokenContract.balanceOf(userAddress)
  const decimals = await tokenContract.decimals()

  return ethers.formatUnits(balance, decimals)
}

// 获取Cake代币余额
export const getCakeBalance = async (signerOrProvider: ethers.Signer | ethers.Provider, userAddress: string) => {
  const cakeAddress = await getCakeTokenAddress(signerOrProvider)
  return await getTokenBalance(signerOrProvider, cakeAddress, userAddress)
}

// 检查并批准Cake代币使用权限
export const checkAndApproveCake = async (signer: ethers.Signer, amount: string) => {
  const idoAddress = await getIdoContractAddress()
  const cakeAddress = await getCakeTokenAddress(signer)
  const cakeContract = new ethers.Contract(cakeAddress, ERC20_ABI, signer)

  const userAddress = await signer.getAddress()
  const allowance = await cakeContract.allowance(userAddress, idoAddress)
  const amountWei = ethers.parseEther(amount)

  if (allowance < amountWei) {
    console.log("Approving Cake token for IDO contract...")
    const tx = await cakeContract.approve(idoAddress, ethers.MaxUint256)
    await tx.wait()
    console.log("Cake token approved successfully")
  } else {
    console.log("Cake token already approved")
  }

  return true
}

// 参与IDO
export const participateInIdo = async (signer: ethers.Signer, projectId: number, amount: string) => {
  // 首先检查并批准Cake代币
  await checkAndApproveCake(signer, amount)

  const contract = await getIdoContract(signer)
  const amountWei = ethers.parseEther(amount)

  console.log(`Participating in project ${projectId} with ${amount} CAKE...`)
  const tx = await contract.participate(projectId, amountWei)
  const receipt = await tx.wait()
  console.log("Participation successful:", receipt.hash)

  return receipt
}

// 领取代币
export const claimTokens = async (signer: ethers.Signer, projectId: number) => {
  const contract = await getIdoContract(signer)

  console.log(`Claiming tokens for project ${projectId}...`)
  const tx = await contract.claim(projectId)
  const receipt = await tx.wait()
  console.log("Claim successful:", receipt.hash)

  return receipt
}

// 申请退款
export const requestRefund = async (signer: ethers.Signer, projectId: number) => {
  const contract = await getIdoContract(signer)

  console.log(`Requesting refund for project ${projectId}...`)
  const tx = await contract.refund(projectId)
  const receipt = await tx.wait()
  console.log("Refund request successful:", receipt.hash)

  return receipt
}
