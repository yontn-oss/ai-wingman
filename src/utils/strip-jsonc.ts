/**
 * Strips JSONC (JSON with Comments) extras so the result can be parsed by JSON.parse.
 * Handles:
 *   - Single-line comments (//)
 *   - Block comments (/* ... *\/)
 *   - Trailing commas before } or ]
 *
 * Unlike a naive regex approach, this correctly skips comment markers that appear
 * inside string values (e.g. URLs like "https://example.com").
 */
export function stripJsonc(text: string): string {
  let result = ''
  let i = 0

  while (i < text.length) {
    // String — copy verbatim, respecting escape sequences
    if (text[i] === '"') {
      result += '"'
      i++
      while (i < text.length) {
        const c = text[i]!
        result += c
        if (c === '\\') {
          // Escaped char — include the next char too
          i++
          if (i < text.length) {
            result += text[i]!
            i++
          }
        } else if (c === '"') {
          i++
          break
        } else {
          i++
        }
      }
      continue
    }

    // Single-line comment — skip to end of line
    if (text[i] === '/' && text[i + 1] === '/') {
      while (i < text.length && text[i] !== '\n') i++
      continue
    }

    // Block comment — skip until */
    if (text[i] === '/' && text[i + 1] === '*') {
      i += 2
      while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) i++
      i += 2 // skip the closing */
      continue
    }

    result += text[i]!
    i++
  }

  // Remove trailing commas (safe now that strings and comments are handled)
  return result.replace(/,(\s*[}\]])/g, '$1')
}
