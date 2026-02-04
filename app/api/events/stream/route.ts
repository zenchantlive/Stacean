import { taskTracker } from '@/lib/integrations/kv/tracker';
import { KVAdapter } from '@/lib/integrations/kv/adapter';

export const dynamic = 'force-dynamic';

// Store last known task count for change detection
let lastTaskCount = 0;

export async function GET(request: Request) {
  const encoder = new TextEncoder();
  
  // Create a readable stream for SSE
  const stream = new ReadableStream({
    async start(controller) {
      // Helper to send events
      const sendEvent = (type: string, data: unknown) => {
        try {
          controller.enqueue(encoder.encode(`event: ${type}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch (e) {
          // Connection closed, stop polling
        }
      };

      // Send initial connection event
      sendEvent('connected', { status: 'ok', timestamp: Date.now() });

      // Poll KV for changes
      const pollInterval = setInterval(async () => {
        try {
          const tasks = await taskTracker.listTasks();
          const currentCount = tasks.length;

          // If task count changed, send update
          if (currentCount !== lastTaskCount) {
            lastTaskCount = currentCount;
            sendEvent('tasks.updated', { count: currentCount, tasks });
          }
        } catch (e) {
          console.error('[SSE Poll] Error polling KV:', e);
        }
      }, 2000); // Poll every 2 seconds

      // Cleanup on connection close
      request.signal.addEventListener('abort', () => {
        clearInterval(pollInterval);
        try {
          controller.close();
        } catch {
          // Already closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}