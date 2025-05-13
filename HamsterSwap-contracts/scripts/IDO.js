const { getSavedContractAddresses } = require("./utils");
const hre = require("hardhat");
const { ethers } = hre;

async function addwhilelist() {
    const IDO_addresses = getSavedContractAddresses()["31337"]?.IDO;
    console.log("addresses", IDO_addresses);
    const ido = await hre.ethers.getContractAt("IDO", IDO_addresses);
    //console.log("ido", ido);
    let tx = await ido.addToWhitelist(0,["0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266"])
    await  tx.wait()
    console.log("tx", tx);

    const isWhite = await ido.isWhitelisted(0, "0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266");
    console.log("is whitelisted:", isWhite);
}
addwhilelist()