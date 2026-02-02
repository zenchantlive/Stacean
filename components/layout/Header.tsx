"use client";

import { useEffect, useState } from "react";
import { Activity } from "lucide-react";

interface AtlasStatus {
  isOnline: boolean;
  currentActivity: string;
  lastHeartbeat: string;
}

export function Header() {
  const [status, setStatus] = useState<AtlasStatus>({
    isOnline: false,
    currentActivity: "Initializing...",
    lastHeartbeat: "",
  });

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch("/api/state");
        const data = await res.json();
        setStatus({
          isOnline: data.atlasOnline === true || data._connected === true,
          currentActivity: data.currentActivity || data.currentTask || "Idle",
          lastHeartbeat: data.lastHeartbeat || data.lastUpdated || "",
        });
      } catch (err) {
        setStatus(prev => ({ ...prev, isOnline: false }));
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatLastSeen = (timestamp: string): string => {
    if (!timestamp) return "";
    try {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return "just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString();
    } catch {
      return "";
    }
  };

  return (
    <header className="header">
      <div className="header-brand">
        <div className="header-logo">
          <Activity size={20} strokeWidth={2.5} />
        </div>
        <span className="header-title">Atlas Cockpit</span>
      </div>
      
      <div className="header-status">
        <span className={`status-indicator ${status.isOnline ? 'online' : 'offline'}`} />
        <span className="status-text">
          {status.isOnline ? "Online" : "Offline"}
        </span>
        {status.lastHeartbeat && (
          <span className="status-time">
            • {formatLastSeen(status.lastHeartbeat)}
          </span>
        )}
      </div>
    </header>
  );
}
