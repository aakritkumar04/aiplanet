import React, { useState, useEffect, useMemo } from "react";
import { NavigationBar } from "./NavigationBar";
import { ReactComponent as SendIcon } from "../images/send.svg";
import { ReactComponent as UserIcon } from "../images/user.svg";
import { ReactComponent as AiIcon } from "../images/ai.svg";
import { RingLoader } from "react-spinners";

export const Home = () => {
  const [query, setQuery] = useState("");
  const [userQueue, setUserQueue] = useState([]);
  const [aiQueue, setAiQueue] = useState([]);
  const combinedMessages = [];
  const [loading, setLoading] = useState(false);
  const [localFile, setLocalFile] = useState(null);
  // Preventing unneccesary re renders due to useEffect
  const memoizedMessages = useMemo(() => combinedMessages, [combinedMessages]);

  // Changing the loading value so that it can show loader while the server sends the response
  useEffect(() => {
    const lastMessage = memoizedMessages[memoizedMessages.length - 1];
    if (lastMessage?.type === "user") {
      setLoading(true);
    } else if (lastMessage?.type === "ai") {
      setLoading(false);
    }
  }, [memoizedMessages]);

  // Storing the query of the user
  const handleChange = (event) => {
    setQuery(event.target.value);
  };

  // Send the query to the server to get the solution for the same from the pdf
  // Also checks if the pdf file is there so no query can be asked without uploading a PDF file.
  const handleSendClick = async () => {
    if (localFile) {
      if (query.trim()) {
        setUserQueue((prevQueue) => [...prevQueue, query]);
        setQuery("");
        try {
          const response = await fetch("http://127.0.0.1:8000/get_prompt", {
            method: "POST",
            body: JSON.stringify({ message: query }),
          });
          if (!response.ok) {
            alert("Error fetching response");
          }
          const data = await response.json();
          setAiQueue((prevQueue) => [...prevQueue, data.output]);
        } catch (err) {
          alert("Error during fetching respone");
          console.error(err);
        }
      }
    }
    else
    {
      alert("Please upload a PDF file first")
    }
  };

// alternative adds the query and the solution to a queue for further mapping
  for (let i = 0; i < Math.max(userQueue.length, aiQueue.length); i++) {
    if (i < userQueue.length) {
      combinedMessages.push({ type: "user", message: userQueue[i] });
    }
    if (i < aiQueue.length) {
      combinedMessages.push({ type: "ai", message: aiQueue[i] });
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      <NavigationBar setLocalFile={setLocalFile} />

      <div
        className="mt-5 mb-4"
        style={{
          marginLeft: "15%",
          marginRight: "15%",
          height: "70vh",
          overflow: "scroll",
          whiteSpace: "normal",
          justifyContent: "flex-start",
          alignItems: "center",
          display: "flex",
          flexDirection: "column",
          textAlign: "left",
        }}
      >
        {combinedMessages.map((item, index) => (
          <div
            key={index}
            className="gap-2"
            style={{
              whiteSpace: "normal",
              display: "flex",
              wordWrap: "break-word",
              width: "100%",
            }}
          >
            {item.type === "user" && <UserIcon />}
            {item.type === "ai" && <AiIcon />}
            <p
              style={{
                color: item.type === "user" ? "black" : "blue",
                wordBreak: "break-word",
                maxWidth: "70%",
                overflow: "hidden",
                textOverflow: "ellipsis",
                backgroundColor: item.type === "user" ? "#f0f0f0" : "#d0e0ff",
                padding: "10px",
                borderRadius: "10px",
              }}
            >
              {item.message}
            </p>
            {/* Loader should only be on the last query asked */}
            {item.type === "user" &&
              index === combinedMessages.length - 1 &&
              loading && (
                <div className="flexcol" style={{ alignItems: "center" }}>
                  <RingLoader size={24} color="#007bff" loading={true} />
                </div>
              )}
          </div>
        ))}
      </div>
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "85%",
            height: "56px",
            marginTop: "auto",
            marginBottom: "3%",
          }}
        >
          <input
            style={{
              width: "100%",
              height: "100%",
              paddingRight: "50px",
            }}
            className="px-5"
            placeholder="Send a message..."
            value={query}
            onChange={handleChange}
          />
          <SendIcon
            style={{
              position: "absolute",
              top: "50%",
              right: "10px",
              transform: "translateY(-50%)",
              cursor: "pointer",
            }}
            onClick={handleSendClick}
          />
        </div>
      </div>
    </div>
  );
};
