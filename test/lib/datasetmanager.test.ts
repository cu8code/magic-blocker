import { DatasetManager, DataSet } from '~lib';
import type { MetaData } from '~lib';

const mockChromeStorage = {
  local: {
    get: jest.fn(),
    set: jest.fn(),
  },
  runtime: {
    lastError: null,
  },
};

(global as any).chrome = mockChromeStorage;

jest.mock('./dataset', () => ({
  DataSet: jest.fn().mockImplementation((id: string) => ({
    id,
    save: jest.fn(),
  })),
}));

describe('DatasetManager', () => {
  beforeEach(() => {
    // Clear mocks and reset state before each test
    jest.clearAllMocks();
    (global as any).chrome.local.get.mockClear();
    (global as any).chrome.local.set.mockClear();
  });

  describe('load', () => {
    it('should load singleton instance of DatasetManager', async () => {
      const instance = await DatasetManager.load();
      expect(instance).toBeInstanceOf(DatasetManager);
    });

    it('should return the same instance when called multiple times', async () => {
      const instance1 = await DatasetManager.load();
      const instance2 = await DatasetManager.load();

      expect(instance1).toBe(instance2);
    });
  });

  describe('addDataset', () => {
    it('should add a new dataset and save it to Chrome storage', async () => {
      const instance = await DatasetManager.load();

      (global as any).chrome.local.get.mockImplementationOnce((key: string, callback: (result: any) => void) => {
        callback({ 'dataset-manager': [] });
      });
      (global as any).chrome.local.set.mockImplementationOnce((data: any, callback: () => void) => {
        callback();
      });

      const meta: MetaData = {
        length: 10,
        type: 'string',
        name: 'Sample Dataset',
        author: 'John Doe',
        description: 'This is a sample dataset',
        email: 'sample@example.com',
      };

      const newDataset = await instance.addDataset('dataset3', 'username', 'repo', 'branch', meta, 0);

      expect((global as any).chrome.local.set).toHaveBeenCalledWith(
        { 'dataset-manager': ['dataset3'] },
        expect.any(Function)
      );
      expect(instance['datasets']['dataset3']).toBeInstanceOf(DataSet);
      expect(newDataset.id).toBe('dataset3');
    });

    it('should handle error when adding dataset and saving to Chrome storage', async () => {
      const instance = await DatasetManager.load();

      (global as any).chrome.local.get.mockImplementationOnce((key: string, callback: (result: any) => void) => {
        callback({ 'dataset-manager': [] });
      });
      (global as any).chrome.local.set.mockImplementationOnce((data: any, callback: (e: Error) => void) => {
        callback(new Error('Storage error'));
      });

      const meta: MetaData = {
        length: 10,
        type: 'string',
        name: 'Sample Dataset',
        author: 'John Doe',
        description: 'This is a sample dataset',
        email: 'sample@example.com',
      };

      await expect(
        instance.addDataset('dataset4', 'username', 'repo', 'branch', meta, 0)
      ).rejects.toThrow('Storage error');

      expect(instance['datasets']['dataset4']).toBeUndefined();
    });
  });

  describe('getQuestion', () => {
    it('should return a random question from loaded datasets', async () => {
      const instance = await DatasetManager.load();
      instance['datasets'] = {
        dataset1: new DataSet('dataset1', 0, 'username', 'repo', 'branch', { author: 'John Doe', description: '', email: '', length: 0, name: '', type: 'string' }, 0),
      };

      const question = instance.getQuestion();

      expect(question).toBeDefined();
    });

    it('should return null if no datasets are loaded', async () => {
      const instance = await DatasetManager.load();

      const question = instance.getQuestion();

      expect(question).toBeNull();
    });
  });
});
