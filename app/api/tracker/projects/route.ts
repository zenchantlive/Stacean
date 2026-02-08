import { NextRequest, NextResponse } from 'next/server';
import { projectTracker, type Project } from '@/lib/integrations/kv/tracker';

// ============================================================================
// GET /api/tracker/projects - List all registered projects
// ============================================================================

export async function GET(request: NextRequest) {
    try {
        const projects = await projectTracker.listProjects();
        return NextResponse.json(projects);
    } catch (error) {
        console.error('API Error (GET /projects):', error);
        return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 });
    }
}

// ============================================================================
// POST /api/tracker/projects - Register or update a project
// ============================================================================

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        if (!body.id || !body.label) {
            return NextResponse.json({ error: 'ID and Label are required' }, { status: 400 });
        }

        const project: Project = {
            id: body.id,
            label: body.label,
            emoji: body.emoji,
            color: body.color,
        };

        await projectTracker.setProject(project);
        return NextResponse.json(project, { status: 201 });
    } catch (error) {
        console.error('API Error (POST /projects):', error);
        return NextResponse.json({ error: 'Failed to register project' }, { status: 500 });
    }
}
