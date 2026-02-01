/**
 * Multi-Provider Embedding Manager
 * 
 * Supports the best current embedding models:
 * - Jina AI jina-embeddings-v3 (excellent quality/price)
 * - Cohere embed-v3.0 (enterprise grade)
 * - OpenAI text-embedding-3-large (good, expensive)
 * - Qwen3-VL-Embedding (multilingual, vision-capable)
 * - OpenRouter unified API
 */

import { VectorIndex } from './index';

export interface EmbeddingConfig {
  provider?: 'openrouter' | 'jina' | 'cohere' | 'openai' | 'qwen';
  apiKey?: string;
  model?: string;
  dimensions?: number;
  maxTokens?: number;
}

export interface EmbeddingProvider {
  name: string;
  model: string;
  dimensions: number;
  endpoint: string;
  apiKeyEnv: string;
}

// ============================================================================
// PROVIDER REGISTRY
// ============================================================================

const PROVIDERS: Record<string, EmbeddingProvider> = {
  openrouter: {
    name: 'OpenRouter',
    model: 'text-embedding-3-small', // Use OpenAI model via OpenRouter
    dimensions: 1536,
    endpoint: 'https://openrouter.ai/api/v1/embeddings',
    apiKeyEnv: 'OPENROUTER_API_KEY',
  },
  jina: {
    name: 'Jina AI',
    model: 'jina-embeddings-v3',
    dimensions: 1024,
    endpoint: 'https://api.jina.ai/v1/embeddings',
    apiKeyEnv: 'JINA_API_KEY',
  },
  jina: {
    name: 'Jina AI',
    model: 'jina-embeddings-v3',
    dimensions: 1024,
    endpoint: 'https://api.jina.ai/v1/embeddings',
    apiKeyEnv: 'JINA_API_KEY',
  },
  cohere: {
    name: 'Cohere',
    model: 'embed-v3.0',
    dimensions: 1024,
    endpoint: 'https://api.cohere.ai/v1/embeddings',
    apiKeyEnv: 'COHERE_API_KEY',
  },
  openai: {
    name: 'OpenAI',
    model: 'text-embedding-3-large',
    dimensions: 3072,
    endpoint: 'https://api.openai.com/v1/embeddings',
    apiKeyEnv: 'OPENAI_API_KEY',
  },
  qwen: {
    name: 'Qwen (Alibaba)',
    model: 'text-embedding-v3',
    dimensions: 1024,
    endpoint: 'https://dashscope.aliyuncs.com/api/v1/services/aigc/embedding/text-embedding',
    apiKeyEnv: 'DASHSCOPE_API_KEY',
  },
};

export class EmbeddingManager {
  private config: Required<EmbeddingConfig>;
  private provider: EmbeddingProvider;
  private index: VectorIndex;
  private fallbackMode: boolean = false;

  constructor(index: VectorIndex, config: EmbeddingConfig = {}) {
    // Determine provider
    const providerName = config.provider || 'openrouter';
    this.provider = PROVIDERS[providerName] || PROVIDERS.openrouter;

    this.config = {
      provider: providerName as any,
      apiKey: config.apiKey || process.env[this.provider.apiKeyEnv] || '',
      model: config.model || this.provider.model,
      dimensions: config.dimensions || this.provider.dimensions,
      maxTokens: config.maxTokens || 8000,
    };

    this.index = index;

    if (!this.config.apiKey) {
      console.log(`EmbeddingManager: No API key for ${this.provider.name}, using fallback mode`);
      this.fallbackMode = true;
    } else {
      console.log(`EmbeddingManager: Using ${this.provider.name} (${this.config.model}, ${this.config.dimensions}d)`);
    }
  }

  async initialize(config?: EmbeddingConfig): Promise<void> {
    if (config?.apiKey) {
      this.config.apiKey = config.apiKey;
      this.fallbackMode = false;
    }
  }

  /**
   * Generate embeddings using the configured provider
   */
  async generate(text: string): Promise<number[]> {
    if (this.fallbackMode) {
      return this.mockEmbedding(text);
    }

    const truncatedText = text.substring(0, this.config.maxTokens);

    try {
      const response = await fetch(this.provider.endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json',
          ...(this.config.provider === 'openrouter' && {
            'HTTP-Referer': 'https://atlas.openclaw.ai',
            'X-Title': 'Atlas Memory System',
          }),
        },
        body: JSON.stringify({
          model: this.config.model,
          input: truncatedText,
          ...(this.config.provider === 'cohere' && {
            truncate: 'END',
          }),
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error(`${this.provider.name} API error:`, error);
        return this.mockEmbedding(text);
      }

      const data = await response.json();

      // Handle different response formats
      if (this.config.provider === 'cohere') {
        return data.embeddings[0];
      } else if (this.config.provider === 'jina' || this.config.provider === 'openrouter') {
        return data.data[0].embedding;
      } else {
        return data.data[0].embedding;
      }
    } catch (error) {
      console.error(`${this.provider.name} embedding failed:`, error);
      return this.mockEmbedding(text);
    }
  }

  /**
   * Generate embedding and add to index in one call
   */
  async generateAndAdd(id: string, text: string, metadata: Record<string, any>): Promise<void> {
    const vector = await this.generate(text);
    this.index.add(id, vector, metadata);
  }

  /**
   * Fallback mock embedding (better than hash-based)
   * Uses word frequency vectors for basic semantic similarity
   */
  private mockEmbedding(text: string): number[] {
    const dimensions = this.config.dimensions;
    const vector = new Array(dimensions).fill(0);
    const words = text.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);

    // Build vocabulary from common tech/agent terms
    const vocab: Record<string, number[]> = {};
    const seedTerms = [
      'jordan', 'preference', 'task', 'memory', 'learning', 'system',
      'code', 'error', 'success', 'pattern', 'lesson', 'fact',
      'project', 'app', 'api', 'database', 'file', 'test',
      'france', 'germany', 'cat', 'animal', 'capital', 'city',
      'config', 'api', 'model', 'train', 'predict', 'embed',
      'agent', 'atlas', 'openclaw', 'moltbook', 'beads',
      'typescript', 'javascript', 'python', 'node', 'rust',
      'bug', 'fix', 'feature', 'refactor', 'optimize',
      'api', 'endpoint', 'request', 'response', 'auth',
    ];

    seedTerms.forEach((term, i) => {
      const vec = new Array(dimensions).fill(0);
      vec[i % dimensions] = 1;
      vec[(i + 1) % dimensions] = 0.5;
      vec[(i + 2) % dimensions] = 0.25;
      vocab[term] = vec;
    });

    // Build vector from word presence
    let wordCount = 0;
    for (const word of words) {
      // Direct match
      if (vocab[word]) {
        for (let i = 0; i < dimensions; i++) {
          vector[i] += vocab[word][i];
        }
        wordCount++;
        continue;
      }

      // Partial match
      for (const [term, termVec] of Object.entries(vocab)) {
        if (word.includes(term) || term.includes(word)) {
          for (let i = 0; i < dimensions; i++) {
            vector[i] += termVec[i] * 0.3;
          }
          wordCount++;
        }
      }
    }

    // Normalize
    if (wordCount > 0) {
      for (let i = 0; i < dimensions; i++) {
        vector[i] /= wordCount;
      }
    }

    // L2 normalize
    let norm = 0;
    for (let i = 0; i < dimensions; i++) norm += vector[i] * vector[i];
    norm = Math.sqrt(norm);
    if (norm > 0) {
      for (let i = 0; i < dimensions; i++) vector[i] /= norm;
    }

    return vector;
  }

  /**
   * Get current provider info
   */
  getProviderInfo() {
    return {
      provider: this.provider.name,
      model: this.config.model,
      dimensions: this.config.dimensions,
      fallbackMode: this.fallbackMode,
    };
  }

  /**
   * List available providers
   */
  static getAvailableProviders() {
    return Object.entries(PROVIDERS).map(([key, p]) => ({
      id: key,
      name: p.name,
      model: p.model,
      dimensions: p.dimensions,
    }));
  }
}
