import { FaGithub, FaMinus, FaTwitter, FaPlus, FaPause, FaPlay } from "react-icons/fa";
import { IoSettingsSharp } from "react-icons/io5";

import "~style.css";
import { useEffect, useState } from "react";

const WIDTH = "plasmo-max-w-[300px] plasmo-w-[300px]";
const HEIGHT = "plasmo-max-h-[400px]";

function IndexPopup() {
  const [isClockRunning, setIsClockRunning] = useState(false);
  const [currentWebsite, setCurrentWebsite] = useState('');

  const handleClockToggle = (isRunning: boolean) => {
    setIsClockRunning(isRunning);
  };

  const handleAddWebsite = () => {
    console.log("Add website clicked");

    chrome.runtime.sendMessage({ action: 'siteManager.addWebsite', websiteToAdd: currentWebsite }, (response) => {
      if (response.status === 'success') {
        console.log('Website added successfully.');
      } else {
        console.error('Failed to add website.');
      }
    });
  };

  const handleRemoveWebsite = () => {
    console.log("Remove website clicked");

    chrome.runtime.sendMessage({ action: 'siteManager.removeWebsite', websiteToRemove: currentWebsite }, (response) => {
      if (response.status === 'success') {
        console.log('Website removed successfully.');
      } else {
        console.error('Failed to remove website.');
      }
    });
  };

  return (
    <div className={`${WIDTH} ${HEIGHT} plasmo-bg-stone-900 plasmo-text-white`}>
      <div className="plasmo-flex plasmo-p-2 plasmo-w-full plasmo-justify-evenly plasmo-bg-stone-800 plasmo-items-center">
        <CurrentWebsite setCurrentWebsite={setCurrentWebsite} />
        <div className="plasmo-flex plasmo-text-xl plasmo-gap-3">
          <FaGithub />
          <FaTwitter />
        </div>
      </div>
      <div className="plasmo-flex plasmo-flex-col plasmo-w-full plasmo-items-center plasmo-justify-center plasmo-gap-2">
        <Clock running={isClockRunning} />
        <div>{ }</div>
        <div className="plasmo-text-xs plasmo-font-mono plasmo-p-2">Minute till we torture you again</div>
      </div>
      <div className="plasmo-flex plasmo-items-center plasmo-justify-evenly plasmo-w-full plasmo-bg-stone-800 plasmo-text-xl plasmo-p-2">
        <FaPlus className="plasmo-cursor-pointer" onClick={handleAddWebsite} />
        <FaMinus className="plasmo-cursor-pointer" onClick={handleRemoveWebsite} />
        <ToggleButton onPause={handleClockToggle} />
        <IoSettingsSharp className="plasmo-cursor-pointer" onClick={() => { window.open(chrome.runtime.getURL('options.html')) }} />
      </div>
    </div>
  );
}

function ToggleButton({ onPause }) {
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    chrome.runtime.sendMessage({ action: 'sessionManager.is_running' }, (response) => {
      if (response && response.status === 'success') {
        setIsRunning(response.result);
        onPause(response.result);
      } else {
        console.error('Failed to fetch timer state.');
      }
    });
  }, []);

  const handleToggle = () => {
    if (isRunning) {
      chrome.runtime.sendMessage({ action: 'sessionManager.pause' }, (response) => {
        if (response && response.status === 'success') {
          setIsRunning(false);
          onPause(false);
        } else {
          console.error('Failed to pause the session.');
        }
      });
    } else {
      chrome.runtime.sendMessage({ action: 'sessionManager.start' }, (response) => {
        if (response && response.status === 'success') {
          setIsRunning(true);
          onPause(true);
        } else {
          console.error('Failed to start the session.');
        }
      });
    }
  };

  return (
    <button onClick={handleToggle} className="toggle-button">
      {isRunning ? <FaPause /> : <FaPlay />}
    </button>
  );
}

function CurrentWebsite({ setCurrentWebsite }) {
  const [hostname, setHostname] = useState('');

  useEffect(() => {
    const fetchCurrentTabUrl = () => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs.length > 0) {
          const activeTab = tabs[0];
          const url = new URL(activeTab.url);
          setHostname(url.host);
          setCurrentWebsite(url.host);
        }
      });
    };

    fetchCurrentTabUrl();
  }, []);

  return (
    <div className="plasmo-font-mono plasmo-text-sm plasmo-overflow-hidden">
      {hostname || 'Loading...'}
    </div>
  );
}

function Clock({ running }) {
  const [time, setTime] = useState(0);
  const [isLoaded, setIsLoaded] = useState(false);
  const [timerInterval, setTimerInterval] = useState(null);
  const [intervalTime, setIntervalTime] = useState(40)

  useEffect(() => {
    chrome.runtime.sendMessage({ action: "sessionManager.getTimeLeft" }, (response) => {
      const initialTime = response.result;
      setTime(initialTime);
      setIsLoaded(true);
    });
    chrome.runtime.sendMessage({
      action: "sessionManager.getSessionTime",
    }, (responce) => {
      setIntervalTime(Math.floor(responce.result / 60000));
    })

    return () => {
      clearInterval(timerInterval);
    };
  }, []);

  useEffect(() => {
    if (!isLoaded || !running) {
      clearInterval(timerInterval);
      return;
    }

    let lastUpdateTime = Date.now();

    const interval = setInterval(() => {
      const now = Date.now();
      const delta = now - lastUpdateTime;
      lastUpdateTime = now;

      setTime((prevTime) => {
        const newTime = prevTime - delta;
        if (newTime <= 0) {
          clearInterval(interval);
          return 0;
        }
        return newTime;
      });
    }, 1000);

    setTimerInterval(interval);

    return () => {
      clearInterval(interval);
    };
  }, [isLoaded, running]);

  const minutes = Math.floor(time / 60000);
  const seconds = Math.floor((time % 60000) / 1000);

  return (
    <div className="plasmo-flex-col ">
      {isLoaded ? (
        <>
          <div className="plasmo-flex plasmo-items-center ">
            <div className="plasmo-text-9xl">{minutes}</div>
            <div className="plasmo-text-2xl">{seconds}s</div>
          </div>
          <div className="plasmo-text-sm plasmo-text-stone-500 m-auto plasmo-w-full plasmo-text-center">
            <div>{intervalTime} min</div>
          </div>
        </>
      ) : (
        <div>Loading...</div>
      )}
    </div>
  );
}

export default IndexPopup;
