const warnings = new Set<string>()

export function warn(warning: string) {
  if (!warnings.has(warning)) {
    warnings.add(warning)
    console.warn(warning)
  }
}
