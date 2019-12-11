import { FrontMatter } from './frontMatter'

export const CANONICAL_HOST = 'https://leebyron.com'
export const SHARE_HOST = 'https://lwb.io'
export const API_HOST =
  process.env.NODE_ENV === 'production' ||
  (typeof window === 'object' &&
    window.location.href.indexOf(CANONICAL_HOST) === 0)
    ? 'https://lwb.io'
    : typeof window === 'object'
    ? ''
    : 'http://localhost:3000'

export function canonicalURL(frontMatter: FrontMatter): string {
  return `${CANONICAL_HOST}/${frontMatter.slug}/`
}

export function shareURL(frontMatter: FrontMatter, selection?: string): string {
  return selection
    ? `${SHARE_HOST}/${frontMatter.slug}/?$=${selection}`
    : canonicalURL(frontMatter)
}

export function shareImageURL(frontMatter: FrontMatter, selection?: string) {
  return (
    `${API_HOST}/api/article/${encodeURIComponent(frontMatter.slug)}/snap` +
    (selection ? '?selection=' + selection : '')
  )
}

export function twitterShareURL(frontMatter: FrontMatter): string {
  const tweet = `${frontMatter.title} by @leeb ${shareURL(frontMatter)}`
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`
}

export function facebookShareURL(
  frontMatter: FrontMatter,
  selection?: string
): string {
  return (
    `https://www.facebook.com/v3.3/dialog/share?display=page` +
    `&app_id=46273233281` +
    `&href=${encodeURIComponent(shareURL(frontMatter, selection))}` +
    `&redirect_uri=${encodeURIComponent(canonicalURL(frontMatter))}`
    // &quote=
  )
}

export function canNativeShare(): boolean {
  return (
    typeof navigator === 'object' &&
    typeof (navigator as any).share === 'function' &&
    (typeof (navigator as any).canShare !== 'function' ||
      (navigator as any).canShare() === true)
  )
}

export function nativeShare(data: {
  title?: string
  text?: string
  url: string
}): Promise<void> {
  return (navigator as any).share(data)
}
