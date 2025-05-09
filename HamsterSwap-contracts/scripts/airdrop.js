const { getSavedContractAddresses } = require("./utils");
const hre = require("hardhat");
const { ethers } = hre;
async function Airdropinit() {
    const addresses = getSavedContractAddresses();
    const localhost = "31337";
    const CakeTokenAddress = addresses[localhost]?.CakeToken;
    const TakeTokenAddress = addresses[localhost]?.TakeToken;
    const AirdropAddress = addresses[localhost]?.Airdrop;
    console.log("CakeTokenAddress:", CakeTokenAddress);
    console.log("TakeTokenAddress:", TakeTokenAddress);
    console.log("AirdropAddress:", AirdropAddress);
    const cake = await hre.ethers.getContractAt("CAKE", CakeTokenAddress);
    let tx = await cake.mint(
        AirdropAddress,
        ethers.parseEther("10000")
    );
    await tx.wait();
    const balance = await cake.balanceOf(AirdropAddress);
    console.log(tx);
    console.log("Airdrop balance of CAKE token: ", ethers.formatEther(balance));
    // create airdrop 
    
}

async function createAirdrop() {
    const addresses = getSavedContractAddresses();
    const localhost = "31337";
    const AirdropAddress = addresses[localhost]?.Airdrop;
    const airdrop = await hre.ethers.getContractAt("AirDrop", AirdropAddress);
    const TakeTokenAddress = addresses[localhost]?.TakeToken;
    const merkleRoot = "0x7f8b9a1c562e4d73b33a9c0f1d2e6a5d0c4b3f8e1a2d5c7b6e3f0a9d1e2c4d6f";
    console.log("createAirdrop");
    let tx = await airdrop.createAirdrop(
        TakeTokenAddress,
        1000,
        Date.now(),
        Date.now() + 1000 * 60 * 60 * 24 * 30,
        merkleRoot
    );
    await tx.wait();
    console.log(tx);
}

async function getAirdrop() {
    const addresses = getSavedContractAddresses();
    const localhost = "31337";
    const AirdropAddress = addresses[localhost]?.Airdrop;
    const airdrop = await hre.ethers.getContractAt("AirDrop", AirdropAddress);
    const TakeTokenAddress = addresses[localhost]?.TakeToken;
    const merkleRoot = "0x7f8b9a1c562e4d73b33a9c0f1d2e6a5d0c4b3f8e1a2d5c7b6e3f0a9d1e2c4d6f";
    console.log("getAirdrop");
    let tx = await airdrop.getAirdropInfo(0);
    console.log(tx);
}
Airdropinit()
    .then(() => createAirdrop())
    .then(() => getAirdrop())
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
//createAirdrop()