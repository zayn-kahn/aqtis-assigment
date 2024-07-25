# Project README

## Overview

This project includes a smart contract and a backend application that interacts with it. The smart contract, deployed on Ethereum-compatible networks, handles token deposits, withdrawals, and WIN token distribution. The backend, built with NestJS, manages interactions with the smart contract, handles real-time events, and provides API endpoints for various functionalities.

## Smart Contract

### Introduction

The smart contract is designed to manage token deposits, withdrawals, and the distribution of WIN tokens on the Ethereum blockchain.

### Contract Details

- **Contract Name**: `AirVault`
- **Functions**:
  - `deposit(amount: BigNumber)`: Deposits a specified amount of tokens.
  - `withdraw(amount: BigNumber)`: Withdraws a specified amount of tokens.
  - `distributeWinTokens(addresses: string[], amounts: BigNumber[])`: Distributes WIN tokens to a list of addresses.

### Setup and Deployment

1. **`cd smart-contracts`**: 
2. **Copy and Configure `.env`**: 
   Copy the example environment file and configure it with your details:
   ```bash
   cp .env.example .env
   ```
   Update the `.env` file with the following variables:
   ```env
   ADDRESS=<your_address>
   PRIVATE_KEY=<your_private_key>
   RPC_URL=<rpc_url> # e.g., http://127.0.0.1:8545/
   ETHER_SCAN_KEY=<ether_scan_api_key>
   COIN_MARKET_CAP_API_KEY=<coin_market_cap_api_key>
   REPORT_GAS=true
   ```

3. **Install Dependencies**:
   ```bash
   npm i
   ```

4. **Run Local Node**:
   ```bash
   npm run node
   ```

5. **Run Tests**:
   Open a new terminal session and run all tests:
   ```bash
   npm run test-all ""
   ```

6. **Check Test Coverage**:
   View the test coverage report:
   ```bash
   npm run coverage ""
   ```

7. **Deploy Contract**:
   Deploy the smart contract to your local node:
   ```bash
   npm run deploy
   ```

8. **Run Setup**:
   Initialize the contract setup by approving tokens:
   ```bash
   npm run setup
   ```

## Backend

### Introduction

The backend application, built with NestJS, handles smart contract interactions, listens for events, and provides API endpoints for various operations.

### Setup

1. **`cd backend`**: 
2. **Install Dependencies**:
   ```bash
   npm i
   ```

3. **Configure `.env`**:
   Copy the example environment file and configure it with your details:
   ```bash
   cp .env.example .env
   ```
   Update the `.env` file with the following variables:
   ```env
   PORT=<port>
   ADDRESS=<your_address> # Use the first hardhat account for testing
   PRIVATE_KEY=<your_private_key> # Use the first hardhat account for testing
   RPC_URL=<rpc_url> # e.g., http://127.0.0.1:8545/
   ```

4. **Run the Application**:
   ```bash
   npm run start
   ```

### API Endpoints

- **`GET /setup`**: Deposit Tokens from 3 predefined signers.
- **`GET /withdraw`**: Withdraws tokens from 3 predefined signers.
- **`GET /all-depositor`**: Retrieves a list of depositors and their balances.

### Testing

1. **Install Testing Dependencies**:
   ```bash
   npm i
   ```

2. **Run Tests**:
   ```bash
   npm run test
   ```

3. **Check Test Coverage**:
   View the test coverage report:
   ```bash
   npm run test:cov
   ```

4. **Run in Development Mode**:
   ```bash
   npm run start:dev
   ```