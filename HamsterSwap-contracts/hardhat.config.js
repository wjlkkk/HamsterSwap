require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.28",
  networks: {
    // sepolia: {
    //   url: `https://eth-sepolia.g.alchemy.com/v2/${process.env.ALCHEMY_API_KEY}`, // 替换为你的 Alchemy API 密钥
    //   accounts: [`${process.env.PRIVATE_KEY}`] // 替换为你的钱包私钥
    // },
    localhost: {
      url: "http://127.0.0.1:8545", // 本地链的默认地址
      accounts: ["0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"] // 替换为你的钱包私钥
    }
  }
};
