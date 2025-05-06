# HamsterSwap 智能合约集成指南

本文档提供了关于如何将前端与HamsterSwap的Farm、IDO和Airdrop智能合约进行集成的详细说明。

## 目录

1. [概述](#概述)
2. [合约文件](#合约文件)
3. [Farm合约集成](#farm合约集成)
4. [IDO合约集成](#ido合约集成)
5. [Airdrop合约集成](#airdrop合约集成)
6. [需要提供的信息](#需要提供的信息)
7. [测试与部署](#测试与部署)

## 概述

HamsterSwap前端应用需要与三个主要的智能合约进行交互：

1. **Farm合约**：用于质押LP代币和获取奖励
2. **IDO合约**：用于参与初始DEX发行并认购新代币
3. **Airdrop合约**：用于管理和领取代币空投

这些合约的交互逻辑已经在前端代码中实现，但需要合约工程师提供实际部署的合约地址和ABI。

## 合约文件

前端与合约交互的主要文件位于：

- `contracts/farm-contract.ts` - Farm合约交互逻辑
- `contracts/ido-contract.ts` - IDO合约交互逻辑
- `contracts/airdrop-contract.ts` - Airdrop合约交互逻辑
- `hooks/use-farm-contract.tsx` - Farm合约React Hook
- `hooks/use-ido-contract.tsx` - IDO合约React Hook
- `hooks/use-airdrop-contract.tsx` - Airdrop合约React Hook

## Farm合约集成

### 合约接口

Farm合约需要实现以下主要功能：

1. **查询功能**：
   - 获取农场信息
   - 获取用户质押信息
   - 获取待领取奖励

2. **交易功能**：
   - 质押LP代币
   - 解质押LP代币
   - 收获奖励
   - 紧急提款

### 所需ABI

Farm合约的ABI已在`contracts/farm-contract.ts`中定义，包括以下主要函数：

\`\`\`javascript
[
  // 只读函数
  "function getFarmInfo(uint256 _pid) external view returns (address lpToken, address rewardToken, uint256 allocPoint, uint256 lastRewardBlock, uint256 accRewardPerShare, uint256 totalStaked)",
  "function poolLength() external view returns (uint256)",
  "function rewardPerBlock() external view returns (uint256)",
  "function totalAllocPoint() external view returns (uint256)",
  "function userInfo(uint256 _pid, address _user) external view returns (uint256 amount, uint256 rewardDebt)",
  "function pendingReward(uint256 _pid, address _user) external view returns (uint256)",
  
  // 写入函数
  "function deposit(uint256 _pid, uint256 _amount) external",
  "function withdraw(uint256 _pid, uint256 _amount) external",
  "function emergencyWithdraw(uint256 _pid) external",
  "function harvest(uint256 _pid) external",
  
  // 事件
  "event Deposit(address indexed user, uint256 indexed pid, uint256 amount)",
  "event Withdraw(address indexed user, uint256 indexed pid, uint256 amount)",
  "event EmergencyWithdraw(address indexed user, uint256 indexed pid, uint256 amount)",
  "event Harvest(address indexed user, uint256 indexed pid, uint256 amount)"
]
\`\`\`

### 集成步骤

1. 部署Farm合约
2. 更新`contracts/farm-contract.ts`中的`FARM_CONTRACT_ADDRESS`变量
3. 确认ABI与实际部署的合约匹配
4. 测试基本功能：查询农场列表、质押、解质押和收获

## IDO合约集成

### 合约接口

IDO合约需要实现以下主要功能：

1. **查询功能**：
   - 获取项目信息
   - 获取用户分配信息
   - 检查白名单状态

2. **交易功能**：
   - 参与IDO
   - 领取代币
   - 申请退款

3. **管理功能**：
   - 创建项目
   - 管理白名单
   - 取消/完成项目

### 所需ABI

IDO合约的ABI已在`contracts/ido-contract.ts`中定义，包括以下主要函数：

\`\`\`javascript
[
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
  "event ProjectFinalized(uint256 indexed projectId, uint256 totalRaised)"
]
\`\`\`

### 集成步骤

1. 部署IDO合约
2. 更新`contracts/ido-contract.ts`中的`IDO_CONTRACT_ADDRESS`变量
3. 确认ABI与实际部署的合约匹配
4. 测试基本功能：查询项目列表、参与IDO和领取代币

## Airdrop合约集成

### 合约接口

Airdrop合约需要实现以下主要功能：

1. **查询功能**：
   - 获取空投活动信息
   - 获取用户资格信息
   - 检查资格条件

2. **交易功能**：
   - 领取空投代币
   - 批量领取多个空投

3. **管理功能**：
   - 创建空投活动
   - 设置用户资格列表
   - 激活/停用/取消空投
   - 提取未领取的代币

### 所需ABI

Airdrop合约的ABI已在`contracts/airdrop-contract.ts`中定义，包括以下主要函数：

\`\`\`javascript
[
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
  "event UnclaimedTokensWithdrawn(uint256 indexed airdropId, uint256 amount)"
]
\`\`\`

### 集成步骤

1. 部署Airdrop合约
2. 更新`contracts/airdrop-contract.ts`中的`AIRDROP_CONTRACT_ADDRESS`变量
3. 确认ABI与实际部署的合约匹配
4. 测试基本功能：查询空投列表、检查资格和领取空投

## 需要提供的信息

作为合约工程师，您需要提供以下信息：

1. **Farm合约**：
   - 部署的合约地址
   - 完整的合约ABI（如果与预定义的不同）
   - 每个农场的LP代币地址
   - 奖励代币地址

2. **IDO合约**：
   - 部署的合约地址
   - 完整的合约ABI（如果与预定义的不同）
   - IDO项目的代币地址
   - 项目的详细信息（价格、上限、时间等）

3. **Airdrop合约**：
   - 部署的合约地址
   - 完整的合约ABI（如果与预定义的不同）
   - 空投活动的代币地址
   - 空投的详细信息（总量、时间、资格条件等）

4. **测试账户**：
   - 具有一些LP代币和ETH的测试账户
   - 已添加到白名单的测试账户（如果IDO需要白名单）
   - 符合空投资格条件的测试账户

## 测试与部署

### 测试环境

1. 在测试网（如Goerli或Sepolia）上部署合约
2. 使用测试账户验证所有功能
3. 确认前端正确显示所有信息并处理交易

### 生产环境

1. 在主网上部署合约
2. 更新前端配置以使用主网合约地址
3. 进行最终测试并确认一切正常工作

### 安全考虑

1. 确保合约已经过审计
2. 实现紧急暂停功能
3. 限制管理员功能的访问
4. 确保用户资金安全

如有任何问题或需要进一步的信息，请联系前端开发团队。
