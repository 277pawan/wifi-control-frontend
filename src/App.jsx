import React, { useState, useEffect } from "react";
import axios from "axios";
import "./App.css";

function App() {
  const [laptops, setLaptops] = useState([]);
  const [selectedLaptop, setSelectedLaptop] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [command, setCommand] = useState('echo "Hello World"');
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState("");

  const API_URL = import.meta.env.VITE_API_URL || `http://localhost:3001/api/`;
  const API_KEY = "Pawan_Bisht"; // In prod, use environment variables

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
      console.log(selectedLaptop);
      const response = await axios.post(
        `${API_URL}control/wifi/off`,
        { laptopId: selectedLaptop.id, type: type },
        { headers: { "X-API-Key": API_KEY } },
      );
      setStatus(response.data.message);
    } catch (error) {
      console.error("Error turning off WiFi:", error);
      setStatus("Failed to turn off/on WiFi");
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
    try {
      const response = await axios.post(
        `${API_URL}control/execute`,
        {
          laptopId: selectedLaptop.id,
          command: command,
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

  return (
    <div className="app-container">
      <h1>Remote Laptop Control</h1>

      <div className="section">
        <h2>Connected Laptops</h2>
        <button onClick={fetchLaptops} disabled={isLoading}>
          {isLoading ? "Refreshing..." : "Refresh List"}
        </button>

        {isLoading && <p>Loading...</p>}

        <div className="laptop-list">
          {laptops.map((laptop) => (
            <div
              key={laptop.id}
              className={`laptop-card ${selectedLaptop?.id === laptop.id ? "selected" : ""}`}
              onClick={() => setSelectedLaptop(laptop)}
            >
              <h3>{laptop.name}</h3>
              <p>
                Connected: {new Date(laptop.connectionTime).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      </div>

      {selectedLaptop && (
        <div className="section">
          <h2>Control Panel: {selectedLaptop.name}</h2>

          <div className="control-card">
            <h3>WiFi Control</h3>

            <button
              onClick={() => turnOffWifi(wifiOff)}
              className="danger"
              disabled={isLoading}
            >
              Turn Off WiFi
            </button>

            <button
              onClick={() => turnOffWifi(wifiOn)}
              className="danger"
              disabled={isLoading}
            >
              Turn On WiFi
            </button>
            {status && <p className="status">{status}</p>}
          </div>

          <div className="control-card">
            <h3>Execute Command</h3>
            <input
              value={command}
              onChange={(e) => setCommand(e.target.value)}
              disabled={isLoading}
            ></input>
            <button onClick={executeCommand} disabled={isLoading}>
              Execute
            </button>
            <div className="output">
              <h4>Output:</h4>
              {output ? (
                typeof output === "string" ? (
                  <pre>{output}</pre>
                ) : (
                  output.filepath && (
                    <>
                      <img
                        src={output.filePath}
                        alt="Generated Output"
                        style={{ maxWidth: "100%", height: "auto" }}
                      />
                      <a
                        href={output.filepath}
                        download={output.filePath.split("screenshots/").pop()}
                      >
                        <button>Download Image</button>
                      </a>
                    </>
                  )
                )
              ) : (
                <pre>No output yet</pre>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
