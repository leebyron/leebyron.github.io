import { useCallback, useRef } from 'react'
import { FrontMatter } from './frontMatter'
import { copyToClipboard } from './clipboardUtil'
import {
  canonicalURL,
  twitterShareURL,
  facebookShareURL,
  canNativeShare,
  nativeShare
} from './shareUtil'
import Toaster, { ToastRef } from './Toaster'
import FacebookSVG from '../svg/FacebookSVG'
import TwitterSVG from '../svg/TwitterSVG'
import LinkSVG from '../svg/LinkSVG'

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
          margin: 0 -0.4em;
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

        .actions :global(svg):hover {
          fill: black;
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
