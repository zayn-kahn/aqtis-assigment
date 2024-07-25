import { Controller, Get, OnModuleInit } from '@nestjs/common';
import { AppService } from './app.service';
import { airVault, provider, signer } from './utils';
import { BigNumber, utils } from 'ethers';

interface DepositorInfo {
  amount: BigNumber;
  blockNumber: number;
}

@Controller()
export class AppController implements OnModuleInit {
  constructor(private readonly appService: AppService) {}
  private lastProcessedBlock: number;
  private blockInterval: number = 5;
  private pollInterval: number = 2000;
  private pollIntervalId: NodeJS.Timeout;
  private depositorBalances: Map<string, DepositorInfo[]> = new Map();

  async onModuleInit() {
    this.lastProcessedBlock = await provider.getBlockNumber();
    this.listenToEvents();
    await this.pollBlocks();
  }

  @Get('/setup')
  setup() {
    return this.appService.setup();
  }

  @Get('/withdraw')
  withdraw() {
    return this.appService.withdraw();
  }

  @Get('/all-depositors')
  allDepositor() {
    return {
      depositors: Array.from(this.depositorBalances.keys()),
      values: Array.from(this.depositorBalances.values()).map((deposits) => {
        return {
          amounts: deposits.map((deposit) => utils.formatEther(deposit.amount)),
          blockNumber: deposits.map((deposit) => deposit.blockNumber),
        };
      }),
    };
  }

  private listenToEvents() {
    airVault.on(
      airVault.interface.getEventTopic('AirVault__Deposit'),
      (depositor, amount, event) => {
        console.log(`Deposit event: ${depositor} deposited ${amount}`);
        this.updateDepositorBalance(depositor, amount, event.blockNumber, true);
      },
    );

    airVault.on(
      airVault.interface.getEventTopic('AirVault__Withdraw'),
      (depositor, amount, event) => {
        console.log(`Withdraw event: ${depositor} withdrew ${amount}`);
        this.updateDepositorBalance(
          depositor,
          amount,
          event.blockNumber,
          false,
        );
      },
    );
  }

  onModuleDestroy() {
    if (this.pollIntervalId) {
      clearInterval(this.pollIntervalId);
    }
  }
  private updateDepositorBalance(
    depositor: string,
    amount: BigNumber,
    blockNumber: number,
    isDeposit: boolean,
  ) {
    const amountValue = amount;
    const depositorInfo = this.depositorBalances.get(depositor) || [];

    if (isDeposit) {
      depositorInfo.push({ amount: amountValue, blockNumber });
    } else {
      let remainingAmount = amountValue;
      while (
        depositorInfo.length > 0 &&
        remainingAmount.gt(BigNumber.from(0))
      ) {
        const currentDeposit = depositorInfo[0];

        if (remainingAmount.lte(currentDeposit.amount)) {
          currentDeposit.amount = currentDeposit.amount.sub(remainingAmount);
          remainingAmount = BigNumber.from(0);
          if (currentDeposit.amount.isZero()) {
            depositorInfo.shift();
          }
        } else {
          remainingAmount = remainingAmount.sub(currentDeposit.amount);
          depositorInfo.shift();
        }
      }
    }

    if (depositorInfo.length > 0) {
      this.depositorBalances.set(depositor, depositorInfo);
    } else {
      this.depositorBalances.delete(depositor);
    }

    console.log('Addresses:', Array.from(this.depositorBalances.keys()));
    console.log(
      'Values:',
      Array.from(this.depositorBalances.values()).map((deposits) =>
        deposits.map((deposit) => utils.formatEther(deposit.amount)),
      ),
    );
  }

  private async pollBlocks() {
    this.pollIntervalId = setInterval(async () => {
      const currentBlock = await provider.getBlockNumber();
      if (currentBlock >= this.lastProcessedBlock + this.blockInterval) {
        this.handleAirdrop(currentBlock);
        this.lastProcessedBlock = currentBlock;
      } else {
        console.log(
          `Current block ${currentBlock} is less than ${
            this.lastProcessedBlock + this.blockInterval
          }`,
        );
      }
    }, this.pollInterval);
  }

  private async handleAirdrop(currentBlock: number) {
    console.log(`Running airdrop logic at block ${currentBlock}...`);

    const addresses: string[] = [];
    const amounts: BigNumber[] = [];

    try {
      this.depositorBalances.forEach((deposits, depositor) => {
        const { totalDeposits, totalBlocks } = this.calculateDepositsAndBlocks(
          deposits,
          currentBlock,
        );
        if (totalBlocks > 0) {
          const winTokens = totalDeposits.div(totalBlocks).mul(5).div(100);
          addresses.push(depositor);
          amounts.push(winTokens);
        }
      });

      if (addresses.length > 0) {
        await this.distributeWinTokens(addresses, amounts);
      }
    } catch (error) {
      this.handleError(error);
    }
  }

  private calculateDepositsAndBlocks(
    deposits: DepositorInfo[],
    currentBlock: number,
  ): { totalDeposits: BigNumber; totalBlocks: number } {
    let totalDeposits = utils.parseEther(`0`);
    let totalBlocks = 0;

    deposits.forEach(({ amount, blockNumber }) => {
      const blocksDeposited = currentBlock - blockNumber;
      totalDeposits = totalDeposits.add(amount.mul(blocksDeposited));
      totalBlocks += blocksDeposited;
    });

    return { totalDeposits, totalBlocks };
  }

  private async distributeWinTokens(addresses: string[], amounts: BigNumber[]) {
    console.log(
      `Distributing WIN tokens to the following addresses: ${addresses}`,
    );
    console.log(
      `Amounts: ${amounts.map((amount) => utils.formatEther(amount))}`,
    );

    try {
      const tx = await (
        await airVault.connect(signer).distributeWinTokens(addresses, amounts)
      ).wait();
      console.log(`Transaction hash of AirDrop: ${tx.transactionHash}`);
    } catch (error) {
      console.log('Error during token distribution:', error.message);
    }
  }

  private handleError(error: any) {
    console.log('Error during airdrop process:', error.message);
  }
}
