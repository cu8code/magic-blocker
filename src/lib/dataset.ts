import type { Box, Data, MetaData } from "~lib/types";

/**
 * Class representing a dataset with associated metadata, a single chunk, and versioning.
 */
export class DataSet {
    _type = "DataSet";
    private _id: string;
  
    public get id(): string {
      return this._id;
    }
    /**
     * @param {string} value - the format must be {username}.{repository}.{branch}
     */
    public set id(value: string) {
      if (value.split(".").length === 3) {
        this._id = value;
      }
    }
    current: Box = {
      one: [],
      two: [],
      three: []
    };
    lastLoadedIndex = 0;
    version: number;
    username: string;
    repository: string;
    branch: string;
    meta: MetaData;
  
    /**
     * Create a DataSet.
     * @param {string} id - The unique identifier for the dataset.
     * @param {number} [version=0] - The version of the dataset.
     * @param {string} username - The GitHub username associated with the dataset.
     * @param {string} repository - The GitHub repository name.
     * @param {string} branch - The branch of the GitHub repository.
     * @param {MetaData} meta - The metadata associated with the dataset.
     * @param {number} index - The last index till which we have loaded 
     */
    constructor(
      id: string,
      version: number = 0,
      username: string,
      repository: string,
      branch: string,
      meta: MetaData,
      index: number
    ) {
      this.id = id;
      this.version = version;
      this.username = username;
      this.repository = repository;
      this.branch = branch;
      this.meta = meta;
      this.lastLoadedIndex = index;
    }
  
    /**
     * Save the dataset to Chrome local storage.
     */
    save() {
      const data = {
        id: this.id,
        meta: this.meta,
        current: this.current,
        version: this.version,
        username: this.username,
        repository: this.repository,
        branch: this.branch,
        lastLoadedIndex: this.lastLoadedIndex
      };
      chrome.storage.local.set({ [this.id]: data }, () => {
        if (chrome.runtime.lastError) {
          console.error(`Error saving dataSet with id ${this.id}: ${chrome.runtime.lastError}`);
        } else {
          console.log(`DataSet with id ${this.id} saved successfully.`);
        }
      });
    }
  
    /**
     * Load a dataset from Chrome local storage.
     * @param {string} id - The unique identifier for the dataset to load.
     * @returns {Promise<DataSet|null>} A promise that resolves to the loaded DataSet or null if not found.
     */
    static load(id: string): Promise<DataSet | null> {
      return new Promise((resolve, reject) => {
        chrome.storage.local.get([id], (result) => {
          if (chrome.runtime.lastError) {
            console.error(`Error loading dataSet with id ${id}: ${chrome.runtime.lastError}`);
            reject(chrome.runtime.lastError);
          } else {
            const data = result[id];
            if (data) {
              const meta: MetaData = data.meta;
              const dataSet = new DataSet(
                data.id,
                data.version,
                data.username,
                data.repository,
                data.branch,
                meta,
                data.lastLoadedIndex
              );
              dataSet.current = data.current;
              resolve(dataSet);
            } else {
              resolve(null);
            }
          }
        });
      });
    }
  
    /**
     * Add a question to the dataset based on its difficulty.
     * @param {Data} question - The question object to add.
     */
    addQuestion(question: Data) {
      switch (question.difficulty) {
        case "EASY":
          this.current.one.push(question);
          break;
        case "MEDIUM":
          this.current.two.push(question);
          break;
        case "HARD":
          this.current.three.push(question);
          break;
        default:
          console.warn(`Unknown difficulty level for question: ${question.difficulty}`);
      }
      this.save();
    }
  
  }