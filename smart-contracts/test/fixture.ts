// @ts-ignore
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  AirVault__factory,
  FUDToken__factory,
  WINToken__factory,
} from "../typechain-types";

export async function deployFixture() {
  const [deployer, addr1, addr2, addr3, distributor] =
    (await ethers.getSigners()) as SignerWithAddress[];

  const FUDTokenFactory = (await ethers.getContractFactory(
    "FUDToken",
    deployer
  )) as FUDToken__factory;
  const WINTokenFactory = (await ethers.getContractFactory(
    "WINToken",
    deployer
  )) as WINToken__factory;
  const AirVaultFactory = (await ethers.getContractFactory(
    "AirVault",
    deployer
  )) as AirVault__factory;

  return {
    addr1,
    addr2,
    addr3,
    deployer,
    distributor,
    FUDTokenFactory,
    WINTokenFactory,
    AirVaultFactory,
  };
}
