/**
 * Trend Selector - Pick winning trend based on problem fit + novelty
 *
 * Scoring: ProblemFit × 0.7 + Novelty × 0.2 + Engagement × 0.1
 *
 * Novelty criteria (reject if):
 * - Has existingPatterns (wrapper, another X, new UI for Y)
 * - Novelty score < 30
 */

function calculateProblemFit(trend) {
  const text = `${trend.title} ${trend.description}`.toLowerCase();
  const painIndicators = trend.painIndicators || [];
  const painWords = [
    'manually', 'tired of', 'annoying', 'error-prone', 'waste of time',
    'slow', 'complicated', 'forgetting', 'hard to read', 'nothing exists',
    'wish there was', 'wish i had', 'need something', 'wish someone'
  ];

  let score = 50; // Base score
  let painCount = 0;

  for (const pain of painIndicators) {
    if (painWords.some(w => pain.toLowerCase().includes(w))) {
      painCount++;
    }
  }

  // Add up to 40 points for pain indicators
  score += Math.min(painCount * 15, 40);

  // Bonus for specific pain words in title
  if (text.includes('tired of')) score += 10;
  if (text.includes('manually')) score += 10;
  if (text.includes('annoying')) score += 5;
  if (text.includes('wish there was') || text.includes('wish i had')) score += 15;

  return Math.min(score, 100);
}

function calculateNoveltyScore(trend) {
  const text = `${trend.title} ${trend.description}`.toLowerCase();
  const noveltyIndicators = trend.noveltyIndicators || [];
  const existingPatterns = trend.existingPatterns || [];

  let score = 50; // Base score

  // Add points for novelty indicators
  for (const indicator of noveltyIndicators) {
    const lower = indicator.toLowerCase();
    if (lower.includes('first') || lower.includes('nothing exists')) score += 20;
    if (lower.includes('wish there was') || lower.includes('wish i had')) score += 15;
    if (lower.includes('clickable') || lower.includes('real-time')) score += 10;
    if (lower.includes('stop manually') || lower.includes('automatically')) score += 10;
  }

  // Subtract points for existing patterns
  for (const pattern of existingPatterns) {
    const lower = pattern.toLowerCase();
    if (lower.includes('wrapper')) score -= 25;
    if (lower.includes('new ui') || lower.includes('ui for')) score -= 20;
    if (lower.includes('another')) score -= 15;
    if (lower.includes('ai-generated') || lower.includes('ai wrapper')) score -= 20;
    if (lower.includes('bot')) score -= 10;
  }

  return Math.max(0, Math.min(score, 100));
}

function calculateEngagementScore(trend) {
  // Normalize engagement to 0-100
  const engagement = trend.engagement || 0;
  const recency = Math.max(0, 24 - (trend.ageHours || 0)); // Recency bonus

  const normalizedEngagement = Math.min(engagement / 10, 70); // Max 70 from engagement
  const recencyBonus = Math.min(recency * 2, 30); // Max 30 from recency

  return Math.min(normalizedEngagement + recencyBonus, 100);
}

function selectTrend(trends) {
  if (!trends || trends.length === 0) return null;

  const scored = trends.map(trend => {
    const problemFit = calculateProblemFit(trend);
    const noveltyScore = calculateNoveltyScore(trend);
    const engagementScore = calculateEngagementScore(trend);

    // Apply filters
    const hasExistingPatterns = (trend.existingPatterns || []).length > 0;
    const noveltyTooLow = noveltyScore < 30;
    const problemFitTooLow = problemFit < 40;

    // Final score with weights
    const finalScore = (problemFit * 0.7) + (noveltyScore * 0.2) + (engagementScore * 0.1);

    return {
      ...trend,
      problemFit,
      noveltyScore,
      engagementScore,
      finalScore,
      noveltyAssessment: {
        score: noveltyScore,
        indicators: trend.noveltyIndicators || [],
        concerns: trend.existingPatterns || [],
        verdict: noveltyScore >= 30 ? 'ACCEPT' : 'REJECT'
      },
      rejected: hasExistingPatterns || noveltyTooLow || problemFitTooLow,
      rejectionReason: hasExistingPatterns
        ? 'Existing pattern detected (wrapper/wrapper)'
        : noveltyTooLow
        ? `Novelty score ${noveltyScore} too low`
        : problemFitTooLow
        ? `Problem fit ${problemFit} too low`
        : null
    };
  });

  // Filter out rejected trends and sort by score
  const valid = scored.filter(t => !t.rejected);
  valid.sort((a, b) => b.finalScore - a.finalScore + (Math.random() - 0.5) * 5);

  if (valid.length === 0) {
    console.log('All trends rejected:');
    scored.filter(t => t.rejected).forEach(t => {
      console.log(`  - ${t.title.substring(0, 50)}... (${t.rejectionReason})`);
    });
    return null;
  }

  return valid[0];
}

module.exports = {
  selectTrend,
  calculateProblemFit,
  calculateNoveltyScore,
  calculateEngagementScore
};