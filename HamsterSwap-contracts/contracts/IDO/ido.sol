// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";


contract IDO is Ownable {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    // Project信息结构体
    struct ProjectInfo {
        IERC20 tokenAddress; // 代币地址
        uint256 tokenPrice; // 代币价格
        uint256 softCap; // 软顶
        uint256 hardCap; // 硬顶
        uint256 minAllocation; // 最小认购额度
        uint256 maxAllocation; // 最大认购额度
        uint256 startTime; // 开始时间
        uint256 endTime; // 结束时间
        uint256 totalRaised; // 已筹集金额
        bool isCancelled; // 是否取消
        bool isFinalized; // 是否已完成
    }
    // User信息结构体
    struct UserInfo {
        uint256 amount; // 认购金额
        bool claimed; // 是否已认领
    }

    ProjectInfo[] public projects; // 存储项目

    mapping(uint256 => mapping(address => UserInfo)) public userAllocations; // 用户认购额度
    mapping(uint256 => mapping(address => bool)) public whitelistedUsers; // 白名单用户
    // 只读函数
    function getProjectInfo(uint256 _projectId) external view returns (address tokenAddress, uint256 tokenPrice, uint256 softCap, uint256 hardCap, uint256 minAllocation, uint256 maxAllocation, uint256 startTime, uint256 endTime, uint256 totalRaised, bool isCancelled, bool isFinalized) {
        ProjectInfo memory project = projects[_projectId];
        return (
            address(project.tokenAddress),
            project.tokenPrice,
            project.softCap,
            project.hardCap,
            project.minAllocation,
            project.maxAllocation,
            project.startTime,
            project.endTime,
            project.totalRaised,
            project.isCancelled,
            project.isFinalized
        );
    }
    function projectsCount() external view returns (uint256){
        return projects.length;
    }
    function getUserAllocation(uint256 _projectId, address _user) external view returns (uint256 amount, bool claimed) {
        UserInfo memory user = userAllocations[_projectId][_user];
        return (user.amount, user.claimed);
    }
    function isWhitelisted(uint256 _projectId, address _user) external view returns (bool){
        return whitelistedUsers[_projectId][_user];
    }

    // 写入函数
    function participate(uint256 _projectId) external payable {
        ProjectInfo storage project = projects[_projectId];
        require(project.startTime <= block.timestamp, "IDO not started");
        require(project.endTime >= block.timestamp, "IDO ended");
        require(!project.isCancelled, "IDO cancelled");
        require(!project.isFinalized, "IDO finalized");
        require(whitelistedUsers[_projectId][msg.sender], "User not whitelisted");
        require(msg.value >= project.minAllocation && msg.value <= project.maxAllocation, "Invalid allocation amount");
        require(project.totalRaised.add(msg.value) <= project.hardCap, "Hard cap reached");
        require(userAllocations[_projectId][msg.sender].amount.add(msg.value) <= project.maxAllocation, "Max allocation exceeded");
        project.totalRaised = project.totalRaised.add(msg.value);
        userAllocations[_projectId][msg.sender].amount = userAllocations[_projectId][msg.sender].amount.add(msg.value);
        emit Participated(_projectId, msg.sender, msg.value);
    }
    function claim(uint256 _projectId) external {
        ProjectInfo storage project = projects[_projectId];
        Userinfo storage user = userAllocations[_projectId][msg.sender];
        require(!project.isCancelled,"IDO cancelled");
        require(block.timestamp > project.starTime,"IDO not started");
        require(user.amount >0 , "User doesn't participate");
        require(!user.claimed,"User has claimed");
        user.claimed = true;
        IERC20(project.tokenAddress).transfer(msg.sender,user.amount);
        
    }
    function refund(uint256 _projectId) external {
        ProjectInfo storage project = projects[_projectId];
        UserInfo storage user = userAllocations[_projectId][msg.sender];
        require(project.isCancelled, "IDO not cancelled");
        require(user.amount > 0, "User doesn't participate");
        require(!user.claimed, "User has claimed");
        uint256 refundAmount = user.amount;
        user.amount = 0;
        payable(msg.sender).transfer(refundAmount);
        emit Refunded(_projectId, msg.sender, refundAmount);
    }

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
}