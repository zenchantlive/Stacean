# Code Execution API Client System

Following the pattern from: https://www.anthropic.com/engineering/code-execution-with-mcp

## Structure

```
/system/api-clients/
├── brave-search/       # Search API (needs auth)
├── context7/          # Documentation API (needs API key)
├── duckduckgo/        # Search API (limited results)
├── wikipedia/         # Encyclopedia API ✓ WORKING
├── perplexity/        # Research API (needs auth)
└── rtfmbro/           # MCP server (protocol issues)
```

## Usage Pattern

```javascript
import { search } from './system/api-clients/wikipedia/client.mjs';

// Simple API call
const results = await search('TypeScript best practices', 5);
console.log(results);
```

## Working Clients

### Wikipedia (100% Free, No Auth)
```javascript
import { search, randomArticle } from './system/api-clients/wikipedia/client.mjs';

// Search for topics
const results = await search('Artificial Intelligence', 5);

// Get random article
const article = await randomArticle();
```

## Environment Variables

Some clients need API keys:
```bash
export CONTEXT7_API_KEY=your_key_here    # Context7: https://context7.com
export PERPLEXITY_API_KEY=your_key_here  # Perplexity: https://perplexity.ai
export BRAVE_API_KEY=your_key_here       # Brave: https://brave.com/search/api
```

## Benefits of Code Execution Pattern

1. **Load only what you need** - No tool definitions upfront
2. **Filter in code** - Transform data before returning
3. **Loops & conditionals** - Native JavaScript control flow
4. **Privacy** - Sensitive data stays in execution environment
5. **State persistence** - Write results to files

## Adding New Clients

1. Create folder: `/system/api-clients/{name}/`
2. Add `client.mjs` with exported functions
3. Add `test.mjs` for verification
4. Document any required env vars

Example `client.mjs`:
```javascript
export async function myApiCall(params) {
  // Implementation here
  return result;
}

export default { myApiCall };
```
