"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/layout/Header";
import { CheckSquare, FolderKanban, MessageSquare, ScrollText, Plus, ChevronRight, Grid, ArrowLeft } from "lucide-react";
import { TaskWidget } from "@/components/dashboard/TaskWidget";
import { FieldNotes } from "@/components/dashboard/FieldNotes";
import { LedgerFeed } from "@/components/dashboard/LedgerFeed";

type Tab = "tasks" | "projects" | "notes" | "ledger";

export default function FocusedPage() {
  const [activeTab, setActiveTab] = useState<Tab>("tasks");

  return (
    <div className="app">
      <Header />
      
      {/* BACK TO FULL DASHBOARD */}
      <div className="back-link">
        <Link href="/" className="back-btn">
          <ArrowLeft size={16} />
          Full Dashboard
        </Link>
      </div>

      {/* TABS */}
      <nav className="app-tabs">
        <button 
          className={`tab ${activeTab === "tasks" ? "active" : ""}`}
          onClick={() => setActiveTab("tasks")}
        >
          <CheckSquare size={18} />
          Tasks
        </button>
        
        <button 
          className={`tab ${activeTab === "projects" ? "active" : ""}`}
          onClick={() => setActiveTab("projects")}
        >
          <FolderKanban size={18} />
          Projects
        </button>
        
        <button 
          className={`tab ${activeTab === "notes" ? "active" : ""}`}
          onClick={() => setActiveTab("notes")}
        >
          <MessageSquare size={18} />
          Notes
        </button>
        
        <button 
          className={`tab ${activeTab === "ledger" ? "active" : ""}`}
          onClick={() => setActiveTab("ledger")}
        >
          <ScrollText size={18} />
          Ledger
        </button>
      </nav>

      {/* CONTENT */}
      <main className="app-content">
        {activeTab === "tasks" && (
          <div className="focused-view">
            <h2>Tasks</h2>
            <TaskWidget isActive={true} />
          </div>
        )}

        {activeTab === "projects" && (
          <div className="focused-view">
            <h2>Projects</h2>
            <p>Projects linked to tasks - coming soon.</p>
          </div>
        )}

        {activeTab === "notes" && (
          <div className="focused-view">
            <h2>Notes</h2>
            <FieldNotes />
          </div>
        )}

        {activeTab === "ledger" && (
          <div className="focused-view">
            <h2>Ledger</h2>
            <LedgerFeed />
          </div>
        )}
      </main>
    </div>
  );
}
