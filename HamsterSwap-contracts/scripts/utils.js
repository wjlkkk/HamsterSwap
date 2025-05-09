const fs = require("fs");
const path = require("path");

const ADDRESS_FILE = path.join(__dirname, "../../HamsterSwap-forented/public/HamsterSwap-contracts/contract-address.json");

function getSavedContractAddresses() {
    if (fs.existsSync(ADDRESS_FILE)) {
        return JSON.parse(fs.readFileSync(ADDRESS_FILE, "utf8"));
    } else {
        return {};
    }
}

function saveContractAddress(networkName, contractName, contractAddress) {
    const data = getSavedContractAddresses();
    if (!data[networkName]) {
        data[networkName] = {};
    }
    data[networkName][contractName] = contractAddress;

    fs.writeFileSync(ADDRESS_FILE, JSON.stringify(data, null, 2));
    console.log(`✅ Saved ${contractName} address to network "${networkName}"`);
}

module.exports = {
    getSavedContractAddresses,
    saveContractAddress,
};