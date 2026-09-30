/**
 * Sketchio word list — 200+ common drawable words grouped by category.
 * Used by the server to offer word choices each round.
 */

export interface WordEntry {
  word: string;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export const SKETCHIO_WORDS: WordEntry[] = [
  // Animals
  { word: 'cat', category: 'Animals', difficulty: 'easy' },
  { word: 'dog', category: 'Animals', difficulty: 'easy' },
  { word: 'fish', category: 'Animals', difficulty: 'easy' },
  { word: 'bird', category: 'Animals', difficulty: 'easy' },
  { word: 'cow', category: 'Animals', difficulty: 'easy' },
  { word: 'pig', category: 'Animals', difficulty: 'easy' },
  { word: 'duck', category: 'Animals', difficulty: 'easy' },
  { word: 'frog', category: 'Animals', difficulty: 'easy' },
  { word: 'horse', category: 'Animals', difficulty: 'easy' },
  { word: 'sheep', category: 'Animals', difficulty: 'easy' },
  { word: 'rabbit', category: 'Animals', difficulty: 'easy' },
  { word: 'turtle', category: 'Animals', difficulty: 'easy' },
  { word: 'elephant', category: 'Animals', difficulty: 'medium' },
  { word: 'giraffe', category: 'Animals', difficulty: 'medium' },
  { word: 'penguin', category: 'Animals', difficulty: 'medium' },
  { word: 'dolphin', category: 'Animals', difficulty: 'medium' },
  { word: 'butterfly', category: 'Animals', difficulty: 'medium' },
  { word: 'crocodile', category: 'Animals', difficulty: 'medium' },
  { word: 'kangaroo', category: 'Animals', difficulty: 'medium' },
  { word: 'octopus', category: 'Animals', difficulty: 'medium' },
  { word: 'flamingo', category: 'Animals', difficulty: 'hard' },
  { word: 'chameleon', category: 'Animals', difficulty: 'hard' },
  { word: 'platypus', category: 'Animals', difficulty: 'hard' },

  // Food
  { word: 'pizza', category: 'Food', difficulty: 'easy' },
  { word: 'cake', category: 'Food', difficulty: 'easy' },
  { word: 'apple', category: 'Food', difficulty: 'easy' },
  { word: 'banana', category: 'Food', difficulty: 'easy' },
  { word: 'burger', category: 'Food', difficulty: 'easy' },
  { word: 'bread', category: 'Food', difficulty: 'easy' },
  { word: 'egg', category: 'Food', difficulty: 'easy' },
  { word: 'ice cream', category: 'Food', difficulty: 'easy' },
  { word: 'cookie', category: 'Food', difficulty: 'easy' },
  { word: 'hotdog', category: 'Food', difficulty: 'easy' },
  { word: 'taco', category: 'Food', difficulty: 'easy' },
  { word: 'sushi', category: 'Food', difficulty: 'medium' },
  { word: 'popcorn', category: 'Food', difficulty: 'medium' },
  { word: 'waffle', category: 'Food', difficulty: 'medium' },
  { word: 'donut', category: 'Food', difficulty: 'easy' },
  { word: 'sandwich', category: 'Food', difficulty: 'medium' },
  { word: 'watermelon', category: 'Food', difficulty: 'medium' },
  { word: 'strawberry', category: 'Food', difficulty: 'medium' },
  { word: 'broccoli', category: 'Food', difficulty: 'medium' },
  { word: 'pancake', category: 'Food', difficulty: 'medium' },
  { word: 'pineapple', category: 'Food', difficulty: 'medium' },
  { word: 'pretzel', category: 'Food', difficulty: 'hard' },
  { word: 'croissant', category: 'Food', difficulty: 'hard' },

  // Objects
  { word: 'house', category: 'Objects', difficulty: 'easy' },
  { word: 'car', category: 'Objects', difficulty: 'easy' },
  { word: 'tree', category: 'Objects', difficulty: 'easy' },
  { word: 'sun', category: 'Objects', difficulty: 'easy' },
  { word: 'star', category: 'Objects', difficulty: 'easy' },
  { word: 'moon', category: 'Objects', difficulty: 'easy' },
  { word: 'cloud', category: 'Objects', difficulty: 'easy' },
  { word: 'flower', category: 'Objects', difficulty: 'easy' },
  { word: 'book', category: 'Objects', difficulty: 'easy' },
  { word: 'hat', category: 'Objects', difficulty: 'easy' },
  { word: 'shoe', category: 'Objects', difficulty: 'easy' },
  { word: 'clock', category: 'Objects', difficulty: 'easy' },
  { word: 'chair', category: 'Objects', difficulty: 'easy' },
  { word: 'key', category: 'Objects', difficulty: 'easy' },
  { word: 'lamp', category: 'Objects', difficulty: 'easy' },
  { word: 'guitar', category: 'Objects', difficulty: 'medium' },
  { word: 'umbrella', category: 'Objects', difficulty: 'medium' },
  { word: 'bicycle', category: 'Objects', difficulty: 'medium' },
  { word: 'telescope', category: 'Objects', difficulty: 'medium' },
  { word: 'lighthouse', category: 'Objects', difficulty: 'medium' },
  { word: 'candle', category: 'Objects', difficulty: 'easy' },
  { word: 'ladder', category: 'Objects', difficulty: 'medium' },
  { word: 'magnet', category: 'Objects', difficulty: 'medium' },
  { word: 'scissors', category: 'Objects', difficulty: 'medium' },
  { word: 'compass', category: 'Objects', difficulty: 'hard' },
  { word: 'hourglass', category: 'Objects', difficulty: 'hard' },
  { word: 'microscope', category: 'Objects', difficulty: 'hard' },

  // Nature
  { word: 'rainbow', category: 'Nature', difficulty: 'easy' },
  { word: 'volcano', category: 'Nature', difficulty: 'medium' },
  { word: 'snowflake', category: 'Nature', difficulty: 'medium' },
  { word: 'tornado', category: 'Nature', difficulty: 'medium' },
  { word: 'waterfall', category: 'Nature', difficulty: 'medium' },
  { word: 'desert', category: 'Nature', difficulty: 'medium' },
  { word: 'island', category: 'Nature', difficulty: 'easy' },
  { word: 'mountain', category: 'Nature', difficulty: 'easy' },
  { word: 'river', category: 'Nature', difficulty: 'easy' },
  { word: 'forest', category: 'Nature', difficulty: 'easy' },
  { word: 'cave', category: 'Nature', difficulty: 'easy' },
  { word: 'glacier', category: 'Nature', difficulty: 'hard' },
  { word: 'canyon', category: 'Nature', difficulty: 'hard' },

  // Actions
  { word: 'sleeping', category: 'Actions', difficulty: 'easy' },
  { word: 'swimming', category: 'Actions', difficulty: 'easy' },
  { word: 'running', category: 'Actions', difficulty: 'easy' },
  { word: 'jumping', category: 'Actions', difficulty: 'easy' },
  { word: 'dancing', category: 'Actions', difficulty: 'medium' },
  { word: 'cooking', category: 'Actions', difficulty: 'medium' },
  { word: 'painting', category: 'Actions', difficulty: 'medium' },
  { word: 'reading', category: 'Actions', difficulty: 'medium' },
  { word: 'surfing', category: 'Actions', difficulty: 'medium' },
  { word: 'climbing', category: 'Actions', difficulty: 'medium' },
  { word: 'fishing', category: 'Actions', difficulty: 'easy' },
  { word: 'flying', category: 'Actions', difficulty: 'easy' },
  { word: 'skating', category: 'Actions', difficulty: 'medium' },
  { word: 'sneezing', category: 'Actions', difficulty: 'hard' },
  { word: 'yawning', category: 'Actions', difficulty: 'hard' },

  // Places
  { word: 'school', category: 'Places', difficulty: 'easy' },
  { word: 'hospital', category: 'Places', difficulty: 'easy' },
  { word: 'beach', category: 'Places', difficulty: 'easy' },
  { word: 'castle', category: 'Places', difficulty: 'medium' },
  { word: 'library', category: 'Places', difficulty: 'medium' },
  { word: 'airport', category: 'Places', difficulty: 'medium' },
  { word: 'circus', category: 'Places', difficulty: 'medium' },
  { word: 'farm', category: 'Places', difficulty: 'easy' },
  { word: 'zoo', category: 'Places', difficulty: 'easy' },
  { word: 'museum', category: 'Places', difficulty: 'medium' },
  { word: 'stadium', category: 'Places', difficulty: 'medium' },
  { word: 'jungle', category: 'Places', difficulty: 'easy' },
  { word: 'igloo', category: 'Places', difficulty: 'medium' },
  { word: 'pyramid', category: 'Places', difficulty: 'medium' },
  { word: 'windmill', category: 'Places', difficulty: 'hard' },

  // Fantasy / Fun
  { word: 'dragon', category: 'Fantasy', difficulty: 'medium' },
  { word: 'wizard', category: 'Fantasy', difficulty: 'medium' },
  { word: 'mermaid', category: 'Fantasy', difficulty: 'medium' },
  { word: 'unicorn', category: 'Fantasy', difficulty: 'easy' },
  { word: 'robot', category: 'Fantasy', difficulty: 'medium' },
  { word: 'alien', category: 'Fantasy', difficulty: 'medium' },
  { word: 'ghost', category: 'Fantasy', difficulty: 'easy' },
  { word: 'vampire', category: 'Fantasy', difficulty: 'medium' },
  { word: 'zombie', category: 'Fantasy', difficulty: 'medium' },
  { word: 'pirate', category: 'Fantasy', difficulty: 'medium' },
  { word: 'ninja', category: 'Fantasy', difficulty: 'medium' },
  { word: 'astronaut', category: 'Fantasy', difficulty: 'medium' },
  { word: 'superhero', category: 'Fantasy', difficulty: 'hard' },
  { word: 'treasure', category: 'Fantasy', difficulty: 'medium' },

  // Sports
  { word: 'football', category: 'Sports', difficulty: 'easy' },
  { word: 'basketball', category: 'Sports', difficulty: 'easy' },
  { word: 'tennis', category: 'Sports', difficulty: 'easy' },
  { word: 'baseball', category: 'Sports', difficulty: 'easy' },
  { word: 'bowling', category: 'Sports', difficulty: 'easy' },
  { word: 'golf', category: 'Sports', difficulty: 'easy' },
  { word: 'skiing', category: 'Sports', difficulty: 'medium' },
  { word: 'skateboard', category: 'Sports', difficulty: 'medium' },
  { word: 'weightlifting', category: 'Sports', difficulty: 'hard' },
  { word: 'archery', category: 'Sports', difficulty: 'hard' },
];

/** Pick N unique random word entries, biased toward different categories */
export function getSketchioWordChoices(n: number = 3): WordEntry[] {
  const pool = [...SKETCHIO_WORDS];
  const picks: WordEntry[] = [];
  const usedCategories = new Set<string>();

  // First pass: try to get diverse categories
  const shuffled = pool.sort(() => Math.random() - 0.5);
  for (const entry of shuffled) {
    if (picks.length >= n) break;
    if (!usedCategories.has(entry.category)) {
      picks.push(entry);
      usedCategories.add(entry.category);
    }
  }

  // Fill remaining slots if needed
  for (const entry of shuffled) {
    if (picks.length >= n) break;
    if (!picks.includes(entry)) picks.push(entry);
  }

  return picks.slice(0, n);
}

/** Normalise a guess for comparison (lowercase, trim, collapse spaces) */
export function normaliseGuess(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, ' ');
}

/** Return true if guess matches the word (allows minor typos via proximity check) */
export function isSketchioGuessCorrect(guess: string, word: string): boolean {
  const g = normaliseGuess(guess);
  const w = normaliseGuess(word);
  if (g === w) return true;

  // Allow off-by-one for words > 4 chars (simple Levenshtein distance = 1)
  if (w.length > 4 && levenshtein(g, w) === 1) return true;
  return false;
}

/** Private "that's close!" cue — not a correct guess */
export function isSketchioGuessClose(guess: string, word: string): boolean {
  const g = normaliseGuess(guess);
  const w = normaliseGuess(word);
  if (!g || g === w) return false;
  if (w.length >= 5 && (g.includes(w) || w.includes(g))) return true;
  const dist = levenshtein(g, w);
  if (w.length <= 4) return dist === 1;
  return dist > 1 && dist <= 2;
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) => (i === 0 ? j : j === 0 ? i : 0))
  );
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}
