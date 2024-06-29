import { DatasetManager, DataSet } from '~lib';
import type { MetaData } from '~lib';

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

// Mock the DataSet class
jest.mock('./dataset', () => {
  return {
    DataSet: jest.fn().mockImplementation(() => ({
      save: jest.fn(),
      getQuestion: jest.fn(),
    })),
  };
});

describe('DatasetManager', () => {
  let manager: DatasetManager;

  beforeEach(async () => {
    jest.clearAllMocks();
    // Reset the singleton instance before each test
    (DatasetManager as any).instance = null;
    mockChromeStorage.get.mockImplementation((key, callback) => {
      callback({});
    });
    manager = await DatasetManager.load();
  });

  test('load creates a singleton instance', async () => {
    const manager1 = await DatasetManager.load();
    const manager2 = await DatasetManager.load();
    expect(manager1).toBe(manager2);
  });

  test('addDataset adds a new dataset and saves it to storage', async () => {
    const mockMeta: MetaData = {
      type: 'quiz',
      name: 'Test Quiz',
      author: 'Test Author',
      description: 'A test quiz dataset',
      email: 'test@example.com',
      length: 10
    };

    await manager.addDataset('testuser', 'testrepo', 'main', mockMeta);

    expect(manager.datasets['testuser.testrepo.main']).toBeDefined();
    expect(DataSet).toHaveBeenCalledWith('testuser', 'testrepo', 'main', mockMeta);
    expect(mockChromeStorage.set).toHaveBeenCalledWith(
      { 'dataset-manager': ['testuser.testrepo.main'] },
      expect.any(Function)
    );
  });

  test('getQuestion returns a question from a random dataset', async () => {
    const mockDataset = {
      getQuestion: jest.fn().mockResolvedValue({ question: 'Test question', answer: 'Test answer' }),
    };
    manager.datasets = {
      'test.dataset.1': mockDataset as any,
    };

    await manager.getQuestion();

    expect(mockDataset.getQuestion).toHaveBeenCalled();
  });

  test('fetchDataset fetches and adds a new dataset', async () => {
    const mockMeta: MetaData = {
      type: 'quiz',
      name: 'Test Quiz',
      author: 'Test Author',
      description: 'A test quiz dataset',
      email: 'test@example.com',
      length: 10
    };

    (global.fetch as jest.Mock).mockResolvedValue({
      json: jest.fn().mockResolvedValue(mockMeta),
    });

    await manager.fetchDataset('testuser', 'testrepo', 'main');

    expect(global.fetch).toHaveBeenCalledWith('https://raw.githubusercontent.com/testuser/testrepo/main/index.json');
    expect(manager.datasets['testuser.testrepo.main']).toBeDefined();
  });

  test('loadDatasetIdsFromMemory loads datasets from storage', async () => {
    const mockStoredData = {
      'dataset-manager': ['testuser.testrepo.main'],
    };
    mockChromeStorage.get.mockImplementation((key, callback) => {
      callback(mockStoredData);
    });

    const mockDataset = new DataSet('testuser', 'testrepo', 'main', {} as MetaData);
    (DataSet.load as jest.Mock).mockResolvedValue(mockDataset);

    // Create a new instance to trigger loadDatasetIdsFromMemory
    (DatasetManager as any).instance = null;
    manager = await DatasetManager.load();

    expect(manager.datasets['testuser.testrepo.main']).toBe(mockDataset);
  });
});
