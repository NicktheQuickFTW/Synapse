import module from './index';

describe('XII Module Template', () => {
  beforeAll(async () => {
    // Initialize the module before tests
    await module.initialize();
  });

  afterAll(async () => {
    // Clean up after tests
    await module.shutdown();
  });

  test('should provide module info', () => {
    const info = module.getInfo();
    expect(info).toBeDefined();
    expect(info.name).toBe('module-template');
    expect(typeof info.version).toBe('string');
    expect(typeof info.description).toBe('string');
  });

  test('should execute successfully with no parameters', async () => {
    const result = await module.execute();
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
    expect(result.data.message).toBe('Module executed successfully');
    expect(result.data.timestamp).toBeDefined();
  });

  test('should execute successfully with parameters', async () => {
    const params = { test: 'value' };
    const result = await module.execute(params);
    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });
}); 