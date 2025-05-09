// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.0.0
pragma solidity ^0.8.0;
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract AirDrop is Ownable{
    // 只读函数
    constructor (address _initialOwner) Ownable(_initialOwner){}
    
    struct Airdropinfo{
        IERC20 tokenAddress;
        uint totalAmount;
        uint claimedAmount;
        uint startTime;
        uint endTime;
        bool isActive;
        bool isCancelled;
        bytes32 merkleRoot;
    }
    
    Airdropinfo[] public AirDropinfos;

    struct userinfo{
        bool isEligible;
        uint amount;
        bool claimed;
    }
    mapping (uint =>mapping (address => userinfo)) userEligibilityinfo;


    function getAirdropInfo(uint256 _airdropId) external view returns (address tokenAddress, uint256 totalAmount, uint256 claimedAmount, uint256 startTime, uint256 endTime, bool isActive, bool isCancelled){
        Airdropinfo memory airDrop = AirDropinfos[_airdropId];
        tokenAddress = address(airDrop.tokenAddress);
        totalAmount = airDrop.totalAmount;
        claimedAmount = airDrop.claimedAmount;
        startTime = airDrop.startTime;
        endTime = airDrop.endTime;
        isActive = airDrop.isActive;
        isCancelled = airDrop.isCancelled;
    }
    function airdropsCount() external view returns (uint256){
        return AirDropinfos.length;
    }
    function getUserEligibility(uint256 _airdropId, address _user) external view returns (bool isEligible, uint256 amount, bool claimed){
        userinfo storage UserIndexInfo = userEligibilityinfo[_airdropId][_user];
        return (
            UserIndexInfo.isEligible,
            UserIndexInfo.amount,
            UserIndexInfo.claimed
        );
        
    }
    function checkEligibilityCriteria(uint256 _airdropId, address _user) external view returns (bool[] memory){
        userinfo memory UserIndexInfo = userEligibilityinfo[_airdropId][_user];
        Airdropinfo memory airDrop = AirDropinfos[_airdropId];
        bool[] memory  criteria = new bool[](2);
        criteria[0] =UserIndexInfo.isEligible;
        if(airDrop.tokenAddress.balanceOf(_user) > 1000){
            criteria[1] = true;
        }
        return criteria;
    }

    //写入函数
    function claimAirdrop(uint256 _airdropId) external{
        Airdropinfo storage airDrop = AirDropinfos[_airdropId];
        require(airDrop.isActive,"Airdrop is inactive");
        require(!airDrop.isCancelled,"Airdrop is cancelled");
        require(airDrop.claimedAmount<airDrop.totalAmount,"No enough tokens in airdrop");
        require(block.timestamp >= airDrop.startTime, "Airdrop has not started yet");
        userinfo storage userIndexInfo = userEligibilityinfo[_airdropId][msg.sender];
        if (userIndexInfo.isEligible && !userIndexInfo.claimed){
            uint rewardamount = userIndexInfo.amount;
            userIndexInfo.amount -= rewardamount;
            airDrop.tokenAddress.transfer(msg.sender,rewardamount);
            userIndexInfo.claimed = true;
            airDrop.claimedAmount += rewardamount;
            emit AirdropClaimed(_airdropId,msg.sender,rewardamount);
        }else{
            revert("This user is not Eligible");
        }
    }
    function batchClaim(uint256[] calldata _airdropIds) external {
        require(_airdropIds.length>0,"Calldata is invalid");
        for (uint i =0;i<_airdropIds.length ;i++){
            try this.claimAirdrop(_airdropIds[i]) {} catch{}
        }
    }

    //管理员函数
    function createAirdrop(address _tokenAddress, uint256 _totalAmount, uint256 _startTime, uint256 _endTime, bytes32 _merkleRoot) external onlyOwner returns (uint256){
        AirDropinfos.push(Airdropinfo({
            tokenAddress:IERC20(_tokenAddress),
            totalAmount : _totalAmount,
            claimedAmount:0,
            startTime : _startTime,
            endTime:_endTime,
            isActive:false,
            isCancelled:false,
            merkleRoot : _merkleRoot
        }));
        //IERC20(_tokenAddress).transferFrom(msg.sender,address(this),_totalAmount);
        emit AirdropCreated(AirDropinfos.length-1,_tokenAddress,_totalAmount);
        return AirDropinfos.length -1;
    }
    function setEligibilityList(uint256 _airdropId, address[] calldata _users, uint256[] calldata _amounts) external onlyOwner {
        require(_users.length == _amounts.length , "Invalid calldata");
        for (uint i = 0 ; i < _users.length;i++){
            require(_users[i]!= address(0) && _amounts[i] >0,"Invalid useraddress");
            userinfo storage userIndexinfo=userEligibilityinfo[_airdropId][_users[i]];
            require(!userIndexinfo.isEligible,"Already set");
            userIndexinfo.isEligible = true;
            userIndexinfo.amount = _amounts[i];
        }
    }
    function activateAirdrop(uint256 _airdropId) external onlyOwner {
        Airdropinfo storage airdrop = AirDropinfos[_airdropId];
        //require(block.timestamp < startTime ,"AirDrop already started");
        airdrop.isActive = true;
        emit AirdropActivated(_airdropId);
        
    }
    function deactivateAirdrop(uint256 _airdropId) external onlyOwner {
        Airdropinfo storage airdrop = AirDropinfos[_airdropId];
        airdrop.isActive = false;
        emit AirdropDeactivated(_airdropId);
    }
    function cancelAirdrop(uint256 _airdropId) external onlyOwner {
        Airdropinfo storage airdrop = AirDropinfos[_airdropId];
        airdrop.isCancelled = true;
        emit AirdropCancelled(_airdropId);
    }
    function withdrawUnclaimedTokens(uint256 _airdropId) external onlyOwner {
        Airdropinfo storage airdrop = AirDropinfos[_airdropId];
        require(airdrop.claimedAmount < airdrop.totalAmount,"All Tokens has been claimed");
        uint unclaimedTokens = airdrop.totalAmount - airdrop.claimedAmount;
        airdrop.tokenAddress.transfer(msg.sender,unclaimedTokens);
        emit UnclaimedTokensWithdrawn(_airdropId,unclaimedTokens);
    }

    //事件
    event AirdropCreated(uint256 indexed airdropId, address tokenAddress, uint256 totalAmount);
    event AirdropClaimed(uint256 indexed airdropId, address indexed user, uint256 amount);
    event AirdropActivated(uint256 indexed airdropId);
    event AirdropDeactivated(uint256 indexed airdropId);
    event AirdropCancelled(uint256 indexed airdropId);
    event UnclaimedTokensWithdrawn(uint256 indexed airdropId, uint256 amount);

    function verifyMerkleProof(
        bytes32 _merkleRoot,
        bytes32[] memory _merkleProof,
        bytes32 _leaf
    ) internal pure returns (bool)  {
        bytes32 computeHash = _leaf;
        for (uint i=0;i<_merkleProof.length;i++) {
            bytes32 proofElement = _merkleProof[i];
            if (computeHash < proofElement){
                computeHash = keccak256(abi.encodePacked(computeHash,proofElement));
            }else{
                computeHash = keccak256(abi.encodePacked(proofElement,computeHash));
            }
        }
        return computeHash == _merkleRoot;
    }
}