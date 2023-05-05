import { Test, TestingModule } from '@nestjs/testing';
import { when } from 'jest-when';
import IORedis from 'ioredis';
import { mockDatabaseService } from 'src/__mocks__';
import { DatabaseService } from 'src/modules/database/database.service';
import { GetKeyInfoResponse } from 'src/modules/browser/dto';
import { SearchJSONStrategy } from 'src/modules/database-recommendation/scanner/strategies';

const nodeClient = Object.create(IORedis.prototype);
nodeClient.sendCommand = jest.fn();

const mockDatabaseId = 'id';

const mockJSONInfo: GetKeyInfoResponse = {
  name: Buffer.from('testString_1'),
  type: 'ReJSON-RL',
  ttl: -1,
  size: 1,
};

const mockHashInfo: GetKeyInfoResponse = {
  name: Buffer.from('testString_2'),
  type: 'hash',
  ttl: -1,
  size: 512 * 1024 + 1,
};

const mockEmptyIndexes = [];
const mockIndexes = ['foo'];

describe('SearchJSONStrategy', () => {
  let strategy: SearchJSONStrategy;
  let databaseService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: DatabaseService,
          useFactory: mockDatabaseService,
        },
      ],
    }).compile();

    databaseService = module.get<DatabaseService>(DatabaseService);
    strategy = new SearchJSONStrategy(databaseService);
  });

  describe('isRecommendationReached', () => {
    describe('with search module', () => {
      beforeEach(() => {
        databaseService.get.mockResolvedValue({ modules: [{ name: 'search' }] });
      });

      it('should return true when there is JSON key', async () => {
        when(nodeClient.sendCommand)
          .calledWith(jasmine.objectContaining({ name: 'FT._LIST' }))
          .mockResolvedValue(mockEmptyIndexes);

        expect(await strategy.isRecommendationReached({
          client: nodeClient,
          databaseId: mockDatabaseId,
          keys: [mockJSONInfo, mockHashInfo],
        })).toEqual({ isReached: true, params: { keys: [mockJSONInfo.name] } });
      });

      it('should return false when there is not JSON key', async () => {
        expect(await strategy.isRecommendationReached({
          client: nodeClient,
          databaseId: mockDatabaseId,
          keys: [mockHashInfo],
        })).toEqual({ isReached: false });
      });

      it('should return false when FT._LIST return indexes', async () => {
        when(nodeClient.sendCommand)
          .calledWith(jasmine.objectContaining({ name: 'FT._LIST' }))
          .mockResolvedValue(mockIndexes);

        expect(await strategy.isRecommendationReached({
          client: nodeClient,
          databaseId: mockDatabaseId,
          keys: [mockJSONInfo, mockHashInfo],
        })).toEqual({ isReached: false });
      });
    });

    describe('without search module', () => {
      beforeEach(() => {
        databaseService.get.mockResolvedValue({ modules: [] });
      });

      it('should return true when there is JSON key', async () => {
        expect(await strategy.isRecommendationReached({
          client: nodeClient,
          databaseId: mockDatabaseId,
          keys: [mockJSONInfo, mockHashInfo],
        })).toEqual({ isReached: true, params: { keys: [mockJSONInfo.name] } });
      });

      it('should return false when there is not JSON key', async () => {
        expect(await strategy.isRecommendationReached({
          client: nodeClient,
          databaseId: mockDatabaseId,
          keys: [mockHashInfo],
        })).toEqual({ isReached: false });
      });
    });
  });
});
