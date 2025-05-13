import { ethers } from "ethers"
import { getContractAddress } from "@/utils/contract-addresses"

// 完整的ERC20 ABI，包含所有标准方法和扩展方法
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

// 已部署的代币列表 - 返回空数组，由用户手动添加代币
export const getDeployedTokens = async () => {
  return []
}

// 获取代币信息 - 直接从合约获取
export async function getTokenInfo(tokenAddress: string, provider: ethers.BrowserProvider) {
  try {
    console.log("正在获取代币信息:", tokenAddress)

    // 验证地址格式
    const formattedAddress = ethers.getAddress(tokenAddress.trim())
    console.log("格式化后的地址:", formattedAddress)

    // 创建合约实例
    const tokenContract = new ethers.Contract(formattedAddress, ERC20_ABI, provider)

    // 尝试调用基本方法以验证合约
    const [name, symbol, decimals, totalSupply] = await Promise.all([
      tokenContract.name().catch(() => "Unknown Token"),
      tokenContract.symbol().catch(() => "???"),
      tokenContract.decimals().catch(() => 18),
      tokenContract.totalSupply().catch(() => ethers.parseEther("0")),
    ])

    console.log("获取到代币信息:", { name, symbol, decimals, totalSupply: ethers.formatUnits(totalSupply, decimals) })

    // 尝试获取owner，如果合约支持的话
    let owner = null
    try {
      owner = await tokenContract.owner()
      console.log("代币所有者:", owner)
    } catch (e) {
      console.log("Token does not have owner method")
    }

    // 尝试获取暂停状态，如果合约支持的话
    let paused = false
    try {
      paused = await tokenContract.paused()
      console.log("代币暂停状态:", paused)
    } catch (e) {
      console.log("Token does not have paused method")
    }

    return {
      address: formattedAddress,
      name,
      symbol,
      decimals,
      totalSupply: ethers.formatUnits(totalSupply, decimals),
      owner,
      paused,
    }
  } catch (error) {
    console.error("获取代币信息失败:", error)
    throw new Error(`无法获取代币信息: ${error.message || "未知错误"}`)
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
    console.error("获取代币余额失败:", error)
    throw new Error(`获取代币余额失败: ${error.message || "未知错误"}`)
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
    console.error("检查授权额度失败:", error)
    throw new Error(`检查授权额度失败: ${error.message || "未知错误"}`)
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
    console.error("授权代币失败:", error)
    throw new Error(`授权代币失败: ${error.message || "未知错误"}`)
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
    console.error("转移代币失败:", error)
    throw new Error(`转移代币失败: ${error.message || "未知错误"}`)
  }
}

// 铸造代币
export async function mintTokens(
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
    const tx = await tokenWithSigner.mint(recipientAddress, parsedAmount)

    // 等待交易确认
    const receipt = await tx.wait()
    return receipt
  } catch (error) {
    console.error("铸造代币失败:", error)
    throw new Error(`铸造代币失败: ${error.message || "未知错误"}`)
  }
}

// 销毁代币
export async function burnTokens(
  tokenAddress: string,
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
    const tx = await tokenWithSigner.burn(parsedAmount)

    // 等待交易确认
    const receipt = await tx.wait()
    return receipt
  } catch (error) {
    console.error("销毁代币失败:", error)
    throw new Error(`销毁代币失败: ${error.message || "未知错误"}`)
  }
}

// 暂停代币
export async function pauseToken(tokenAddress: string, provider: ethers.BrowserProvider, signer: ethers.Signer) {
  try {
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider)
    const tokenWithSigner = tokenContract.connect(signer)

    // 发送交易
    const tx = await tokenWithSigner.pause()

    // 等待交易确认
    const receipt = await tx.wait()
    return receipt
  } catch (error) {
    console.error("暂停代币失败:", error)
    throw new Error(`暂停代币失败: ${error.message || "未知错误"}`)
  }
}

// 恢复代币
export async function unpauseToken(tokenAddress: string, provider: ethers.BrowserProvider, signer: ethers.Signer) {
  try {
    const tokenContract = new ethers.Contract(tokenAddress, ERC20_ABI, provider)
    const tokenWithSigner = tokenContract.connect(signer)

    // 发送交易
    const tx = await tokenWithSigner.unpause()

    // 等待交易确认
    const receipt = await tx.wait()
    return receipt
  } catch (error) {
    console.error("恢复代币失败:", error)
    throw new Error(`恢复代币失败: ${error.message || "未知错误"}`)
  }
}
