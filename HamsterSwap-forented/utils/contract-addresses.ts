// This file handles loading contract addresses from the contract-address.json file

import { ethers } from "ethers"

// Define the structure of the contract addresses JSON file
interface ContractAddresses {
  [networkId: string]: {
    [contractName: string]: string
  }
}

// Default addresses to use as fallback
const defaultAddresses = {
  "31337": {
    // Hardhat local network
    Cake: "0x5fbdb2315678afecb367f032d93f642f64180aa3",
    Take: "0x8a791620dd6260079bf849dc5567adc3f2fdc318",
    Farm: "0x7bc06c482DEAd17c0e297aFbC32f6e63d3846650",
    Airdrop: "0x99bbA657f2BbC93c02D617f8bA121cB8Fc104Acf",
    IDO: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  },
}

// Function to load contract addresses
export async function loadContractAddresses(): Promise<ContractAddresses> {
  try {
    // Try to fetch the contract-address.json file
    const response = await fetch("/HamsterSwap-contracts/contract-address.json")

    if (!response.ok) {
      console.warn("Could not load contract-address.json, using default addresses")
      return defaultAddresses
    }

    const addresses = await response.json()
    return addresses
  } catch (error) {
    console.warn("Error loading contract addresses:", error)
    return defaultAddresses
  }
}

// Function to get a specific contract address
export async function getContractAddress(contractName: string, networkId = "31337"): Promise<string> {
  const addresses = await loadContractAddresses()

  // Check if the network exists in the addresses
  if (!addresses[networkId]) {
    console.warn(`Network ID ${networkId} not found in contract addresses`)
    return defaultAddresses[networkId]?.[contractName] || ethers.ZeroAddress
  }

  // Check if the contract exists for the network
  if (!addresses[networkId][contractName]) {
    console.warn(`Contract ${contractName} not found for network ${networkId}`)
    return defaultAddresses[networkId]?.[contractName] || ethers.ZeroAddress
  }

  return addresses[networkId][contractName]
}

// Function to get all contract addresses for a network
export async function getNetworkAddresses(networkId = "31337"): Promise<Record<string, string>> {
  const addresses = await loadContractAddresses()
  return addresses[networkId] || defaultAddresses[networkId] || {}
}
