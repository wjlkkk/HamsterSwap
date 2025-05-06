// 这个文件定义了与IDO合约交互所需的接口和函数

import { ethers } from "ethers"

// IDO合约ABI - 这是与合约交互所需的接口定义
export const IDO_ABI = [
  // 只读函数
  "function getProjectInfo(uint256 _projectId) external view returns (address tokenAddress, uint256 tokenPrice, uint256 softCap, uint256 hardCap, uint256 minAllocation, uint256 maxAllocation, uint256 startTime, uint256 endTime, uint256 totalRaised, bool isCancelled, bool isFinalized)",
  "function projectsCount() external view returns (uint256)",
  "function getUserAllocation(uint256 _projectId, address _user) external view returns (uint256 amount, bool claimed)",
  "function isWhitelisted(uint256 _projectId, address _user) external view returns (bool)",

  // 写入函数
  "function participate(uint256 _projectId) external payable",
  "function claim(uint256 _projectId) external",
  "function refund(uint256 _projectId) external",

  // 管理员函数
  "function createProject(address _tokenAddress, uint256 _tokenPrice, uint256 _softCap, uint256 _hardCap, uint256 _minAllocation, uint256 _maxAllocation, uint256 _startTime, uint256 _endTime) external returns (uint256)",
  "function addToWhitelist(uint256 _projectId, address[] calldata _users) external",
  "function removeFromWhitelist(uint256 _projectId, address[] calldata _users) external",
  "function cancelProject(uint256 _projectId) external",
  "function finalizeProject(uint256 _projectId) external",

  // 事件
  "event ProjectCreated(uint256 indexed projectId, address tokenAddress, uint256 tokenPrice)",
  "event Participated(uint256 indexed projectId, address indexed user, uint256 amount)",
  "event Claimed(uint256 indexed projectId, address indexed user, uint256 amount)",
  "event Refunded(uint256 indexed projectId, address indexed user, uint256 amount)",
  "event ProjectCancelled(uint256 indexed projectId)",
  "event ProjectFinalized(uint256 indexed projectId, uint256 totalRaised)",
]

// IDO合约地址 - 这需要根据实际部署的合约地址进行更新
// 本地网络合约地址示例
export const IDO_CONTRACT_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512" // 本地Hardhat默认部署的第二个合约地址

// 连接到IDO合约
export const connectToIdoContract = (provider: ethers.providers.Web3Provider, signer?: ethers.Signer) => {
  const contract = new ethers.Contract(IDO_CONTRACT_ADDRESS, IDO_ABI, signer || provider)
  return contract
}
s
// 获取所有IDO项目信息
export const getAllProjects = async (provider: ethers.providers.Web3Provider) => {
  const contract = connectToIdoContract(provider)
  const projectsCount = await contract.projectsCount()

  const projects = []
  for (let i = 0; i < projectsCount.toNumber(); i++) {
    const projectInfo = await contract.getProjectInfo(i)
    projects.push({
      projectId: i,
      tokenAddress: projectInfo.tokenAddress,
      tokenPrice: ethers.utils.formatEther(projectInfo.tokenPrice),
      softCap: ethers.utils.formatEther(projectInfo.softCap),
      hardCap: ethers.utils.formatEther(projectInfo.hardCap),
      minAllocation: ethers.utils.formatEther(projectInfo.minAllocation),
      maxAllocation: ethers.utils.formatEther(projectInfo.maxAllocation),
      startTime: new Date(projectInfo.startTime.toNumber() * 1000).toISOString(),
      endTime: new Date(projectInfo.endTime.toNumber() * 1000).toISOString(),
      totalRaised: ethers.utils.formatEther(projectInfo.totalRaised),
      isCancelled: projectInfo.isCancelled,
      isFinalized: projectInfo.isFinalized,
    })
  }

  return projects
}

// 获取用户在特定IDO项目的分配信息
export const getUserAllocation = async (
  provider: ethers.providers.Web3Provider,
  projectId: number,
  userAddress: string,
) => {
  const contract = connectToIdoContract(provider)
  const allocation = await contract.getUserAllocation(projectId, userAddress)

  return {
    amount: ethers.utils.formatEther(allocation.amount),
    claimed: allocation.claimed,
  }
}

// 检查用户是否在白名单中
export const checkWhitelist = async (
  provider: ethers.providers.Web3Provider,
  projectId: number,
  userAddress: string,
) => {
  const contract = connectToIdoContract(provider)
  return await contract.isWhitelisted(projectId, userAddress)
}

// 参与IDO
export const participateInIdo = async (
  provider: ethers.providers.Web3Provider,
  signer: ethers.Signer,
  projectId: number,
  amount: string,
) => {
  const contract = connectToIdoContract(provider, signer)
  const amountInWei = ethers.utils.parseEther(amount)

  // 执行参与交易
  const tx = await contract.participate(projectId, { value: amountInWei })
  return await tx.wait()
}

// 领取代币
export const claimTokens = async (
  provider: ethers.providers.Web3Provider,
  signer: ethers.Signer,
  projectId: number,
) => {
  const contract = connectToIdoContract(provider, signer)

  // 执行领取交易
  const tx = await contract.claim(projectId)
  return await tx.wait()
}

// 申请退款（如果项目被取消或未达到软顶）
export const requestRefund = async (
  provider: ethers.providers.Web3Provider,
  signer: ethers.Signer,
  projectId: number,
) => {
  const contract = connectToIdoContract(provider, signer)

  // 执行退款交易
  const tx = await contract.refund(projectId)
  return await tx.wait()
}
