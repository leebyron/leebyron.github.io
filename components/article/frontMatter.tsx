import { frontMatter } from './allFrontMatter'

export type FrontMatter = {
  __resourcePath: string
  slug: string,
  title: string
  date: Date
  dateModified?: Date
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
      _bySlug[matter.slug] = matter
    }
  }
  return _bySlug
}

export function getBySlug(slug: string): FrontMatter | undefined {
  return allBySlug()[slug]
}
