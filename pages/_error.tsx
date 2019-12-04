import Body from '../components/Body'
import Head from '../components/Head'
import { useState, useEffect, ReactNode } from 'react'

export default () => (
  <Body>
    <Head>
      <title>Whoops</title>
    </Head>
    <style jsx>{`
      .card404 h1 {
        display: block;
        margin: 1em 0;
        font-weight: normal;
        font-style: italic;
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

        -webkit-perspective: 1600px;
        perspective: 1600px;
        -webkit-transform-style: preserve-3d;
        transform-style: preserve-3d;

        -webkit-transform: translate3d(0, 0, 0);
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
      <script
        dangerouslySetInnerHTML={{
          __html: `
      (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
      (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
      m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
      })(window,document,'script','//www.google-analytics.com/analytics.js','ga');
      ga('create', 'UA-61714711-1', 'auto');
      ga('send', 'pageview');
    `
        }}
      />
    </div>
  </Body>
)

function GHIssueLink({ children }: { children: ReactNode }) {
  const [path, setPath] = useState()
  useEffect(() => setPath(document.location.pathname), [])
  const query = path ? `?title=Broken+link:+${encodeURIComponent(path)}` : ''
  return (
    <a
      href={`https://github.com/leebyron/leebyron.com/issues/new${query}`}
      target="_blank"
    >
      {children}
    </a>
  )
}
