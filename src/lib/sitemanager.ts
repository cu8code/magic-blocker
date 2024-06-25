

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
  