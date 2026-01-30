/**
 * Context7 API Client - Code Execution Pattern
 * Docs: https://context7.com/docs/api-guide
 * 
 * Run: CONTEXT7_API_KEY=your_key node client.js
 */

const CONTEXT7_API_BASE = 'https://context7.com/api/v2';

// Get API key from environment
const apiKey = process.env.CONTEXT7_API_KEY || '';

interface Context7Snippet {
  title: string;
  content?: string;
  source: string;
  language?: string;
}

interface Context7Library {
  id: string;
  title: string;
  description: string;
  branch?: string;
  lastUpdateDate?: string;
}

interface Context7SearchResult {
  results: Context7Library[];
}

/**
 * Generic request handler using native fetch
 */
async function context7Request(path: string, method = 'GET', body: object | null = null): Promise<unknown> {
  const url = new URL(path, CONTEXT7_API_BASE);
  
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'User-Agent': 'Context7-Client/1.0'
    }
  };
  
  if (body) options.body = JSON.stringify(body);
  
  const response = await fetch(url, options);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const text = await response.text();
  
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * Search for a library by name
 * GET /api/v2/libs/search?libraryName=react&query=hooks
 */
export async function searchLibrary(libraryName: string, query = ''): Promise<Context7SearchResult> {
  const url = `/libs/search?libraryName=${encodeURIComponent(libraryName)}&query=${encodeURIComponent(query)}`;
  const result = await context7Request(url);
  return result as Context7SearchResult;
}

/**
 * Get documentation context for a library
 * GET /api/v2/context?libraryId=/vercel/next.js&query=How%20to%20use%20middleware
 * Returns: array of snippets (normalized from codeSnippets format)
 */
export async function getContext(libraryId: string, query: string): Promise<Context7Snippet[]> {
  const url = `/context?libraryId=${encodeURIComponent(libraryId)}&query=${encodeURIComponent(query)}&type=json`;
  const result = await context7Request(url);
  
  // Handle codeSnippets response format
  if (result && typeof result === 'object' && 'codeSnippets' in result) {
    const data = result as { codeSnippets: Array<{
      codeTitle: string;
      codeDescription: string;
      codeId: string;
      codeLanguage: string;
    }> };
    return data.codeSnippets.map(snippet => ({
      title: snippet.codeTitle,
      content: snippet.codeDescription,
      source: snippet.codeId,
      language: snippet.codeLanguage
    }));
  }
  
  return result as Context7Snippet[];
}

/**
 * Set API key programmatically
 */
export function setApiKey(key: string): void {
  process.env.CONTEXT7_API_KEY = key;
}

export default {
  searchLibrary,
  getContext,
  setApiKey
};
