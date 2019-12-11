import { frontMatter } from './allFrontMatter'

export type FrontMatter = {
  __resourcePath: string
  title: string
  date: Date
  wordCount: number
  tags?: Array<string>
  published?: boolean
  medium?: string
}

let _bySlug: { [slug: string]: FrontMatter } | undefined
export function allBySlug(): { [slug: string]: FrontMatter } {
  if (!_bySlug) {
    _bySlug = {}
    for (const matter of frontMatter) {
      const slug = getSlug(matter)
      _bySlug[slug] = matter
    }
  }
  return _bySlug
}

export function getBySlug(slug: string): FrontMatter | undefined {
  return allBySlug()[slug]
}

export function getSlug(matter: FrontMatter): string {
  return matter.__resourcePath.split('.')[0].replace(/\/index$/, '')
}
