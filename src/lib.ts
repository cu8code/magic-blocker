export interface Data {
  question: string;
  solution: string;
  difficulty: "HARD" | "MEDIUM" | "EASY";
  source?: string;
  hints?: string;
  coverImage?: string;
}

/**
 * Define the interfaces for the fetched data
 */
export interface MetaData {
  length: number;
  type: "string";
  name: string;
  description: string;
  email: string;
  twitter?: string;
  github?: string;
  youtube?: string;
  discord?: string;
}

interface Box {
  one: Data[];
  two: Data[];
  three: Data[];
}

/**
 * Class representing a dataset with associated metadata, a single chunk, and versioning.
 */
class DataSet {
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
    // Save the dataset after adding the question
    this.save();
  }

}

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
    newDataset.save(); // Save the new dataset using its own save method

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



/**
 * A Singleton class responsible for keeping track of user session of our app.
 */
export class SessionManager {
  _type = "SessionManager"
  private static instance: SessionManager | null = null;
  private numberOfSession: number = 0;
  private sessionTime: number | null = 25 * 60 * 1000; // Time in millis
  private timeLeft: number | null = 25 * 60 * 1000; // Time in millis
  private lastUpdateTime: number | null = Date.now();
  private timerInterval = null; // New property to track the interval
  private isRunning: boolean = false; // New property to track if the timer is running

  private constructor() { }

  /**
   * Load the Session Manager into the memory and return a new SessionManager object.
   * @returns {Promise<SessionManager>} The loaded SessionManager instance.
   */
  static async load(): Promise<SessionManager> {
    if (SessionManager.instance) {
      return SessionManager.instance;
    }

    try {
      const result = await new Promise<{ [key: string]: any }>((resolve) => {
        chrome.storage.local.get('session-manager', (result) => {
          resolve(result);
        });
      });

      const sessionManagerData = result['session-manager'];
      const manager = new SessionManager();

      if (sessionManagerData) {
        manager.numberOfSession = sessionManagerData.numberOfSession || 0;
        manager.sessionTime = sessionManagerData.sessionTime || 25 * 60 * 1000;
        manager.timeLeft = sessionManagerData.timeLeft || manager.sessionTime;
        manager.lastUpdateTime = sessionManagerData.lastUpdateTime || Date.now();
      }

      SessionManager.instance = manager;
      manager.startTimer();

      return manager;
    } catch (error) {
      console.error("Error loading SessionManager from storage:", error);
      throw error;
    }
  }

  /**
   * Save the Session Manager into the memory using storage API from chrome.
   */
  save() {
    const data = {
      numberOfSession: this.numberOfSession,
      sessionTime: this.sessionTime,
      timeLeft: this.timeLeft,
      lastUpdateTime: this.lastUpdateTime,
    };

    chrome.storage.local.set({ 'session-manager': data }, () => {
      if (chrome.runtime.lastError) {
        console.error(`Error saving SessionManager: ${chrome.runtime.lastError}`);
      } else {
        console.log('SessionManager saved successfully.');
      }
    });
  }

  /**
   * Change the sessionTime.
   * @param {number} n - Time in minutes.
   */
  setSessionTime(n: number) {
    this.sessionTime = n * 60 * 1000; // Convert minutes to milliseconds
    this.reset();
    this.save();
  }

  getSessionTime() {
    return this.sessionTime;
  }

  /**
   * Get the time left in the session.
   * @returns {number | null} The time left in the session.
   */
  getTimeLeft(): number | null {
    return this.timeLeft;
  }

  /**
   * Reset the time left.
   */
  reset() {
    this.timeLeft = this.sessionTime;
    this.lastUpdateTime = Date.now();
    this.save();
  }

  /**
   * Start the timer that updates the remaining time every second.
   */
  startTimer() {
    if (this.isRunning) {
      return; // Prevent multiple intervals from being set
    }

    this.lastUpdateTime = Date.now(); // Initialize lastUpdateTime when starting the timer
    this.isRunning = true; // Mark the timer as running

    this.timerInterval = setInterval(() => { // Use window.setInterval for TypeScript compatibility
      const now = Date.now();
      if (this.lastUpdateTime && this.timeLeft !== null) {
        const delta = now - this.lastUpdateTime; // Time in milliseconds
        this.timeLeft = Math.max(this.timeLeft - delta, 0); // Ensure timeLeft doesn't go negative
        this.lastUpdateTime = now;
        this.save(); // Assuming save method updates the necessary state or storage

        if (this.timeLeft <= 0) {
          this.pause(); // Use pause instead of clearInterval directly
          this.reset(); // Assuming reset method resets the timer state
        }
      }
    }, 1000);  // Set interval to 1000 milliseconds (1 second)

  }

  /**
   * Pause the timer.
   */
  pause() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
      this.isRunning = false; // Mark the timer as not running
      this.save();
    }
  }

  /**
   * Toggle the timer between running and paused states.
   */
  toggle() {
    if (this.isRunning) {
      this.pause();
    } else {
      this.startTimer();
    }
  }

  /**
   * is running
   */
  is_running() {
    return this.isRunning
  }
}

/**
 * Manages information about websites that need to be blocked.
 * By default, blocks some websites like YouTube, Twitter, Instagram.
 */
export class SiteManager {
  _type = "SiteManager"
  private static instance: SiteManager;
  blockedDomains: Set<string>;

  private constructor() {
    // Initialize blocked domains with defaults
    this.blockedDomains = new Set<string>([
      'youtube.com',
      'twitter.com',
      'instagram.com'
    ]);
  }

  /**
   * Returns the singleton instance of SiteManager.
   */
  static getInstance(): SiteManager {
    if (!SiteManager.instance) {
      SiteManager.instance = new SiteManager();
    }
    return SiteManager.instance;
  }

  /**
   * Adds a website to the list of blocked websites based on domain.
   * @param website The website URL to block.
   */
  addWebsite(website: string): void {
    const domain = this.extractDomain(website);
    if (domain) {
      this.blockedDomains.add(domain);
      this.save(); // Save the updated list
    }
  }

  /**
   * Removes a website from the list of blocked websites based on domain.
   * @param website The website URL to unblock.
   */
  removeWebsite(website: string): void {
    const domain = this.extractDomain(website);
    if (domain) {
      this.blockedDomains.delete(domain);
      this.save(); // Save the updated list
    }
  }

  /**
   * Checks if a URL is blocked based on its domain.
   * @param website The website URL to check.
   * @returns True if the domain is blocked, false otherwise.
   */
  isBlocked(website: string): boolean {
    const domain = this.extractDomain(website);
    return domain ? this.blockedDomains.has(domain) : false;
  }

  /**
   * Extracts and returns the domain (excluding subpaths) from a URL.
   * @param url The URL from which to extract the domain.
   * @returns The domain part of the URL (e.g., 'youtube.com') or null if extraction fails.
   */
  private extractDomain(url: string): string | null {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.hostname.replace(/^www\./, ''); // Remove 'www.' prefix if present
    } catch (error) {
      console.error(`Failed to parse URL: ${url}`);
      return null;
    }
  }

  /**
   * Saves the current state of blocked domains to chrome.storage.local.
   */
  save(): void {
    chrome.storage.local.set({ blockedDomains: Array.from(this.blockedDomains) }, () => {
      if (chrome.runtime.lastError) {
        console.error('Failed to save blocked domains:', chrome.runtime.lastError);
      } else {
        console.log('Blocked domains saved successfully.');
      }
    });
  }

  /**
   * Loads the saved state of blocked domains from chrome.storage.local.
   * @returns A promise that resolves to an instance of SiteManager with loaded data.
   */
  static async load(): Promise<SiteManager> {
    return new Promise((resolve) => {
      chrome.storage.local.get('blockedDomains', (data) => {
        const instance = new SiteManager();
        if (data.blockedDomains) {
          instance.blockedDomains = new Set<string>(data.blockedDomains);
        }
        resolve(instance);
      });
    });
  }
}

