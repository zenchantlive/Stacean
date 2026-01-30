import { search } from './client.js';

async function main() {
  console.log('=== Perplexity API Test ===\n');

  const result = await search({
    query: 'What is the most exciting AI agent breakthrough in January 2026?',
    maxResults: 3
  });

  console.log('Response:');
  console.log(result.choices[0].message.content.slice(0, 800));
  console.log('\n--- Stats ---');
  console.log('Tokens used:', result.usage.total_tokens);
  console.log('Model:', result.choices[0].message.role);
}

main().catch(console.error);
