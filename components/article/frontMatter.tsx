// @ts-ignore
import { frontMatter } from '../../pages/**/*.mdx'

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

const allFrontMatter = frontMatter as FrontMatter[]

export function publishedFrontMatter(): FrontMatter[] {
  return allFrontMatter
    .filter(fm => fm.published)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
}

let _bySlug: { [slug: string]: FrontMatter } | undefined
function allBySlug(): { [slug: string]: FrontMatter } {
  if (!_bySlug) {
    _bySlug = {}
    for (const matter of allFrontMatter) {
      _bySlug[matter.slug] = matter
    }
  }
  return _bySlug
}

export function getBySlug(slug: string): FrontMatter | undefined {
  return allBySlug()[slug]
}
