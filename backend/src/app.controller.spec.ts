import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BigNumber, utils } from 'ethers';
import { airVault, signer, provider } from './utils';

jest.mock('./utils', () => ({
  airVault: {
    connect: jest.fn(),
    interface: {
      getEventTopic: jest.fn(),
    },
    on: jest.fn(),
  },
  provider: {
    getBlockNumber: jest.fn(),
  },
  signer: {},
}));

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(async () => {
    const mockAppService = {
      setup: jest.fn(),
      withdraw: jest.fn(),
    };

    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: mockAppService,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    appService = app.get<AppService>(AppService);
  });

  afterEach(() => {
    appController.onModuleDestroy();
    jest.clearAllTimers();
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  describe('root', () => {
    describe('setup', () => {
      it('should call appService.setup and return its result', async () => {
        const result = true;
        jest.spyOn(appService, 'setup').mockResolvedValue(result);

        const response = await appController.setup();

        expect(appService.setup).toHaveBeenCalled();
        expect(response).toBe(result);
      });
    });

    describe('withdraw', () => {
      it('should call appService.withdraw and return its result', async () => {
        const result = true;
        jest.spyOn(appService, 'withdraw').mockResolvedValue(result);

        const response = await appController.withdraw();

        expect(appService.withdraw).toHaveBeenCalled();
        expect(response).toBe(result);
      });
    });

    describe('all-depositors', () => {
      it('should handle empty depositorBalances', () => {
        (appController as any).depositorBalances = new Map<
          string,
          { amount: BigNumber; blockNumber: number }[]
        >();

        const result = appController.allDepositor();

        expect(result).toEqual({
          depositors: [],
          values: [],
        });
      });

      it('should return all depositors and their values', () => {
        const depositorBalances = new Map<
          string,
          { amount: BigNumber; blockNumber: number }[]
        >();
        depositorBalances.set('0xAddress1', [
          { amount: utils.parseEther('10'), blockNumber: 1 },
        ]);
        depositorBalances.set('0xAddress2', [
          { amount: utils.parseEther('20'), blockNumber: 2 },
        ]);

        (appController as any).depositorBalances = depositorBalances;

        const result = appController.allDepositor();
        expect(result).toEqual({
          depositors: ['0xAddress1', '0xAddress2'],
          values: [
            { amounts: ['10.0'], blockNumber: [1] },
            { amounts: ['20.0'], blockNumber: [2] },
          ],
        });
      });
    });

    describe('listenToEvents', () => {
      it('should initialize and set up event listeners on module init', async () => {
        const blockNumber = 12345;
        (provider.getBlockNumber as jest.Mock).mockResolvedValue(blockNumber);

        const listenToEventsSpy = jest.spyOn(
          appController as any,
          'listenToEvents',
        );
        const pollBlocksSpy = jest.spyOn(appController as any, 'pollBlocks');

        await appController.onModuleInit();

        expect(appController['lastProcessedBlock']).toBe(blockNumber);
        expect(listenToEventsSpy).toHaveBeenCalled();
        expect(pollBlocksSpy).toHaveBeenCalled();
      });
    });

    it('should clear the interval on module destroy', async () => {
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      await appController.onModuleInit();
      appController.onModuleDestroy();

      expect(clearIntervalSpy).toHaveBeenCalledWith(
        appController['pollIntervalId'],
      );
    });

    it('should handle the case with no depositors', async () => {
      appController['depositorBalances'] = new Map();
      await appController.onModuleInit();
      const currentBlock = 101;

      const distributeWinTokensMock = jest.fn();
      (appController as any).distributeWinTokens = distributeWinTokensMock;

      await (appController as any).handleAirdrop(currentBlock);

      expect(distributeWinTokensMock).not.toHaveBeenCalled();
    });

    it('should correctly update depositor balances on deposit event', () => {
      const depositor = '0xAddress1';
      const amount = utils.parseEther('10');
      const blockNumber = 100;

      appController['updateDepositorBalance'](
        depositor,
        amount,
        blockNumber,
        true,
      );

      const balances = appController['depositorBalances'].get(depositor);
      expect(balances).toEqual([{ amount, blockNumber }]);
      expect(appController['depositorBalances'].size).toBe(1);
    });

    it('should correctly update depositor balances on withdrawal event', () => {
      const depositor = '0xAddress1';
      const depositAmount = utils.parseEther('15');
      let blockNumber = 100;

      // Initial deposit
      appController['updateDepositorBalance'](
        depositor,
        depositAmount,
        blockNumber,
        true,
      );

      // First withdrawal
      let withdrawAmount = utils.parseEther('10');
      blockNumber = 111;
      appController['updateDepositorBalance'](
        depositor,
        withdrawAmount,
        blockNumber,
        false,
      );

      // Verify after first withdrawal
      let balances = appController['depositorBalances'].get(depositor);
      expect(balances).toEqual([
        { amount: utils.parseEther('5'), blockNumber: 100 },
      ]);

      // Second withdrawal
      withdrawAmount = utils.parseEther('5');
      blockNumber = 112;
      appController['updateDepositorBalance'](
        depositor,
        withdrawAmount,
        blockNumber,
        false,
      );

      // Verify after second withdrawal
      balances = appController['depositorBalances'].get(depositor);
      expect(balances).toBeUndefined();

      // Verify that the depositor is removed from the map
      expect(appController['depositorBalances'].size).toBe(0);
    });

    it('should successfully distribute WIN tokens', async () => {
      const addresses = ['0xAddress1', '0xAddress2'];
      const amounts = [utils.parseEther('10'), utils.parseEther('20')];

      const distributeWinTokensMock = jest.fn().mockResolvedValue({
        wait: jest.fn().mockResolvedValue({ transactionHash: '0x123' }),
      });

      (airVault.connect as jest.Mock).mockReturnValue({
        distributeWinTokens: distributeWinTokensMock,
      });

      const privateDistributeWinTokens =
        appController['distributeWinTokens'].bind(appController);

      await privateDistributeWinTokens(addresses, amounts);

      expect(airVault.connect).toHaveBeenCalledWith(signer);
      expect(distributeWinTokensMock).toHaveBeenCalledWith(addresses, amounts);
    });

    it('should handle errors during airdrop process', async () => {
      appController['depositorBalances'] = new Map([
        ['0xAddress1', [{ amount: utils.parseEther('10'), blockNumber: 1 }]],
      ]);

      const currentBlock = 101;

      const error = new Error('Mock error');
      (appController as any).distributeWinTokens = jest
        .fn()
        .mockRejectedValue(error);

      const handleErrorSpy = jest.spyOn(appController as any, 'handleError');

      await (appController as any).handleAirdrop(currentBlock);

      expect(handleErrorSpy).toHaveBeenCalledWith(error);
    });

    it('should correctly calculate and distribute WIN tokens for a single depositor', async () => {
      appController['depositorBalances'] = new Map([
        ['0xAddress1', [{ amount: utils.parseEther(`50`), blockNumber: 1 }]],
      ]);

      const currentBlock = 101;

      const distributeWinTokensMock = jest.fn();
      (appController as any).distributeWinTokens = distributeWinTokensMock;

      await (appController as any).handleAirdrop(currentBlock);

      const expectedAddresses = ['0xAddress1'];
      const expectedAmounts = [utils.parseEther(`${(50 * 100 * 0.05) / 100}`)];

      expect(distributeWinTokensMock).toHaveBeenCalledWith(
        expectedAddresses,
        expectedAmounts,
      );
    });

    it('should correctly calculate and distribute WIN tokens for multiple deposits by a single depositor', async () => {
      appController['depositorBalances'] = new Map([
        [
          '0xAddress1',
          [
            { amount: utils.parseEther(`10`), blockNumber: 1 },
            { amount: utils.parseEther(`20`), blockNumber: 50 },
          ],
        ],
      ]);

      const currentBlock = 101;
      const distributeWinTokensMock = jest.fn();
      (appController as any).distributeWinTokens = distributeWinTokensMock;

      await (appController as any).handleAirdrop(currentBlock);

      const totalBlocks1 = 101 - 1;
      const totalBlocks2 = 101 - 50;
      const totalDeposits = utils
        .parseEther(`10`)
        .mul(totalBlocks1)
        .add(utils.parseEther(`20`).mul(totalBlocks2));
      const totalBlocks = totalBlocks1 + totalBlocks2;
      const expectedWinTokens = totalDeposits.div(totalBlocks).mul(5).div(100);

      const expectedAddresses = ['0xAddress1'];
      const expectedAmounts = [expectedWinTokens];

      expect(distributeWinTokensMock).toHaveBeenCalledWith(
        expectedAddresses,
        expectedAmounts,
      );
    });

    it('should correctly calculate and distribute WIN tokens', async () => {
      appController['depositorBalances'] = new Map([
        ['0xAddress1', [{ amount: utils.parseEther(`10`), blockNumber: 1 }]],
        ['0xAddress2', [{ amount: utils.parseEther(`20`), blockNumber: 1 }]],
      ]);

      const currentBlock = 101;

      const distributeWinTokensMock = jest.fn();
      (appController as any).distributeWinTokens = distributeWinTokensMock;

      await (appController as any).handleAirdrop(currentBlock);

      const expectedAddresses = ['0xAddress1', '0xAddress2'];
      const expectedAmounts = [
        utils.parseEther(`${(10 * 100 * 0.05) / 100}`), // 0.5
        utils.parseEther(`${(20 * 100 * 0.05) / 100}`), // 1
      ];

      expect(distributeWinTokensMock).toHaveBeenCalledWith(
        expectedAddresses,
        expectedAmounts,
      );
    });

    it('should trigger airdrop logic at specified block intervals', async () => {
      const currentBlock = 105;

      jest.useFakeTimers();

      (provider.getBlockNumber as jest.Mock).mockResolvedValue(currentBlock);

      const handleAirdropSpy = jest.spyOn(
        appController as any,
        'handleAirdrop',
      );
      const pollBlocksSpy = jest.spyOn(appController as any, 'pollBlocks');

      await appController.onModuleInit();
      appController['lastProcessedBlock'] = 100;

      jest.advanceTimersByTime(appController['pollInterval'] * 2);

      await Promise.resolve();
      await Promise.resolve();

      expect(pollBlocksSpy).toHaveBeenCalled();
      expect(handleAirdropSpy).toHaveBeenCalledWith(currentBlock);
      expect(handleAirdropSpy).toHaveBeenCalledTimes(1);

      jest.useRealTimers();
    });
  });
});
