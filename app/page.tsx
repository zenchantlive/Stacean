"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { CheckSquare, FolderKanban, MessageSquare, ScrollText, Plus, ChevronRight, Filter, MoreVertical, Settings, User } from "lucide-react";

type Tab = "tasks" | "projects" | "notes" | "ledger";
type TaskFilter = "all" | "active" | "completed";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  project?: string;
  createdAt: string;
}

interface Project {
  id: string;
  name: string;
  url?: string;
  status: "active" | "building" | "archived";
  tasksCount: number;
  completedTasks: number;
}

interface Note {
  id: string;
  content: string;
  createdAt: string;
}

interface LedgerEntry {
  id: string;
  message: string;
  timestamp: string;
  type: string;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("tasks");
  const [taskFilter, setTaskFilter] = useState<TaskFilter>("active");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [newTask, setNewTask] = useState("");
  const [newNote, setNewNote] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tasksRes, projectsRes, notesRes, ledgerRes] = await Promise.all([
          fetch("/api/tracker/tasks"),
          fetch("/api/projects"),
          fetch("/api/notes"),
          fetch("/api/ledger")
        ]);
        
        setTasks(await tasksRes.json());
        setProjects(await projectsRes.json());
        setNotes(await notesRes.json());
        setLedger(await ledgerRes.json());
      } catch (err) {
        console.error("Failed to fetch data:", err);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const filteredTasks = tasks.filter(t => {
    if (taskFilter === "active") return t.status !== "done" && t.status !== "closed";
    if (taskFilter === "completed") return t.status === "done" || t.status === "closed";
    return true;
  });

  const handleAddTask = () => {
    if (!newTask.trim()) return;
    fetch("/api/tracker/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTask, assignedTo: "JORDAN" })
    }).then(() => {
      setNewTask("");
      fetch("/api/tracker/tasks").then(r => r.json()).then(d => setTasks(d));
    });
  };

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: newNote })
    }).then(() => {
      setNewNote("");
      fetch("/api/notes").then(r => r.json()).then(d => setNotes(d));
    });
  };

  const toggleTask = (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === "done" ? "open" : "done";
    fetch(`/api/tracker/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus })
    }).then(() => {
      fetch("/api/tracker/tasks").then(r => r.json()).then(d => setTasks(d));
    });
  };

  return (
    <div className="app">
      <Header />
      
      {/* TABS */}
      <nav className="app-tabs">
        <button 
          className={`tab ${activeTab === "tasks" ? "active" : ""}`}
          onClick={() => setActiveTab("tasks")}
        >
          <CheckSquare size={18} />
          Tasks
          <span className="tab-count">{tasks.filter(t => t.status !== "done" && t.status !== "closed").length}</span>
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
          <div className="tasks-view">
            {/* Quick Add */}
            <div className="quick-add">
              <input
                type="text"
                placeholder="Add a task..."
                value={newTask}
                onChange={e => setNewTask(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAddTask()}
              />
              <button onClick={handleAddTask}><Plus size={18} /></button>
            </div>

            {/* Filter */}
            <div className="filter-bar">
              <button className={`filter-btn ${taskFilter === "all" ? "active" : ""}`} onClick={() => setTaskFilter("all")}>All</button>
              <button className={`filter-btn ${taskFilter === "active" ? "active" : ""}`} onClick={() => setTaskFilter("active")}>Active</button>
              <button className={`filter-btn ${taskFilter === "completed" ? "active" : ""}`} onClick={() => setTaskFilter("completed")}>Completed</button>
            </div>

            {/* Task List */}
            <div className="tasks-list">
              {filteredTasks.length === 0 ? (
                <p className="empty-state">No tasks</p>
              ) : (
                filteredTasks.map(task => (
                  <div key={task.id} className="task-item">
                    <input 
                      type="checkbox" 
                      checked={task.status === "done"}
                      onChange={() => toggleTask(task.id, task.status)}
                    />
                    <div className="task-info">
                      <span className={`task-title ${task.status === "done" ? "completed" : ""}`}>{task.title}</span>
                      {task.project && <span className="task-project">{task.project}</span>}
                    </div>
                    {task.priority && <span className={`priority ${task.priority}`}>{task.priority}</span>}
                    <MoreVertical size={16} className="task-action" />
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "projects" && (
          <div className="projects-view">
            <div className="section-header">
              <h3>Projects</h3>
              <button className="icon-btn"><Plus size={18} /></button>
            </div>
            <div className="projects-grid">
              {projects.map(project => (
                <div key={project.id} className="project-card">
                  <div className="project-header">
                    <FolderKanban size={20} />
                    <span className="project-name">{project.name}</span>
                    <span className={`status-badge ${project.status}`}>{project.status}</span>
                  </div>
                  <div className="project-stats">
                    <span>{project.tasksCount} tasks</span>
                    <span>{project.completedTasks} done</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "notes" && (
          <div className="notes-view">
            <div className="quick-add">
              <input
                type="text"
                placeholder="Leave a note for Atlas..."
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAddNote()}
              />
              <button onClick={handleAddNote}><Plus size={18} /></button>
            </div>
            <div className="notes-list">
              {notes.map(note => (
                <div key={note.id} className="note-item">
                  <p>{note.content}</p>
                  <span className="note-time">{new Date(note.createdAt).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "ledger" && (
          <div className="ledger-view">
            <div className="filter-bar">
              <button className="filter-btn active">All</button>
              <button className="filter-btn">Today</button>
              <button className="filter-btn">Week</button>
            </div>
            <div className="ledger-list">
              {ledger.map(entry => (
                <div key={entry.id} className="ledger-item">
                  <span className="ledger-time">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                  <span className="ledger-message">{entry.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="app-footer">
        <span className="version">v1.0.0</span>
        <div className="footer-actions">
          <button className="icon-btn"><Settings size={16} /></button>
          <button className="icon-btn"><User size={16} /></button>
        </div>
      </footer>
    </div>
  );
}
