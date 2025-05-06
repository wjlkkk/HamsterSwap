const hre = require("hardhat");

const ownerAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
const _cakeAddress = "0x5fbdb2315678afecb367f032d93f642f64180aa3";


// Function to deploy the Cake token contract
async function deployToken() {
    try {
        console.log("Deploying Cake Token...");
        const CakeToken = await hre.ethers.getContractFactory("farm");
        const cake = await CakeToken.deploy(_cakeAddress,ownerAddress,10);
        await cake.waitForDeployment();

        const cakeAddress = await cake.getAddress();
        console.log(`Cake Token deployed to: ${cakeAddress}`);

        // Mint total supply to the owner address
        //const totalSupply = BigInt(1000) * BigInt(10) ** (await cake.decimals());
        
        //const mintTx = await cake.mint(ownerAddress, totalSupply);

        //console.log(cake.balanceof(ownerAddress))
        //await mintTx.wait(); // Wait for the transaction to be mined
        //console.log(`Minted ${totalSupply} tokens to owner address: ${ownerAddress}`);

        return cake;
    } catch (error) {
        console.error("Error deploying Cake Token:", error);
        throw error; // Re-throw the error to stop execution if needed
    }
}

deployToken()