/**
 * rtfmbro MCP Client (SSE + JSON-RPC) - Node.js Native
 * Code execution pattern: https://www.anthropic.com/engineering/code-execution-with-mcp
 */

import https from 'https';
import http from 'http';
import { URL } from 'url';

const MCP_URL = 'https://rtfmbro.smolosoft.dev/mcp/';

interface RtfmbroRequest {
  jsonrpc: '2.0';
  id: string;
  method: string;
  params: Record<string, unknown>;
}

interface ReadmeResponse {
  success: boolean;
  package: string;
  version: string;
  ecosystem: string;
  readme: string;
}

interface DocTreeResponse {
  success: boolean;
  package: string;
  version: string;
  ecosystem: string;
  tree: string;
}

interface ReadFilesResponse {
  success: boolean;
  package: string;
  version: string;
  ecosystem: string;
  files: Record<string, string>;
}

interface SearchResponse {
  success: boolean;
  query: string;
  results: Array<{
    name: string;
    full_name: string;
    description: string;
    stars: number;
    url: string;
  }>;
}

interface GetReadmeOptions {
  package: string;
  version?: string;
  ecosystem?: 'pypi' | 'npm' | 'spm' | 'github';
}

interface GetDocumentationTreeOptions {
  package: string;
  version?: string;
  ecosystem?: 'pypi' | 'npm' | 'spm' | 'github';
}

interface ReadFilesOptions {
  package: string;
  version?: string;
  ecosystem?: 'pypi' | 'npm' | 'spm' | 'github';
  files: Array<{
    path: string;
    startLine?: number;
    endLine?: number;
  }>;
}

interface SearchGitHubOptions {
  query: string;
  sort?: 'stars' | 'forks' | 'updated' | 'best-match';
  order?: 'desc' | 'asc';
  per_page?: number;
}

let requestId = 0;
let sessionId: string | null = null;
let esConnection: http.ClientRequest | null = null;
let esResolve: ((id: string) => void) | null = null;
let esReject: ((err: Error) => void) | null = null;

function httpsRequest(url: string, headers: Record<string, string>, body?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const protocol = parsedUrl.protocol === 'https:' ? https : http;

    const req = protocol.request(url, {
      method: body ? 'POST' : 'GET',
      headers: {
        'Accept': 'text/event-stream, application/json',
        'Content-Type': 'application/json',
        ...headers
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    });

    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

async function establishSSE(): Promise<string> {
  if (sessionId) return sessionId;

  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(MCP_URL);

    esResolve = resolve;
    esReject = reject;

    const req = https.request(MCP_URL, {
      method: 'GET',
      headers: {
        'Accept': 'text/event-stream',
        'Connection': 'keep-alive'
      }
    }, (res) => {
      let buffer = '';

      res.on('data', (chunk) => {
        buffer += chunk.toString();

        // Parse SSE format looking for session_id
        const match = buffer.match(/session_id["']?\s*:\s*["']?([^"'\s\n,}]+)/i);
        if (match) {
          sessionId = match[1];
          if (esResolve) esResolve(sessionId);
        }

        // Also check for data events with JSON
        const dataMatch = buffer.match(/data:\s*(\{[\s\S]*?\})\s*/);
        if (dataMatch) {
          try {
            const data = JSON.parse(dataMatch[1]);
            if (data.id && data.result) {
              // This is a response to a request
            }
          } catch (e) {
            // Not JSON or not a response
          }
        }

        // Clear buffer periodically
        if (buffer.length > 10000) buffer = buffer.slice(-5000);
      });

      res.on('end', () => {
        if (!sessionId && esReject) {
          esReject(new Error('SSE connection closed without session ID'));
        }
      });

      res.on('error', (err) => {
        if (esReject) esReject(err);
      });
    });

    req.on('error', (err) => {
      if (esReject) esReject(err);
    });

    req.setTimeout(10000, () => {
      req.destroy();
      if (esReject) esReject(new Error('SSE connection timeout'));
    });

    req.end();
  });
}

async function mcpRequest<T>(method: string, params: Record<string, unknown>): Promise<T> {
  const sid = await establishSSE();

  const response = await httpsRequest(
    MCP_URL,
    {
      'Content-Type': 'application/json',
      'X-Session-Id': sid
    },
    JSON.stringify({
      jsonrpc: '2.0',
      id: String(++requestId),
      method,
      params
    } as RtfmbroRequest)
  );

  try {
    const data = JSON.parse(response);
    if (data.error) {
      throw new Error(JSON.stringify(data.error));
    }
    return data.result as T;
  } catch (e) {
    // Try SSE parse
    const match = response.match(/data:\s*(\{[\s\S]*?\})\s*$/m);
    if (match) {
      const data = JSON.parse(match[1]);
      if (data.error) {
        throw new Error(JSON.stringify(data.error));
      }
      return data.result as T;
    }
    throw e;
  }
}

export async function getReadme(options: GetReadmeOptions): Promise<ReadmeResponse> {
  const { package: pkg, version = 'latest', ecosystem = 'pypi' } = options;
  return mcpRequest<ReadmeResponse>('get_readme', { package: pkg, version, ecosystem });
}

export async function getDocumentationTree(options: GetDocumentationTreeOptions): Promise<DocTreeResponse> {
  const { package: pkg, version = 'latest', ecosystem = 'pypi' } = options;
  return mcpRequest<DocTreeResponse>('get_documentation_tree', { package: pkg, version, ecosystem });
}

export async function readFiles(options: ReadFilesOptions): Promise<ReadFilesResponse> {
  const { package: pkg, version = 'latest', ecosystem = 'pypi', files } = options;
  return mcpRequest<ReadFilesResponse>('read_files', { package: pkg, version, ecosystem, requests: files });
}

export async function searchGitHub(options: SearchGitHubOptions): Promise<SearchResponse> {
  const { query, sort = 'best-match', order = 'desc', per_page = 10 } = options;
  return mcpRequest<SearchResponse>('search_github_repositories', { query, sort, order, per_page });
}

export async function getPackageInfo(
  packageName: string,
  version: string = 'latest',
  ecosystem: 'pypi' | 'npm' | 'spm' | 'github' = 'pypi'
): Promise<{ readme: ReadmeResponse; tree: DocTreeResponse }> {
  const [readme, tree] = await Promise.all([
    getReadme({ package: packageName, version, ecosystem }),
    getDocumentationTree({ package: packageName, version, ecosystem })
  ]);
  return { readme, tree };
}
