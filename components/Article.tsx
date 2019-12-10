import { ReactNode } from 'react'
import Head from 'next/head'
import { useRouter } from 'next/router'

import Body from './Body'
import { isMobile } from './isMobile'
import { ExplodingLogo } from './ExplodingLogo'
import { Feedback } from './article/Feedback'
import { FrontMatter, getSlug } from './article/frontMatter'
import { SelectionAnchor } from './article/SelectionAnchor'
import FacebookSVG from './svg/FacebookSVG'
import LinkedInSVG from './svg/LinkedInSVG'
import TwitterSVG from './svg/TwitterSVG'

const CANONICAL_HOST = 'https://leebyron.com'
const SHARE_HOST = 'https://lwb.io'
const API_HOST =
  process.env.NODE_ENV === 'production'
    ? 'https://lwb.io'
    : 'http://localhost:3000'

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
        <meta property="og:type" content="article" />
        <meta
          property="og:url"
          content={shareURL(frontMatter, initialSelection)}
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
        <meta property="article:author" content="https://twitter.com/@leeb" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:label1" content="Reading time" />
        <meta name="twitter:data1" content={`${readMin} min read`} />
      </Head>
      <Page>
        <style jsx>{`
          :global(.articleLogo) {
            height: 24px;
          }

          @media screen and (max-width: 600px) {
            :global(.articleLogo) {
              height: 18px;
            }
          }

          .metaData {
            margin: -2em 0 2em;
            font-style: italic;
          }

          .metaData > a {
            text-decoration: none;
          }

          .metaData > a:hover {
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
            flex-spacing: space-between;
            justify-content: space-between;
            margin: 2rem 0;
          }

          .share {
            display: flex;
          }

          .share > * {
            display: block;
          }

          .share :global(svg) {
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

            .share :global(svg) {
              height: 1.8em;
              width: 1.8em;
            }
          }
        `}</style>
        <ExplodingLogo offset={isMobile() ? 10 : 50} className="articleLogo" />
        <h1>
          <div aria-hidden="true">
            <span>{frontMatter.title}</span>
          </div>
          <span>{frontMatter.title}</span>
        </h1>
        <div className="metaData">
          <a href={canonicalURL(frontMatter)}>{frontMatter.date}</a>
          {` · ${readMin} min read`}
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
          <div className="share">
            <TwitterSVG />
            <a target="_blank" href={facebookShareURL(frontMatter)}>
              <FacebookSVG />
            </a>
            <LinkedInSVG />
          </div>
        </footer>
      </Page>
    </Body>
  )
}

function canonicalURL(frontMatter: FrontMatter): string {
  return `${CANONICAL_HOST}/${getSlug(frontMatter)}/`
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

function shareImageURL(frontMatter: FrontMatter, selection?: string) {
  return (
    `${API_HOST}/api/article/${encodeURIComponent(getSlug(frontMatter))}/snap` +
    (selection ? '?selection=' + selection : '')
  )
}

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
            padding: 8vmax 5vw 6em;
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
