
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