import { DatasetManager, RemoteManager, SessionManager, SiteManager } from "~lib"

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
  const remoteManager = RemoteManager.getInstance();
  const siteManager = SiteManager.getInstance();

  console.log(datasetManager);
  console.log(remoteManager);
  console.log(sessionManager);
  console.log(siteManager);

  if (Object.keys(datasetManager.datasets).length === 0) {
    await remoteManager.loadDataSetsFromDefaultUrl(datasetManager);
  }

  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    switch (request.action) {
      case "datasetManager.getQuestion":
        let keys = Object.keys(datasetManager.datasets);
        if (keys.length > 0) {
          const datasetKey = keys.includes("data") ? "data" : keys[0]; // Ensure the correct dataset key
          const dataset = datasetManager.datasets[datasetKey];
          const chunk = dataset.current;
          const randomIndex = Math.floor(Math.random() * chunk.one.length);
          const question = chunk.one[randomIndex];

          console.log("Selected question:", question);

          if (question) {
            sendResponse({ status: "success", question });
          } else {
            sendResponse({ status: "failed" });
          }
        } else {
          sendResponse({ status: "failed" });
        }
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

      case "sessionManager.isRunning":
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
