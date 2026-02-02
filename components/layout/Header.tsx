"use client";

import { useEffect, useState } from "react";
import { Activity } from "lucide-react";

export function Header() {
  const [status, setStatus] = useState({ isOnline: false, currentActivity: "Initializing...", lastHeartbeat: "" });

  useEffect(() => {
    fetch("/api/state").then(r => r.json()).then(data => {
      setStatus({
        isOnline: data.atlasOnline || data._connected,
        currentActivity: data.currentActivity || data.currentTask || "Idle",
        lastHeartbeat: data.lastHeartbeat || data.lastUpdated || ""
      });
    });
    const interval = setInterval(() => {
      fetch("/api/state").then(r => r.json()).then(data => {
        setStatus({
          isOnline: data.atlasOnline || data._connected,
          currentActivity: data.currentActivity || data.currentTask || "Idle",
          lastHeartbeat: data.lastHeartbeat || data.lastUpdated || ""
        });
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="header">
      <div className="header-brand">
        <div className="header-logo"><Activity size={20} /></div>
        <span className="header-title">Atlas Cockpit</span>
      </div>
      <div className="header-status">
        <span className={`status-indicator ${status.isOnline ? "online" : "offline"}`} />
        <span>{status.isOnline ? "Online" : "Offline"}</span>
      </div>
    </header>
  );
}
