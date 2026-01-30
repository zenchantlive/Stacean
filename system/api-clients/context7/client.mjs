/**
 * Context7 API Client - Code Execution Pattern
 * Docs: https://context7.com/docs/api-guide
 * 
 * Set CONTEXT7_API_KEY environment variable to use
 * Sign up at https://context7.com for a free API key
 */

const CONTEXT7_API_BASE = 'https://context7.com/api/v2';

let apiKey = process.env.CONTEXT7_API_KEY || '';

/**
 * Generic request handler using native fetch (handles redirects)
 */
async function context7Request(path, method = 'GET', body = null) {
  const url = new URL(path, CONTEXT7_API_BASE);
  
  // Get fresh API key from env or use the cached one
  const key = process.env.CONTEXT7_API_KEY || apiKey;
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${key}`,
      'User-Agent': 'Context7-Client/1.0'
    }
  };
  
  if (body) options.body = JSON.stringify(body);
  
  const response = await fetch(url, options);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const text = await response.text();
  
  // Try to parse as JSON
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
export async function searchLibrary(libraryName, query = '') {
  const url = `/libs/search?libraryName=${encodeURIComponent(libraryName)}&query=${encodeURIComponent(query)}`;
  const result = await context7Request(url);
  return result;
}

/**
 * Get documentation context for a library
 * GET /api/v2/context?libraryId=/vercel/next.js&query=How%20to%20use%20middleware
 * Returns: array of snippets (txt) or codeSnippets object (json)
 */
export async function getContext(libraryId, query, type = 'json') {
  const url = `/context?libraryId=${encodeURIComponent(libraryId)}&query=${encodeURIComponent(query)}&type=${type}`;
  const result = await context7Request(url);
  
  // Normalize response format
  if (result?.codeSnippets) {
    return result.codeSnippets.map(snippet => ({
      title: snippet.codeTitle,
      content: snippet.codeDescription,
      source: snippet.codeId,
      language: snippet.codeLanguage
    }));
  }
  return result;
}

/**
 * Set API key (alternative to environment variable)
 */
export function setApiKey(key) {
  apiKey = key;
}

export default {
  searchLibrary,
  getContext,
  setApiKey
};
