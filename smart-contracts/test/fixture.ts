// @ts-ignore
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  AirVault__factory,
  FUDToken__factory,
  WINToken__factory,
} from "../typechain-types";

export async function deployFixture() {
  const [deployer, addr1, addr2, addr3]: SignerWithAddress[] =
    (await ethers.getSigners());

  const FUDTokenFactory: FUDToken__factory = await ethers.getContractFactory(
    "FUDToken",
    deployer
  );
  const WINTokenFactory: WINToken__factory = await ethers.getContractFactory(
    "WINToken",
    deployer
  );
  const AirVaultFactory: AirVault__factory = await ethers.getContractFactory(
    "AirVault",
    deployer
  );

  return {
    addr1,
    addr2,
    addr3,
    deployer,
    FUDTokenFactory,
    WINTokenFactory,
    AirVaultFactory,
  };
}
