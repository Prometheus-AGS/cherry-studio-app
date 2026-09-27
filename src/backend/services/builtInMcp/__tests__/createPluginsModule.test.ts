import { authorizationStoreFixture } from '../authorization/__tests__/_authorizationStoreFixture';
import { PluginAuthorizationManager } from '../authorization/PluginAuthorizationManager';
import { createPluginsModule as createModule } from '../createPluginsModule';
import { requirePluginAuthMethod, requirePluginDefinition } from '../pluginRegistry';
import type { FeishuAuthorizationRuntime } from '../plugins/feishu/FeishuAuthorizationRuntime';

type Runtime = Parameters<typeof createModule>[0];
function createPluginsModule(runtime: Pick<Runtime, 'invalidateServer'> & Partial<Runtime>) {
  return createModule(
    { cachePluginToolCatalog: jest.fn(async () => undefined), ...runtime },
    authorizations,
  );
}

const mockConnect = jest.fn();
const mockDisconnect = jest.fn();
const mockList = jest.fn();
const mockCurrentGrant = jest.fn();
const mockValidateConnection = jest.fn();
jest.mock('@/backend/data/services/PluginAuthorizationService', () => ({
  pluginAuthorizationService: {
    listConnections: (...args: unknown[]) => mockList(...args),
    getCurrentGrant: (...args: unknown[]) => mockCurrentGrant(...args),
  },
}));
jest.mock('../transport/validatePluginConnection', () => ({
  validatePluginConnection: (...args: unknown[]) => mockValidateConnection(...args),
}));
jest.mock('../authorization/PluginCredentialStore', () => ({
  PluginCredentialStore: class {
    authorizationStore() {
      return mockFixture.store;
    }
    connect(...args: unknown[]) {
      return mockConnect(...args);
    }
    disconnect(...args: unknown[]) {
      return mockDisconnect(...args);
    }
    async stop() {}
  },
}));

// A credentials-kind method on a plugin that is not paused (unlike GitHub/Notion, see
// `assertPluginSignInAvailable`), so these fixtures exercise `connect()` itself rather than the
// disabled-plugin guard, which has its own dedicated test below.
const input = { pluginId: 'amap', authMethod: 'api_key', fields: { key: 'test-key' } };
const connection = {
  pluginId: 'amap',
  accountLabel: 'cherry',
  serverId: 'server-1',
  connectedAt: '2026-09-09T00:00:00.000Z',
};
const validation = {
  accountLabel: 'cherry',
  catalog: {
    tools: [{ name: 'maps_geo', inputSchema: { type: 'object' as const, properties: {} } }],
    discoveryWarnings: [],
    serverInfo: { name: 'Amap', version: '1' },
  },
};
let mockFixture: ReturnType<typeof authorizationStoreFixture>;
let authorizations: PluginAuthorizationManager;
beforeEach(() => {
  jest.resetAllMocks();
  mockFixture = authorizationStoreFixture();
  authorizations = new PluginAuthorizationManager();
  mockValidateConnection.mockResolvedValue(validation);
  mockConnect.mockResolvedValue(connection);
  mockList.mockResolvedValue([connection]);
  mockDisconnect.mockResolvedValue({ serverId: 'server-1' });
});
afterEach(async () => {
  await authorizations.stop();
  jest.restoreAllMocks();
});

it('commits an observed ready attempt only after read-only validation of its selected method', async () => {
  const auth = authorizations.get('feishu', 'feishu_user') as FeishuAuthorizationRuntime;
  const credential = {
    version: 1,
    application: { appId: 'cli_cherry', appSecret: 'secret' },
    tokens: { accessToken: 'user-token' },
  };
  const signal = auth.attemptSignal;
  jest
    .spyOn(auth, 'getState')
    .mockResolvedValue({ status: 'ready', attemptId: '00000000-0000-4000-8000-000000000001' });
  jest
    .spyOn(auth, 'prepare')
    .mockResolvedValue({ credential, accountLabel: 'Cherry (ou_cherry)', signal });
  const commit = jest.spyOn(auth, 'commit').mockResolvedValue(connection);
  const invalidateServer = jest.fn();
  const cachePluginToolCatalog = jest.fn(async () => undefined);
  const plugins = createPluginsModule({ invalidateServer, cachePluginToolCatalog });
  const connected = new Promise<unknown>((resolve) => {
    plugins.authorization.observe('feishu', 'feishu_user', (observation) => {
      if (observation.connection) resolve(observation.connection);
    });
  });
  await expect(connected).resolves.toEqual(connection);
  expect(mockValidateConnection).toHaveBeenCalledWith('feishu', 'feishu_user', credential, signal);
  expect(commit).toHaveBeenCalledWith(
    '00000000-0000-4000-8000-000000000001',
    'Cherry (ou_cherry)',
    signal,
  );
  expect(invalidateServer).toHaveBeenCalledWith(connection.serverId);
  expect(cachePluginToolCatalog).toHaveBeenCalledWith(connection.serverId, validation.catalog);
  expect(cachePluginToolCatalog.mock.invocationCallOrder[0]).toBeGreaterThan(
    invalidateServer.mock.invocationCallOrder[0]!,
  );
  await auth.stop();
});

it('saves an existing application through the plugin field rules before user authorization', async () => {
  const auth = authorizations.get('feishu', 'feishu_user') as FeishuAuthorizationRuntime;
  const useApplication = jest
    .spyOn(auth, 'useApplication')
    .mockResolvedValue({ status: 'application-ready', applicationId: 'cli_cherry' });
  const plugins = createPluginsModule({ invalidateServer: jest.fn() });
  expect(() =>
    plugins.authorization.useApplication('feishu', 'feishu_user', {
      appId: 'bad id',
      appSecret: 'secret',
    }),
  ).toThrow();
  expect(() =>
    plugins.authorization.useApplication('github', 'personal_token', { token: 'secret' }),
  ).toThrow('unavailable');
  await expect(
    plugins.authorization.useApplication('feishu', 'feishu_user', {
      appId: ' cli_cherry ',
      appSecret: 'secret',
    }),
  ).resolves.toEqual({ status: 'application-ready', applicationId: 'cli_cherry' });
  expect(useApplication).toHaveBeenCalledWith({ appId: 'cli_cherry', appSecret: 'secret' });
  await auth.stop();
});

it('invalidates pending user authorization synchronously and keeps the application on disconnect', async () => {
  const auth = authorizations.get('feishu', 'feishu_user') as FeishuAuthorizationRuntime;
  const cancel = jest
    .spyOn(auth, 'cancel')
    .mockResolvedValue({ status: 'application-ready', applicationId: 'cli_cherry' });
  const signal = auth.attemptSignal;
  const disconnect = createPluginsModule({ invalidateServer: jest.fn() }).disconnect('feishu');
  expect(signal.aborted).toBe(true);
  await disconnect;
  expect(cancel).toHaveBeenCalledTimes(1);
  await auth.stop();
});

it('validates credentials upstream before storing anything', async () => {
  const invalidateServer = jest.fn();
  const cachePluginToolCatalog = jest.fn(async () => undefined);
  const plugins = createPluginsModule({ invalidateServer, cachePluginToolCatalog });
  mockValidateConnection.mockRejectedValueOnce(new Error('invalid token'));
  await expect(plugins.connect(input)).rejects.toThrow('invalid token');
  expect(mockConnect).not.toHaveBeenCalled();
  mockConnect.mockRejectedValueOnce(new Error('storage error'));
  await expect(plugins.connect(input)).rejects.toThrow('Could not save');
  expect(invalidateServer).not.toHaveBeenCalled();
  expect(cachePluginToolCatalog).not.toHaveBeenCalled();
});

it('invalidates the runtime only after the new grant commits', async () => {
  const operations: string[] = [];
  mockConnect.mockImplementation(async () => {
    operations.push('commit');
    return connection;
  });
  const plugins = createPluginsModule({
    invalidateServer: () => operations.push('invalidate'),
    cachePluginToolCatalog: async (_id, catalog) => {
      expect(catalog).toBe(validation.catalog);
      operations.push('cache');
    },
  });
  await expect(plugins.connect(input)).resolves.toEqual(connection);
  expect(operations).toEqual(['commit', 'invalidate', 'cache']);
  expect(mockConnect.mock.calls[0][0]).toEqual({
    pluginId: 'amap',
    authMethod: 'api_key',
    serverName: '高德地图',
    accountLabel: 'cherry',
    credential: { version: 1, key: 'test-key' },
  });
});

it('finishes the connection after the validated catalog has been cached', async () => {
  let finishCache!: () => void;
  const cachePluginToolCatalog = jest.fn(
    () =>
      new Promise<void>((resolve) => {
        finishCache = resolve;
      }),
  );
  const plugins = createPluginsModule({ invalidateServer: jest.fn(), cachePluginToolCatalog });
  let connected = false;
  const connect = plugins.connect(input).then((value) => {
    connected = true;
    return value;
  });
  await new Promise((resolve) => setImmediate(resolve));
  expect(cachePluginToolCatalog).toHaveBeenCalledWith(connection.serverId, validation.catalog);
  expect(connected).toBe(false);
  finishCache();
  await expect(connect).resolves.toEqual(connection);
});

it('serializes disconnect behind an in-progress connect and leaves it disconnected', async () => {
  let finishValidation!: () => void;
  mockValidateConnection.mockImplementation(
    () =>
      new Promise((resolve) => {
        finishValidation = () => resolve(validation);
      }),
  );
  const operations: string[] = [];
  mockConnect.mockImplementation(async () => {
    operations.push('connect');
    return connection;
  });
  mockDisconnect.mockImplementation(async () => {
    operations.push('disconnect');
    return { serverId: 'server-1' };
  });
  const plugins = createPluginsModule({ invalidateServer: jest.fn() });
  const connect = plugins.connect(input);
  const disconnect = plugins.disconnect('amap');
  await new Promise((resolve) => setImmediate(resolve));
  expect(mockDisconnect).not.toHaveBeenCalled();
  finishValidation();
  await Promise.all([connect, disconnect]);
  expect(operations).toEqual(['connect', 'disconnect']);
});

it('does not commit when the authorization form is cancelled after validation', async () => {
  const controller = new AbortController();
  mockValidateConnection.mockImplementation(async () => {
    controller.abort();
    return validation;
  });
  const plugins = createPluginsModule({ invalidateServer: jest.fn() });
  await expect(plugins.connect(input, controller.signal)).rejects.toThrow();
  expect(mockConnect).not.toHaveBeenCalled();
});

it('rejects unregistered plugins and invalid plugin-owned fields before network or persistence', () => {
  const plugins = createPluginsModule({ invalidateServer: jest.fn() });
  expect(() =>
    plugins.connect({
      pluginId: 'future',
      authMethod: 'personal_token',
      fields: { token: 'secret' },
    }),
  ).toThrow('not available');
  for (const fields of [{ key: 'bad key' }, { key: 'secret', unexpected: 'value' }, {}] as Record<
    string,
    string
  >[]) {
    expect(() => plugins.connect({ pluginId: 'amap', authMethod: 'api_key', fields })).toThrow();
  }
  expect(mockValidateConnection).not.toHaveBeenCalled();
  expect(mockConnect).not.toHaveBeenCalled();
});

it('allows disconnecting a plugin no longer bundled by this app version', async () => {
  mockList.mockResolvedValue([{ ...connection, pluginId: 'future' }]);
  const invalidateServer = jest.fn();
  await createPluginsModule({ invalidateServer }).disconnect('future');
  expect(invalidateServer).toHaveBeenCalledWith(connection.serverId);
  expect(mockDisconnect).toHaveBeenCalledWith('future');
});

it('requires an explicit disconnect before a credential method replaces an identity it cannot compare', async () => {
  // Amap's `api_key` method does not itself require disconnect-before-replace; borrow that
  // behavior for this one assertion (restored below) since GitHub, the plugin that actually
  // has it, is paused and `connect()` now refuses it before reaching this check.
  const method = requirePluginAuthMethod(requirePluginDefinition('amap'), 'api_key');
  Object.assign(method, { requiresDisconnect: true });
  try {
    mockCurrentGrant.mockResolvedValue({ id: 'old-grant', authMethod: 'api_key' });
    await expect(
      createPluginsModule({ invalidateServer: jest.fn() }).connect(input),
    ).rejects.toMatchObject({ reason: 'requires-disconnect' });
    expect(mockValidateConnection).not.toHaveBeenCalled();
    expect(mockConnect).not.toHaveBeenCalled();
  } finally {
    Object.assign(method, { requiresDisconnect: false });
  }
});

it('refuses to connect a plugin whose sign-in is paused, the same as beginning one', () => {
  // Both `begin()` and `connect()` call `assertPluginSignInAvailable` before doing any async
  // work, so each throws synchronously rather than rejecting a promise.
  const plugins = createPluginsModule({ invalidateServer: jest.fn() });
  let beginError: unknown;
  try {
    plugins.authorization.begin('github', 'personal_token');
  } catch (error) {
    beginError = error;
  }
  expect(beginError).toBeInstanceOf(Error);
  expect(() =>
    plugins.connect({ pluginId: 'github', authMethod: 'personal_token', fields: { token: 'x' } }),
  ).toThrow((beginError as Error).message);
  expect(mockValidateConnection).not.toHaveBeenCalled();
  expect(mockConnect).not.toHaveBeenCalled();
});

it('captures optional revocation before local deletion and reports remote failure after disconnect', async () => {
  const operations: string[] = [];
  mockCurrentGrant.mockResolvedValue({ id: 'old-grant', authMethod: 'feishu_user' });
  const auth = authorizations.get('feishu', 'feishu_user');
  auth.prepareRevocation = async () => {
    operations.push('capture');
    return {
      managementUrl: 'https://example.com/manage',
      revoke: async (signal) => {
        expect(signal.aborted).toBe(false);
        operations.push('remote');
        throw new Error('network');
      },
    };
  };
  mockDisconnect.mockImplementation(async () => {
    operations.push('local');
  });
  const result = await createPluginsModule({ invalidateServer: jest.fn() }).disconnect('feishu');
  expect(operations).toEqual(['capture', 'local', 'remote']);
  expect(result).toEqual({
    revocation: 'unconfirmed',
    managementUrl: 'https://example.com/manage',
  });
});

it('does not let unavailable native credentials prevent local disconnection', async () => {
  mockCurrentGrant.mockResolvedValue({ id: 'old-grant', authMethod: 'feishu_user' });
  authorizations.get('feishu', 'feishu_user').prepareRevocation = async () => {
    throw new Error('locked');
  };
  await expect(
    createPluginsModule({ invalidateServer: jest.fn() }).disconnect('feishu'),
  ).resolves.toEqual({ revocation: 'unconfirmed' });
  expect(mockDisconnect).toHaveBeenCalledWith('feishu');
});
