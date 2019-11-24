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
const SHARE_HOST =
  process.env.NODE_ENV === 'production'
    ? 'https://lwb.io'
    : 'http://localhost:3000'

export default (frontMatter: FrontMatter) => ({
  children
}: {
  children: ReactNode
}) => (
  <Body>
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

      .share > :global(svg) {
        width: 2em;
        margin: 0.2em;
        fill: #222;
      }

      @media screen and (max-width: 600px) {
        h1 {
          font-size: 2em;
          margin-top: 2rem;
        }

        .share > :global(svg) {
          width: 1.8em;
        }
      }
    `}</style>
    <Head>
      <title>{frontMatter.title}</title>
      <link rel="canonical" href={canonicalURL(frontMatter)} />
      <meta property="og:type" content="article" />
      <meta property="og:image" content={shareImageURL(frontMatter)} />
    </Head>
    <Page>
      <ExplodingLogo offset={isMobile() ? 10 : 50} className="articleLogo" />
      <h1>
        <div aria-hidden="true">
          <span>{frontMatter.title}</span>
        </div>
        <span>{frontMatter.title}</span>
      </h1>
      <div className="metaData">
        <a href={canonicalURL(frontMatter)}>{frontMatter.date}</a>
        {` · `}
        {Math.round(frontMatter.wordCount / 250)} min read
      </div>
      <SelectionAnchor
        showActions={!useRouter().query.screenshot}
        initialSelection={useRouter().query.$}
        createShareLink={selection => shareURL(frontMatter, selection)}
      >
        {children}
      </SelectionAnchor>
      <footer>
        <Feedback article={getSlug(frontMatter)} />
        <div className="share">
          <TwitterSVG />
          <FacebookSVG />
          <LinkedInSVG />
        </div>
      </footer>
    </Page>
  </Body>
)

function canonicalURL(frontMatter: any): string {
  return `${CANONICAL_HOST}/${getSlug(frontMatter)}`
}

function shareURL(frontMatter: any, selection?: string): string {
  return (
    `${SHARE_HOST}/${getSlug(frontMatter)}` +
    (selection ? '?$=' + selection : '')
  )
}

function shareImageURL(frontMatter: any) {
  const { $: selection } = useRouter().query
  return (
    `${SHARE_HOST}/api/snap?article=${getSlug(frontMatter)}` +
    (selection ? '&selection=' + selection : '')
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
