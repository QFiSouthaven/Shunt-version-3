
// services/TokenMiddleware.ts

/**
 * TOKEN EFFICIENCY MIDDLEWARE
 * Implements "Zero Fluff" principles to maximize information density per token.
 */

const SCHEMA_MAP: Record<string, string> = {
  "id": "i",
  "name": "n",
  "role": "r",
  "description": "d",
  "status": "s",
  "content": "c",
  "instruction": "in",
  "timestamp": "t",
  "metadata": "m",
  "version": "v",
  "capabilities": "cap",
  "priority": "p"
};

const REVERSE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(SCHEMA_MAP).map(([k, v]) => [v, k])
);

export const TokenMiddleware = {
  /**
   * Minifies JSON by aliasing keys and pruning nulls/defaults.
   * Implementation of Step 1 & 3 of the Protocol.
   */
  compress: (obj: any): any => {
    if (!obj || typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
      // Step 2: Convert Object Arrays to Tuple Arrays if applicable
      if (obj.length > 2 && typeof obj[0] === 'object' && !Array.isArray(obj[0])) {
        const keys = Object.keys(obj[0]);
        const data = obj.map(item => keys.map(k => TokenMiddleware.compress(item[k])));
        return { k: keys.map(k => SCHEMA_MAP[k] || k), d: data };
      }
      return obj.map(TokenMiddleware.compress);
    }

    const compressed: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      // Step 3: Prune Nulls and Defaults
      if (value === null || value === undefined || value === "" || (Array.isArray(value) && value.length === 0)) {
        continue;
      }

      const aliasedKey = SCHEMA_MAP[key] || key;
      compressed[aliasedKey] = TokenMiddleware.compress(value);
    }
    return compressed;
  },

  /**
   * Rehydrates compressed JSON into full domain objects.
   */
  decompress: (obj: any): any => {
    if (!obj || typeof obj !== 'object') return obj;

    if (Array.isArray(obj)) {
      return obj.map(TokenMiddleware.decompress);
    }

    // Handle Tuple Arrays (Step 2 reverse)
    if (obj.k && obj.d && Array.isArray(obj.k) && Array.isArray(obj.d)) {
      const keys = obj.k.map((k: string) => REVERSE_MAP[k] || k);
      return obj.d.map((row: any[]) => {
        const item: any = {};
        keys.forEach((k: string, i: number) => {
          item[k] = TokenMiddleware.decompress(row[i]);
        });
        return item;
      });
    }

    const decompressed: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      const fullKey = REVERSE_MAP[key] || key;
      decompressed[fullKey] = TokenMiddleware.decompress(value);
    }
    return decompressed;
  },

  /**
   * Implementation of Step 5: Whitespace Minification for code snippets.
   */
  minifyCode: (code: string): string => {
    return code
      .replace(/\/\/.*$/gm, '') // Remove single line comments
      .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
      .replace(/\s+/g, ' ') // Collapse whitespace
      .trim();
  }
};
