import type { Data, MetaData } from "~lib/types";
import { selectRandomElementFromArray } from "~utils/functions";

/**
 * Class representing a dataset with associated metadata;
 * resposible for fetching the data
 * and implimenting spaced repitation
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
  version: number;
  username: string;
  repository: string;
  branch: string;
  meta: MetaData;
  private history = {
    one: [],
    two: [],
    three: [],
  }
  private lastQuestionId: ["one" | "two" | "three", number] | null = null
  private totalNumberOfDays: number = 7;
  private intervalCountForTwo: number = 2;
  private intervalCountForThree: number = 3;
  private intervalCount = 0

  /**
   * Create a DataSet.
   * @param {string} id - The unique identifier for the dataset.
   * @param {number} [version=0] - The version of the dataset.
   * @param {string} username - The GitHub username associated with the dataset.
   * @param {string} repository - The GitHub repository name.
   * @param {string} branch - The branch of the GitHub repository.
   * @param {MetaData} meta - The metadata associated with the dataset.
   */
  constructor(
    username: string,
    repository: string,
    branch: string,
    meta: MetaData,
  ) {
    this.id = `${username}.${repository}.${branch}`;
    this.username = username;
    this.repository = repository;
    this.branch = branch;
    this.meta = meta;
    this.history = {
      one: Array.from(Array(meta.length).keys()),
      two: [],
      three: [],
    }
  }

  async getQuestion() {
    this.intervalCount = ((this.intervalCount + 1) % this.totalNumberOfDays) + 1
    try {

      if (this.intervalCount === this.intervalCountForThree) {
        if (this.history.three.length) {
          const id = selectRandomElementFromArray<number>(this.history.three)
          this.lastQuestionId = ["three", id]
          const url = `https://raw.githubusercontent.com/${this.username}/${this.repository}/${this.branch}/data/${id}.json`;
          const data = (await (await fetch(url)).json()) as Data
          return { status: "success", data }
        }
      }

      if (this.intervalCount === this.intervalCountForTwo) {
        if (this.history.two.length) {
          const id = selectRandomElementFromArray<number>(this.history.two)
          this.lastQuestionId = ["two", id]
          const url = `https://raw.githubusercontent.com/${this.username}/${this.repository}/${this.branch}/data/${id}.json`;
          const data = (await (await fetch(url)).json()) as Data
          return { status: "success", data }
        }
      }

      const id = selectRandomElementFromArray<number>(this.history.one)
      this.lastQuestionId = ["one", id]
      const url = `https://raw.githubusercontent.com/${this.username}/${this.repository}/${this.branch}/data/${id}.json`;
      const data = (await (await fetch(url)).json()) as Data
      return { status: "success", data }

    }

    catch (err) {
      console.error(err)
      console.log({
        status: "failed",
        error: err,
      });

      return {
        status: "failed",
        error: err,
      };
    }

  }

  sucess(ans: boolean) {
    if (ans) {
      if (this.lastQuestionId) {
        const [box, id] = this.lastQuestionId
        if (box === "one") {
          this.history.one.splice(this.history.one.indexOf(id), 1)
          this.history.two.push(id)
        }
        if (box === "two") {
          this.history.two.splice(this.history.two.indexOf(id), 1)
          this.history.three.push(id)
        }
      }
    } else {
      if (this.lastQuestionId) {
        const [box, id] = this.lastQuestionId
        if (box === "two") {
          this.history.two.splice(this.history.two.indexOf(id), 1)
          this.history.one.push(id)
        }
        if (box === "three") {
          this.history.three.splice(this.history.three.indexOf(id), 1)
          this.history.two.push(id)
        }
      }
    }
  }

  /**
   * Load a DataSet from local storage.
   * @param {string} id - The unique identifier for the dataset.
   * @returns {Promise<DataSet | null>} A promise that resolves to the loaded DataSet or null if not found.
   */
  static async load(id: string): Promise<DataSet | null> {
    try {
      const result = await new Promise<{ [key: string]: any }>((resolve) => {
        chrome.storage.local.get(id, (result) => {
          resolve(result);
        });
      });

      const datasetData = result[id];
      if (datasetData) {
        return new DataSet(
          datasetData.username,
          datasetData.repository,
          datasetData.branch,
          datasetData.meta
        );
      } else {
        console.error(`Failed to load dataset with id ${id}.`);
        return null;
      }
    } catch (error) {
      console.error(`Error loading dataset with id ${id}:`, error);
      return null;
    }
  }

  save() {
    chrome.storage.local.set({
      [this.id]: {
        username: this.username,
        repository: this.repository,
        branch: this.branch,
        meta: this.meta
      }
    }, () => {
      if (chrome.runtime.lastError) {
        console.error(`Error saving dataset with id ${this.id}:`, chrome.runtime.lastError);
      } else {
        console.log(`Dataset with id ${this.id} saved successfully.`);
      }
    });
  }




}