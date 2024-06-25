import { DataSet } from "./dataset";
import type { MetaData } from "./types";

/**
 * A Singleton class responsible for managing datasets.
 * Leitner System
 */
export class DatasetManager {
    _type = "DatasetManager";
    datasets: { [key: string]: DataSet };
    private static instance: DatasetManager | null = null;
  
    private constructor() {
      this.datasets = {};
    }
  
    /**
     * Load dataset IDs from memory and populate the datasets map.
     * @returns {Promise<void>}
     */
    private async loadDatasetIdsFromMemory(): Promise<void> {
      try {
        const result = await new Promise<{ [key: string]: any }>((resolve) => {
          chrome.storage.local.get("dataset-manager", (result) => {
            resolve(result);
          });
        });
  
        const datasetKeys = result["dataset-manager"] || [];
        if (datasetKeys.length === 0) {
          console.log("dataset-manager no data loaded");
        }
  
        for (const datasetKey of datasetKeys) {
          const dataset = await DataSet.load(datasetKey);
          if (dataset) {
            console.log(`Dataset with id ${datasetKey} loaded into DatasetManager.`);
            this.datasets[datasetKey] = dataset;
          } else {
            console.error(`Failed to load dataset with id ${datasetKey}.`);
          }
        }
      } catch (error) {
        console.error("Error loading datasets from storage:", error);
      }
    }
  
    /**
     * Create and initialize the singleton instance of DatasetManager.
     * @returns {Promise<DatasetManager>}
     */
    static async load(): Promise<DatasetManager> {
      if (!DatasetManager.instance) {
        DatasetManager.instance = new DatasetManager();
        await DatasetManager.instance.loadDatasetIdsFromMemory();
      }
      return DatasetManager.instance;
    }
  
    /**
     * Add a new dataset to the manager and save it to storage.
     * @param {string} id - The ID of the new dataset.
     * @param {string} username - The GitHub username associated with the dataset.
     * @param {string} repository - The GitHub repository name associated with the dataset.
     * @param {string} branch - The GitHub branch name associated with the dataset.
     * @param {MetaData} meta - Metadata for the new dataset.
     * @param {number} lastLoadedIndex - The last loaded index.
     * @returns {Promise<DataSet>} The newly created dataset.
     */
    async addDataset(
      id: string,
      username: string,
      repository: string,
      branch: string,
      meta: MetaData,
      lastLoadedIndex: number
    ): Promise<DataSet> {
      const newDataset = new DataSet(id, 0, username, repository, branch, meta, lastLoadedIndex);
      this.datasets[id] = newDataset;
      newDataset.save();
  
      try {
        const result = await new Promise<{ [key: string]: any }>((resolve) => {
          chrome.storage.local.get("dataset-manager", (result) => {
            resolve(result);
          });
        });
  
        const datasetManagerData = result["dataset-manager"] || [];
        datasetManagerData.push(id);
  
        await new Promise<void>((resolve, reject) => {
          chrome.storage.local.set({ "dataset-manager": datasetManagerData }, () => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              resolve();
            }
          });
        });
      } catch (error) {
        console.error(`Error adding dataset with id ${id}:`, error);
        throw error;
      }
  
      return newDataset;
    }
  
    /**
     * Gets a random question from the dataset
     */
    getQuestion() {
      // Implement the method to get a random question from the dataset
    }
  }