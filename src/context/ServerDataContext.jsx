// src/context/ServerDataContext.jsx
import { createContext, useContext, useEffect, useState } from "react";

const ServerDataContext = createContext();

export const ServerDataProvider = ({ children }) => {
  const [serverData, setServerData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchServerData = async () => {
      try {
        setMessage("Fetching server data...");
        setLoading(true);

        const response = await fetch(
          "https://sewage-bot-backend-vw44.onrender.com/api/data"
        );

        if (!response.ok) throw new Error(`Server error: ${response.status}`);

        const data = await response.json();
        setServerData(data || []);
        setMessage("Server data loaded");
      } catch (error) {
        console.warn("⚠ Server fetch failed:", error.message);
        setMessage("⚠ Failed to load server data");
      } finally {
        setLoading(false);
      }
    };

    fetchServerData();
  }, []);
//   console.log("ServerDataContext:", serverData);

  return (
    <ServerDataContext.Provider value={{ serverData, loading, message }}>
      {children}
    </ServerDataContext.Provider>
  );
};

export const useServerData = () => useContext(ServerDataContext);
