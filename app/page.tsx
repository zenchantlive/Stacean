"use client";

import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { CheckSquare, FolderKanban, MessageSquare, ScrollText, Plus, ChevronRight } from "lucide-react";
import Link from "next/link";

type Tab = "tasks" | "projects" | "notes" | "ledger";

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority?: string;
  project?: string;
}

interface Project {
  id: string;
  name: string;
  url: string;
  status: "active" | "building" | "archived";
  tasksCount?: number;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("tasks");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [newTask, setNewTask] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tasksRes, projectsRes] = await Promise.all([
          fetch("/api/tracker/tasks"),
          fetch("/api/projects")  // Need to create this endpoint
        ]);
        
        const tasksData = await tasksRes.json();
        const projectsData = await projectsRes.json();
        
        setTasks(Array.isArray(tasksData) ? tasksData : []);
        setProjects(Array.isArray(projectsData) ? projectsData : []);
      } catch (err) {
        console.error("Failed to fetch data:", err);
      }
    };

    fetchData();
  }, []);

  const activeTasks = tasks.filter(t => t.status !== "done" && t.status !== "closed");

  const handleAddTask = () => {
    if (!newTask.trim()) return;
    // Create task via API
    fetch("/api/tracker/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: newTask,
        description: "",
        priority: "medium",
        project: "",
        assignedTo: "JORDAN"
      })
    }).then(() => {
      setNewTask("");
      // Refresh tasks
      fetch("/api/tracker/tasks")
        .then(res => res.json())
        .then(data => setTasks(Array.isArray(data) ? data : []));
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
          <span className="tab-count">{activeTasks.length}</span>
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

      {/* CONTENT AREA */}
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
              <button onClick={handleAddTask}>
                <Plus size={18} />
              </button>
            </div>

            {/* Tasks List */}
            <div className="tasks-list">
              {activeTasks.length === 0 ? (
                <p className="empty-state">No active tasks</p>
              ) : (
                activeTasks.map(task => (
                  <div key={task.id} className="task-item">
                    <div className="task-checkbox">
                      <input type="checkbox" id={task.id} />
                    </div>
                    <label htmlFor={task.id} className="task-content">
                      <span className="task-title">{task.title}</span>
                      {task.project && (
                        <span className="task-project">{task.project}</span>
                      )}
                    </label>
                    <ChevronRight size={16} className="task-arrow" />
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "projects" && (
          <div className="projects-view">
            <h3>Projects</h3>
            <p className="view-description">
              Projects are linked to tasks. Manage tasks and see project context together.
            </p>
            {/* Projects grid - each links to related tasks */}
            <div className="projects-grid">
              {projects.map(project => (
                <div key={project.id} className="project-card">
                  <div className="project-header">
                    <FolderKanban size={20} />
                    <span className="project-name">{project.name}</span>
                    <span className={`project-status ${project.status}`}>
                      {project.status}
                    </span>
                  </div>
                  <div className="project-tasks">
                    {project.tasksCount || 0} tasks
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "notes" && (
          <div className="notes-view">
            <h3>Notes for Atlas</h3>
            <p className="view-description">
              Leave notes for Atlas to read and act on.
            </p>
            {/* Notes input and list */}
          </div>
        )}

        {activeTab === "ledger" && (
          <div className="ledger-view">
            <h3>Activity Ledger</h3>
            <p className="view-description">
              See everything Atlas has done.
            </p>
            {/* Ledger entries */}
          </div>
        )}
      </main>
    </div>
  );
}
