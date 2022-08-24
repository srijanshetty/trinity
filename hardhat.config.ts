import * as dotenv from "dotenv";

import { HardhatUserConfig, task } from "hardhat/config";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@typechain/hardhat";
import "hardhat-gas-reporter";
import "hardhat-contract-sizer";
import "solidity-coverage";
import "hardhat-deploy";

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY || "0x";

const KOVAN_RPC_URL = process.env.KOVAN_RPC_URL || "";
const MUMBAI_RPC_URL = process.env.POLYGON_MAINNET_RPC_URL || "";

const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || "";
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY || "";

// optional
const REPORT_GAS = !!process.env.REPORT_GAS || false;

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (_taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

const config: HardhatUserConfig = {
  solidity: "0.8.4",
  networks: {
    kovan: {
      url: KOVAN_RPC_URL,
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
      saveDeployments: true,
      chainId: 42,
    },
    polygon: {
      url: MUMBAI_RPC_URL,
      accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
      saveDeployments: true,
      chainId: 137,
    },
    localhost: {
      url: 'http://localhost:8545',
      chainId: 31337,
    }
  },
  gasReporter: {
      enabled: REPORT_GAS,
      currency: "USD",
      outputFile: "gas-report.txt",
      noColors: true,
      // coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
  contractSizer: {
    runOnCompile: false,
    only: ["Trinity"],
  },
  namedAccounts: {
    deployer: {
      default: 0,
    },
    candidate: {
      default: 1,
    },
    validator: {
      default: 2,
    },
    employer: {
      default: 3,
    },
  },
  etherscan: {
    // yarn hardhat verify --network <NETWORK> <CONTRACT_ADDRESS> <CONSTRUCTOR_PARAMETERS>
    apiKey: {
        kovan: ETHERSCAN_API_KEY,
        polygon: POLYGONSCAN_API_KEY,
    },
  },
  mocha: {
    timeout: 500000, // 500 seconds max for running tests
  },
};

export default config;
