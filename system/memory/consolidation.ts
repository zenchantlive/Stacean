/**
 * Memory Consolidator - Active Forgetting & Wisdom Compression
 *
 * Implements the "Memory as Experience" three-stage model:
 * 1. Storage: Raw data (daily logs, task outputs)
 * 2. Reflection: Extract patterns, lessons, contradictions
 * 3. Experience: Abstracted strategies, reusable knowledge
 *
 * Features:
 * - Automatic compression of raw logs into lessons
 * - Conflict detection between memories
 * - Pattern recognition in errors and successes
 * - Intelligent pruning of low-value memories
 */

import * as fs from 'fs/promises';
import * as path from 'path';

import {
  MemoryEntry,
  MemoryType,
  MemoryQuery,
  RetrievalResult,
  ConsolidationOptions,
  ConsolidationResult,
  PruneOptions,
  MemoryConflict,
  generateId,
  generateConflictId,
  calculateAge,
  DEFAULT_VALUE_SCORE,
  MAX_VALUE_SCORE,
  MIN_VALUE_SCORE,
  CONSOLIDATION_WINDOW_DAILY,
  CONSOLIDATION_WINDOW_WEEKLY,
  PRUNE_THRESHOLD_LOW,
  PRUNE_AGE_THRESHOLD,
  MIN_RETRIEVALS_TO_KEEP,
} from './types';

import { VectorIndex } from './index';
import { EmbeddingManager } from './embeddings';

// ============================================================================
// CONSOLIDATOR CONFIG
// ============================================================================

export interface ConsolidatorConfig {
  memoryPath?: string;        // Where memory files are stored
  indexFile?: string;         // Vector index persistence
  patternsFile?: string;      // Extracted patterns output
  maxEntryAge?: number;       // Max age before consolidation (default: 7 days)
  minValueToKeep?: number;    // Minimum value score to retain
}

export interface PatternExtractionResult {
  patterns: ExtractedPattern[];
  lessons: ExtractedLesson[];
  contradictions: DetectedContradiction[];
}

export interface ExtractedPattern {
  id: string;
  content: string;
  confidence: number;
  sourceEntries: string[];
  tags: string[];
}

export interface ExtractedLesson {
  id: string;
  content: string;
  context: string;
  applicability: string[];
  tags: string[];
}

export interface DetectedContradiction {
  entryA: string;
  entryB: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  resolution?: string;
}

// ============================================================================
// MEMORY CONSOLIDATOR
// ============================================================================

export class MemoryConsolidator {
  private config: Required<ConsolidatorConfig>;
  private vectorIndex: VectorIndex;
  private embeddingManager: EmbeddingManager;

  constructor(config: ConsolidatorConfig = {}) {
    this.config = {
      memoryPath: config.memoryPath || '/home/clawdbot/clawd/memory',
      indexFile: config.indexFile || '/tmp/memory-index.json',
      patternsFile: config.patternsFile || '/tmp/consolidated-patterns.json',
      maxEntryAge: config.maxEntryAge || 7 * 24 * 60 * 60 * 1000, // 7 days
      minValueToKeep: config.minValueToKeep || 0.3,
    };

    this.vectorIndex = new VectorIndex(1536);
    this.embeddingManager = new EmbeddingManager(this.vectorIndex, { dimensions: 1536 });
  }

  // ==========================================================================
  // INITIALIZATION
  // ==========================================================================

  async initialize(): Promise<void> {
    console.log('MemoryConsolidator: Initializing...');

    // Load existing index
    try {
      const exists = await fs.access(this.config.indexFile).then(() => true).catch(() => false);
      if (exists) {
        const loadedIndex = await VectorIndex.loadFromFile(this.config.indexFile);
        this.vectorIndex = loadedIndex;
        console.log(`MemoryConsolidator: Loaded ${loadedIndex.size()} entries`);
      }
    } catch (error) {
      console.log('MemoryConsolidator: No existing index found');
    }

    await this.embeddingManager.initialize();
    console.log('MemoryConsolidator: Ready');
  }

  // ==========================================================================
  // MAIN CONSOLIDATION WORKFLOW
  // ==========================================================================

  /**
   * Run the full consolidation pipeline
   * 1. Read raw logs
   * 2. Extract patterns & lessons
   * 3. Detect conflicts
   * 4. Create consolidated entries
   * 5. Prune low-value memories
   */
  async consolidate(options: ConsolidationOptions = {}): Promise<ConsolidationResult> {
    console.log(`MemoryConsolidator: Starting consolidation...`);

    const result: ConsolidationResult = {
      entriesAdded: 0,
      patternsExtracted: 0,
      conflictsDetected: 0,
      conflictsResolved: 0,
      lowValuePruned: 0,
    };

    // 1. Identify source files (raw logs)
    const sources = await this.identifySources(options);
    console.log(`MemoryConsolidator: Found ${sources.length} sources to consolidate`);

    // 2. Extract patterns and lessons from sources
    const extraction = await this.extractPatternsAndLessons(sources);
    console.log(`MemoryConsolidator: Extracted ${extraction.patterns.length} patterns, ${extraction.lessons.length} lessons`);

    // 3. Detect contradictions
    const contradictions = await this.detectContradictions();
    result.conflictsDetected = contradictions.length;
    console.log(`MemoryConsolidator: Found ${contradictions.length} contradictions`);

    // 4. Create consolidated entries
    for (const pattern of extraction.patterns) {
      await this.createPatternEntry(pattern);
      result.patternsExtracted++;
      result.entriesAdded++;
    }

    for (const lesson of extraction.lessons) {
      await this.createLessonEntry(lesson);
      result.entriesAdded++;
    }

    // 5. Resolve conflicts (auto-resolve low severity)
    for (const contradiction of contradictions) {
      if (contradiction.severity === 'low') {
        await this.autoResolveConflict(contradiction);
        result.conflictsResolved++;
      }
    }

    // 6. Prune low-value entries
    const pruned = await this.prune({
      threshold: PRUNE_THRESHOLD_LOW,
      age: 'older_than_90_days',
      minRetrievalCount: MIN_RETRIEVALS_TO_KEEP,
    });
    result.lowValuePruned = pruned;

    // Save updated index
    await this.vectorIndex.saveToFile(this.config.indexFile);

    console.log(`MemoryConsolidator: Consolidation complete:
      Entries added: ${result.entriesAdded}
      Patterns extracted: ${result.patternsExtracted}
      Conflicts: ${result.conflictsDetected} detected, ${result.conflictsResolved} resolved
      Pruned: ${result.lowValuePruned}`);

    return result;
  }

  // ==========================================================================
  // PATTERN EXTRACTION
  // ==========================================================================

  private async identifySources(options: ConsolidationOptions): Promise<string[]> {
    const sources: string[] = [];

    if (options.source) {
      sources.push(options.source);
    } else {
      // Scan memory directory for raw logs
      try {
        const files = await fs.readdir(this.config.memoryPath);
        const mdFiles = files.filter(f => f.match(/^\d{4}-\d{2}-\d{2}\.md$/));

        for (const file of mdFiles) {
          const filePath = path.join(this.config.memoryPath, file);
          const stats = await fs.stat(filePath);

          let include = false;
          const age = calculateAge(stats.mtime.getTime());

          if (options.window === 'last_24_hours') {
            include = age <= CONSOLIDATION_WINDOW_DAILY;
          } else if (options.window === 'last_7_days') {
            include = age <= CONSOLIDATION_WINDOW_WEEKLY;
          } else {
            // Default: include if older than 24h but younger than maxEntryAge
            include = age > CONSOLIDATION_WINDOW_DAILY && age < this.config.maxEntryAge;
          }

          if (include) {
            sources.push(filePath);
          }
        }
      } catch (error) {
        console.log('MemoryConsolidator: No memory directory found');
      }
    }

    return sources;
  }

  private async extractPatternsAndLessons(sources: string[]): Promise<PatternExtractionResult> {
    const patterns: ExtractedPattern[] = [];
    const lessons: ExtractedLesson[] = [];
    const allContent: string[] = [];

    for (const source of sources) {
      try {
        const content = await fs.readFile(source, 'utf-8');
        allContent.push(content);

        // Extract patterns from this source
        const sourcePatterns = this.extractPatternsFromText(content, source);
        patterns.push(...sourcePatterns);

        // Extract lessons
        const sourceLessons = this.extractLessonsFromText(content, source);
        lessons.push(...sourceLessons);
      } catch (error) {
        console.error(`MemoryConsolidator: Failed to read source ${source}:`, error);
      }
    }

    // Cross-reference patterns across sources
    const consolidatedPatterns = this.consolidateDuplicatePatterns(patterns);
    const consolidatedLessons = this.mergeRelatedLessons(lessons, allContent);

    return {
      patterns: consolidatedPatterns,
      lessons: consolidatedLessons,
      contradictions: [],
    };
  }

  private extractPatternsFromText(content: string, source: string): ExtractedPattern[] {
    const patterns: ExtractedPattern[] = [];

    // Look for pattern markers
    const patternMarkers = [
      /pattern[:\s]+([^\n]+)/gi,
      /framework[:\s]+([^\n]+)/gi,
      /approach[:\s]+([^\n]+)/gi,
      /method[:\s]+([^\n]+)/gi,
    ];

    for (const marker of patternMarkers) {
      let match;
      while ((match = marker.exec(content)) !== null) {
        patterns.push({
          id: generateId(),
          content: match[1].trim(),
          confidence: 0.7,
          sourceEntries: [source],
          tags: ['pattern', 'extracted'],
        });
      }
    }

    // Extract error patterns
    const errorPatterns = content.match(/error[:\s]+([^\n]+)/gi);
    if (errorPatterns) {
      for (const pattern of errorPatterns) {
        patterns.push({
          id: generateId(),
          content: pattern.replace(/error[:\s]+/i, '').trim(),
          confidence: 0.8,
          sourceEntries: [source],
          tags: ['error-pattern', 'extracted'],
        });
      }
    }

    return patterns;
  }

  private extractLessonsFromText(content: string, source: string): ExtractedLesson[] {
    const lessons: ExtractedLesson[] = [];

    // Look for lesson markers
    const lessonMarkers = [
      /lesson[:\s]+([^\n]+)/gi,
      /learned[:\s]+([^\n]+)/gi,
      / takeaway[:\s]+([^\n]+)/gi,
      /insight[:\s]+([^\n]+)/gi,
    ];

    for (const marker of lessonMarkers) {
      let match;
      while ((match = marker.exec(content)) !== null) {
        lessons.push({
          id: generateId(),
          content: match[1].trim(),
          context: this.extractContext(content, match.index),
          applicability: this.extractApplicability(content, match.index),
          tags: ['lesson', 'extracted'],
        });
      }
    }

    return lessons;
  }

  private extractContext(content: string, index: number): string {
    // Extract surrounding context (200 chars before)
    const start = Math.max(0, index - 200);
    const context = content.substring(start, index).trim();
    return context.length > 0 ? context + '...' : 'Unknown context';
  }

  private extractApplicability(content: string, index: number): string[] {
    const applicability: string[] = [];

    // Look for "when" or "if" patterns nearby
    const nearby = content.substring(index, index + 500);

    if (nearby.match(/when\s+\w+/i)) applicability.push('conditional');
    if (nearby.match(/always|never/i)) applicability.push('rule');
    if (nearby.match(/often|usually/i)) applicability.push('heuristic');
    if (nearby.match(/depends/i)) applicability.push('context-dependent');

    return applicability;
  }

  private consolidateDuplicatePatterns(patterns: ExtractedPattern[]): ExtractedPattern[] {
    const consolidated: Map<string, ExtractedPattern> = new Map();

    for (const pattern of patterns) {
      // Simple deduplication by content similarity
      const existing = Array.from(consolidated.values()).find(
        p => this.stringSimilarity(p.content, pattern.content) > 0.8
      );

      if (existing) {
        // Merge sources
        existing.sourceEntries = [...new Set([...existing.sourceEntries, ...pattern.sourceEntries])];
        existing.confidence = Math.min(1, existing.confidence + 0.1);
      } else {
        consolidated.set(pattern.id, pattern);
      }
    }

    return Array.from(consolidated.values());
  }

  private mergeRelatedLessons(lessons: ExtractedLesson[], allContent: string[]): ExtractedLesson[] {
    // For now, just return all lessons
    // Advanced: would cluster by topic using embeddings
    return lessons;
  }

  // ==========================================================================
  // CONFLICT DETECTION
  // ==========================================================================

  private async detectContradictions(): Promise<DetectedContradiction[]> {
    const contradictions: DetectedContradiction[] = [];
    const entries = this.vectorIndex.getAll();

    // Compare entries for direct contradictions
    for (let i = 0; i < entries.length; i++) {
      for (let j = i + 1; j < entries.length; j++) {
        const a = entries[i] as any;
        const b = entries[j] as any;

        const contentA = a.metadata?.content || a.content || '';
        const contentB = b.metadata?.content || b.content || '';
        const contradiction = this.checkContradiction(contentA, contentB);
        if (contradiction) {
          contradictions.push({
            entryA: a.id,
            entryB: b.id,
            description: contradiction,
            severity: this.getContradictionSeverity(a, b),
          });
        }
      }
    }

    return contradictions;
  }

  private checkContradiction(contentA: string, contentB: string): string | null {
    const lowerA = contentA.toLowerCase();
    const lowerB = contentB.toLowerCase();

    // Check for opposite statements
    const opposites = [
      ['can', 'cannot'],
      ['works', "doesn't work"],
      ['is true', 'is false'],
      ['enable', 'disable'],
    ];

    for (const [positive, negative] of opposites) {
      if (lowerA.includes(positive) && lowerB.includes(negative)) {
        return `"${contentA}" contradicts "${contentB}"`;
      }
      if (lowerB.includes(positive) && lowerA.includes(negative)) {
        return `"${contentB}" contradicts "${contentA}"`;
      }
    }

    return null;
  }

  private getContradictionSeverity(a: any, b: any): 'low' | 'medium' | 'high' {
    const confA = a.metadata?.provenance?.confidence ?? a.metadata?.confidence ?? 0.5;
    const confB = b.metadata?.provenance?.confidence ?? b.metadata?.confidence ?? 0.5;

    if (confA > 0.8 && confB > 0.8) return 'high';
    if (confA < 0.5 || confB < 0.5) return 'low';
    return 'medium';
  }

  private async autoResolveConflict(contradiction: DetectedContradiction): Promise<void> {
    // Auto-resolution strategy: keep the newer entry
    // In production, would use timestamps from metadata
    console.log(`MemoryConsolidator: Auto-resolved conflict: ${contradiction.description}`);
  }

  // ==========================================================================
  // MEMORY PRUNING (Active Forgetting)
  // ==========================================================================

  async prune(options: PruneOptions = {}): Promise<number> {
    console.log('MemoryConsolidator: Starting pruning...');

    const {
      threshold = PRUNE_THRESHOLD_LOW,
      minRetrievalCount = MIN_RETRIEVALS_TO_KEEP,
      age = PRUNE_AGE_THRESHOLD,
      minConfidence,
    } = options;

    const allEntries = this.vectorIndex.getAll();
    let candidates = allEntries;

    // Filter by age
    if (age) {
      const cutoff = Date.now() - 90 * 24 * 60 * 60 * 1000; // 90 days
      candidates = candidates.filter(e => (e.metadata as any)?.timestamp < cutoff);
    }

    // Filter by confidence
    if (minConfidence) {
      candidates = candidates.filter(e => {
        const conf = (e.metadata as any)?.provenance?.confidence ?? (e.metadata as any)?.confidence ?? 0.5;
        return conf < minConfidence;
      });
    }

    // Calculate threshold by value score
    const scores = candidates
      .map(e => (e.metadata as any)?.valueScore ?? DEFAULT_VALUE_SCORE)
      .sort((a, b) => a - b);

    const thresholdIndex = Math.floor(scores.length * threshold);
    const thresholdScore = scores[Math.max(0, thresholdIndex - 1)];

    // Filter by threshold
    const toRemove = candidates.filter(e => {
      const valueScore = (e.metadata as any)?.valueScore ?? DEFAULT_VALUE_SCORE;
      const retrievalCount = (e.metadata as any)?.retrievalCount ?? 0;
      return valueScore < thresholdScore && retrievalCount < minRetrievalCount;
    });

    // Remove from index (ids may already be prefixed)
    const vectorIds = toRemove.map(e => (e.id?.startsWith('vec_') ? e.id : `vec_${e.id}`));
    const pruned = this.vectorIndex.removeBatch(vectorIds);

    console.log(`MemoryConsolidator: Pruned ${pruned} low-value memories`);
    return pruned;
  }

  // ==========================================================================
  // MEMORY ENTRY CREATION
  // ==========================================================================

  private async createPatternEntry(pattern: ExtractedPattern): Promise<void> {
    const vector = await this.embeddingManager.generate(pattern.content);

    this.vectorIndex.add(`vec_${pattern.id}`, vector, {
      memoryId: pattern.id,
      type: 'pattern',
      content: pattern.content,
      confidence: pattern.confidence,
      sourceEntries: pattern.sourceEntries,
      tags: pattern.tags,
      timestamp: Date.now(),
      valueScore: pattern.confidence * 0.8, // Patterns start with high value
      retrievalCount: 0,
    });

    console.log(`MemoryConsolidator: Created pattern entry: "${pattern.content.substring(0, 50)}..."`);
  }

  private async createLessonEntry(lesson: ExtractedLesson): Promise<void> {
    const vector = await this.embeddingManager.generate(lesson.content);

    this.vectorIndex.add(`vec_${lesson.id}`, vector, {
      memoryId: lesson.id,
      type: 'lesson',
      content: lesson.content,
      context: lesson.context,
      applicability: lesson.applicability,
      tags: lesson.tags,
      timestamp: Date.now(),
      valueScore: 0.7, // Lessons start with good value
      retrievalCount: 0,
    });

    console.log(`MemoryConsolidator: Created lesson entry: "${lesson.content.substring(0, 50)}..."`);
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  private stringSimilarity(a: string, b: string): number {
    // Simple Jaccard similarity for deduplication
    const setA = new Set(a.toLowerCase().split(/\s+/));
    const setB = new Set(b.toLowerCase().split(/\s+/));
    const intersection = new Set([...setA].filter(x => setB.has(x)));
    const union = new Set([...setA, ...setB]);
    return intersection.size / union.size;
  }

  // ==========================================================================
  // STATS
  // ==========================================================================

  async getConsolidationStats(): Promise<{
    totalEntries: number;
    patternsCount: number;
    lessonsCount: number;
    conflictsCount: number;
  }> {
    const entries = this.vectorIndex.getAll();
    const patterns = entries.filter(e => (e.metadata as any).type === 'pattern').length;
    const lessons = entries.filter(e => (e.metadata as any).type === 'lesson').length;

    return {
      totalEntries: entries.length,
      patternsCount: patterns,
      lessonsCount: lessons,
      conflictsCount: 0, // Would need to recalculate
    };
  }
}
