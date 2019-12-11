import { ReactNode } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'

import Body from './Body'
import { isMobile } from './isMobile'
import { ExplodingLogo } from './ExplodingLogo'
import { Feedback } from './article/Feedback'
import { FrontMatter, getSlug } from './article/frontMatter'
import { SelectionAnchor } from './article/SelectionAnchor'
import { canonicalURL, shareURL, shareImageURL } from './article/shareUtil'
import { ShareMenu } from './article/ShareMenu'

export default (frontMatter: FrontMatter) => ({
  children
}: {
  children: ReactNode
}) => {
  const router = useRouter()
  const initialSelection =
    typeof router.query.$ === 'string' ? router.query.$ : undefined
  const readMin = Math.round(frontMatter.wordCount / 250)
  return (
    <Body>
      <Head>
        <title>{frontMatter.title}</title>
        <link rel="canonical" href={canonicalURL(frontMatter)} />
        <meta
          property="og:url"
          content={shareURL(frontMatter, initialSelection)}
        />
        <meta property="og:type" content="article" />
        <meta
          property="article:published_time"
          content={frontMatter.date.toISOString()}
        />
        <meta property="og:title" content={frontMatter.title} />
        <meta property="og:description" content="" />
        <meta
          property="og:image"
          content={shareImageURL(frontMatter, initialSelection)}
        />
        <meta
          property="og:image:secure_url"
          content={shareImageURL(frontMatter, initialSelection)}
        />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:width" content="900" />
        <meta property="og:image:height" content="470" />
        <meta property="og:image:alt" content="" />
        <meta property="article:author" content="https://leebyron.com/" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:label1" content="Reading time" />
        <meta name="twitter:data1" content={`${readMin} min read`} />
      </Head>
      <Page>
        <style jsx>{`
          .articleLogo {
            display: block;
            display: table;
            height: 24px;
            margin: -0.5em;
            padding: 0.5em;
          }

          .articleLogo :global(svg) {
            display: block;
            height: 100%;
          }

          @media screen and (max-width: 600px) {
            .articleLogo {
              height: 18px;
            }
          }

          .meta {
            margin: -2em 0 2em;
            display: flex;
            flex-direction: column;
          }

          .share {
            display: none;
          }

          @media screen {
            .share {
              display: block;
            }
          }

          .share {
            margin-top: 0.5em;
          }

          @media screen and (min-width: 460px) {
            .meta {
              flex-direction: row;
              justify-content: space-between;
              align-items: center;
            }

            .share {
              margin-top: -0.5em;
            }
          }

          .data {
            font-style: italic;
          }

          .data > a {
            text-decoration: none;
          }

          .data > a:hover {
            text-decoration: underline;
          }

          h1 {
            font-family: 'Inter', sans-serif;
            font-size: 3rem;
            font-style: italic;
            font-weight: 100;
            letter-spacing: -0.03em;
            line-height: 1.1;
            margin: 3rem 0.3em 3rem calc(1em / -16 - 0.25em);
            color: black;
            position: relative;
          }

          h1 span {
            padding: 0 0.3em 0 0.25em;
            box-decoration-break: clone;
          }

          h1 > div {
            position: absolute;
          }

          h1 > div > span {
            background: url(${require('../assets/bg-highlight.svg')}) space,
              #fff181 content-box;
            color: transparent;
            user-select: none;
          }

          :global(blockquote > p) {
            background: url(${require('../assets/bg-highlight.svg')}) space,
              #fff181 content-box;
            padding: 0 1ch;
            display: inline;
            box-decoration-break: clone;
            color: black;
          }

          h1 > span {
            position: relative;
            user-select: all;
          }

          footer {
            align-items: center;
            display: flex;
            justify-content: space-between;
            margin: 2rem 0;
          }

          @media screen and (max-width: 600px) {
            h1 {
              font-size: 2em;
              margin-top: 2rem;
            }
          }
        `}</style>
        <Link href="/">
          <a className="articleLogo">
            <ExplodingLogo offset={isMobile() ? 10 : 50} />
          </a>
        </Link>
        <h1>
          <div aria-hidden="true">
            <span>{frontMatter.title}</span>
          </div>
          <span>{frontMatter.title}</span>
        </h1>
        <div className="meta">
          <div className="data">
            <a
              href={canonicalURL(frontMatter)}
              title={longDate(frontMatter.date)}
            >
              {shortDate(frontMatter.date)}
            </a>
            {` · ${readMin} min read`}
          </div>
          {!router.query.screenshot && (
            <div className="share">
              <ShareMenu frontMatter={frontMatter} />
            </div>
          )}
        </div>
        <SelectionAnchor
          showActions={!router.query.screenshot}
          initialSelection={initialSelection}
          createShareLink={selection => shareURL(frontMatter, selection)}
        >
          {children}
        </SelectionAnchor>
        <footer>
          <Feedback article={getSlug(frontMatter)} />
          <ShareMenu frontMatter={frontMatter} />
        </footer>
      </Page>
    </Body>
  )
}

function shortDate(date: Date): string {
  try {
    return date.toLocaleDateString(undefined, {
      timeZone: 'America/Los_Angeles',
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  } catch (error) {
    if (error.name === 'RangeError') {
      return date.toDateString()
    }
    throw error
  }
}

function longDate(date: Date): string {
  try {
    return date.toLocaleString(undefined, {
      timeZone: 'America/Los_Angeles',
      weekday: 'short',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      timeZoneName: 'long'
    })
  } catch (error) {
    if (error.name === 'RangeError') {
      return String(date)
    }
    throw error
  }
}

// TODO: Generic or merge into above?
function Page({ children }: { children: ReactNode }) {
  return (
    <div className="page">
      <style jsx>{`
        .page {
          background: white;
          box-shadow: 0 1px 8px 1px rgba(0, 0, 0, 0.2);
        }

        @media screen and (min-width: 768px) and (min-height: 500px) {
          .page {
            padding: 8em 10ch 10em;
            margin: 6em auto 12em;
            width: 70vw;
            max-width: 65ch;
          }
        }

        @media not screen and (min-width: 768px) and (min-height: 500px) {
          .page {
            padding: calc(5vw + 1.5em) 5vw 6em;
            margin: calc(6vh + env(safe-area-inset-top)) auto
              calc(12vh + env(safe-area-inset-bottom));
            width: calc(
              86vw - env(safe-area-inset-left) - env(safe-area-inset-right)
            );
            max-width: 69ch;
          }
        }
      `}</style>
      {children}
    </div>
  )
}
