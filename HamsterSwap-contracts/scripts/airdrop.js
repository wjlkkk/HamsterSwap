const hre = require("hardhat");

const ownerAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

// Function to deploy the Cake token contract
async function deployToken() {
    try {
        console.log("Deploying Cake Token...");
        const CakeToken = await hre.ethers.getContractFactory("CAKE");
        const cake = await CakeToken.deploy(ownerAddress);
        await cake.waitForDeployment();

        const cakeAddress = await cake.getAddress();
        console.log(`Cake Token deployed to: ${cakeAddress}`);

        // Mint total supply to the owner address
        const totalSupply = BigInt(100000000000) * BigInt(10) ** (await cake.decimals());
        const mintTx = await cake.mint(ownerAddress, totalSupply);
        await mintTx.wait(); // Wait for the transaction to be mined
        console.log(`Minted ${totalSupply} tokens to owner address: ${ownerAddress}`);

        return cake;
    } catch (error) {
        console.error("Error deploying Cake Token:", error);
        throw error; // Re-throw the error to stop execution if needed
    }
}

// Function to deploy the Airdrop contract
async function deployAirdrop() {
    try {
        console.log("Deploying Airdrop Contract...");
        const Airdrop = await hre.ethers.getContractFactory("AirDrop");
        const airdrop = await Airdrop.deploy(ownerAddress);
        await airdrop.waitForDeployment();

        const airdropAddress = await airdrop.getAddress();
        console.log(`Airdrop Contract deployed to: ${airdropAddress}`);

        return airdrop;
    } catch (error) {
        console.error("Error deploying Airdrop Contract:", error);
        throw error; // Re-throw the error to stop execution if needed
    }
}

// Main function to execute deployment
async function main() {
    try {
        //const cake = await deployToken();
        const airdrop = await deployAirdrop();

        // Optionally, approve the airdrop contract to spend tokens
        console.log("Approving Airdrop Contract to spend tokens...");
        const airdropAddress = await airdrop.getAddress();
        //const approveTx = await cake.approve(airdropAddress, ethers.MaxUint256); // Approve unlimited amount
        //await approveTx.wait(); // Wait for the transaction to be mined
        //console.log("Airdrop Contract approved to spend tokens.");
    } catch (error) {
        console.error("Deployment failed:", error);
    }
}

// Execute the main function
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Unhandled error:", error);
        process.exit(1);
    });