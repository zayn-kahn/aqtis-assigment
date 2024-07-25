import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';
import { airVault, hardhatSigner1 } from './utils';
import { BigNumber } from 'ethers';

// Mock utils
jest.mock('./utils', () => ({
  airVault: {
    connect: jest.fn(() => ({
      deposit: jest.fn(),
      withdraw: jest.fn(),
    })),
  },
  hardhatSigner1: {},
  hardhatSigner2: {},
  hardhatSigner3: {},
}));

describe('AppService', () => {
  let appService: AppService;
  let mockContract: any;

  beforeEach(async () => {
    const depositTx = { hash: '0x123' };
    const withdrawTx = { hash: '0x456' };

    mockContract = {
      deposit: jest.fn().mockResolvedValue(depositTx),
      withdraw: jest.fn().mockResolvedValue(withdrawTx),
    };

    jest.spyOn(airVault, 'connect').mockImplementation(() => mockContract);

    const module: TestingModule = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    appService = module.get<AppService>(AppService);
  });

  it('should throw an error if setup fails', async () => {
    // Mock deposit method to throw an error
    (airVault.connect(hardhatSigner1).deposit as jest.Mock).mockRejectedValue(
      new Error('Error'),
    );
    await expect(appService.setup()).rejects.toThrow('Error');

    mockContract.deposit.mockRejectedValue(new Error('Failed to deposit'));
    await expect(appService.setup()).rejects.toThrow('Failed to deposit');
  });

  it('should throw an error if withdraw fails', async () => {
    // Mock withdraw method to throw an error
    (airVault.connect(hardhatSigner1).withdraw as jest.Mock).mockRejectedValue(
      new Error('Error'),
    );
    await expect(appService.withdraw()).rejects.toThrow('Error');

    mockContract.withdraw.mockRejectedValue(new Error('Failed to withdraw'));
    await expect(appService.withdraw()).rejects.toThrow('Failed to withdraw');
  });

  it('should successfully execute setup and log transaction hashes', async () => {
    const result = await appService.setup();

    expect(result).toBe(true);

    expect(mockContract.deposit).toHaveBeenCalledTimes(3);
    expect(mockContract.deposit).toHaveBeenCalledWith(expect.any(BigNumber));
  });

  it('should successfully execute withdraw and log transaction hashes', async () => {
    const result = await appService.withdraw();

    expect(result).toBe(true);

    expect(mockContract.withdraw).toHaveBeenCalledTimes(3);
    expect(mockContract.withdraw).toHaveBeenCalledWith(expect.any(BigNumber));
  });
});
