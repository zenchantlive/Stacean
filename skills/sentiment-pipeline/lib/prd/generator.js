/**
 * PRD Generator v2
 * Creates actionable Product Requirement Document from sentiment analysis
 * Outputs specs that agents can actually execute
 */

const fs = require('fs');
const path = require('path');

class PRDGenerator {
  async generate(productPath, fatiguePath, analysisPath = null) {
    let productDecisions;
    let fatigue;
    let analysis;

    try {
      productDecisions = JSON.parse(fs.readFileSync(productPath, 'utf-8'));
    } catch {
      productDecisions = { features: [], recommendations: [], priorityMatrix: [] };
    }

    try {
      fatigue = JSON.parse(fs.readFileSync(fatiguePath, 'utf-8'));
    } catch {
      fatigue = { brokenMoments: [], drivers: [], recommendations: [] };
    }

    try {
      if (analysisPath) {
        analysis = JSON.parse(fs.readFileSync(analysisPath, 'utf-8'));
      }
    } catch {
      analysis = { summary: {}, painPoints: [], themes: [], rawFeedback: [] };
    }

    const results = {
      generatedAt: new Date().toISOString(),
      sections: [],
      features: productDecisions.features || [],
      rawProduct: productDecisions,
      rawFatigue: fatigue,
      rawAnalysis: analysis
    };

    // Build PRD sections
    results.sections = [
      this.buildExecutiveSummary(analysis, fatigue),
      this.buildProblemStatement(productDecisions, fatigue, analysis),
      this.buildFeatureSpecs(productDecisions, analysis),
      this.buildUserStories(productDecisions, analysis),
      this.buildTechnicalSpec(productDecisions, analysis),
      this.buildSuccessMetrics(productDecisions, analysis),
      this.buildTimeline(productDecisions),
      this.buildRisks(fatigue),
      this.buildAppendix(analysis, fatigue)
    ];

    // Generate full markdown
    results.markdown = this.toMarkdown(results);

    return results;
  }

  buildExecutiveSummary(analysis, fatigue) {
    const summary = analysis?.summary || {};
    const topTheme = analysis?.themes?.[0] || { name: 'Unknown', percentOfTotal: 0 };
    const topPain = analysis?.painPoints?.[0] || { name: 'Unknown', mentions: 0 };

    return {
      title: 'Executive Summary',
      content: `## Quick Status

| Metric | Value |
|--------|-------|
| **Items Analyzed** | ${summary.totalItems || 0} |
| **Negative Sentiment** | ${summary.sentimentBreakdown?.negativePercent || 0}% |
| **Top Theme** | ${topTheme.name} (${topTheme.percentOfTotal}% of mentions) |
| **Primary Pain Point** | ${topPain.name} (${topPain.mentions} mentions) |

## TL;DR

Users are frustrated about **${topPain.name.toLowerCase()}** with **${summary.sentimentBreakdown?.negativePercent || 0}%** negative sentiment across ${summary.totalItems || 0} feedback items.

**Recommended Action:** Implement feature voting system to give users agency over roadmap priorities.`
    };
  }

  buildProblemStatement(productDecisions, fatigue, analysis) {
    const summary = analysis?.summary || {};
    const topPain = analysis?.painPoints?.[0] || { name: 'Core Functionality', description: 'Issues from user feedback' };
    const brokenMoments = fatigue?.brokenMoments || [];
    const sampleFeedback = analysis?.rawFeedback?.slice(0, 3) || [];

    let content = `## The Problem

${topPain.description || 'Users express frustration around core functionality.'}

### Evidence from User Feedback

`;
    for (const fb of sampleFeedback) {
      content += `> "${fb.text?.substring(0, 150) || 'No text'}"\n`;
      content += `> — ${fb.source || 'Unknown'}, ${fb.sentiment || 'neutral'}\n\n`;
    }

    content += `### Broken Moments (User Frustration Triggers)

`;
    if (brokenMoments.length === 0) {
      content += `_No specific broken moments captured in this analysis._\n`;
    } else {
      for (const bm of brokenMoments.slice(0, 3)) {
        content += `- **${bm.moment || 'Unknown moment'}**\n`;
        content += `  - Impact: ${bm.impact || 'User frustration'}\n`;
        content += `  - Frequency: ${bm.frequency || 'Unknown'}\n\n`;
      }
    }

    content += `## The Opportunity

By addressing **${topPain.name.toLowerCase()}**, we can:
1. Reduce negative sentiment from **${summary.sentimentBreakdown?.negativePercent || 0}% → <15%**
2. Improve user retention by **10%+**
3. Build trust through visible responsiveness to feedback`;

    return {
      title: 'Problem Statement',
      content
    };
  }

  buildFeatureSpecs(productDecisions, analysis) {
    const features = productDecisions.features || [];
    const painPoints = analysis?.painPoints || [];

    let content = `## Feature Specifications

This section provides actionable specs for each feature. Each spec includes data models, API contracts, and UI requirements.

`;

    for (const feature of features.slice(0, 3)) {
      const featureName = feature.name || 'Unnamed Feature';
      const description = feature.description || 'No description provided';
      const priority = (feature.priority * 100).toFixed(0);
      const effort = feature.effort || 'medium';

      // Determine which pain point this addresses
      const linkedPain = painPoints.find(p => 
        featureName.toLowerCase().includes(p.name?.toLowerCase()) ||
        description.toLowerCase().includes(p.name?.toLowerCase())
      );

      content += `### ${featureName}

**Priority:** ${priority}% | **Effort:** ${effort}

**Addresses:** ${linkedPain?.name || 'General user need'}

**Description:**
${description}

#### Data Model

\`\`\`typescript
${this.generateDataModel(featureName)}
\`\`\`

#### API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | \`/api/${this.slugify(featureName)}\` | List all ${this.slugify(featureName)} |
| POST | \`/api/${this.slugify(featureName)}\` | Create new ${this.slugify(featureName)} |
| GET | \`/api/${this.slugify(featureName)}/:id\` | Get specific ${this.slugify(featureName)} |
| PUT | \`/api/${this.slugify(featureName)}/:id\` | Update ${this.slugify(featureName)} |
| DELETE | \`/api/${this.slugify(featureName)}/:id\` | Delete ${this.slugify(featureName)} |

#### UI Requirements

1. **Main View:** List page with search/filter/sort
2. **Detail View:** Full information with actions
3. **Create Modal/Page:** Form with validation
4. **Feedback:** Success/error toasts

#### Acceptance Criteria

- [ ] User can view list of ${this.slugify(featureName)}
- [ ] User can create new ${this.slugify(featureName)}
- [ ] User can update existing ${this.slugify(featureName)}
- [ ] User can delete ${this.slugify(featureName)} (with confirmation)
- [ ] Form validation shows appropriate errors
- [ ] Loading states displayed during API calls

#### Edge Cases

- **Duplicate creation** → Return 409 Conflict with existing resource
- **Not found** → Return 404 with helpful message
- **Unauthorized** → Return 401 and redirect to login
- **Rate limiting** → Return 429 after 100 requests/minute

#### Related Features

${this.findRelatedFeatures(feature, features).map(f => `- ${f.name}`).join('\n') || '_None identified_'}

---

`;
    }

    return {
      title: 'Feature Specifications',
      content
    };
  }

  buildUserStories(productDecisions, analysis) {
    const features = productDecisions.features || [];
    const themes = analysis?.themes || [];

    let content = `## User Stories

Prioritized stories for implementation.

### Must Have (P0)

`;
    let p0Count = 0;
    for (const feature of features.filter(f => f.priority >= 0.6)) {
      p0Count++;
      content += `**${feature.name}**\n`;
      content += `- As a user, I want to ${this.extractVerb(feature.name)} so that ${this.extractBenefit(feature.description)}\n`;
      content += `- As an admin, I want to manage ${this.slugify(feature.name)} so that I can keep content up-to-date\n\n`;
    }

    if (p0Count === 0) {
      content += `_No P0 features identified._\n\n`;
    }

    content += `### Should Have (P1)

`;
    let p1Count = 0;
    for (const feature of features.filter(f => f.priority >= 0.4 && f.priority < 0.6)) {
      p1Count++;
      content += `**${feature.name}**\n`;
      content += `- As a user, I want to ${this.extractVerb(feature.name)} so that ${this.extractBenefit(feature.description)}\n\n`;
    }

    if (p1Count === 0) {
      content += `_No P1 features identified._\n\n`;
    }

    content += `### Nice to Have (P2)

`;
    let p2Count = 0;
    for (const feature of features.filter(f => f.priority < 0.4)) {
      p2Count++;
      content += `**${feature.name}**\n`;
      content += `- As a user, I want to ${this.extractVerb(feature.name)} so that ${this.extractBenefit(feature.description)}\n\n`;
    }

    if (p2Count === 0) {
      content += `_No P2 features identified._\n\n`;
    }

    return {
      title: 'User Stories',
      content
    };
  }

  buildTechnicalSpec(productDecisions, analysis) {
    const features = productDecisions.features || [];

    let content = `## Technical Specifications

### Database Schema

#### Core Tables

| Table | Columns | Indexes |
|-------|---------|---------|
| \`features\` | id, title, description, status, priority, created_at, updated_at | status, priority |
| \`feature_votes\` | id, feature_id, user_id, created_at | feature_id, user_id |
| \`feature_requests\` | id, user_id, title, description, status, created_at | status, user_id |

#### ERD Summary

\`\`\`
features 1───< feature_votes
features 1───< feature_requests
users 1───< feature_votes
users 1───< feature_requests
\`\`\`

### API Contract

#### Response Format

All responses follow this structure:

\`\`\`json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 100
  }
}
\`\`\`

#### Error Format

\`\`\`json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input",
    "details": [...]
  }
}
\`\`\`

### Integration Points

| Service | Purpose | Method |
|---------|---------|--------|
| Auth Service | User authentication | JWT Bearer token |
| KV Store | Caching and counters | Redis |
| Notification Service | User alerts | Async event |

### Security Requirements

1. All endpoints require authentication except GET
2. Rate limiting: 100 requests/minute per user
3. Input validation on all POST/PUT endpoints
4. SQL injection prevention via parameterized queries
5. XSS prevention via output encoding

### Performance Requirements

- API response time: < 200ms at p95
- List endpoints support pagination (default 20, max 100)
- Database queries use indexes effectively`;

    return {
      title: 'Technical Specifications',
      content
    };
  }

  buildSuccessMetrics(productDecisions, analysis) {
    const summary = analysis?.summary || {};
    const negativeCurrent = parseFloat(summary.sentimentBreakdown?.negativePercent || 0);

    return {
      title: 'Success Metrics',
      content: `## Key Performance Indicators

### Primary Metrics

| Metric | Current | Target | Timeline |
|--------|---------|--------|----------|
| Negative Sentiment | ${negativeCurrent}% | <15% | 90 days |
| Feature Adoption | 0% | >50% | 60 days |
| User Retention | Baseline | +10% | 90 days |
| NPS Score | Baseline | +15 | 180 days |

### Secondary Metrics

- **Vote Participation:** % of users who vote on features
- **Feature Request Completion:** % of requests addressed
- **Time to Launch:** Days from request to deployment
- **User Satisfaction:** CSAT score on new features

### Measurement Strategy

1. **Sentiment:** Run sentiment analysis weekly on new feedback
2. **Adoption:** Track feature usage via analytics
3. **Retention:** Cohort analysis at 7/30/90 days
4. **NPS:** Quarterly survey to 10% of users`

    };
  }

  buildTimeline(productDecisions) {
    const features = productDecisions.features || [];
    const p0Features = features.filter(f => f.priority >= 0.6);
    const p1Features = features.filter(f => f.priority >= 0.4 && f.priority < 0.6);
    const p2Features = features.filter(f => f.priority < 0.4);

    let content = `## Implementation Timeline

### Phase 1: Foundation (Week 1-2)

**Goal:** Core infrastructure and P0 features

Tasks:
- [ ] Database schema migration
- [ ] API scaffold with auth
- [ ] Basic CRUD for features
- [ ] Feature voting system MVP

**Features:** ${p0Features.slice(0, 2).map(f => f.name).join(', ') || 'TBD'}

### Phase 2: Enhancement (Week 3-4)

**Goal:** Complete P0, start P1

Tasks:
- [ ] UI/UX refinements
- [ ] Feature request submission
- [ ] Email notifications
- [ ] Analytics integration

**Features:** ${p0Features[2]?.name || 'Completed'}, ${p1Features[0]?.name || 'TBD'}

### Phase 3: Polish (Week 5-6)

**Goal:** Launch-ready, P1 complete

Tasks:
- [ ] User testing (beta users)
- [ ] Performance optimization
- [ ] Documentation
- [ ] Launch preparation

**Features:** ${p1Features.slice(1, 3).map(f => f.name).join(', ') || 'TBD'}

### Phase 4: Iteration (Week 7+)

**Goal:** P2 features based on user feedback

Tasks:
- [ ] Monitor metrics
- [ ] Address edge cases
- [ ] Plan next iteration

**Features:** ${p2Features.slice(0, 2).map(f => f.name).join(', ') || 'TBD'}`;

    return {
      title: 'Implementation Timeline',
      content
    };
  }

  buildRisks(fatigue) {
    const brokenMoments = fatigue?.brokenMoments || [];

    let content = `## Risks & Mitigations

### Technical Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Feature scope creep | High | Medium | Strict PR reviews, define MVP scope |
| Performance at scale | High | Low | Pagination, caching, indexing |
| Database contention | Medium | Low | Connection pooling, read replicas |

### User Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Low adoption | High | Medium | In-app prompts, email campaign |
| Vote manipulation | Medium | Low | One vote per user, fraud detection |
| Feature overload | Medium | Medium | Prioritization process, user education |

### Operational Risks

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Resource constraints | High | Medium | Prioritize P0, defer P2 |
| Technical debt | Medium | High | Refactor time allocated weekly |`;

    return {
      title: 'Risks & Mitigations',
      content
    };
  }

  buildAppendix(analysis, fatigue) {
    const summary = analysis?.summary || {};
    const painPoints = analysis?.painPoints || [];
    const brokenMoments = fatigue?.brokenMoments || [];
    const themes = analysis?.themes || [];

    return {
      title: 'Appendix',
      content: `## Research Data

**Total Items Analyzed:** ${summary.totalItems || 0}
**Sentiment Breakdown:**
- Positive: ${summary.sentimentBreakdown?.positivePercent || 0}%
- Neutral: ${summary.sentimentBreakdown?.neutralPercent || 0}%
- Negative: ${summary.sentimentBreakdown?.negativePercent || 0}%

## Identified Pain Points (Ranked)

${painPoints.map(p => `- **${p.name}**: ${p.mentions} mentions (${p.severity} severity) — ${p.description || 'No description'}`).join('\n') || '- No data available'}

## Broken Moments

${brokenMoments.map(b => `- **${b.moment || 'Unknown'}**\n  - Impact: ${b.impact || 'Unknown'}\n  - User Emotion: ${b.emotion || 'Unknown'}`).join('\n\n') || '- No data available'}

## Theme Analysis

${themes.map(t => `- **${t.name}**: ${t.percentOfTotal}% of mentions (${t.sentiment})`).join('\n') || '- No data available'}

## Generated

This PRD was auto-generated by Daily Shipper from sentiment analysis.
Timestamp: ${new Date().toISOString()}`
    };
  }

  // Helper methods
  slugify(text) {
    return text
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }

  generateDataModel(featureName) {
    const slug = this.slugify(featureName);
    return `interface ${this.pascalCase(slug)} {
  id: string;                    // UUID
  title: string;
  description?: string;
  status: 'draft' | 'active' | 'archived';
  createdAt: string;             // ISO timestamp
  updatedAt: string;             // ISO timestamp
  createdBy: string;             // User ID
}

interface ${this.pascalCase(slug)}Filter {
  status?: string;
  createdBy?: string;
  createdAfter?: string;
  createdBefore?: string;
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'title';
  sortOrder?: 'asc' | 'desc';
}

interface ${this.pascalCase(slug)}Response {
  success: boolean;
  data: ${this.pascalCase(slug)}[];
  meta: {
    total: number;
    limit: number;
    offset: number;
  };
}`;
  }

  pascalCase(text) {
    return text
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }

  extractVerb(featureName) {
    const verbs = ['add', 'create', 'view', 'edit', 'delete', 'manage', 'track', 'vote', 'request'];
    for (const verb of verbs) {
      if (featureName.toLowerCase().includes(verb)) {
        return verb;
      }
    }
    return 'manage';
  }

  extractBenefit(description) {
    if (!description) return 'I can accomplish my goal';
    // Clean up description and extract benefit
    const cleaned = description
      .replace(/[^a-zA-Z0-9\s]/g, '')
      .split(' ')
      .slice(0, 10)
      .join(' ')
      .toLowerCase();
    return cleaned || 'I can accomplish my goal';
  }

  findRelatedFeatures(feature, allFeatures) {
    const featureTerms = (feature.name + ' ' + feature.description)
      .toLowerCase()
      .split(/\s+/)
      .filter(t => t.length > 3);

    return allFeatures
      .filter(f => f.name !== feature.name)
      .map(f => {
        const score = featureTerms.reduce((acc, term) => {
          if ((f.name + ' ' + f.description).toLowerCase().includes(term)) {
            return acc + 1;
          }
          return acc;
        }, 0);
        return { ...f, score };
      })
      .filter(f => f.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }

  toMarkdown(results) {
    let md = `# Product Requirements Document\n\n`;
    md += `**Generated:** ${results.generatedAt}\n\n`;
    md += `---\n\n`;

    for (const section of results.sections) {
      md += `## ${section.title}\n\n`;
      md += `${section.content}\n\n`;
      md += `---\n\n`;
    }

    return md;
  }
}

module.exports = PRDGenerator;
