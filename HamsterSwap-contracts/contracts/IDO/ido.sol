// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";



contract IDO is Ownable {
    IERC20 public immutable Cake;// Cake 代币地址
    using SafeERC20 for IERC20;
    // Project信息结构体
    struct ProjectInfo {
        address projectOwner; // 项目拥有者
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

    constructor (address _cake, address _Owner) Ownable(_Owner) {
        Cake = IERC20(_cake);
    }
    // 只读函数
    function getProjectInfo(uint256 _projectId) external view returns (address projectOwner,address tokenAddress, uint256 tokenPrice, uint256 softCap, uint256 hardCap, uint256 minAllocation, uint256 maxAllocation, uint256 startTime, uint256 endTime, uint256 totalRaised, bool isCancelled, bool isFinalized) {
        ProjectInfo memory project = projects[_projectId];
        return (
            project.projectOwner,
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
    function participate(uint256 _projectId , uint _amount) external payable {
        ProjectInfo storage project = projects[_projectId];
        UserInfo storage user = userAllocations[_projectId][msg.sender];
        require(project.startTime <= block.timestamp, "IDO not started");
        require(project.endTime >= block.timestamp, "IDO ended");
        require(!project.isCancelled, "IDO cancelled");
        require(!project.isFinalized, "IDO finalized");
        require(whitelistedUsers[_projectId][msg.sender], "User not whitelisted");
        require(_amount >= project.minAllocation && _amount <= project.maxAllocation, "Invalid allocation amount");
        require(project.totalRaised +_amount <= project.hardCap, "Hard cap reached");
        project.totalRaised = project.totalRaised +_amount;
        user.amount += _amount;
        Cake.safeTransferFrom(msg.sender, address(this), _amount);
        emit Participated(_projectId, msg.sender, _amount);
    }
    function claim(uint256 _projectId) external {
        ProjectInfo storage project = projects[_projectId];
        UserInfo storage user = userAllocations[_projectId][msg.sender];
        require(!project.isCancelled,"IDO cancelled");
        require(block.timestamp > project.startTime,"IDO not started");
        require(user.amount >0 , "User doesn't participate");
        require(!user.claimed,"User has claimed");
        user.claimed = true;
        uint256 tokenAmount = (user.amount * project.tokenPrice) / 1e18;
        user.amount = 0;
        IERC20(project.tokenAddress).transfer(msg.sender, tokenAmount);
        emit Claimed(_projectId, msg.sender, tokenAmount);
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
    function createProject(address _projectOwner ,address _tokenAddress, uint256 _tokenPrice, uint256 _softCap, uint256 _hardCap, uint256 _minAllocation, uint256 _maxAllocation, uint256 _startTime, uint256 _endTime) external onlyOwner returns (uint256) {
        require(_startTime < _endTime, "Invalid time range");
        require(_softCap < _hardCap, "Invalid cap range");
        require(_minAllocation < _maxAllocation, "Invalid allocation range");
        ProjectInfo memory newProject = ProjectInfo({
            projectOwner: _projectOwner,
            tokenAddress: IERC20(_tokenAddress),
            tokenPrice: _tokenPrice,
            softCap: _softCap,
            hardCap: _hardCap,
            minAllocation: _minAllocation,
            maxAllocation: _maxAllocation,
            startTime: _startTime,
            endTime: _endTime,
            totalRaised: 0,
            isCancelled: false,
            isFinalized: false
        });
        projects.push(newProject);
        emit ProjectCreated(projects.length - 1, _tokenAddress, _tokenPrice);
        return projects.length - 1;
    }
    function addToWhitelist(uint256 _projectId, address[] calldata _users) onlyOwner external {
        for (uint256 i = 0; i < _users.length; i++) {
            whitelistedUsers[_projectId][_users[i]] = true;
        }
    }
    function removeFromWhitelist(uint256 _projectId, address[] calldata _users) onlyOwner external {
        for (uint256 i = 0;i < _users.length; i++) {
            whitelistedUsers[_projectId][_users[i]] = false;
        }
    }
    function cancelProject(uint256 _projectId) onlyOwner external {
        ProjectInfo storage project = projects[_projectId];
        require(!project.isCancelled, "Project already cancelled");
        require(!project.isFinalized, "Project already finalized");
        project.isCancelled = true;
        emit ProjectCancelled(_projectId);
    }
    function finalizeProject(uint256 _projectId) onlyOwner external {
        ProjectInfo storage project = projects[_projectId];
        require(!project.isCancelled, "Project cancelled");
        require(!project.isFinalized, "Project already finalized");
        require(block.timestamp > project.endTime, "IDO not ended");
        require(project.totalRaised >= project.softCap, "Soft cap not reached");
        project.isFinalized = true;
        uint256 totalRaised = project.totalRaised;
        Cake.safeTransfer(msg.sender, totalRaised);
        emit ProjectFinalized(_projectId, totalRaised);
    }

    // 事件
    event ProjectCreated(uint256 indexed projectId, address tokenAddress, uint256 tokenPrice);
    event Participated(uint256 indexed projectId, address indexed user, uint256 amount);
    event Claimed(uint256 indexed projectId, address indexed user, uint256 amount);
    event Refunded(uint256 indexed projectId, address indexed user, uint256 amount);
    event ProjectCancelled(uint256 indexed projectId);
    event ProjectFinalized(uint256 indexed projectId, uint256 totalRaised);
}