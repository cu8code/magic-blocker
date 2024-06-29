import { assert } from "console";
import { DatasetManager, SessionManager, SiteManager } from "~lib"
import TimedStorage from "~utils/TimeStorage";
import { generateUniqueId } from "~utils/functions";

console.log(`
 __       __                      __                  _______   __                      __             
/  \     /  |                    /  |                /       \ /  |                    /  |            
$$  \   /$$ |  ______    ______  $$/   _______       $$$$$$$  |$$ |  ______    _______ $$ |   __       
$$$  \ /$$$ | /      \  /      \ /  | /       |      $$ |__$$ |$$ | /      \  /       |$$ |  /  |      
$$$$  /$$$$ | $$$$$$  |/$$$$$$  |$$ |/$$$$$$$/       $$    $$< $$ |/$$$$$$  |/$$$$$$$/ $$ |_/$$/       
$$ $$ $$/$$ | /    $$ |$$ |  $$ |$$ |$$ |            $$$$$$$  |$$ |$$ |  $$ |$$ |      $$   $$<        
$$ |$$$/ $$ |/$$$$$$$ |$$ \__$$ |$$ |$$ \_____       $$ |__$$ |$$ |$$ \__$$ |$$ \_____ $$$$$$  \       
$$ | $/  $$ |$$    $$ |$$    $$ |$$ |$$       |      $$    $$/ $$ |$$    $$/ $$       |$$ | $$  |      
$$/      $$/  $$$$$$$/  $$$$$$$ |$$/  $$$$$$$/       $$$$$$$/  $$/  $$$$$$/   $$$$$$$/ $$/   $$/       
                       /  \__$$ |                                                                      
                       $$    $$/                                                                       
                        $$$$$$/                                                                        
`)

async function initialize() {
  const datasetManager = await DatasetManager.load();
  const sessionManager = await SessionManager.load();
  const siteManager = SiteManager.getInstance();
  const timedStorage = new TimedStorage()

  console.log(datasetManager);
  console.log(sessionManager);
  console.log(siteManager);

  if (Object.keys(datasetManager.datasets)) {
    datasetManager.fetchDataset()
  }

  chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    switch (request.action) {
      case "datasetManager.getQuestion":
        let key = "fetch-question"
        let isRetry = request.payload.is_retry as boolean
        assert(!(isRetry === undefined), "isRetry should not be undefined it should be a boolean")
        if (!isRetry) {
          timedStorage.set(key, { status: "loading" }, 3000)
          datasetManager.getQuestion().then((e) => {
            timedStorage.set(key, e, 3000)
          });
        }
        console.log(timedStorage.get(key))
        sendResponse(timedStorage.get(key))
        break;

      case "sessionManager.getTimeLeft":
        const timeLeft = sessionManager.getTimeLeft();
        sendResponse({ status: "success", result: timeLeft });
        break;

      case "sessionManager.getSessionTime":
        const sessionTime = sessionManager.getSessionTime();
        sendResponse({ status: "success", result: sessionTime });
        break;

      case "sessionManager.updateSessionTime":
        const { sessionTime: newSessionTime } = request;
        sessionManager.setSessionTime(newSessionTime);
        sessionManager.save();
        sendResponse({ status: "success" });
        break;

      case "sessionManager.start":
        sessionManager.startTimer();
        sendResponse({ status: "success" });
        break;

      case "sessionManager.pause":
        sessionManager.pause();
        sendResponse({ status: "success" });
        break;

      case "sessionManager.toggle":
        sessionManager.toggle();
        sendResponse({ status: "success" });
        break;

      case "sessionManager.is_running":
        sendResponse({ status: "success", result: sessionManager.is_running() });
        break;

      case "siteManager.addWebsite":
        const { websiteToAdd } = request;
        siteManager.addWebsite(websiteToAdd);
        siteManager.save();
        sendResponse({ status: "success" });
        break;

      case "siteManager.removeWebsite":
        const { websiteToRemove } = request;
        siteManager.removeWebsite(websiteToRemove);
        siteManager.save();
        sendResponse({ status: "success" });
        break;

      case "siteManager.isBlocked":
        const { websiteToCheck } = request;
        const isBlocked = siteManager.isBlocked(websiteToCheck);
        sendResponse({ status: "success", result: isBlocked });
        break;

      case "siteManager.getBlockedWebsites":
        const blockedWebsites = Array.from(siteManager.blockedDomains);
        sendResponse({ status: "success", result: blockedWebsites });
        break;

      default:
        console.error(`Unknown action: ${request.action}`);
        sendResponse({ status: "error", message: `Unknown action: ${request.action}` });
        break;
    }

    return true; // Required to use sendResponse asynchronously
  });


  // Listener for web navigation events
  chrome.webNavigation.onCompleted.addListener(async (details) => {
    if (details.frameId !== 0) return; // Ignore subframes

    const url = details.url;
    if (siteManager && siteManager.isBlocked(url)) {
      const arenaUrl = chrome.runtime.getURL('tabs/arena.html');
      await chrome.tabs.update(details.tabId, { url: arenaUrl });
    }
  }, { url: [{ schemes: ['http', 'https'] }] });


}

// Initialize the app
initialize();
