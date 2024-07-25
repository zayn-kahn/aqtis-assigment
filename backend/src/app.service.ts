import { Injectable } from '@nestjs/common';
import {
  airVault,
  hardhatSigner1,
  hardhatSigner2,
  hardhatSigner3,
} from './utils';
import { BigNumber, utils } from 'ethers';

@Injectable()
export class AppService {
  async setup() {
    try {
      const txsPromise = [
        airVault
          .connect(hardhatSigner1)
          .deposit(this.generateDeposit('hardhatSigner1')),
        airVault
          .connect(hardhatSigner2)
          .deposit(this.generateDeposit('hardhatSigner2')),
        airVault
          .connect(hardhatSigner3)
          .deposit(this.generateDeposit('hardhatSigner3')),
      ];
      const txs = await Promise.all(txsPromise);
      txs.map((tx) => console.log('deposit:', tx.hash));
      return true;
    } catch (error) {
      console.error(error.message);
      throw new Error(error);
    }
  }

  async withdraw() {
    try {
      // if ((await this.checkIfDeposited()).length === 0) {
      //   console.log('No deposits found');
      //   throw new Error('No deposits were made');
      // }
      const txsPromise = [
        airVault
          .connect(hardhatSigner1)
          .withdraw(this.generateWithdraw('hardhatSigner1')),
        airVault
          .connect(hardhatSigner2)
          .withdraw(this.generateWithdraw('hardhatSigner2')),
        airVault
          .connect(hardhatSigner3)
          .withdraw(this.generateWithdraw('hardhatSigner3')),
      ];
      const txs = await Promise.all(txsPromise);
      txs.map((tx) => console.log('withdraw:', tx.hash));
      return true;
    } catch (error) {
      console.error(error.message);
      throw new Error(error);
    }
  }

  async checkIfDeposited(): Promise<{ address: string; value: string }[]> {
    const depositEvent = await airVault.queryFilter(
      airVault.filters.AirVault__Deposit(),
    );
    return depositEvent.map((event) => {
      return {
        address: event.args['_address'] as string,
        value: utils.formatEther(event.args['_amount']),
      };
    });
  }

  generateDeposit(caller?: string): BigNumber {
    const amount = utils.parseEther(
      `${Math.floor(Math.random() * 50) + 10}`, // generate random number between 10 and 60
    );
    console.log(caller, utils.formatEther(amount));
    return amount;
  }

  generateWithdraw(caller?: string): BigNumber {
    const amount = utils.parseEther(
      `${Math.floor(Math.random() * 3) + 1}`, // generate random number between 1 and 3
    );
    console.log(caller, utils.formatEther(amount));
    return amount;
  }
}
