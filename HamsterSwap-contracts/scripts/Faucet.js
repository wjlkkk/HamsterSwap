const { getSavedContractAddresses } = require("./utils");
const hre = require("hardhat");
const { ethers } = hre;

async function addFaucet() {
    const faucetAddress = getSavedContractAddresses()["31337"]?.Faucet;
    const cakeAddress = getSavedContractAddresses()["31337"]?.CakeToken;
    const fu = await hre.ethers.getContractAt("Faucet", faucetAddress);
    const cake = await hre.ethers.getContractAt("CAKE",cakeAddress);

    //mint 给水龙头1000000个代币
    const tx = await cake.mint(faucetAddress,1000000 * 10 ** 18);
    await tx.wait();
    const balance = await cake.balanceOf(faucetAddress);
    console.log(`Faucet balance: ${ethers.utils.formatEther(balance)} CAKE`);
}

addFaucet()