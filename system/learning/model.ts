/**
 * ML Learning Model
 * 
 * Replaces arithmetic-based "learning" with ACTUAL MACHINE LEARNING.
 * Model: Logistic Regression with feature extraction
 * Features: memory type, content length, source, time, etc.
 * Training: Stochastic Gradient Descent
 */

export interface MLConfig {
  learningRate?: number;
  epochs?: number;
  regularization?: number;
}

export interface MemoryFeatures {
  typeEncoded: number;      // fact=0, pattern=1, lesson=2, experience=3
  contentLength: number;    // normalized
  hasTags: number;          // 0 or 1
  sourceEncoded: number;    // user_input=0, task_output=1, consolidation=2, research=3
  hourOfDay: number;        // 0-23 normalized
  dayOfWeek: number;        // 0-6 normalized
}

export interface TrainingExample {
  features: MemoryFeatures;
  label: number;  // 1 = helpful, 0 = not helpful
}

export interface PredictionResult {
  useful: boolean;
  probability: number;
  confidence: number;
}

// ============================================================================
// LOGISTIC REGRESSION MODEL (SIMPLE, INTERPRETABLE, EFFECTIVE)
// ============================================================================

export class LearningModel {
  private weights: Map<string, number> = new Map();
  private bias: number = 0;
  private learningRate: number;
  private epochs: number;
  private regularization: number;
  private initialized: boolean = false;

  constructor(config: MLConfig = {}) {
    this.learningRate = config.learningRate || 0.01;
    this.epochs = config.epochs || 100;
    this.regularization = config.regularization || 0.001;
  }

  /**
   * Initialize weights with small random values
   */
  initialize(): void {
    const featureNames = [
      'typeEncoded', 'contentLength', 'hasTags', 'sourceEncoded',
      'hourOfDay', 'dayOfWeek', 'bias'
    ];
    
    for (const name of featureNames) {
      // Xavier initialization
      this.weights.set(name, (Math.random() - 0.5) * 0.1);
    }
    this.bias = 0;
    this.initialized = true;
    
    console.log('LearningModel: Initialized with random weights');
  }

  /**
   * Sigmoid activation function
   */
  private sigmoid(z: number): number {
    return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, z))));
  }

  /**
   * Extract features from a memory context
   */
  extractFeatures(context: { type?: string; content?: string; source?: string; sessionId?: string }): MemoryFeatures {
    const now = new Date();
    
    // Type encoding
    const typeMap: Record<string, number> = { 'fact': 0, 'pattern': 1, 'lesson': 2, 'experience': 3 };
    const typeEncoded = typeMap[(context.type || 'fact').toLowerCase()] || 0;

    // Content length (normalized to 0-1, assuming max 10000 chars)
    const contentLength = Math.min(1, (context.content?.length || 0) / 10000);

    // Has tags
    const hasTags = context.content && context.content.includes('#') ? 1 : 0;

    // Source encoding
    const sourceMap: Record<string, number> = { 'user_input': 0, 'task_output': 1, 'consolidation': 2, 'research': 3 };
    const sourceEncoded = sourceMap[(context.source || 'user_input').toLowerCase()] || 0;

    // Time features
    const hourOfDay = now.getHours() / 24;
    const dayOfWeek = now.getDay() / 7;

    return {
      typeEncoded,
      contentLength,
      hasTags,
      sourceEncoded,
      hourOfDay,
      dayOfWeek,
    };
  }

  /**
   * Convert features to array for computation
   */
  private featuresToArray(features: MemoryFeatures): number[] {
    return [
      features.typeEncoded,
      features.contentLength,
      features.hasTags,
      features.sourceEncoded,
      features.hourOfDay,
      features.dayOfWeek,
    ];
  }

  /**
   * Forward pass: compute prediction
   */
  predict(features: MemoryFeatures): number {
    if (!this.initialized) this.initialize();

    const arr = this.featuresToArray(features);
    let z = this.bias;
    
    const weightNames = ['typeEncoded', 'contentLength', 'hasTags', 'sourceEncoded', 'hourOfDay', 'dayOfWeek'];
    
    for (let i = 0; i < arr.length; i++) {
      z += arr[i] * (this.weights.get(weightNames[i]) || 0);
    }

    return this.sigmoid(z);
  }

  /**
   * Predict whether a memory will be useful
   */
  predictUsefulness(context: { type?: string; content?: string; source?: string; sessionId?: string }): PredictionResult {
    const features = this.extractFeatures(context);
    const prob = this.predict(features);
    
    return {
      useful: prob > 0.5,
      probability: prob,
      confidence: Math.abs(prob - 0.5) * 2, // 0 to 1, higher = more confident
    };
  }

  /**
   * Training step: single example
   */
  trainStep(features: MemoryFeatures, label: number): void {
    if (!this.initialized) this.initialize();

    const prediction = this.predict(features);
    const error = prediction - label;
    const arr = this.featuresToArray(features);
    const weightNames = ['typeEncoded', 'contentLength', 'hasTags', 'sourceEncoded', 'hourOfDay', 'dayOfWeek'];

    // Update weights with gradient descent + regularization
    for (let i = 0; i < arr.length; i++) {
      const currentWeight = this.weights.get(weightNames[i]) || 0;
      const gradient = error * arr[i] + this.regularization * currentWeight;
      this.weights.set(weightNames[i], currentWeight - this.learningRate * gradient);
    }

    // Update bias
    this.bias -= this.learningRate * error;
  }

  /**
   * Train on a batch of examples
   */
  trainBatch(examples: TrainingExample[]): { loss: number; accuracy: number } {
    if (!this.initialized) this.initialize();

    let totalLoss = 0;
    let correct = 0;

    for (const example of examples) {
      // Forward pass
      const prediction = this.predict(example.features);
      
      // Compute loss (binary cross-entropy)
      const epsilon = 1e-15;
      const p = Math.max(epsilon, Math.min(1 - epsilon, prediction));
      const loss = -(example.label * Math.log(p) + (1 - example.label) * Math.log(1 - p));
      totalLoss += loss;

      // Accuracy
      const predicted = prediction > 0.5 ? 1 : 0;
      if (predicted === example.label) correct++;

      // Backward pass
      this.trainStep(example.features, example.label);
    }

    return {
      loss: totalLoss / examples.length,
      accuracy: correct / examples.length,
    };
  }

  /**
   * Full training loop
   */
  train(examples: TrainingExample[], verbose: boolean = true): { finalLoss: number; finalAccuracy: number } {
    let bestLoss = Infinity;
    let bestWeights = new Map(this.weights);
    let bestBias = this.bias;

    for (let epoch = 0; epoch < this.epochs; epoch++) {
      // Shuffle examples
      const shuffled = [...examples].sort(() => Math.random() - 0.5);
      
      // Train
      const { loss, accuracy } = this.trainBatch(shuffled);

      // Early stopping if loss increases (overfitting)
      if (loss < bestLoss) {
        bestLoss = loss;
        bestWeights = new Map(this.weights);
        bestBias = this.bias;
      } else if (epoch > 10) {
        // Restore best weights if overfitting
        this.weights = new Map(bestWeights);
        this.bias = bestBias;
        if (verbose) console.log(`LearningModel: Early stopping at epoch ${epoch}`);
        break;
      }

      if (verbose && epoch % 20 === 0) {
        console.log(`LearningModel: Epoch ${epoch}/${this.epochs}, Loss: ${loss.toFixed(4)}, Accuracy: ${(accuracy * 100).toFixed(1)}%`);
      }
    }

    // Final evaluation
    const { loss, accuracy } = this.trainBatch(examples);
    
    if (verbose) {
      console.log(`LearningModel: Training complete`);
      console.log(`  Final Loss: ${loss.toFixed(4)}`);
      console.log(`  Final Accuracy: ${(accuracy * 100).toFixed(1)}%`);
    }

    return { finalLoss: loss, finalAccuracy: accuracy };
  }

  /**
   * Get model weights for inspection
   */
  getWeights(): Record<string, number> {
    const result: Record<string, number> = {};
    this.weights.forEach((v, k) => result[k] = v);
    result['bias'] = this.bias;
    return result;
  }

  /**
   * Serialize model for storage
   */
  serialize(): string {
    return JSON.stringify({
      weights: Array.from(this.weights.entries()),
      bias: this.bias,
      learningRate: this.learningRate,
      epochs: this.epochs,
      regularization: this.regularization,
      initialized: this.initialized,
    });
  }

  /**
   * Load serialized model
   */
  deserialize(data: string): void {
    const parsed = JSON.parse(data);
    this.weights = new Map(parsed.weights);
    this.bias = parsed.bias;
    this.learningRate = parsed.learningRate;
    this.epochs = parsed.epochs;
    this.regularization = parsed.regularization;
    this.initialized = parsed.initialized;
  }
}
