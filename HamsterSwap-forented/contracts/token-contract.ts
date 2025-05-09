import { ethers } from "ethers"
import { getContractAddress } from "@/utils/contract-addresses"

// ERC20 ABI - 包含标准方法和扩展方法
export const ERC20_ABI = [
  // 读取函数
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address owner) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function owner() view returns (address)",
  "function paused() view returns (bool)",
  // 写入函数
  "function transfer(address to, uint amount) returns (bool)",
  "function approve(address spender, uint256 amount) returns (bool)",
  "function transferFrom(address sender, address recipient, uint256 amount) returns (bool)",
  "function mint(address to, uint256 amount) returns (bool)",
  "function burn(uint256 amount) returns (bool)",
  "function pause() returns (bool)",
  "function unpause() returns (bool)",
]

// 获取空投合约地址
export const getAirdropContractAddress = async () => {
  return await getContractAddress("Airdrop")
}

// 已部署的代币列表
export const getDeployedTokens = async () => {
  return [] // 返回空数组，让管理员手动添加代币
}

// 获取代币信息
export async function getTokenInfo(tokenAddress: string, provider: ethers.BrowserProvider) {
  try {
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider)

    const [name, symbol, decimals] = await Promise.all([
      tokenContract.name(),
      tokenContract.symbol(),
      tokenContract.decimals(),
    ])

    // 尝试获取owner，如果合约支持的话
    let owner = null
    try {
      owner = await tokenContract.owner()
    } catch (e) {
      console.log("Token does not have owner method")
    }

    return {
      address: tokenAddress,
      name,
      symbol,
      decimals,
      owner,
    }
  } catch (error) {
    console.error("Error getting token info:", error)
    throw new Error("Failed to get token information")
  }
}

// 获取代币余额
export async function getTokenBalance(tokenAddress: string, accountAddress: string, provider: ethers.BrowserProvider) {
  try {
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider)
    const balance = await tokenContract.balanceOf(accountAddress)
    const decimals = await tokenContract.decimals()

    return {
      raw: balance,
      formatted: ethers.formatUnits(balance, decimals),
      decimals,
    }
  } catch (error) {
    console.error("Error getting token balance:", error)
    throw new Error("Failed to get token balance")
  }
}

// 检查授权额度
export async function checkAllowance(
  tokenAddress: string,
  ownerAddress: string,
  spenderAddress: string,
  provider: ethers.BrowserProvider,
) {
  try {
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider)
    const allowance = await tokenContract.allowance(ownerAddress, spenderAddress)
    const decimals = await tokenContract.decimals()

    return {
      raw: allowance,
      formatted: ethers.formatUnits(allowance, decimals),
      decimals,
    }
  } catch (error) {
    console.error("Error checking allowance:", error)
    throw new Error("Failed to check token allowance")
  }
}

// 批准代币使用
export async function approveTokens(
  tokenAddress: string,
  spenderAddress: string,
  amount: string,
  provider: ethers.BrowserProvider,
  signer: ethers.Signer,
) {
  try {
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider)
    const tokenWithSigner = tokenContract.connect(signer)
    const decimals = await tokenContract.decimals()

    // 将金额转换为正确的单位
    const parsedAmount = ethers.parseUnits(amount, decimals)

    // 发送交易
    const tx = await tokenWithSigner.approve(spenderAddress, parsedAmount)

    // 等待交易确认
    const receipt = await tx.wait()
    return receipt
  } catch (error) {
    console.error("Error approving tokens:", error)
    throw new Error("Failed to approve tokens")
  }
}

// 转移代币
export async function transferTokens(
  tokenAddress: string,
  recipientAddress: string,
  amount: string,
  provider: ethers.BrowserProvider,
  signer: ethers.Signer,
) {
  try {
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider)
    const tokenWithSigner = tokenContract.connect(signer)
    const decimals = await tokenContract.decimals()

    // 将金额转换为正确的单位
    const parsedAmount = ethers.parseUnits(amount, decimals)

    // 发送交易
    const tx = await tokenWithSigner.transfer(recipientAddress, parsedAmount)

    // 等待交易确认
    const receipt = await tx.wait()
    return receipt
  } catch (error) {
    console.error("Error transferring tokens:", error)
    throw new Error("Failed to transfer tokens")
  }
}

// 从一个地址转移代币到另一个地址（需要授权）
export async function transferFromTokens(
  tokenAddress: string,
  fromAddress: string,
  toAddress: string,
  amount: string,
  provider: ethers.BrowserProvider,
  signer: ethers.Signer,
) {
  try {
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider)
    const tokenWithSigner = tokenContract.connect(signer)
    const decimals = await tokenContract.decimals()

    // 将金额转换为正确的单位
    const parsedAmount = ethers.parseUnits(amount, decimals)

    // 发送交易
    const tx = await tokenWithSigner.transferFrom(fromAddress, toAddress, parsedAmount)

    // 等待交易确认
    const receipt = await tx.wait()
    return receipt
  } catch (error) {
    console.error("Error transferring tokens from address:", error)
    throw new Error("Failed to transfer tokens from address")
  }
}
