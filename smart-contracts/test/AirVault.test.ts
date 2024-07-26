import { expect, use } from "chai";
// @ts-ignore
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { deployFixture } from "./fixture";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { FUDToken, WINToken, AirVault } from "../typechain-types";
import { solidity } from "ethereum-waffle";
import { BigNumber } from "ethers";
use(solidity);

const increaseTimeInSec = (seconds: number) => {
  return ethers.provider.send("evm_increaseTime", [seconds]);
};

describe("Air Vault Test", function () {
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let addr3: SignerWithAddress;
  let deployer: SignerWithAddress;

  let fudToken: FUDToken;
  let winToken: WINToken;
  let airVault: AirVault;
  let unSetAirVault: AirVault;

  let distributeAddresses: string[] = [];
  let distributeAmounts: BigNumber[] = [
    ethers.utils.parseUnits("1", "ether"),
    ethers.utils.parseUnits("2", "ether"),
    ethers.utils.parseUnits("3", "ether"),
  ];

  const initialDeposit: BigNumber = ethers.utils.parseUnits("10", "ether");
  const withdrawAmount: BigNumber = ethers.utils.parseUnits("5", "ether");

  beforeEach("Setup for AirVault", async () => {
    const fixture = await loadFixture(deployFixture);

    ({ addr1, addr2, addr3, deployer } = fixture);

    distributeAddresses = [addr1.address, addr2.address, addr3.address];
    fudToken = await fixture.FUDTokenFactory.deploy(deployer.address);
    winToken = await fixture.WINTokenFactory.deploy();
    airVault = await fixture.AirVaultFactory.deploy();
    unSetAirVault = await fixture.AirVaultFactory.deploy();

    await fudToken.deployed();
    await winToken.deployed();
    await airVault.deployed();
    await unSetAirVault.deployed();

    await airVault.setFUDToken(fudToken.address);
    await airVault.setWINToken(winToken.address);

    await winToken.transferOwnership(airVault.address);
  });

  describe("AirVault: setFUDToken() setWINToken()", async function () {
    it("Should revert when non owner setting tokens", async function () {
      await expect(
        unSetAirVault.connect(addr1).setWINToken(winToken.address)
      ).to.revertedWith("Ownable: caller is not the owner");
      await expect(
        unSetAirVault.connect(addr1).setFUDToken(fudToken.address)
      ).to.revertedWith("Ownable: caller is not the owner");
    });

    it("Should set tokens", async function () {
      let fudTokenAddress = await unSetAirVault.fudToken();
      let winTokenAddress = await unSetAirVault.winToken();

      expect(fudTokenAddress).to.be.equal(ethers.constants.AddressZero);
      expect(winTokenAddress).to.be.equal(ethers.constants.AddressZero);

      await unSetAirVault.setFUDToken(fudToken.address);
      await unSetAirVault.setWINToken(winToken.address);

      fudTokenAddress = await unSetAirVault.fudToken();
      winTokenAddress = await unSetAirVault.winToken();

      expect(fudTokenAddress).to.be.equal(fudToken.address);
      expect(winTokenAddress).to.be.equal(winToken.address);
    });
    describe("Should revert if either token is not set for:", async function () {
      it("deposit()", async function () {
        await fudToken.approve(unSetAirVault.address, initialDeposit);
        await expect(unSetAirVault.deposit(initialDeposit)).to.revertedWith(
          "AirVault__FUDTokenNotSet"
        );
        await unSetAirVault.setFUDToken(fudToken.address);
        await expect(unSetAirVault.deposit(initialDeposit)).to.revertedWith(
          "AirVault__WinTokenNotSet"
        );
      });
  
      it("withdraw()", async function () {
        await fudToken.approve(unSetAirVault.address, initialDeposit);
        await expect(unSetAirVault.withdraw(initialDeposit)).to.revertedWith(
          "AirVault__FUDTokenNotSet"
        );
        await unSetAirVault.setFUDToken(fudToken.address);
        await expect(unSetAirVault.withdraw(initialDeposit)).to.revertedWith(
          "AirVault__WinTokenNotSet"
        );
      });
  
      it("distributeWinTokens()", async function () {
        await expect(
          unSetAirVault
            .connect(deployer)
            .distributeWinTokens(distributeAddresses, distributeAmounts)
        ).to.revertedWith("AirVault__FUDTokenNotSet");
        await unSetAirVault.setFUDToken(fudToken.address);
        await expect(
          unSetAirVault
            .connect(deployer)
            .distributeWinTokens(distributeAddresses, distributeAmounts)
        ).to.revertedWith("AirVault__WinTokenNotSet");
      });
    })
  });

  describe("AirVault: deposit()", async function () {
    it("Should revert if zero amount is deposited", async function () {
      await fudToken
        .connect(deployer)
        .approve(airVault.address, initialDeposit);
      await expect(
        airVault.connect(deployer).deposit(ethers.constants.Zero)
      ).to.revertedWith("AirVault__ZeroAmountNotAllowed");
    });

    it("Should emit deposit event", async function () {
      await fudToken
        .connect(deployer)
        .approve(airVault.address, initialDeposit);
      await expect(airVault.connect(deployer).deposit(initialDeposit))
        .to.emit(airVault, "AirVault__Deposit")
        .withArgs(deployer.address, initialDeposit);
    });

    it("Should deposit FUD tokens and update balance", async function () {
      await fudToken
        .connect(deployer)
        .approve(airVault.address, initialDeposit);
      await airVault.connect(deployer).deposit(initialDeposit);
      const balance = await airVault.lockedBalanceOf(deployer.address);
      expect(balance).to.be.equal(initialDeposit);
    });
  });

  describe("AirVault: withdraw()", async function () {
    it("Should revert if zero amount is withdraw", async function () {
      await fudToken
        .connect(deployer)
        .approve(airVault.address, initialDeposit);
      await airVault.connect(deployer).deposit(initialDeposit);
      await expect(
        airVault.connect(deployer).withdraw(ethers.constants.Zero)
      ).to.revertedWith("AirVault__ZeroAmountNotAllowed");
    });

    it("Should emit withdraw event", async function () {
      await fudToken
        .connect(deployer)
        .approve(airVault.address, initialDeposit);
      await airVault.connect(deployer).deposit(initialDeposit);
      await expect(airVault.connect(deployer).withdraw(withdrawAmount))
        .to.emit(airVault, "AirVault__Withdraw")
        .withArgs(deployer.address, withdrawAmount);
    });

    it("Should withdraw FUD tokens and update balance", async function () {
      await fudToken
        .connect(deployer)
        .approve(airVault.address, initialDeposit);
      await airVault.connect(deployer).deposit(initialDeposit);

      await airVault.connect(deployer).withdraw(withdrawAmount);
      let balance = await airVault.lockedBalanceOf(deployer.address);
      expect(balance).to.be.equal(withdrawAmount);

      await airVault.connect(deployer).withdraw(withdrawAmount);
      await expect(
        airVault.lockedBalanceOf(deployer.address)
      ).to.be.revertedWith("AirVault__HasNotMadeDeposit");
    });
  });

  describe("AirVault: distributeWinTokens()", async function () {
    it("Should revert if input is not valid", async function () {
      await expect(
        airVault
          .connect(addr1)
          .distributeWinTokens(distributeAddresses, distributeAmounts)
      ).to.be.revertedWith("Ownable: caller is not the owner");
      await expect(
        airVault.connect(deployer).distributeWinTokens(distributeAddresses, [])
      ).to.be.revertedWith("AirVault__MisMatchedArray");
      await expect(
        airVault.connect(deployer).distributeWinTokens([], distributeAmounts)
      ).to.be.revertedWith("AirVault__MisMatchedArray");
      let newAddresses: string[] = [];
      let newAmounts: BigNumber[] = [];
      for (let i = 0; i < 34; i++) {
        newAddresses = newAddresses.concat(...distributeAddresses);
        newAmounts = newAmounts.concat(...distributeAmounts);
      }
      await expect(
        airVault.connect(deployer).distributeWinTokens(newAddresses, newAmounts)
      ).to.be.revertedWith("AirVault__MaxAllowedPerTxReached");
    });

    it("Should distribute tokens", async function () {
      let balances = [];
      for (let i = 0; i < distributeAddresses.length; i++) {
        let balance = await winToken.balanceOf(distributeAddresses[i]);
        expect(balance).to.be.eq(0);
        balances.push(balance);
      }
      await airVault
        .connect(deployer)
        .distributeWinTokens(distributeAddresses, distributeAmounts);
      for (let i = 0; i < distributeAddresses.length; i++) {
        let balance = await winToken.balanceOf(distributeAddresses[i]);
        expect(balance).to.be.eq(distributeAmounts[i]);
      }
    });
  });
});
