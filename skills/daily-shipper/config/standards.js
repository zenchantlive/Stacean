// Coding Standards - Language-Agnostic Rules
// Applied to ALL apps regardless of language

module.exports = {
  rules: [
    {
      id: 1,
      name: "Meaningful Commits",
      description: "Git commits must describe actual changes, not generic terms",
      check: (commitMsg) => {
        const generic = /^(fix|update|wip|tmp|test)$/i;
        return !generic.test(commitMsg);
      }
    },
    {
      id: 2,
      name: "Complete README",
      description: "README must have purpose, usage, demo, installation",
      requiredSections: ["Purpose", "Usage", "Demo", "Installation"]
    },
    {
      id: 3,
      name: "License File",
      description: "Every repo must include LICENSE file",
      defaultLicense: "MIT"
    },
    {
      id: 4,
      name: "Proper .gitignore",
      description: "Ignore language-specific artifacts",
      patterns: [
        "node_modules",
        ".next",
        ".DS_Store",
        "*.pyc",
        "*.o",
        "*.gem",
        "Gemfile.lock",
        ".bundle",
        "target/",
        ".env*"
      ]
    },
    {
      id: 5,
      name: "Error Handling",
      description: "No silent failures - errors must be caught and logged",
      check: (code, language) => {
        // Language-specific patterns
        const errorPatterns = {
          javascript: /catch\s*\(\w+\)\s*\{/,
          ruby: /rescue\s*=>/,
          python: /except\s+\w+.*:/,
          rust: /\?\s*$/,
        };
        return errorPatterns[language]?.test(code);
      }
    },
    {
      id: 6,
      name: "No Hardcoded Secrets",
      description: "Use environment variables, never hardcode API keys",
      forbiddenPatterns: [
        /api[_-]?key\s*=\s*['"][\w-]+/i,
        /password\s*=\s*['"][\w-]+/i,
        /secret\s*=\s*['"][\w-]+/i,
        /token\s*=\s*['"][\w-]+/i
      ]
    },
    {
      id: 7,
      name: "Happy Path Tested",
      description: "At least verify the main use case works",
      check: () => true // Placeholder - implemented per app
    },
    {
      id: 8,
      name: "Clean Structure",
      description: "Organized folders, no spaghetti",
      recommended: ["src/", "lib/", "app/", "tests/", "README.md", "LICENSE"]
    }
  ],

  validate(commitMsg, code, language) {
    const violations = [];

    for (const rule of this.rules) {
      if (rule.check) {
        const passed = rule.check(commitMsg, code, language);
        if (!passed) {
          violations.push({
            ruleId: rule.id,
            ruleName: rule.name,
            description: rule.description
          });
        }
      }
    }

    return {
      passed: violations.length === 0,
      violations
    };
  }
};
