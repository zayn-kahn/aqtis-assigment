// @ts-ignore
import { ethers, run } from "hardhat";
import { AirVault, FUDToken, WINToken } from "../typechain-types";
import config from "./address/31337.json";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

async function setUp() {
  const [deployer, add1, add2, add3] =
    (await ethers.getSigners()) as SignerWithAddress[];
  const initialDeposit = ethers.utils.parseEther("5000");

  const air = (await ethers.getContractAt(
    config.airVault.abi,
    config.airVault.address
  )) as AirVault;
  const win = (await ethers.getContractAt(
    config.winToken.abi,
    config.winToken.address
  )) as WINToken;
  const fud = (await ethers.getContractAt(
    config.fudToken.abi,
    config.fudToken.address
  )) as FUDToken;

  let allowance = await fud.allowance(deployer.address, air.address);
  if (allowance.lt(initialDeposit)) {
    console.log('Transfer FUD to multiple addresses')
    await fud.transfer(add1.address, initialDeposit);
    await fud.transfer(add2.address, initialDeposit);
    await fud.transfer(add3.address, initialDeposit);

    console.log('Approving FUD for Air from same addresses')
    await fud.approve(air.address, ethers.constants.MaxUint256);
    await fud.connect(add1).approve(air.address, ethers.constants.MaxUint256);
    await fud.connect(add2).approve(air.address, ethers.constants.MaxUint256);
    await fud.connect(add3).approve(air.address, ethers.constants.MaxUint256);

    console.log('Approving WIN for Air from deployer address')
    await win.approve(air.address, ethers.constants.MaxUint256);
  }
  console.log("Setup complete");
}

setUp().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
