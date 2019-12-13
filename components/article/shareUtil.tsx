import { Children, isValidElement, ReactNode } from 'react'

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

export function canonicalURL(articleSlug: string): string {
  return `${CANONICAL_HOST}/${articleSlug}/`
}

export function shareURL(articleSlug: string, selection?: string): string {
  return selection
    ? `${SHARE_HOST}/${articleSlug}/?$=${selection}`
    : canonicalURL(articleSlug)
}

type Image = { src: string; width?: number; height?: number; mime?: string }

export function shareImage(
  markdown: ReactNode,
  articleSlug: string,
  selection?: string
): Image {
  const screenshot = {
    src:
      `${API_HOST}/api/article/${encodeURIComponent(articleSlug)}/snap` +
      (selection ? '?selection=' + selection : ''),
    width: 900,
    height: 470,
    mime: 'image/png'
  }
  return selection ? screenshot : heroImage(markdown) || screenshot
}

export function heroImage(markdown: ReactNode): Image | undefined {
  let src: string | undefined
  let width: number | undefined
  let height: number | undefined
  Children.forEach(markdown, child => {
    if (isValidElement(child) && child.props.hero && !src) {
      src = CANONICAL_HOST + child.props.src
      width = child.props.width
      height = child.props.height
    }
  })
  if (src) {
    const ext = src.split('.').pop()
    const mime = `image/${ext === 'jpg' ? 'jpeg' : ext}`
    return { src, width, height, mime }
  }
}

export function twitterTitleTweet(articleSlug: string, title: string): string {
  return `“${title}” by @leeb ${canonicalURL(articleSlug)}`
}

export function twitterQuoteTweet(
  articleSlug: string,
  selection: string,
  selectedText: string
): string {
  const quote = selectedQuote(selectedText, 250)
  return `${quote} — @leeb ${shareURL(articleSlug, selection)}`
}

export function twitterShareURL(tweet: string): string {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`
}

export function facebookShareURL(
  articleSlug: string,
  selection?: string
): string {
  return (
    `https://www.facebook.com/v3.3/dialog/share?display=page` +
    `&app_id=46273233281` +
    `&href=${encodeURIComponent(shareURL(articleSlug, selection))}` +
    `&redirect_uri=${encodeURIComponent(canonicalURL(articleSlug))}`
  )
}

export function selectedQuote(
  selectedText: string,
  maxLength?: number
): string {
  let quote = selectedText
  if (maxLength && quote.length > maxLength) {
    const words = quote.split(/(?=\s)/g)
    quote = ''
    for (const word of words) {
      if (quote.length + word.length >= maxLength) {
        break
      }
      quote += word
    }
    quote += '…'
  }
  return `“${quote.trim()}”`
}

export function canNativeShare(): boolean {
  return (
    typeof navigator === 'object' &&
    /iPhone|iPad|iOS|Android/.test(navigator.userAgent) &&
    typeof (navigator as any).share === 'function' &&
    (typeof (navigator as any).canShare !== 'function' ||
      (navigator as any).canShare() === true)
  )
}

export function nativeShare(data: {
  title?: string
  text?: string
  url?: string
}): Promise<void> {
  return (navigator as any).share(data).catch((error: Error) => {
    if (error.name !== 'AbortError') {
      console.error(error)
    }
  })
}
