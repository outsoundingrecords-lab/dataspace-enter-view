export interface FuzzyMatchResult {
  matched: boolean;
  score: number; // 0 to 1, higher is better
  matchedIndices: number[]; // Distinct sorted character indices in target
  matchType: 'exact' | 'prefix' | 'substring' | 'subsequence' | 'transposition' | 'levenshtein';
}

/**
 * Calculates Damerau-Levenshtein distance (allows insertion, deletion, substitution, and adjacent transposition).
 */
export function damerauLevenshtein(a: string, b: string): number {
  const al = a.length;
  const bl = b.length;
  if (al === 0) return bl;
  if (bl === 0) return al;

  const matrix: number[][] = Array.from({ length: al + 1 }, () => new Array(bl + 1).fill(0));

  for (let i = 0; i <= al; i++) matrix[i][0] = i;
  for (let j = 0; j <= bl; j++) matrix[0][j] = j;

  for (let i = 1; i <= al; i++) {
    for (let j = 1; j <= bl; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );

      // Transposition
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        matrix[i][j] = Math.min(matrix[i][j], matrix[i - 2][j - 2] + 1);
      }
    }
  }

  return matrix[al][bl];
}

/**
 * Performs approximate string matching on a target string.
 * Supports:
 * - Exact match (score 1.0)
 * - Prefix match (score 0.95)
 * - Substring match with word-boundary bonus (score 0.85 - 0.90)
 * - Subsequence matching (e.g. cfgjson -> config.json) (score 0.70 - 0.85)
 * - Transposition matching (score 0.65)
 * - Levenshtein typo tolerance (score 0.50 - 0.60)
 */
export function fuzzyMatchString(query: string, target: string): FuzzyMatchResult | null {
  if (!query || !target) return null;

  const q = query.trim().toLowerCase();
  const t = target.toLowerCase();

  if (q.length === 0) return null;

  // 1. Exact Match
  if (t === q) {
    const indices: number[] = [];
    for (let i = 0; i < target.length; i++) indices.push(i);
    return {
      matched: true,
      score: 1.0,
      matchedIndices: indices,
      matchType: 'exact',
    };
  }

  // 2. Prefix Match
  if (t.startsWith(q)) {
    const indices: number[] = [];
    for (let i = 0; i < q.length; i++) indices.push(i);
    const score = 0.95 - (target.length - q.length) * 0.0005;
    return {
      matched: true,
      score: Math.max(0.91, score),
      matchedIndices: indices,
      matchType: 'prefix',
    };
  }

  // 3. Substring Match
  const subIdx = t.indexOf(q);
  if (subIdx !== -1) {
    const indices: number[] = [];
    for (let i = 0; i < q.length; i++) indices.push(subIdx + i);

    // Word boundary bonus if preceded by separator
    const isWordStart = subIdx === 0 || /[-_./\s\\]/.test(t[subIdx - 1]);
    const score = isWordStart ? 0.90 : 0.85 - (subIdx * 0.001);
    return {
      matched: true,
      score: Math.max(0.82, score),
      matchedIndices: indices,
      matchType: 'substring',
    };
  }

  // 4. Subsequence Matching (supports non-consecutive characters like 'cfgjson' matching 'config.json')
  let qIdx = 0;
  const subseqIndices: number[] = [];

  for (let i = 0; i < t.length && qIdx < q.length; i++) {
    if (t[i] === q[qIdx]) {
      subseqIndices.push(i);
      qIdx++;
    }
  }

  if (qIdx === q.length) {
    // Matched all query characters in sequence!
    const span = subseqIndices[subseqIndices.length - 1] - subseqIndices[0] + 1;
    const compactness = q.length / span; // 1.0 if contiguous

    // Adjacent character bonus
    let adjacentBonus = 0;
    for (let j = 1; j < subseqIndices.length; j++) {
      if (subseqIndices[j] === subseqIndices[j - 1] + 1) {
        adjacentBonus += 0.02;
      }
    }

    // Word boundary start bonus
    let boundaryBonus = 0;
    for (const idx of subseqIndices) {
      if (idx === 0 || /[-_./\s\\]/.test(t[idx - 1])) {
        boundaryBonus += 0.025;
      }
    }

    const score = 0.70 + (compactness * 0.12) + Math.min(0.06, adjacentBonus) + Math.min(0.05, boundaryBonus);
    return {
      matched: true,
      score: Math.min(0.88, score),
      matchedIndices: subseqIndices,
      matchType: 'subsequence',
    };
  }

  // 5. Transposition Tolerance (adjacent character swap in query, e.g. 'confgi' -> 'config')
  if (q.length >= 3) {
    for (let i = 0; i < q.length - 1; i++) {
      // Swap q[i] and q[i+1]
      const transposed = q.slice(0, i) + q[i + 1] + q[i] + q.slice(i + 2);
      const transIdx = t.indexOf(transposed);
      if (transIdx !== -1) {
        const indices: number[] = [];
        for (let k = 0; k < transposed.length; k++) indices.push(transIdx + k);
        return {
          matched: true,
          score: 0.68,
          matchedIndices: indices,
          matchType: 'transposition',
        };
      }

      // Check if transposed matches as subsequence
      let tqIdx = 0;
      const transSubseqIndices: number[] = [];
      for (let j = 0; j < t.length && tqIdx < transposed.length; j++) {
        if (t[j] === transposed[tqIdx]) {
          transSubseqIndices.push(j);
          tqIdx++;
        }
      }
      if (tqIdx === transposed.length) {
        return {
          matched: true,
          score: 0.64,
          matchedIndices: transSubseqIndices,
          matchType: 'transposition',
        };
      }
    }
  }

  // 6. Typo Tolerance via Levenshtein (Missing characters / typo on words or file name)
  if (q.length >= 3) {
    // Check against individual path/filename tokens or whole filename
    const tokens = target.split(/[/\\._-]/).filter(token => token.length >= 2);
    
    // Also include the base filename
    const baseName = target.split(/[/|\\]/).pop() || '';
    if (!tokens.includes(baseName)) tokens.push(baseName);

    for (const token of tokens) {
      const lowerToken = token.toLowerCase();
      // Allow max 1 edit for 3-5 chars, max 2 edits for >= 6 chars
      const maxDistance = q.length <= 5 ? 1 : 2;
      const dist = damerauLevenshtein(q, lowerToken);

      if (dist <= maxDistance) {
        // Locate token in target string for highlight indices
        const tokenStart = t.indexOf(lowerToken);
        const indices: number[] = [];
        if (tokenStart !== -1) {
          // Highlight characters of token that match query characters
          for (let k = 0; k < lowerToken.length; k++) {
            if (q.includes(lowerToken[k])) {
              indices.push(tokenStart + k);
            }
          }
        }
        const score = 0.58 - (dist * 0.06);
        return {
          matched: true,
          score: Math.max(0.45, score),
          matchedIndices: indices.length > 0 ? indices : (tokenStart !== -1 ? [tokenStart] : []),
          matchType: 'levenshtein',
        };
      }
    }
  }

  return null;
}

export interface ScoredInventoryMatch {
  score: number;
  nameIndices?: number[];
  pathIndices?: number[];
  matchedField: 'name' | 'path' | 'category' | 'extension' | 'other';
}

/**
 * Evaluates an Inventory file against a search query using fuzzy matching.
 */
export function evaluateFuzzyMatch(
  fileName: string,
  relativePath: string,
  category: string,
  extension: string,
  query: string
): ScoredInventoryMatch | null {
  if (!query || query.trim() === '') return null;
  const q = query.trim();

  // Test 1: File name (highest priority)
  const nameMatch = fuzzyMatchString(q, fileName);
  if (nameMatch) {
    return {
      score: nameMatch.score,
      nameIndices: nameMatch.matchedIndices,
      matchedField: 'name',
    };
  }

  // Test 2: Relative path
  const pathMatch = fuzzyMatchString(q, relativePath);
  if (pathMatch) {
    // Map path indices to filename if possible
    const fileNameStart = relativePath.lastIndexOf(fileName);
    let nameIndices: number[] | undefined = undefined;
    if (fileNameStart !== -1) {
      nameIndices = pathMatch.matchedIndices
        .filter(idx => idx >= fileNameStart && idx < fileNameStart + fileName.length)
        .map(idx => idx - fileNameStart);
    }
    return {
      score: pathMatch.score * 0.9, // slight discount for path match
      pathIndices: pathMatch.matchedIndices,
      nameIndices,
      matchedField: 'path',
    };
  }

  // Test 3: Category match
  const catMatch = fuzzyMatchString(q, category);
  if (catMatch && catMatch.score >= 0.7) {
    return {
      score: catMatch.score * 0.75,
      matchedField: 'category',
    };
  }

  // Test 4: Extension match
  if (extension) {
    const extMatch = fuzzyMatchString(q, extension);
    if (extMatch && extMatch.score >= 0.7) {
      return {
        score: extMatch.score * 0.7,
        matchedField: 'extension',
      };
    }
  }

  return null;
}
