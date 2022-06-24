import { Test, TestingModule } from '@nestjs/testing';
import {
  mockSocket,
  MockType,
} from 'src/__mocks__';
import { UserSessionProvider } from 'src/modules/pub-sub/providers/user-session.provider';
import { RedisClientProvider } from 'src/modules/pub-sub/providers/redis-client.provider';
import { UserClient } from 'src/modules/pub-sub/model/user-client';
import { RedisClient } from 'src/modules/pub-sub/model/redis-client';

const mockUserClient = new UserClient('socketId', mockSocket, 'databaseId');
const mockUserClient2 = new UserClient('socketId2', mockSocket, 'databaseId');
const getRedisClientFn = jest.fn();
const mockRedisClient = new RedisClient('databaseId', getRedisClientFn);

describe('UserSessionProvider', () => {
  let service: UserSessionProvider;
  let redisClientProvider: MockType<RedisClientProvider>;

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserSessionProvider,
        {
          provide: RedisClientProvider,
          useFactory: () => ({
            createClient: jest.fn(),
          }),
        },

      ],
    }).compile();

    service = await module.get(UserSessionProvider);
    redisClientProvider = await module.get(RedisClientProvider);

    redisClientProvider.createClient.mockReturnValue(mockRedisClient);
  });

  describe('getOrCreateUserSession', () => {
    it('should create new UserSession and store it. Ignore the same session', async () => {
      expect(service['sessions'].size).toEqual(0);
      const userSession = await service.getOrCreateUserSession(mockUserClient);
      expect(service['sessions'].size).toEqual(1);
      expect(service.getUserSession(userSession.getId())).toEqual(userSession);
      await service.getOrCreateUserSession(mockUserClient);
      expect(service['sessions'].size).toEqual(1);
      expect(service.getUserSession(userSession.getId())).toEqual(userSession);
    });
  });
  describe('removeUserSession', () => {
    it('should remove UserSession', async () => {
      expect(service['sessions'].size).toEqual(0);
      await service.getOrCreateUserSession(mockUserClient);
      await service.getOrCreateUserSession(mockUserClient2);
      expect(service['sessions'].size).toEqual(2);
      await service.removeUserSession(mockUserClient.getId());
      expect(service['sessions'].size).toEqual(1);
      await service.removeUserSession(mockUserClient.getId());
      expect(service['sessions'].size).toEqual(1);
      await service.removeUserSession(mockUserClient2.getId());
      expect(service['sessions'].size).toEqual(0);
    });
  });
});
