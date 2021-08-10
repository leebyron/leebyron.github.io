import Head from 'next/head'
import { useState, useEffect, ReactNode } from 'react'

import Body from '../components/Body'

export default () => (
  <Body>
    <Head>
      <title>Whoops</title>
      <meta name="robots" content="noindex" />
      <meta
        name="description"
        content="This site has recently moved, and some links may have been broken."
      />
    </Head>
    <style jsx>{`
      .card404 h1 {
        display: block;
        font-style: italic;
        font-weight: normal;
        margin: 1em 0;
        user-select: none;
      }

      .card404 :global(a) {
        color: #505050;
        text-decoration: underline;
      }

      .card404 :global(a):hover {
        text-decoration: none;
      }

      .card {
        pointer-events: none;
        position: fixed;
        top: 0;
        left: 0;
        bottom: 0;
        right: 0;
        margin: auto;

        perspective: 1600px;
        transform-style: preserve-3d;
        transform: translate3d(0, 0, 0);

        width: 80vm;
        width: 80vmin;
        height: 44vm;
        height: 44vmin;
        max-width: 600px;
        max-height: 330px;
        min-width: 460px;
        min-height: 253px;
      }

      .card404 {
        height: 100%;
        background: white;
        box-shadow: 0 1px 8px 1px rgba(0, 0, 0, 0.2);
        box-sizing: border-box;
        padding: 1.5em;
      }

      @media screen and (max-width: 500px) {
        .card {
          width: calc(
            100vw - 4vmin - env(safe-area-inset-left) -
              env(safe-area-inset-right)
          );
          max-width: auto;
          min-width: auto;
        }
      }

      @media screen and (max-height: 300px) {
        .card {
          height: calc(
            100vh - 8vmin - env(safe-area-inset-top) -
              env(safe-area-inset-bottom)
          );
          max-height: auto;
          min-height: auto;
        }
      }
    `}</style>
    <div className="card">
      <div className="card404">
        <h1>Looking for something?</h1>
        This site has recently moved, and some links may have been broken. If
        you&apos;re looking for something here, please{' '}
        <GHIssueLink>let me know</GHIssueLink>, and I&apos;ll do my best to fix
        it.
      </div>
    </div>
  </Body>
)

function GHIssueLink({ children }: { children: ReactNode }) {
  const [path, setPath] = useState()
  useEffect(() => setPath(document.location.pathname), [])
  const query = path ? `?title=Broken+link:+${encodeURIComponent(path)}` : ''
  return (
    <a
      href={`https://github.com/leebyron/leebyron.github.io/issues/new${query}`}
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  )
}
