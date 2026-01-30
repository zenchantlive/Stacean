/**
 * Code Name Generator
 * Auto-generates memorable agent handles (Adjective + Animal)
 *
 * Purpose: Avoid cognitive load from raw IDs like "a1b2c3"
 * Usage: "Neon-Hawk is doing DB refactor" vs "Agent a1 is doing DB refactor"
 */

// ============================================================================
// Word Banks
// ============================================================================

const ADJECTIVES = [
  // Colors & Visuals
  "Neon",
  "Solar",
  "Crimson",
  "Azure",
  "Iron",
  "Golden",
  "Silver",
  "Cobalt",
  "Emerald",
  "Obsidian",
  // Nature & Elements
  "Storm",
  "Swift",
  "Thunder",
  "Shadow",
  "Lightning",
  "Frost",
  "Ember",
  "Mist",
  "Dawn",
  "Dusk",
  // Qualities
  "Steady",
  "Silent",
  "Keen",
  "Brave",
  "Bright",
  "Quick",
  "Sharp",
  "Bold",
  "Calm",
  "Wild",
  // Tech-adjacent
  "Cyber",
  "Quantum",
  "Nebula",
  "Aether",
  "Void",
  "Pulse",
  "Echo",
  "Signal",
  "Core",
];

const ANIMALS = [
  // Predators (strong)
  "Hawk",
  "Wolf",
  "Falcon",
  "Eagle",
  "Lion",
  "Tiger",
  "Panther",
  "Shark",
  "Dragon",
  // Aquatic (fast)
  "Otter",
  "Dolphin",
  "Whale",
  "Stingray",
  "Seahorse",
  // Small creatures (nimble)
  "Fox",
  "Rabbit",
  "Squirrel",
  "Hummingbird",
  "Sparrow",
  // Mythical
  "Phoenix",
  "Griffin",
  "Unicorn",
  "Basilisk",
  // Tech-inspired
  "Drone",
  "Bot",
  "Sentinel",
  "Wraith",
  "Specter",
];

// ============================================================================
// Types
// ============================================================================

export interface CodeName {
  name: string; // "Neon-Hawk"
  initials: string; // "NH"
  adjective: string;
  animal: string;
}

export interface CodeNameGeneratorOptions {
  existingNames?: string[]; // Avoid duplicates
  seed?: string; // For deterministic generation (tests)
}

// ============================================================================
// Generator
// ============================================================================

/**
 * Generate a unique code name (Adjective + Animal)
 */
export function generateCodeName(options: CodeNameGeneratorOptions = {}): CodeName {
  const { existingNames = [], seed } = options;

  // Simple pseudo-random using seed if provided (for tests)
  let randomIndex: () => number;

  if (seed) {
    // Basic seeded random (not crypto-secure, but deterministic for tests)
    let seedValue = 0;
    for (let i = 0; i < seed.length; i++) {
      seedValue += seed.charCodeAt(i);
    }
    randomIndex = () => {
      seedValue = (seedValue * 1103515245 + 12345) & 0x7fffffff;
      return Math.abs(seedValue % 1000);
    };
  } else {
    randomIndex = () => Math.floor(Math.random() * 1000);
  }

  // Try up to 100 times to find a unique name
  const maxAttempts = 100;
  let attempts = 0;

  while (attempts < maxAttempts) {
    const adjective = ADJECTIVES[randomIndex() % ADJECTIVES.length];
    const animal = ANIMALS[randomIndex() % ANIMALS.length];
    const name = `${adjective}-${animal}`;

    // Check uniqueness if existing names provided
    if (!existingNames.includes(name)) {
      const initials = extractInitials(adjective, animal);

      return {
        name,
        initials,
        adjective,
        animal,
      };
    }

    attempts++;
  }

  // Fallback: Add number to ensure uniqueness
  const adjective = ADJECTIVES[randomIndex() % ADJECTIVES.length];
  const animal = ANIMALS[randomIndex() % ANIMALS.length];
  const fallbackName = `${adjective}-${animal}-${randomIndex() % 99}`;

  return {
    name: fallbackName,
    initials: extractInitials(adjective, animal),
    adjective,
    animal,
  };
}

/**
 * Generate multiple unique code names
 */
export function generateCodeNames(count: number, existingNames: string[] = []): CodeName[] {
  const names: CodeName[] = [];
  const currentExisting = [...existingNames];

  for (let i = 0; i < count; i++) {
    const codeName = generateCodeName({ existingNames: currentExisting });
    names.push(codeName);
    currentExisting.push(codeName.name);
  }

  return names;
}

/**
 * Extract initials from code name (e.g., "Neon-Hawk" → "NH")
 */
function extractInitials(adjective: string, animal: string): string {
  const firstInitial = adjective.charAt(0).toUpperCase();
  const secondInitial = animal.charAt(0).toUpperCase();

  return `${firstInitial}${secondInitial}`;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if a string is a valid code name format
 */
export function isValidCodeName(input: string): boolean {
  const pattern = /^[A-Z][a-z]+-[A-Z][a-z]+(?:-\d+)?$/;
  return pattern.test(input);
}

/**
 * Parse code name into components
 */
export function parseCodeName(input: string): CodeName | null {
  if (!isValidCodeName(input)) return null;

  const parts = input.split('-');
  const adjective = parts[0];
  const animal = parts[1].replace(/\d+$/, ''); // Remove trailing number if present

  return {
    name: input,
    initials: extractInitials(adjective, animal),
    adjective,
    animal,
  };
}

/**
 * Get stats about code name generation capacity
 */
export function getGenerationStats(): {
  possibleCombinations: number;
  adjectiveCount: number;
  animalCount: number;
} {
  return {
    possibleCombinations: ADJECTIVES.length * ANIMALS.length,
    adjectiveCount: ADJECTIVES.length,
    animalCount: ANIMALS.length,
  };
}
