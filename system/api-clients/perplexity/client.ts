/**
 * Perplexity API Client
 * Code execution pattern: https://www.anthropic.com/engineering/code-execution-with-mcp
 */

export interface PerplexityResponse {
  id: string;
  choices: Array<{
    message: {
      content: string;
      role: string;
    };
    finish_reason: string;
    index: number;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface SearchOptions {
  query: string;
  model?: 'perplexity/sonar-pro' | 'perplexity/sonar-reasoning-pro';
  maxResults?: number;
  systemPrompt?: string;
}

const API_URL = 'https://api.perplexity.ai/chat/completions';
const API_KEY = process.env.PERPLEXITY_API_KEY || '';

export async function search(options: SearchOptions): Promise<PerplexityResponse> {
  const { query, model = 'perplexity/sonar-pro', maxResults = 5, systemPrompt } = options;

  const body = {
    model,
    messages: [
      {
        role: 'system',
        content: systemPrompt || 'You are a helpful search assistant. Provide concise, accurate answers with citations.'
      },
      {
        role: 'user',
        content: query
      }
    ],
    max_tokens: 2000,
    temperature: 0.2,
    top_p: 0.9,
    return_citations: true,
    presence_penalty: 0,
    frequency_penalty: 1
  };

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Perplexity API error (${response.status}): ${error}`);
  }

  return response.json() as Promise<PerplexityResponse>;
}

export async function searchAndExtract(
  options: SearchOptions
): Promise<{ content: string; tokens: number }> {
  const result = await search(options);
  const content = result.choices[0]?.message?.content || '';
  return {
    content,
    tokens: result.usage.total_tokens
  };
}
