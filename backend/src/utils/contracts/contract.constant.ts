import { providers, Wallet } from 'ethers';
import * as contractData from './31337.json';
// import * as contractData from './11155111.json';
import { PRIVATE_KEY, RPC_URL } from '../env.constant';
import {
  AirVault__factory,
  FUDToken__factory,
  WINToken__factory,
} from '../../../types';

const provider = new providers.JsonRpcProvider(RPC_URL);

const signer = new Wallet(PRIVATE_KEY, provider);

const hardhatSigner1 = new Wallet(
  '0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d', //0x70997970C51812dc3A010C7d01b50e0d17dc79C8
  provider,
);

const hardhatSigner2 = new Wallet(
  '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a', //0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC
  provider,
);

const hardhatSigner3 = new Wallet(
  '0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6', //0x90F79bf6EB2c4f870365E785982E1f101E93b906
  provider,
);

const airVault = AirVault__factory.connect(
  contractData.airVault.address,
  provider,
);

const fudToken = FUDToken__factory.connect(
  contractData.fudToken.address,
  provider,
);

const winToken = WINToken__factory.connect(
  contractData.winToken.address,
  provider,
);

export {
  signer,
  provider,
  airVault,
  fudToken,
  winToken,
  hardhatSigner1,
  hardhatSigner2,
  hardhatSigner3,
};
