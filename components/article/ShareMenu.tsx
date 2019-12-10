import { useCallback, useRef } from 'react'

import { FrontMatter, getSlug } from './frontMatter'
import FacebookSVG from '../svg/FacebookSVG'
import TwitterSVG from '../svg/TwitterSVG'
import LinkSVG from '../svg/LinkSVG'
import Toaster, { ToastRef } from './Toaster'

const CANONICAL_HOST = 'https://leebyron.com'
const SHARE_HOST = 'https://lwb.io'

export function ShareMenu({ frontMatter }: { frontMatter: FrontMatter }) {
  const toaster = useRef<ToastRef>()
  const onClickShareLink = useCallback(event => {
    event.preventDefault()
    if (canNativeShare()) {
      nativeShare({
        title: frontMatter.title,
        url: canonicalURL(frontMatter)
      }).then(
        () => {
          toaster.current && toaster.current.toast('Shared')
        },
        (error: Error) => {
          if (error.name !== 'AbortError') {
            console.error(error)
          }
        }
      )
    } else {
      copyToClipboard(canonicalURL(frontMatter))
      toaster.current && toaster.current.toast('Link Copied')
    }
  }, [])

  return (
    <div className="share">
      <style jsx>{`
        .share {
          position: relative;
        }

        .actions {
          background: white;
          display: flex;
          position: relative;
        }

        .actions > a {
          display: block;
        }

        .actions :global(svg) {
          fill: #222;
          height: 2em;
          margin: 0.2em;
          width: 2em;
        }

        @media screen and (max-width: 600px) {
          h1 {
            font-size: 2em;
            margin-top: 2rem;
          }

          .actions :global(svg) {
            height: 1.8em;
            width: 1.8em;
          }
        }
      `}</style>
      <Toaster ref={toaster} />
      <div className="actions">
        <a target="_blank" href={twitterShareURL(frontMatter)}>
          <TwitterSVG />
        </a>
        <a target="_blank" href={facebookShareURL(frontMatter)}>
          <FacebookSVG />
        </a>
        <a href={canonicalURL(frontMatter)} onClick={onClickShareLink}>
          <LinkSVG />
        </a>
      </div>
    </div>
  )
}

function canNativeShare() {
  return (
    typeof navigator === 'object' &&
    typeof (navigator as any).share === 'function' &&
    (typeof (navigator as any).canShare !== 'function' ||
      (navigator as any).canShare() === true)
  )
}

function nativeShare(data: {
  title?: string
  text?: string
  url: string
}): Promise<void> {
  return (navigator as any).share(data)
}

function copyToClipboard(content: string) {
  const selection = document.getSelection()
  if (selection) {
    const prevRange = !selection.isCollapsed && selection.getRangeAt(0)
    const textarea = document.createElement('textarea')
    textarea.value = content
    textarea.setAttribute('readonly', '')
    textarea.style.userSelect = 'all'
    textarea.style.position = 'absolute'
    textarea.style.top = '-9999px'
    document.body.appendChild(textarea)
    textarea.select()
    document.execCommand('copy')
    document.body.removeChild(textarea)
    if (prevRange) {
      selection.removeAllRanges()
      selection.addRange(prevRange)
    }
  }
}

function canonicalURL(frontMatter: FrontMatter): string {
  return `${CANONICAL_HOST}/${getSlug(frontMatter)}/`
}

function twitterShareURL(frontMatter: FrontMatter): string {
  const tweet = `${frontMatter.title} by @leeb ${shareURL(frontMatter)}`
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweet)}`
}

function facebookShareURL(
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

function shareURL(frontMatter: FrontMatter, selection?: string): string {
  return (
    `${SHARE_HOST}/${getSlug(frontMatter)}` +
    (selection ? '?$=' + selection : '')
  )
}
