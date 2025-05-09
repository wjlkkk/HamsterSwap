// SPDX-License-Identifier: MIT
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract farm is Ownable {
    // 奖励代币（Cake）
    IERC20 public immutable Cake;

    // 全局变量
    uint256 public rewardPerBlock; // 每区块奖励数量
    uint256 public endTime;        // 奖励分发结束时间
    uint256 public totalAllocPoint; // 总分配点数
    uint256 public paidout;         // 已分发的奖励总量
    uint256 public totalsupply;     // 合约中质押的总代币数量

    // 池子信息结构体
    struct FarmInfo {
        IERC20 lpToken;           // LP 代币地址
        uint256 allocPoint;       // 分配点数
        uint256 lastRewardBlock;  // 上次计算奖励的区块时间
        uint256 accRewardPerShare; // 每单位质押代币累计的奖励
        uint256 totalStaked;      // 当前池子中的总质押量
    }

    // 用户信息结构体
    struct UserInfo {
        uint256 amount;           // 用户质押的数量
        uint256 rewardDebt;       // 用户已计算的奖励债务
    }

    // 存储池子和用户信息
    FarmInfo[] public farmInfos;
    mapping(uint256 => mapping(address => UserInfo)) public userInfos;

    // 事件定义
    event Deposit(address indexed user, uint256 indexed pid, uint256 amount);
    event Withdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event EmergencyWithdraw(address indexed user, uint256 indexed pid, uint256 amount);
    event Harvest(address indexed user, uint256 indexed pid, uint256 amount);
    event PoolAdded(uint256 indexed pid, address indexed stakingToken, uint256 allocPoint);
    event PoolSet(uint256 indexed pid, uint256 allocPoint);
    event RewardPerBlockUpdated(uint256 oldValue, uint256 newValue);

    // 构造函数
    constructor(address _cake, address _Owner,uint256 _rewardPerBlock) Ownable(_Owner) {
        Cake = IERC20(_cake);
        rewardPerBlock = _rewardPerBlock;
        endTime = block.timestamp;
    }

    // 只读函数
    function getFarmInfo(uint256 _pid)
        external
        view
        returns (
            address lpToken,
            uint256 allocPoint,
            uint256 lastRewardBlock,
            uint256 accRewardPerShare,
            uint256 totalStaked
        )
    {
        FarmInfo memory farmInfo = farmInfos[_pid];
        return (
            address(farmInfo.lpToken),
            farmInfo.allocPoint,
            farmInfo.lastRewardBlock,
            farmInfo.accRewardPerShare,
            farmInfo.totalStaked
        );
    }

    function poolLength() external view returns (uint256) {
        return farmInfos.length;
    }

    function getRewardPerBlock() external view returns (uint256) {
        return rewardPerBlock;
    }

    function getTotalAllocPoint() external view returns (uint256) {
        return totalAllocPoint;
    }

    function getUserInfo(uint256 _pid, address _user)
        external
        view
        returns (uint256 amount, uint256 rewardDebt)
    {
        UserInfo memory userInfo = userInfos[_pid][_user];
        return (userInfo.amount, userInfo.rewardDebt);
    }

    // 管理员函数
    function add(
        uint256 _allocPoint,
        address _stakingToken,
        bool _withUpdate
    ) external onlyOwner {
        if (_withUpdate) {
            massUpdatePools();
        }
        uint256 lastBlockTime = block.timestamp > endTime ? endTime : block.timestamp;
        farmInfos.push(
            FarmInfo({
                lpToken: IERC20(_stakingToken),
                allocPoint: _allocPoint,
                lastRewardBlock: lastBlockTime,
                accRewardPerShare: 0,
                totalStaked: 0
            })
        );
        totalAllocPoint += _allocPoint;
        emit PoolAdded(farmInfos.length - 1, _stakingToken, _allocPoint);
    }

    function set(
        uint256 _pid,
        uint256 _allocPoint,
        bool _withUpdate
    ) external onlyOwner {
        if (_withUpdate) {
            updatePool(_pid);
        }
        FarmInfo storage farmInfo = farmInfos[_pid];
        totalAllocPoint = totalAllocPoint - farmInfo.allocPoint + _allocPoint;
        farmInfo.allocPoint = _allocPoint;
        emit PoolSet(_pid, _allocPoint);
    }

    function fund(uint256 _amount) external {
        require(_amount > 0, "Amount must be greater than zero");
        Cake.transferFrom(msg.sender, address(this), _amount);
        totalsupply += _amount;
        endTime += _amount / rewardPerBlock;
    }

    function setRewardPerBlock(uint256 _rewardPerBlock) external onlyOwner {
        uint256 oldRewardPerBlock = rewardPerBlock;
        rewardPerBlock = _rewardPerBlock;
        emit RewardPerBlockUpdated(oldRewardPerBlock, _rewardPerBlock);
    }

    function updatePool(uint256 _pid) public {
        FarmInfo storage farmInfo = farmInfos[_pid];
        uint256 lastBlockTime = block.timestamp > endTime ? endTime : block.timestamp;

        if (farmInfo.lastRewardBlock >= lastBlockTime) {
            return;
        }

        if (farmInfo.totalStaked > 0) {
            uint256 noOfBlocks = lastBlockTime - farmInfo.lastRewardBlock;
            uint256 rewardAmount = (noOfBlocks * rewardPerBlock * farmInfo.allocPoint) /
                totalAllocPoint;
            farmInfo.accRewardPerShare +=
                (rewardAmount * 1e18) /
                farmInfo.totalStaked;
        }

        farmInfo.lastRewardBlock = lastBlockTime;
    }

    function massUpdatePools() public {
        for (uint256 i = 0; i < farmInfos.length; ++i) {
            updatePool(i);
        }
    }

    // 写入函数
    function deposit(uint256 _pid, uint256 _amount) external {
        FarmInfo storage farmInfo = farmInfos[_pid];
        UserInfo storage userInfo = userInfos[_pid][msg.sender];

        updatePool(_pid);

        if (userInfo.amount > 0) {
            uint256 pending = (userInfo.amount * farmInfo.accRewardPerShare) / 1e18 -
                userInfo.rewardDebt;
            if (pending > 0) {
                transferCake(msg.sender, pending);
            }
        }

        if (_amount > 0) {
            farmInfo.lpToken.transferFrom(msg.sender, address(this), _amount);
            farmInfo.totalStaked += _amount;
            userInfo.amount += _amount;
        }

        userInfo.rewardDebt = (userInfo.amount * farmInfo.accRewardPerShare) / 1e18;
        emit Deposit(msg.sender, _pid, _amount);
    }

    function withdraw(uint256 _pid, uint256 _amount) external {
        FarmInfo storage farmInfo = farmInfos[_pid];
        UserInfo storage userInfo = userInfos[_pid][msg.sender];

        require(userInfo.amount >= _amount, "Withdraw: not enough balance");

        updatePool(_pid);

        uint256 pending = (userInfo.amount * farmInfo.accRewardPerShare) / 1e18 -
            userInfo.rewardDebt;
        if (pending > 0) {
            transferCake(msg.sender, pending);
        }

        if (_amount > 0) {
            farmInfo.lpToken.transfer(msg.sender, _amount);
            farmInfo.totalStaked -= _amount;
            userInfo.amount -= _amount;
        }

        userInfo.rewardDebt = (userInfo.amount * farmInfo.accRewardPerShare) / 1e18;
        emit Withdraw(msg.sender, _pid, _amount);
    }

    function emergencyWithdraw(uint256 _pid) external {
        FarmInfo storage farmInfo = farmInfos[_pid];
        UserInfo storage userInfo = userInfos[_pid][msg.sender];

        uint256 amount = userInfo.amount;
        require(amount > 0, "EmergencyWithdraw: no balance to withdraw");

        farmInfo.lpToken.transfer(msg.sender, amount);
        farmInfo.totalStaked -= amount;

        userInfo.amount = 0;
        userInfo.rewardDebt = 0;

        emit EmergencyWithdraw(msg.sender, _pid, amount);
    }

    function harvest(uint256 _pid) external {
        FarmInfo storage farmInfo = farmInfos[_pid];
        UserInfo storage userInfo = userInfos[_pid][msg.sender];

        updatePool(_pid);

        uint256 pending = (userInfo.amount * farmInfo.accRewardPerShare) / 1e18 -
            userInfo.rewardDebt;

        require(pending > 0, "Harvest: no rewards available");

        userInfo.rewardDebt = (userInfo.amount * farmInfo.accRewardPerShare) / 1e18;
        transferCake(msg.sender, pending);

        emit Harvest(msg.sender, _pid, pending);
    }

    // 转移奖励的辅助函数
    function transferCake(address _to, uint256 _amount) private {
        Cake.transfer(_to, _amount);
        paidout += _amount;
    }
}