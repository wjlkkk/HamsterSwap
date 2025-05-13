pragma solidity ^0.8.0;
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Faucet is Ownable {

    constructor(address initialOwner) Ownable(initialOwner) {}
    uint256 public  MAX_COOLDOWN_PERIOD ;
    mapping (address => mapping(address => uint256)) public MAX_TOKENS_PER_REQUEST;
    mapping (address => mapping(address => uint256)) public lastRequestTime;

    function getTokenBalance(address token) external view returns (uint256){
        // 获取指定代币的余额
        return IERC20(token).balanceOf(address(this));
    }
    function getLastRequestTime(address user, address token) external view returns (uint256){
        return lastRequestTime[user][token];
    }
    function cooldownPeriod() external view returns (uint256){
        return MAX_COOLDOWN_PERIOD;
    }
    function tokensPerRequest(address token) external view returns (uint256){
        return MAX_TOKENS_PER_REQUEST[token][msg.sender];
    }
    // 写入函数
    function requestTokens(address token) external returns (bool) {
        uint256 MAX = MAX_TOKENS_PER_REQUEST[token][msg.sender];
        require(block.timestamp >= lastRequestTime[msg.sender][token] + MAX_COOLDOWN_PERIOD, "Please wait before requesting again");
        require(IERC20(token).balanceOf(address(this)) >= MAX, "Not enough tokens in the faucet");
        lastRequestTime[msg.sender][token] = block.timestamp;
        bool ok = IERC20(token).transfer(msg.sender, MAX);
        return ok;
    }
    
    function addToken(address token, uint256 amount) external returns (bool){
        require(token!=address(0),"Invalid token");
        bool ok = IERC20(token).transferFrom(msg.sender,address(this),amount);
        return ok;
    }

    function setTokensPerRequest(address token, uint256 amount) external onlyOwner returns (bool){
        require(amount >0 , "Invalid amount");
        MAX_TOKENS_PER_REQUEST[token][msg.sender] = amount;
        return true;
    }
    function setCooldownPeriod(uint256 period) onlyOwner external returns (bool){
        MAX_COOLDOWN_PERIOD = period;
        return true;
    }
    function withdrawTokens(address token, uint256 amount) onlyOwner external returns  (bool) {
        bool ok = IERC20(token).transfer(msg.sender,amount);
        require(ok, "Transfer failed");
        return ok;
    }
}