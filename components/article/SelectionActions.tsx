import { useLayoutEffect, useRef, useState } from 'react'
import { useCopyEffect } from './clipboardUtil'
import { getCurrentRange, isSameRange } from './selectionUtil'
import Toaster, { ToastRef } from './Toaster'
import { useWindowSize } from '../useWindowSize'
import CopySVG from '../svg/CopySVG'
import LinkSVG from '../svg/LinkSVG'
import TwitterSVG from '../svg/TwitterSVG'

export function SelectionActions({
  encoded,
  decoded,
  createShareLink
}: {
  encoded: string
  decoded: { range: Range; isOutdated: boolean }
  createShareLink: (encoded: string) => string
}) {
  const toaster = useRef<ToastRef>()
  const copyToClipboard = useCopyEffect<boolean>(copyLinkOnly => {
    if (isSameRange(getCurrentRange(), decoded.range)) {
      if (copyLinkOnly) {
        toaster.current && toaster.current.toast('Copied Link')
        return createShareLink(encoded)
      } else {
        toaster.current && toaster.current.toast('Copied Quote')
        return createShareText(encoded, decoded, createShareLink)
      }
    }
  })

  const actionsRef = useRef<HTMLDivElement | null>(null)
  const { width, height } = useWindowSize()
  useLayoutEffect(() => {
    const elem = actionsRef.current
    if (elem) {
      const { top, left, right } = decoded.range.getBoundingClientRect()
      elem.style.top = `${window.scrollY + top}px`
      elem.style.left = `${window.scrollX + (left + right) / 2}px`
    }
  }, [encoded, width, height])

  return (
    <div
      ref={actionsRef}
      className={decoded.isOutdated ? 'outdated rangeActions' : 'rangeActions'}
    >
      <style jsx>{`
        .rangeActions {
          animation: 0.25s ease-out 0.85s both actionsFadeIn;
          margin-top: -2.7em;
          position: absolute;
          transform: translateX(-50%);
        }
        .actions {
          background: black;
          border-radius: 3px;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.25);
          color: #666;
          display: flex;
          padding: 0.3em 0.6em 0.4em;
          position: relative;
        }
        .actions :global(svg) {
          width: 1.6em;
          display: block;
        }
        .actions a {
          margin: 0 0.25em;
          fill: white;
          color: white;
          line-height: 1;
          text-decoration: none;
        }
        .actions a:hover {
          text-decoration: underline;
        }
        .actions:after {
          background: black;
          bottom: -0.375em;
          content: '';
          display: block;
          height: 0.75em;
          left: 0;
          margin-left: 50%;
          position: absolute;
          transform: translateX(-50%) rotate(45deg);
          width: 0.75em;
        }
        .outdated {
          background: red;
        }
        @keyframes actionsFadeIn {
          from {
            opacity: 0;
            transform: translate(-50%, 7px) scale(0.93);
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
      <Toaster ref={toaster} />
      <div className="actions">
        <a
          href={createTwitterLink(encoded, decoded, createShareLink)}
          target="_blank"
        >
          <TwitterSVG />
        </a>
        <a
          href="#"
          onClick={event => {
            copyToClipboard(false)
            event.preventDefault()
          }}
        >
          <CopySVG />
        </a>
        <a
          href={createShareLink(encoded)}
          onClick={event => {
            copyToClipboard(true)
            event.preventDefault()
          }}
        >
          <LinkSVG />
        </a>
      </div>
    </div>
  )
}

// TODO: move to shareLinks
function createTwitterLink(
  encoded: string,
  decoded: { range: Range; isOutdated: boolean },
  createShareLink: (encoded: string) => string
) {
  return `https://twitter.com/intent/tweet?text=${encodeURIComponent(
    createShareText(encoded, decoded, createShareLink, 250)
  )}`
}

function createShareText(
  encoded: string,
  decoded: { range: Range; isOutdated: boolean },
  createShareLink: (encoded: string) => string,
  maxLength?: number
) {
  let quote = decoded.range.toString()
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
  const shareLink = createShareLink(encoded)
  return `“${quote}” — @leeb ${shareLink}`
}
