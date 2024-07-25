// @ts-ignore
import { ethers, run } from "hardhat";
import {
  AirVault,
  AirVault__factory,
  FUDToken,
  FUDToken__factory,
  WINToken,
  WINToken__factory,
} from "../typechain-types";
import { writeFile, cp } from 'fs';
import path from 'path';

import { FormatTypes } from "ethers/lib/utils";


function spaces() {
  console.log("--------------------");
}

async function main() {
  console.log("Deploying AirVault Contracts");
  const deployer = (await ethers.getSigners())[0];
  console.log("Deployer Address:", deployer.address);

  const AirVaultFactory = (await ethers.getContractFactory(
    "AirVault"
  )) as AirVault__factory;

  const FUDTokenFactory = (await ethers.getContractFactory(
    "FUDToken"
  )) as FUDToken__factory;

  const WINTokenFactory = (await ethers.getContractFactory(
    "WINToken"
  )) as WINToken__factory;

  const fudToken = (await FUDTokenFactory.deploy(deployer.address)) as FUDToken;
  await fudToken.deployed();
  spaces();
  console.log("FUDToken deployed to:", fudToken.address);

  const winToken = (await WINTokenFactory.deploy()) as WINToken;
  await winToken.deployed();
  spaces();
  console.log("WINToken deployed to:", winToken.address);

  const airVault = (await AirVaultFactory.deploy()) as AirVault;
  await airVault.deployed();
  spaces();
  console.log("AirVault deployed to:", airVault.address);
  spaces();
  console.log("Transfer Ownership to AirVault Contract");
  let tx = await (await winToken.transferOwnership(airVault.address)).wait();
  console.log(tx.transactionHash);
  spaces();
  console.log("Setting FUD Token Address in AirVault Contract");
  tx = await (await airVault.setFUDToken(fudToken.address)).wait();
  console.log(tx.transactionHash);
  spaces();
  console.log("Setting WIN Token Address in AirVault Contract");
  tx = await (await airVault.setWINToken(winToken.address)).wait();
  console.log(tx.transactionHash);
  spaces();
  console.log("All contracts deployed successfully!");
  const network = await ethers.provider.getNetwork();
  if (network.chainId !== 31337) {
    await run("verify:verify", {
      address: fudToken.address,
      constructorArguments: [deployer.address],
    });
    await run("verify:verify", {
      address: winToken.address,
      constructorArguments: [],
    });
    await run("verify:verify", {
      address: airVault.address,
      constructorArguments: [],
    });
  }
  const deployedAddress = JSON.stringify({ 
    fudToken: {
      address: fudToken.address,
      abi: fudToken.interface.format(FormatTypes.full)
    },
    winToken: {
      address: winToken.address,
      abi: winToken.interface.format(FormatTypes.full)
    }, 
    airVault: {
      address: airVault.address,
      abi: airVault.interface.format(FormatTypes.full)
    } 
  });
  copy(deployedAddress, network);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});


function copy(deployedAddress: string, network: any) {
  const filePath = path.join(__dirname, '..', '..', 'backend', 'src', 'utils', 'contracts', `${network.chainId}.json`);
  writeFile(filePath, deployedAddress, (err) => {
    if (err) {
      console.error('Error writing file:', err);
    } else {
      console.log(`Addresses save in backend/src/utils/contracts/${network.chainId} for chainId ${network.chainId}`);
    }
  });
  cp('./typechain-types', path.join(__dirname, '..', '..', 'backend', 'types'), {recursive: true}, (err) => {
    if (err) {
      console.error('Error copying typechain-types:', err);
    } else {
      console.log('Typechain-types copied to backend/types');
    }
  });
  writeFile(`./scripts/address/${network.chainId}.json`, deployedAddress, (err) => {
    if (err) {
      console.error('Error writing file:', err);
    } else {
      console.log(`Addresses save in contracts/address/${network.chainId} for chainId ${network.chainId}`);
    }
  });
}