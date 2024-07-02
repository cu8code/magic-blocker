import { selectRandomElementFromArray } from "~utils/functions";
import { DataSet } from "./dataset";
import type { Data, MetaData } from "./types";

/**
 * A Singleton class responsible for managing datasets.
 * Leitner System
 */
export class DatasetManager {
  _type = "DatasetManager";
  datasets: { [key: string]: DataSet };
  private static instance: DatasetManager | null = null;
  current: DataSet | null = null;

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
      if (Object.keys(DatasetManager.instance.datasets).length === 0) {
        await DatasetManager.instance.fetchDataset()
        console.log("dataset-manager fetched github");
      }
    }
    return DatasetManager.instance;
  }

  /**
   * Add a new dataset to the manager and save it to storage.
   * @param {string} username - The GitHub username associated with the dataset.
   * @param {string} repository - The GitHub repository name associated with the dataset.
   * @param {string} branch - The GitHub branch name associated with the dataset.
   * @param {MetaData} meta - Metadata for the new dataset.
   * @returns {Promise<DataSet>} The newly created dataset.
   */
  async addDataset(
    username: string,
    repository: string,
    branch: string,
    meta: MetaData,
  ): Promise<DataSet> {
    const newDataset = new DataSet(username, repository, branch, meta);
    const id = `${username}.${repository}.${branch}`
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

  async removeDataset(username: string, repository: string, branch: string){
    const id = `${username}.${repository}.${branch}`
    delete this.datasets[id]
  }

  /**
   * Gets a random question from the dataset
   */
  getQuestion() {
    this.current = this.datasets[
      selectRandomElementFromArray(
        Object.keys(
          this.datasets
        )
      )
    ]

    return this.current.getQuestion()
  }


  async fetchDataset(username: string = "cu8code", repository: string = "eular-dataset-magic-block", branch: string = "main") {
    try {
      const data: MetaData = await (await fetch(`https://raw.githubusercontent.com/${username}/${repository}/main/index.json`)).json()
      this.addDataset(username, repository, branch, data)
    } catch (error) {
      console.error(`Error fetching dataset:`, error);
      throw error;
    }
  }

 
}