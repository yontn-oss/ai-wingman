/**
 * Converts a file path (relative to project root) to an import path
 * using the project's path alias (e.g. `@/` or `~/`).
 *
 * Examples:
 *   toImportPath('src/lib/storage.ts', '@/')  → '@/lib/storage'
 *   toImportPath('lib/storage.ts', '@/')       → '@/lib/storage'
 */
export function toImportPath(filePath: string, pathAlias: string): string {
  const withoutExt = filePath.replace(/\.tsx?$/, '')
  const withoutSrc = withoutExt.replace(/^src\//, '')
  return pathAlias + withoutSrc
}
