import { frontMatter } from './allFrontMatter'

export type FrontMatter = {
  __resourcePath: string
  slug: string
  title: string
  synopsis: string
  date: Date | string
  dateModified?: Date | string
  wordCount: number
  tags?: Array<string>
  published?: boolean
  medium?: string
}

export function allFrontMatter(): FrontMatter[] {
  return (frontMatter as FrontMatter[])
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : -1))
}

let _bySlug: { [slug: string]: FrontMatter } | undefined
export function allBySlug(): { [slug: string]: FrontMatter } {
  if (!_bySlug) {
    _bySlug = {}
    for (const matter of frontMatter as FrontMatter[]) {
      _bySlug[matter.slug] = matter
    }
  }
  return _bySlug
}

export function getBySlug(slug: string): FrontMatter | undefined {
  return allBySlug()[slug]
}
