require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");
require("hardhat-contract-sizer");
require("hardhat-gas-reporter");
require('@typechain/hardhat')
require('solidity-coverage')
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;

const ETHER_SCAN_KEY = process.env.ETHER_SCAN_KEY;

const COIN_MARKET_CAP_API_KEY = process.env.COIN_MARKET_CAP_API_KEY;

const RPC_URL = process.env.RPC_URL;

module.exports = {
  solidity: {
    compilers: [
      {
        version: "0.8.15",
        settings: {
          metadata: {
            bytecodeHash: "none",
          },
          optimizer: {
            enabled: true,
            runs: 5000,
          },
        },
      },
    ],
  },
  paths: {
    artifacts: "./artifacts",
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS == 'true',
    currency: "USD",
    token: "MATIC",
    // gasPrice: 100,
    coinmarketcap: COIN_MARKET_CAP_API_KEY,
    src: "./contracts",
  },
  // defaultNetwork: "localhost",
  networks: {
    hardhat: {
      gas: "auto",
      gasPrice: "auto",
      // accounts: {
      //   mnemonic: "",
      // },
      mining: {
        auto: true,
        interval: [2000, 6000],
        mempool: {
          order: "fifo"
        }
      },
      forking: {
        url: RPC_URL,
        enabled: process.env.MAINNET_FORKING_ENABLED === "true",
      },
    },
    sepolia: {
      url: RPC_URL,
      accounts: [`${PRIVATE_KEY}`],
    },
  },
  etherscan: {
    apiKey: {
      sepolia: ETHER_SCAN_KEY,
    },
  },
  typechain: {
    outDir: './typechain-types/',
    target: 'ethers-v5',
    alwaysGenerateOverloads: false, // should overloads with full signatures like deposit(uint256) be generated always, even if there are no overloads?
    dontOverrideCompile: false // defaults to false
  },
};
