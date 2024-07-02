import "~style.css";
import React, { useEffect, useState } from "react";
import type { Data } from "~lib";
import * as BetterJax from 'better-react-mathjax';
import { createTemporaryInterval } from "~utils/functions";

const Arena: React.FC = () => {
  const [data, setData] = useState<Data | null>(null);
  const [inputValue, setInputValue] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  const config = {
    tex: {
      inlineMath: [['$', '$'], ['\\(', '\\)']],
      displayMath: [['$$', '$$'], ['\\[', '\\]']],
      processEscapes: true,
      processEnvironments: true,
      packages: ['base', 'ams', 'noerrors', 'noundefined']
    },
    options: {
      ignoreHtmlClass: 'tex2jax_ignore',
      processHtmlClass: 'tex2jax_process'
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      let is_retry = false
      const f = () => {
        chrome.runtime.sendMessage(
          { action: "datasetManager.getQuestion", payload: { is_retry } },
          (response: { status: string; data: Data }) => {
            if (response.status === "success" && response.data) {
              setData(response.data);
              console.log(response);
            }
            else if (response.status === "loading") {
              console.log("loading");
            }
            else {
              console.error("Failed to fetch question data.");
            }
          }
        );
        is_retry = true
      }
      createTemporaryInterval(
        f,
        1000,
        5000
      )
    };
    fetchData();
  }, []);

  const handleSubmit = () => {
    if (data) {
      if (inputValue.trim() === data.answer.trim()) {
        chrome.runtime.sendMessage({ action: "answer.correct" });
        window.close()
      } else {
        chrome.runtime.sendMessage({ action: "answer.wrong" });
      }
    }
  };

  if (!data) {
    return <div>Loading...</div>;
  }

  return (
    <>
      <div className="markdown plasmo-bg-gray-200 plasmo-p-10 h-screen">
        <div className="plasmo-m-auto plasmo-max-w-6xl plasmo-w-full">
          <p className="plasmo-text-gray-400">Refresh to get new question</p>
          <BetterJax.MathJaxContext src="/assets/mjex.js" config={config}>
            <BetterJax.MathJax>
              <div dangerouslySetInnerHTML={{
                __html: data.question
              }}></div>
            </BetterJax.MathJax>
          </BetterJax.MathJaxContext>
          <div className="plasmo-flex plasmo-gap-5 plasmo-max-w-4xl plasmo- w-full plasmo-m-auto m-auto plasmo-items-center plasmo-justify-center" >
            <input
              className="plasmo-p-1"
              placeholder="type the answer here"
              type="text"
              width={100}
              height={100}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
            />
            <button
              className="plasmo-bg-gay-500 plasmo-text-white plasmo-p-1 plasmo-bg-slate-600 plasmo-rounded-md plasmo-shadow-lg"
              type="button"
              onClick={handleSubmit}
            >
              Submit
            </button>
          </div>
          {message && <p className="plasmo-text-gray-600">{message}</p>}
        </div>
      </div>
    </>
  );
};

export default Arena;
