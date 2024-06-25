import type { DatasetManager } from "./datasetmanager";
import type { Data, MetaData } from "./types";

/**
 * A class responsible for managing datasets from a remote GitHub repository.
 */
export class RemoteManager {
    _type = "RemoteManager";
    private static instance: RemoteManager;
    default_username: string = "buxr";
    default_repository: string = "data";
    default_branch: string = "master";
  
    private constructor() { }
  
    /**
     * Get the singleton instance of the RemoteManager.
     * @returns {RemoteManager} The singleton instance.
     */
    public static getInstance(): RemoteManager {
      if (!RemoteManager.instance) {
        RemoteManager.instance = new RemoteManager();
      }
      return RemoteManager.instance;
    }
  
    /**
     * Create the base URL for the GitHub repository.
     * @param {string} [username=this.default_username] - The GitHub username.
     * @param {string} [repository=this.default_repository] - The GitHub repository name.
     * @param {string} [branch=this.default_branch] - The GitHub branch name.
     * @returns {string} The constructed base URL.
     */
    createBaseUrl(
      username: string = this.default_username,
      repository: string = this.default_repository,
      branch: string = this.default_branch
    ): string {
      return `https://raw.githubusercontent.com/${username}/${repository}/${branch}`;
    }
  
    /**
     * Load datasets from the default URL and add them to the DatasetManager.
     * @param {DatasetManager} manager - The DatasetManager instance to add datasets to.
     * @returns {Promise<void>} A promise that resolves when the datasets are loaded.
     */
    async loadDataSetsFromDefaultUrl(manager: DatasetManager): Promise<void> {
      console.log("Fetching from the web");
      try {
        // Step 1: Fetch metadata from index.json
        const metadataResponse = await fetch(`${this.createBaseUrl()}/index.json`);
        const fetchMetadata: MetaData = await metadataResponse.json();
        const key = `${this.default_username}.${this.default_repository}.${this.default_branch}`;
        console.log("Key Metadata:", fetchMetadata);
  
        // Step 2: Iterate through each chunk index
        for (let currentIndex = 0; currentIndex < fetchMetadata.length; currentIndex++) {
          // Step 3: Construct URL for fetching questions
          const questionsUrl = `${this.createBaseUrl()}/data/${currentIndex}.json`;
          const questionsResponse = await fetch(questionsUrl);
          const questions: Data[] = await questionsResponse.json();
  
          console.log("Questions:", questions);
  
          // Step 4: Check if the dataset already exists in the manager
          if (!manager.datasets[key]) {
            await manager.addDataset(
              key,
              this.default_username,
              this.default_repository,
              this.default_branch,
              fetchMetadata,
              currentIndex
            );
          }
  
          // Step 5: Add questions to DataSet using appropriate structure
          questions.forEach((question) => {
            manager.datasets[key].addQuestion(question);
          });
  
          console.log("Questions added to DataSet.");
  
          // Step 6: Save the DataSet
          manager.datasets[key].save();
          console.log("Dataset saved with key", key);
        }
      } catch (error) {
        console.error("Error loading datasets from default URL:", error);
      }
    }
  
    /**
     * Load an external dataset from a specified GitHub repository URL.
     * @param {string} username - The GitHub username.
     * @param {string} repository - The GitHub repository name.
     * @param {string} branch - The GitHub branch name.
     * @returns {Promise<void>} A promise that resolves when the dataset is loaded.
     */
    async loadExternalDatasetFromUrl(username: string, repository: string, branch: string): Promise<void> {
      // TODO: Implement this method to load datasets from an external GitHub repository
    }
  }