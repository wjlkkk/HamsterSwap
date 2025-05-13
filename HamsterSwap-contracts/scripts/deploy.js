const hre = require("hardhat");
const { saveContractAddress } = require("./utils");

const ownerAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

async function deployToken(networkName) {
    try {
        console.log("Deploying Cake Token...");
        const CakeToken = await hre.ethers.getContractFactory("CAKE");
        const cake = await CakeToken.deploy(ownerAddress);
        await cake.waitForDeployment();
        const cakeAddress = await cake.getAddress();
        console.log(`Cake Token deployed to: ${cakeAddress}`);
        saveContractAddress(networkName, "CakeToken", cakeAddress);

        console.log("Deploying Take Token...");
        const TakeToken = await hre.ethers.getContractFactory("TAKE");
        const take = await TakeToken.deploy(ownerAddress);
        await take.waitForDeployment();
        const takeAddress = await take.getAddress();
        console.log(`Take Token deployed to: ${takeAddress}`);
        saveContractAddress(networkName, "TakeToken", takeAddress);

        return { cake, take };
    } catch (error) {
        console.error("Error deploying tokens:", error);
        throw error;
    }
}

async function deployAirdrop(networkName) {
    try {
        console.log("Deploying Airdrop Contract...");
        const Airdrop = await hre.ethers.getContractFactory("AirDrop");
        const airdrop = await Airdrop.deploy(ownerAddress);
        await airdrop.waitForDeployment();
        const airdropAddress = await airdrop.getAddress();
        console.log(`Airdrop Contract deployed to: ${airdropAddress}`);
        saveContractAddress(networkName, "Airdrop", airdropAddress);
        return airdrop;
    } catch (error) {
        console.error("Error deploying Airdrop:", error);
        throw error;
    }
}

async function deployFarm(cakeAddress, networkName) {
    try {
        console.log("Deploying Farm Contract...");
        const Farm = await hre.ethers.getContractFactory("farm");
        const farm = await Farm.deploy(cakeAddress, ownerAddress, 10); // 示例参数，请根据实际修改
        await farm.waitForDeployment();
        const farmAddress = await farm.getAddress();
        console.log(`Farm Contract deployed to: ${farmAddress}`);
        saveContractAddress(networkName, "Farm", farmAddress);
        return farm;
    } catch (error) {
        console.error("Error deploying Farm:", error);
        throw error;
    }
}

async function deployIDO(cakeAddress, networkName) {
    try {
        console.log("Deploying IDO Contract...");
        const IDO = await hre.ethers.getContractFactory("IDO");
        const ido = await IDO.deploy(cakeAddress, ownerAddress);
        await ido.waitForDeployment();
        const idoAddress = await ido.getAddress();
        console.log(`IDO Contract deployed to: ${idoAddress}`);
        saveContractAddress(networkName, "IDO", idoAddress);
        return ido;
    } catch (error) {
        console.error("Error deploying IDO:", error);
        throw error;
    }
}

async function deployFaucet(networkName) {
    try{
        console.log("Deploy Faucet Contract...");
        const faucet = await hre.ethers.getContractFactory("Faucet");
        const Faucet = await faucet.deploy(ownerAddress);
        await Faucet.waitForDeployment();
        const faucetAddress = await Faucet.getAddress();
        console.log(`Faucet Contract deployed to: ${faucetAddress}`);
        saveContractAddress(networkName, "Faucet", faucetAddress);
    } catch (error) {
        console.error("Error deploying Faucet:", error);
        throw error;
    }
}

async function main() {
    try {
        const networkID = "31337"; // Replace with your network ID
        console.log(`Running on network: ${networkID}`);

        const { cake, take } = await deployToken(networkID);
        const airdrop = await deployAirdrop(networkID);
        const cakeAddress = await cake.getAddress();
        const farm = await deployFarm(cakeAddress, networkID);
        const ido = await deployIDO(cakeAddress, networkID);
        await deployFaucet(networkID);

        console.log("✅ All contracts deployed and addresses saved.");
        const tx = await cake.mint(airdrop.getAddress(), ethers.parseEther("10000"));
        await tx.wait();
        const balance = await cake.balanceOf(airdrop.getAddress());
        console.log(`Airdrop balance of CAKE token: ${ethers.formatEther(balance)}`);
        
        const tx2 = await cake.mint(ownerAddress, ethers.parseEther("10000"));
        await tx2.wait();
        const balance2 = await cake.balanceOf(ownerAddress);
        console.log(`Owner balance of CAKE token: ${ethers.formatEther(balance2)}`);

        const tx3 = await take.mint(ownerAddress, ethers.parseEther("10000"));
        await tx3.wait();
        const balance3 = await take.balanceOf(ownerAddress);
        console.log(`Owner balance of TAKE token: ${ethers.formatEther(balance3)}`);
    } catch (error) {
        console.error("❌ Deployment failed:", error);
        process.exit(1);
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });