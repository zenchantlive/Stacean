/**
 * rtfmbro MCP Client - Native Node.js HTTPS
 * Code execution pattern: https://www.anthropic.com/engineering/code-execution-with-mcp
 */

import https from 'https';
import { URL } from 'url';

const MCP_URL = 'https://rtfmbro.smolosoft.dev/mcp/';

interface RtfmbroRequest {
  jsonrpc: '2.0';
  id: string;
  method: string;
  params: Record<string, unknown>;
}

export interface ReadmeResponse {
  success: boolean;
  package: string;
  version: string;
  ecosystem: string;
  readme: string;
}

export interface DocTreeResponse {
  success: boolean;
  package: string;
  version: string;
  ecosystem: string;
  tree: string;
}

export interface ReadFilesResponse {
  success: boolean;
  package: string;
  version: string;
  ecosystem: string;
  files: Record<string, string>;
}

export interface SearchResponse {
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

export interface GetReadmeOptions {
  package: string;
  version?: string;
  ecosystem?: 'pypi' | 'npm' | 'spm' | 'github';
}

export interface GetDocumentationTreeOptions {
  package: string;
  version?: string;
  ecosystem?: 'pypi' | 'npm' | 'spm' | 'github';
}

export interface ReadFilesOptions {
  package: string;
  version?: string;
  ecosystem?: 'pypi' | 'npm' | 'spm' | 'github';
  files: Array<{
    path: string;
    startLine?: number;
    endLine?: number;
  }>;
}

export interface SearchGitHubOptions {
  query: string;
  sort?: 'stars' | 'forks' | 'updated' | 'best-match';
  order?: 'desc' | 'asc';
  per_page?: number;
}

let requestId = 0;
let sessionId: string | null = null;
let sessionPromise: Promise<string> | null = null;

/**
 * Establish session by making a GET request to get the session ID from headers
 */
async function getSessionId(): Promise<string> {
  if (sessionId) return sessionId;
  if (sessionPromise) return sessionPromise;

  sessionPromise = new Promise((resolve, reject) => {
    const req = https.request(MCP_URL, {
      method: 'GET',
      headers: {
        'Accept': 'text/event-stream, application/json'
      }
    }, (res) => {
      // Extract session ID from headers
      const sessionHeaderValue = res.headers['mcp-session-id'];
      sessionId = typeof sessionHeaderValue === 'string' ? sessionHeaderValue : null;
      
      if (sessionId) {
        console.log('Got session ID:', sessionId.slice(0, 8) + '...');
        resolve(sessionId);
      } else {
        reject(new Error('No session ID in response headers'));
      }
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Session request timeout'));
    });

    req.setTimeout(10000);
    req.end();
  });

  return sessionPromise;
}

/**
 * Make a JSON-RPC request
 */
async function mcpRequest<T>(method: string, params: Record<string, unknown>): Promise<T> {
  const sid = await getSessionId();

  return new Promise((resolve, reject) => {
    const req = https.request(MCP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream, application/json',
        'mcp-session-id': sid
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        // Parse SSE data
        const match = data.match(/data:\s*(\{[\s\S]*?\})\s*$/m);
        if (match) {
          try {
            const json = JSON.parse(match[1]);
            if (json.error) {
              reject(new Error(JSON.stringify(json.error)));
            } else {
              resolve(json.result as T);
            }
          } catch (e) {
            reject(e);
          }
        } else {
          // Try regular JSON
          try {
            const json = JSON.parse(data);
            if (json.error) {
              reject(new Error(JSON.stringify(json.error)));
            } else {
              resolve(json.result as T);
            }
          } catch (e) {
            reject(new Error('Failed to parse response: ' + data.slice(0, 100)));
          }
        }
      });
    });

    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.setTimeout(30000);
    req.write(JSON.stringify({
      jsonrpc: '2.0',
      id: String(++requestId),
      method,
      params
    } as RtfmbroRequest));
    req.end();
  });
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
