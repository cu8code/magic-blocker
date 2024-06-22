import "~style.css";

import React, { useEffect, useState } from "react";
import Markdown from 'markdown-to-jsx';
import type { Data } from "~lib";

const Arena: React.FC = () => {
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      chrome.runtime.sendMessage(
        { action: "datasetManager.getQuestion" },
        (response: { status: string; result: Data }) => {
          if (response.status === "success" && response.result) {
            setData(response.result);
            console.log(response);
          } else {
            console.error("Failed to fetch question data.");
          }
        }
      );
    };

    fetchData();
  }, []);

  if (!data) {
    return <div>Loading...</div>;
  }

  return (
    <div className="markdown plasmo-bg-gray-200 plasmo-p-10">
      <Markdown>
        {data.question}
      </Markdown>
    </div>
  );
};

export default Arena;
