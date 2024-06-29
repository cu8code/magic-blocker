import { DataSet } from '~lib/dataset';  // Adjust the import path as needed
import type { MetaData } from '~lib';  // Adjust the import path as needed
// Define a mock MetaData that matches the expected structure
const mockMeta: MetaData = {
  type: "card",
  name: 'Test Quiz',
  author: 'Test Author',
  description: 'A test quiz dataset',
  email: 'test@example.com',
  length: 10
};

// Mock the chrome.storage.local API
const mockChromeStorage = {
  get: jest.fn(),
  set: jest.fn(),
};
(global as any).chrome = {
  storage: {
    local: mockChromeStorage,
  },
  runtime: {
    lastError: null,
  },
};

// Mock the fetch function
global.fetch = jest.fn();

describe('DataSet', () => {
  let dataset: DataSet;

  beforeEach(() => {
    dataset = new DataSet('testuser', 'testrepo', 'main', mockMeta);
    jest.clearAllMocks();
  });

  test('constructor initializes properties correctly', () => {
    expect(dataset.id).toBe('testuser.testrepo.main');
    expect(dataset.username).toBe('testuser');
    expect(dataset.repository).toBe('testrepo');
    expect(dataset.branch).toBe('main');
    expect(dataset.meta).toEqual(mockMeta);
  });

  test('getQuestion fetches data correctly', async () => {
    const mockData = { question: 'Test question', answer: 'Test answer' };
    (global.fetch as jest.Mock).mockResolvedValue({
      json: jest.fn().mockResolvedValue(mockData),
    });

    const result = await dataset.getQuestion();
    expect(result.status).toBe('sucess');  // Note: There's a typo in the original code
    expect(result.data).toEqual(mockData);
    expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('https://raw.githubusercontent.com/testuser/testrepo/main/data/'));
  });

  test('success method moves question to correct box', () => {
    // @ts-ignore: Accessing private property for testing
    dataset.lastQuestionId = ['one', 0];
    dataset.sucess(true);
    // @ts-ignore: Accessing private property for testing
    expect(dataset.history.one).not.toContain(0);
    // @ts-ignore: Accessing private property for testing
    expect(dataset.history.two).toContain(0);

    // @ts-ignore: Accessing private property for testing
    dataset.lastQuestionId = ['two', 1];
    dataset.sucess(false);
    // @ts-ignore: Accessing private property for testing
    expect(dataset.history.two).not.toContain(1);
    // @ts-ignore: Accessing private property for testing
    expect(dataset.history.one).toContain(1);
  });

  test('save method calls chrome.storage.local.set', () => {
    dataset.save();
    expect(mockChromeStorage.set).toHaveBeenCalledWith(
      expect.objectContaining({
        'testuser.testrepo.main': expect.objectContaining({
          username: 'testuser',
          repository: 'testrepo',
          branch: 'main',
          meta: mockMeta,
        }),
      }),
      expect.any(Function)
    );
  });

  test('load method retrieves data from chrome.storage.local', async () => {
    const mockStoredData = {
      'testuser.testrepo.main': {
        username: 'testuser',
        repository: 'testrepo',
        branch: 'main',
        meta: mockMeta,
      },
    };
    mockChromeStorage.get.mockImplementation((key, callback) => {
      callback(mockStoredData);
    });

    const loadedDataset = await DataSet.load('testuser.testrepo.main');
    expect(loadedDataset).toBeInstanceOf(DataSet);
    expect(loadedDataset?.id).toBe('testuser.testrepo.main');
    expect(loadedDataset?.username).toBe('testuser');
    expect(loadedDataset?.repository).toBe('testrepo');
    expect(loadedDataset?.branch).toBe('main');
    expect(loadedDataset?.meta).toEqual(mockMeta);
  });
});