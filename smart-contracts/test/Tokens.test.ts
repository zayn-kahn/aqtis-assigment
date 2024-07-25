import { expect, use } from "chai";
// @ts-ignore
import { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { deployFixture } from "./fixture";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { FUDToken, WINToken, AirVault } from "../typechain-types";
import { solidity } from "ethereum-waffle";
use(solidity);

describe("Tokens Test", function () {
  let addr1: SignerWithAddress;
  let deployer: SignerWithAddress;

  let fudToken: FUDToken;
  let winToken: WINToken;

  const initialSupply = ethers.utils.parseUnits("10", "ether");
  const maxSupply = ethers.utils.parseUnits("1500000", "ether");

  beforeEach("Setup for Tokens", async () => {
    const fixture = await loadFixture(deployFixture);

    ({ deployer, addr1 } = fixture);

    fudToken = await fixture.FUDTokenFactory.deploy(deployer.address);
    winToken = await fixture.WINTokenFactory.deploy();

    await fudToken.deployed();
    await winToken.deployed();
  });

  describe("Tokens", async function () {
    it("Should check variables of FUD Token", async function () {
      expect(await fudToken.name()).to.be.equal("FUD Token");
      expect(await fudToken.symbol()).to.be.equal("FUD");
      expect(await fudToken.decimals()).to.be.equal(18);
      expect(await fudToken.totalSupply()).to.be.equal(maxSupply);
      expect(await fudToken.maxSupply()).to.be.equal(maxSupply);
    });
    it("Should check variables of Win Token", async function () {
      expect(await winToken.name()).to.be.equal("WIN Token");
      expect(await winToken.symbol()).to.be.equal("WIN");
      expect(await winToken.decimals()).to.be.equal(18);
      expect(await winToken.totalSupply()).to.be.equal(0);
      expect(await winToken.owner()).to.be.equal(deployer.address);
    });
    it("Should only let owner mint Win Token", async function () {
      await expect(
        winToken.connect(addr1).mint(deployer.address, initialSupply)
      ).to.be.revertedWith("Ownable: caller is not the owner");
      await winToken.connect(deployer).mint(deployer.address, initialSupply);
      expect(await winToken.totalSupply()).to.be.equal(initialSupply);
      expect(await winToken.balanceOf(deployer.address)).to.be.equal(initialSupply);
    });
  });
});
