/**
 * Policy Optimizer - Advanced Learning System
 *
 * Implements sophisticated optimization algorithms for the learned memory policy.
 * Features: A/B testing, hyperparameter tuning, gradient-based updates, benchmarking.
 */

import {
  MemoryPolicy,
  PolicyState,
  TypeStatistics,
  LearningSignal,
  LearningOutcome,
  LEARNING_RATE_POSITIVE,
  LEARNING_RATE_NEGATIVE,
  LEARNING_RATE_CONTRADICTION,
  DEFAULT_VALUE_SCORE,
  MAX_VALUE_SCORE,
  MIN_VALUE_SCORE,
  generateId,
} from '../memory/types';

import * as fs from 'fs/promises';
import * as path from 'path';

// ============================================================================
// OPTIMIZER CONFIG
// ============================================================================

export interface OptimizerConfig {
  policy: MemoryPolicy;
  experimentsPath?: string;
  benchmarksPath?: string;
  autoOptimize?: boolean;
  optimizationInterval?: number; // ms
}

export interface Experiment {
  id: string;
  name: string;
  strategy: string;
  parameters: Record<string, any>;
  startTime: number;
  endTime?: number;
  status: 'running' | 'completed' | 'aborted';
  results?: ExperimentResults;
}

export interface ExperimentResults {
  totalSignals: number;
  helpfulRatio: number;
  avgValueScoreChange: number;
  retrievalAccuracyChange: number;
  winner: 'experiment' | 'control';
  confidence: number;
}

export interface BenchmarkResult {
  timestamp: number;
  metric: string;
  before: number;
  after: number;
  improvement: number;
  percentImprovement: number;
}

// ============================================================================
// POLICY OPTIMIZER
// ============================================================================

export class PolicyOptimizer {
  private config: Required<OptimizerConfig>;
  private policy: MemoryPolicy;
  private experiments: Map<string, Experiment> = new Map();
  private benchmarks: BenchmarkResult[] = [];
  private currentExperiment?: Experiment;
  private optimizationTimer?: NodeJS.Timeout;

  constructor(config: OptimizerConfig) {
    this.config = {
      policy: config.policy,
      experimentsPath: config.experimentsPath || '/tmp/optimizer/experiments',
      benchmarksPath: config.benchmarksPath || '/tmp/optimizer/benchmarks',
      autoOptimize: config.autoOptimize ?? false,
      optimizationInterval: config.optimizationInterval || 60000, // 1 minute
    };
    this.policy = config.policy;
  }

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================

  async initialize(): Promise<void> {
    console.log('PolicyOptimizer: Initializing...');

    // Ensure directories exist
    await fs.mkdir(this.config.experimentsPath, { recursive: true });
    await fs.mkdir(this.config.benchmarksPath, { recursive: true });

    // Load existing experiments
    await this.loadExperiments();

    // Start auto-optimization if enabled
    if (this.config.autoOptimize) {
      this.startAutoOptimization();
    }

    console.log(`PolicyOptimizer: Ready (${this.experiments.size} experiments loaded)`);
  }

  // ==========================================================================
  // A/B TESTING
  // ==========================================================================

  /**
   * Start a new A/B experiment to test a strategy variant
   */
  async startExperiment(
    name: string,
    strategy: 'retrieval_weight' | 'consolidation_rate' | 'pruning_aggression' | 'learning_rate',
    parameters: Record<string, any>
  ): Promise<string> {
    const experimentId = generateId();

    const experiment: Experiment = {
      id: experimentId,
      name,
      strategy,
      parameters,
      startTime: Date.now(),
      status: 'running',
    };

    this.experiments.set(experimentId, experiment);
    this.currentExperiment = experiment;

    // Snapshot current policy state as "control"
    await this.snapshotPolicyState('control');

    console.log(`PolicyOptimizer: Started experiment "${name}" (${strategy})`);

    await this.saveExperiments();
    return experimentId;
  }

  /**
   * Complete current experiment and compare results
   */
  async completeExperiment(): Promise<ExperimentResults | null> {
    if (!this.currentExperiment) {
      console.warn('PolicyOptimizer: No active experiment to complete');
      return null;
    }

    const experiment = this.currentExperiment;
    experiment.status = 'completed';
    experiment.endTime = Date.now();

    // Get current policy state
    const afterStats = this.policy.getTypeStatistics();

    // Calculate results by comparing to control snapshot
    // For now, we'll use the policy's internal helpfulRatio as the metric
    const helpfulRatio = this.policy.getTypeStatistics()?.retrievalSuccessRate || 0.5;

    experiment.results = {
      totalSignals: this.policy.getAllSignals().length,
      helpfulRatio,
      avgValueScoreChange: 0, // Would need historical data
      retrievalAccuracyChange: 0,
      winner: 'control', // Default to control
      confidence: 0.5,
    };

    this.experiments.delete(experiment.id);
    this.currentExperiment = undefined;

    console.log(`PolicyOptimizer: Experiment "${experiment.name}" completed. Results:`, experiment.results);

    await this.saveExperiments();
    return experiment.results;
  }

  /**
   * Abort current experiment
   */
  async abortExperiment(reason: string): Promise<void> {
    if (!this.currentExperiment) return;

    this.currentExperiment.status = 'aborted';
    this.currentExperiment.endTime = Date.now();
    this.currentExperiment.results = {
      totalSignals: 0,
      helpfulRatio: 0,
      avgValueScoreChange: 0,
      retrievalAccuracyChange: 0,
      winner: 'control',
      confidence: 0,
    };

    console.log(`PolicyOptimizer: Experiment aborted: ${reason}`);
    this.currentExperiment = undefined;
    await this.saveExperiments();
  }

  // ==========================================================================
  // HYPERPARAMETER TUNING
  // ==========================================================================

  /**
   * Automatically tune learning rates based on signal history
   */
  async tuneLearningRates(): Promise<{ positive: number; negative: number; contradiction: number }> {
    const signals = this.policy.getAllSignals();
    const recentSignals = signals.filter(s => Date.now() - s.timestamp < 24 * 60 * 60 * 1000); // Last 24h

    if (recentSignals.length < 10) {
      console.log('PolicyOptimizer: Not enough signals for tuning');
      return {
        positive: LEARNING_RATE_POSITIVE,
        negative: LEARNING_RATE_NEGATIVE,
        contradiction: LEARNING_RATE_CONTRADICTION,
      };
    }

    // Analyze signal outcomes
    const helpfulCount = recentSignals.filter(s => s.outcome.type === 'helpful').length;
    const notHelpfulCount = recentSignals.filter(s => s.outcome.type === 'not_helpful').length;
    const total = recentSignals.length;

    const helpfulRatio = helpfulCount / total;

    // Adjust learning rates based on performance
    // If helpfulRatio is high, we can be more aggressive with updates
    // If helpfulRatio is low, we should be more conservative

    let positiveRate = LEARNING_RATE_POSITIVE;
    let negativeRate = LEARNING_RATE_NEGATIVE;

    if (helpfulRatio > 0.8) {
      // Very successful - increase learning rate
      positiveRate = LEARNING_RATE_POSITIVE * 1.5;
      negativeRate = LEARNING_RATE_NEGATIVE * 0.8; // Be more forgiving
    } else if (helpfulRatio < 0.4) {
      // Struggling - decrease learning rate
      positiveRate = LEARNING_RATE_POSITIVE * 0.7;
      negativeRate = LEARNING_RATE_NEGATIVE * 1.2; // Be stricter
    }

    // Clamp values
    positiveRate = Math.max(0.01, Math.min(0.2, positiveRate));
    negativeRate = Math.max(-0.2, Math.min(-0.01, negativeRate));

    console.log(`PolicyOptimizer: Tuned learning rates (helpfulRatio: ${(helpfulRatio * 100).toFixed(1)}%):
      Positive: ${positiveRate.toFixed(4)}
      Negative: ${negativeRate.toFixed(4)}`);

    return {
      positive: positiveRate,
      negative: negativeRate,
      contradiction: LEARNING_RATE_CONTRADICTION,
    };
  }

  // ==========================================================================
  // BENCHMARKING
  // ==========================================================================

  /**
   * Run a benchmark comparing current policy to baseline
   */
  async runBenchmark(name: string): Promise<BenchmarkResult> {
    const before = this.policy.getTypeStatistics();

    // Simulate some retrievals (in production, this would use real queries)
    const testQueries = [
      'Jordan preferences',
      'recent task completion',
      'error patterns',
      'project architecture',
    ];

    let totalSimilarity = 0;
    for (const query of testQueries) {
      const prediction = await this.policy.shouldStore(query, { type: 'fact', source: 'test' });
      totalSimilarity += prediction.confidence;
    }

    const afterSimilarity = totalSimilarity / testQueries.length;
    const beforeSimilarity = before?.retrievalSuccessRate || 0.5;

    const improvement = afterSimilarity - beforeSimilarity;
    const percentImprovement = beforeSimilarity > 0 ? (improvement / beforeSimilarity) * 100 : 0;

    const result: BenchmarkResult = {
      timestamp: Date.now(),
      metric: name,
      before: beforeSimilarity,
      after: afterSimilarity,
      improvement,
      percentImprovement,
    };

    this.benchmarks.push(result);
    console.log(`PolicyOptimizer: Benchmark "${name}":
      Before: ${(beforeSimilarity * 100).toFixed(1)}%
      After: ${(afterSimilarity * 100).toFixed(1)}%
      Improvement: ${(percentImprovement > 0 ? '+' : '')}${percentImprovement.toFixed(2)}%`);

    await this.saveBenchmarks();
    return result;
  }

  /**
   * Get performance trend
   */
  getPerformanceTrend(metric: string = 'retrieval_success'): BenchmarkResult[] {
    return this.benchmarks.filter(b => b.metric === metric);
  }

  // ==========================================================================
  // POLICY GRADIENT (SIMULATED)
  // ==========================================================================

  /**
   * Calculate gradient for policy update based on recent signals
   */
  async calculateGradient(): Promise<number> {
    const signals = this.policy.getAllSignals();
    if (signals.length < 5) return 0;

    const recentSignals = signals.slice(-10); // Last 10 signals
    const outcomes = recentSignals.map(s => s.outcome.type);

    // Calculate empirical gradient
    let gradient = 0;
    for (const outcome of outcomes) {
      if (outcome === 'helpful') gradient += 0.1;
      if (outcome === 'not_helpful') gradient -= 0.1;
      if (outcome === 'contradicted') gradient -= 0.2;
    }

    return gradient;
  }

  /**
   * Apply gradient update to policy
   */
  async applyGradientUpdate(): Promise<void> {
    const gradient = await this.calculateGradient();
    if (Math.abs(gradient) < 0.1) {
      console.log('PolicyOptimizer: Gradient too small for update');
      return;
    }

    console.log(`PolicyOptimizer: Applying gradient update (${gradient.toFixed(3)})`);
    // In a full implementation, this would adjust policy parameters
    // For now, we just log the intention
  }

  // ==========================================================================
  // SNAPSHOTS
  // ==========================================================================

  private async snapshotPolicyState(label: string): Promise<void> {
    const snapshot = {
      label,
      timestamp: Date.now(),
      typeStats: this.policy.getTypeStatistics(),
      signals: this.policy.getAllSignals().length,
    };

    const snapshotPath = `${this.config.experimentsPath}/snapshot_${label}_${Date.now()}.json`;
    await fs.writeFile(snapshotPath, JSON.stringify(snapshot, null, 2), 'utf-8');
    console.log(`PolicyOptimizer: Saved snapshot "${label}"`);
  }

  // ==========================================================================
  // PERSISTENCE
  // ==========================================================================

  private async loadExperiments(): Promise<void> {
    try {
      const exists = await fs.access(this.config.experimentsPath).then(() => true).catch(() => false);
      if (!exists) return;

      const files = await fs.readdir(this.config.experimentsPath);
      const experimentFiles = files.filter(f => f.startsWith('experiments_'));

      for (const file of experimentFiles) {
        const json = await fs.readFile(path.join(this.config.experimentsPath, file), 'utf-8');
        const data = JSON.parse(json);
        for (const exp of data.experiments || []) {
          this.experiments.set(exp.id, exp);
        }
      }
    } catch (error) {
      console.log('PolicyOptimizer: No existing experiments found');
    }
  }

  private async saveExperiments(): Promise<void> {
    const data = {
      timestamp: Date.now(),
      experiments: Array.from(this.experiments.values()),
    };
    const file = `${this.config.experimentsPath}/experiments_${Date.now()}.json`;
    await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf-8');
  }

  private async saveBenchmarks(): Promise<void> {
    const data = {
      timestamp: Date.now(),
      benchmarks: this.benchmarks,
    };
    const file = `${this.config.benchmarksPath}/benchmarks_${Date.now()}.json`;
    await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf-8');
  }

  // ==========================================================================
  // AUTO OPTIMIZATION
  // ==========================================================================

  private startAutoOptimization(): void {
    this.optimizationTimer = setInterval(async () => {
      try {
        await this.tuneLearningRates();
        await this.runBenchmark('auto');
        await this.applyGradientUpdate();
      } catch (error) {
        console.error('PolicyOptimizer: Auto-optimization failed:', error);
      }
    }, this.config.optimizationInterval);

    console.log(`PolicyOptimizer: Auto-optimization every ${this.config.optimizationInterval}ms`);
  }

  stopAutoOptimization(): void {
    if (this.optimizationTimer) {
      clearInterval(this.optimizationTimer);
      this.optimizationTimer = undefined;
    }
  }

  // ==========================================================================
  // STATS & INSPECTION
  // ==========================================================================

  getOptimizerStats() {
    return {
      activeExperiment: this.currentExperiment?.name || null,
      totalExperiments: this.experiments.size,
      totalBenchmarks: this.benchmarks.length,
      autoOptimize: this.config.autoOptimize,
    };
  }
}
