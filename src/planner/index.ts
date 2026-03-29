import type { ExecutionPlan, Pattern, PlanEntry } from '../types.js'

/** Aggregates plan entries and deduplicates packages across all patterns. */
export function buildPlan(
  items: Array<{ pattern: Pattern; config: unknown }>
): ExecutionPlan {
  const entries: PlanEntry[] = []
  const packages = new Set<string>()
  const groups: ExecutionPlan['groups'] = []

  for (const { pattern, config } of items) {
    const patternEntries = pattern.getPlanEntries(config)
    entries.push(...patternEntries)
    groups.push({ patternId: pattern.id, entries: patternEntries })
    for (const pkg of pattern.getPackages(config)) {
      packages.add(pkg)
    }
  }

  return { entries, packages: Array.from(packages), groups }
}
