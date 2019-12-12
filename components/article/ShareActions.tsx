import { useCallback, useRef } from 'react'
import { FrontMatter } from './frontMatter'
import { copyToClipboard } from './clipboardUtil'
import {
  canonicalURL,
  twitterShareURL,
  facebookShareURL,
  canNativeShare,
  nativeShare,
  twitterTitleTweet
} from './shareUtil'
import Toaster, { ToastRef } from './Toaster'
import FacebookSVG from '../svg/FacebookSVG'
import TwitterSVG from '../svg/TwitterSVG'
import LinkSVG from '../svg/LinkSVG'
import { isAlternateClick } from './isAlterateClick'

export function ShareActions({ frontMatter }: { frontMatter: FrontMatter }) {
  const toaster = useRef<ToastRef>()
  const onClickShareLink = useCallback(event => {
    // Allow right-click and command-click to behave as normal.
    if (isAlternateClick(event)) {
      return
    }
    event.preventDefault()
    if (canNativeShare()) {
      nativeShare({
        title: frontMatter.title,
        text: `“${frontMatter.title}” by Lee Byron`,
        url: canonicalURL(frontMatter.slug)
      }).then(
        () => {
          toaster.current && toaster.current.toast('Shared')
        },
        (error: Error) => {
          if (error.name !== 'AbortError') {
            throw error
          }
        }
      )
    } else {
      copyToClipboard(canonicalURL(frontMatter.slug))
      toaster.current && toaster.current.toast('Link Copied')
    }
  }, [])

  return (
    <div className="share">
      <style jsx>{`
        .share {
          position: relative;
          margin: 0 -0.5em;
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
          display: block;
          fill: #444;
          height: 2em;
          margin: 0 0.3em;
          width: 2em;
        }

        @media screen and (max-width: 600px) {
          .actions :global(svg) {
            height: 1.7em;
            width: 1.7em;
          }
        }

        .actions :global(svg):hover {
          fill: black;
        }
      `}</style>
      <Toaster ref={toaster} />
      <div className="actions">
        <a
          target="_blank"
          href={twitterShareURL(
            twitterTitleTweet(frontMatter.slug, frontMatter.title)
          )}
        >
          <TwitterSVG />
        </a>
        <a target="_blank" href={facebookShareURL(frontMatter.slug)}>
          <FacebookSVG />
        </a>
        <a href={canonicalURL(frontMatter.slug)} onClick={onClickShareLink}>
          <LinkSVG />
        </a>
      </div>
    </div>
  )
}