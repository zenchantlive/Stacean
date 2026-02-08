# API Reference

This document describes all API endpoints for the Command Center task tracker.

## Tasks API

### GET /api/tracker/tasks
List all active tasks from KV.

**Response:**
```json
{
  "tasks": [
    {
      "id": "clawd-abc123",
      "title": "Implement feature X",
      "description": "Details...",
      "status": "in_progress",
      "priority": "high",
      "assignedTo": "JORDAN",
      "agentCodeName": "gemini",
      "project": "stacean",
      "createdAt": "2024-01-15T10:30:00Z",
      "updatedAt": "2024-01-15T12:45:00Z"
    }
  ]
}
```

### POST /api/tracker/tasks
Create a new task.

**Request Body:**
```json
{
  "title": "Task title (required, min 3 chars)",
  "description": "Description (optional)",
  "priority": "urgent|high|medium|low",
  "assignedTo": "JORDAN",
  "agentCodeName": "gemini",
  "project": "stacean"
}
```

**Response:** Returns the created task object.

### GET /api/tracker/tasks/[id]
Get a single task by ID.

### PUT /api/tracker/tasks/[id]
Update a task.

**Request Body (all fields optional):**
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "status": "in_progress|needs-you|review|ready|shipped",
  "priority": "urgent|high|medium|low",
  "assignedTo": "JORDAN",
  "agentCodeName": "gemini",
  "project": "stacean"
}
```

### DELETE /api/tracker/tasks/[id]
Soft delete a task (sets status to shipped with deletedAt timestamp).

---

## Agents API

### GET /api/tracker/agents
List all agents from beads.

**Response:**
```json
{
  "agents": [
    {
      "id": "agent-abc",
      "name": "gemini",
      "status": "active",
      "currentTask": "clawd-abc123",
      "lastActivity": "2024-01-15T12:45:00Z"
    }
  ]
}
```

---

## Beads API (for local reading)

### GET /api/tracker/beads
List all issues directly from beads CLI (local only).

**Note:** This endpoint runs `bd list --json` and may be slow.

---

## KV Tasks API

### GET /api/tracker/kv-tasks
Direct KV read (bypasses beads mirroring).

---

## Error Responses

All endpoints return errors in this format:
```json
{
  "error": "Error message here"
}
```

Common HTTP status codes:
- `400` - Bad request (missing required fields)
- `404` - Task/agent not found
- `500` - Server error
