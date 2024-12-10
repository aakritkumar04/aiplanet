import React, { useState, useEffect } from "react";
import { ReactComponent as MyIcon } from "../images/company.svg";

export const NavigationBar = ({ setLocalFile }) => {
  const [file, setFile] = useState(null);
  const [uploadedFileName, setUploadedFileName] = useState("");
  const [isZoomed, setIsZoomed] = useState(false);
 
// animation effect on the upload button
  const handleZoom = () => {
    setIsZoomed(true);
    setTimeout(() => setIsZoomed(false), 200);
  };

// Sending PDF file to the server for processing (creating embeddings and storing meta data)
  async function handleFileChange(event) {
    const file = event.target.files[0];
    if (file.type === "application/pdf") {
      setFile(file);
      setLocalFile(file);
      try {
        const formData = new FormData();
        formData.append("file", file);
        const response = await fetch("http://127.0.0.1:8000/upload", {
          method: "POST",
          body: formData,
        });
        if (response.ok) {
          const data = await response.json();
          alert("File uploaded successfully!");
          setUploadedFileName(event.target.files[0].name);
          console.log(data);
        } else {
          alert("Error fetching data");
        }
      } catch (err) {
        alert("Error during fetch");
        console.error(err);
      }
    } else {
      alert("Please upload a PDF file.");
      return;
    }
  }
  return (
    <div>
      <nav class="navbar navbar-expand-lg navbar-light bg-light px-3 pt-2">
        <div style={{ padding: "3px" }}>
          <MyIcon />
        </div>
        <div style={{ marginLeft: "auto" }} className="d-flex gap-4">
          {uploadedFileName !== "" ? (
            <div
              style={{ marginLeft: "auto", marginTop: "1%" }}
              className="d-flex gap-2"
            >
              <i class="fa-regular fa-file mt-1" style={{ color: "green" }}></i>
              <p style={{ color: "green" }}>{uploadedFileName}</p>
            </div>
          ) : (
            <></>
          )}
          <label
            className="d-flex"
            style={{
              fontFamily: "serif",
              fontWeight: "bold",
            }}
          >
            <div
              className={`zoom-element ml-5 ${
                isZoomed ? "zoomed" : ""
              } gap-3 px-5`}
              onClick={handleZoom}
              style={{
                display: "flex",
                alignItems: "center",
                border: "2px solid black",
                borderRadius: "5px",
                padding: "5px 10px",
                cursor: "pointer",
                paddingLeft: "2%",
                paddingRight: "2%",
                whiteSpace: "nowrap",
              }}
            >
              <i
                className="fa-solid fa-upload"
                style={{ fontSize: "15px" }}
              ></i>
              <p
                className="d-none d-md-inline" 
                style={{ margin: 0 }}
              >
                Upload PDF
              </p>
            </div>

            <input
              type="file"
              onChange={handleFileChange}
              style={{ display: "none" }}
            />
          </label>

          <style>
            {`
          .zoomed {
            transform: scale(0.8);
            transition: transform 0.2s ease;
          }
        `}
          </style>
        </div>
      </nav>
    </div>
  );
};
