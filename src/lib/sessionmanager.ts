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
  private timerInterval: NodeJS.Timeout | null = null; // New property to track the interval
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
      await manager.save();  // Ensure initial state is saved
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
  async save(): Promise<void> {
    const data = {
      numberOfSession: this.numberOfSession,
      sessionTime: this.sessionTime,
      timeLeft: this.timeLeft,
      lastUpdateTime: this.lastUpdateTime,
    };

    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ 'session-manager': data }, () => {
        if (chrome.runtime.lastError) {
          console.error(`Error saving SessionManager: ${chrome.runtime.lastError}`);
          reject(chrome.runtime.lastError);
        } else {
          console.log('SessionManager saved successfully.');
          resolve();
        }
      });
    });
  }

  /**
   * Change the sessionTime.
   * @param {number} n - Time in minutes.
   */
  async setSessionTime(n: number) {
    this.sessionTime = n * 60 * 1000; // Convert minutes to milliseconds
    await this.reset();
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
  async reset() {
    this.timeLeft = this.sessionTime;
    this.lastUpdateTime = Date.now();
    await this.save();
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

    this.timerInterval = setInterval(async () => {
      const now = Date.now();
      if (this.lastUpdateTime && this.timeLeft !== null) {
        const delta = now - this.lastUpdateTime; // Time in milliseconds
        this.timeLeft = Math.max(this.timeLeft - delta, 0); // Ensure timeLeft doesn't go negative
        this.lastUpdateTime = now;

        // Save less frequently, e.g., every 10 seconds
        if (this.timeLeft % 10000 === 0) {
          await this.save();
        }

        if (this.timeLeft <= 0) {
          await this.pause(); // Use pause instead of clearInterval directly
          this.isRunning = false;
        }
      }
    }, 1000);  // Set interval to 1000 milliseconds (1 second)
  }

  /**
   * Pause the timer.
   */
  async pause() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
      this.isRunning = false; // Mark the timer as not running
      await this.save();
    }
  }

  /**
   * Toggle the timer between running and paused states.
   */
  async toggle() {
    if (this.isRunning) {
      await this.pause();
    } else {
      this.startTimer();
    }
  }

  /**
   * Check if the timer is running.
   */
  is_running(): boolean {
    return this.isRunning;
  }
}