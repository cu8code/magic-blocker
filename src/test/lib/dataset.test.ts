import { DataSet } from '~lib';
import type { MetaData, Data } from '~lib/types';

const chrome = {
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn()
    }
  },
  runtime: {
    lastError: null
  }
};
(global as any).chrome = chrome;

describe('DataSet', () => {
  const meta: MetaData = {
    length: 10,
    type: "string",
    name: "Sample Dataset",
    author: "John Doe",
    description: "This is a sample dataset",
    email: "sample@example.com",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should create a DataSet instance', () => {
    const dataSet = new DataSet('username.repo.branch', 1, 'username', 'repo', 'branch', meta, 0);
    expect(dataSet.id).toBe('username.repo.branch');
    expect(dataSet.version).toBe(1);
    expect(dataSet.username).toBe('username');
    expect(dataSet.repository).toBe('repo');
    expect(dataSet.branch).toBe('branch');
    expect(dataSet.meta).toBe(meta);
    expect(dataSet.lastLoadedIndex).toBe(0);
  });

  it('should save the DataSet to chrome storage', () => {
    const dataSet = new DataSet('username.repo.branch', 1, 'username', 'repo', 'branch', meta, 0);
    dataSet.save();
    expect(chrome.storage.local.set).toHaveBeenCalledWith(
      {
        'username.repo.branch': {
          id: 'username.repo.branch',
          meta: meta,
          current: { one: [], two: [], three: [] },
          version: 1,
          username: 'username',
          repository: 'repo',
          branch: 'branch',
          lastLoadedIndex: 0
        }
      },
      expect.any(Function)
    );
  });

  it('should load a DataSet from chrome storage', async () => {
    const storedData = {
      id: 'username.repo.branch',
      meta: meta,
      current: { one: [], two: [], three: [] },
      version: 1,
      username: 'username',
      repository: 'repo',
      branch: 'branch',
      lastLoadedIndex: 0
    };
    chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({ 'username.repo.branch': storedData });
    });

    const dataSet = await DataSet.load('username.repo.branch');
    expect(dataSet).not.toBeNull();
    expect(dataSet?.id).toBe('username.repo.branch');
    expect(dataSet?.version).toBe(1);
    expect(dataSet?.username).toBe('username');
    expect(dataSet?.repository).toBe('repo');
    expect(dataSet?.branch).toBe('branch');
    expect(dataSet?.meta).toBe(meta);
    expect(dataSet?.lastLoadedIndex).toBe(0);
  });

  it('should return null if no DataSet is found in chrome storage', async () => {
    chrome.storage.local.get.mockImplementation((keys, callback) => {
      callback({});
    });

    const dataSet = await DataSet.load('username.repo.branch');
    expect(dataSet).toBeNull();
  });

  it('should add a question to the appropriate difficulty level', () => {
    const dataSet = new DataSet('username.repo.branch', 1, 'username', 'repo', 'branch', meta, 0);
    const question: Data = {
      question: 'What is 2 + 2?',
      solution: '4',
      difficulty: 'EASY',
      source: 'Mathematics',
      hints: 'Think simple!',
      coverImage: 'https://example.com/image.jpg'
    };

    dataSet.addQuestion(question);
    expect(dataSet.current.one).toContain(question);
    expect(dataSet.current.two).toHaveLength(0);
    expect(dataSet.current.three).toHaveLength(0);
    expect(chrome.storage.local.set).toHaveBeenCalled();
  });
});
