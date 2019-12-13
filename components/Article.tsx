import { Children, ReactNode, useEffect, useRef, useState, isValidElement } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { MDXProvider } from '@mdx-js/react'

import Body from './Body'
import { isMobile } from './isMobile'
import { ExplodingLogo } from './ExplodingLogo'
import { useWindowSize } from './useWindowSize'
import { Feedback } from './article/Feedback'
import { FrontMatter } from './article/frontMatter'
import { SelectionAnchor } from './article/SelectionAnchor'
import { SelectionActions } from './article/SelectionActions'
import { ShareActions } from './article/ShareActions'
import { canonicalURL, shareURL, shareImageURL } from './article/shareUtil'

export default (frontMatter: FrontMatter) => ({
  children
}: {
  children: ReactNode
}) => {
  const router = useRouter()
  const initialSelection =
    typeof router.query.$ === 'string' ? router.query.$ : undefined
  const readMin = Math.round(frontMatter.wordCount / 250)
  const shareImage = shareImageURL(children, frontMatter.slug, initialSelection)
  return (
    <Body>
      <Head>
        <title>{frontMatter.title}</title>
        <link rel="canonical" href={canonicalURL(frontMatter.slug)} />
        <meta
          property="og:url"
          content={shareURL(frontMatter.slug, initialSelection)}
        />
        <meta property="og:type" content="article" />
        <meta
          property="article:published_time"
          content={frontMatter.date.toISOString()}
        />
        <meta property="og:title" content={frontMatter.title} />
        <meta property="og:description" content={frontMatter.synopsis} />
        <meta
          property="og:image"
          content={shareImage}
        />
        <meta
          property="og:image:secure_url"
          content={shareImage}
        />
        <meta property="og:image:type" content="image/png" />
        <meta property="og:image:width" content="900" />
        <meta property="og:image:height" content="470" />
        <meta property="og:image:alt" content="" />
        <meta property="article:author" content="https://leebyron.com/" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:label1" content="Reading time" />
        <meta name="twitter:data1" content={`${readMin} min read`} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org/',
              '@type': 'Article',
              abstract: frontMatter.synopsis,
              datePublished: frontMatter.date.toISOString(),
              dateModified: (
                frontMatter.dateModified || frontMatter.date
              ).toISOString(),
              headline: frontMatter.title,
              image: shareImage,
              author: {
                '@type': 'Person',
                name: 'Lee Byron',
                sameAs: 'https://leebyron.com'
              },
              publisher: {
                '@type': 'Organization',
                name: 'leebyron.com',
                logo: {
                  '@type': 'ImageObject',
                  url: require('../assets/me.jpg')
                }
              },
              wordCount: frontMatter.wordCount,
              timeRequired: `PT${readMin}M`,
              mainEntityOfPage: canonicalURL(frontMatter.slug)
            })
          }}
        />
      </Head>
      <Page>
        <style jsx>{`
          .articleLogo {
            display: block;
            display: table;
            margin: -0.5em;
            padding: 0.5em;
          }

          .articleLogo :global(svg) {
            display: block;
            height: 24px;
          }

          @media screen and (max-width: 600px) {
            .articleLogo :global(svg) {
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
            margin: 3rem -0.3em 3rem calc(1em / -16 - 0.25em);
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
            pointer-events: none;
            position: relative;
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

          article {
            hanging-punctuation: first allow-end last;
            overflow-wrap: break-word;
            overflow-wrap: anywhere;
          }

          article > :global(:first-child) {
            margin-top: 0;
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
        <Heading>{frontMatter.title}</Heading>
        <div className="meta">
          <div className="data">
            <a
              href={canonicalURL(frontMatter.slug)}
              title={longDate(frontMatter.date)}
            >
              {shortDate(frontMatter.date)}
            </a>
            {` · ${readMin} min read`}
          </div>
          {!router.query.screenshot && (
            <div className="share">
              <ShareActions frontMatter={frontMatter} />
            </div>
          )}
        </div>
        <SelectionAnchor
          initialSelection={initialSelection}
          actions={({ encoded, decoded }) =>
            !router.query.screenshot && (
              <SelectionActions
                frontMatter={frontMatter}
                encoded={encoded}
                decoded={decoded}
              />
            )
          }
        >
          <article>
            <MDXProvider
              components={{
                a: Anchor,
                img: Image,
                p: P
              }}
            >
              {children}
            </MDXProvider>
          </article>
        </SelectionAnchor>
        <footer>
          <Feedback article={frontMatter.slug} />
          <ShareActions frontMatter={frontMatter} />
        </footer>
      </Page>
    </Body>
  )
}

function Heading({ children }: { children: string }) {
  const h1 = useRef<HTMLHeadingElement | null>(null)
  const [isOverflowing, setOverflowing] = useState<boolean>(false)
  const noWidow = children.replace(/\s+(\S+)$/, (_, end) => `\u00A0${end}`)
  const title = isOverflowing ? children : noWidow
  const { width } = useWindowSize()
  useEffect(() => {
    if (h1.current) {
      const span = h1.current.lastElementChild
      if (span) {
        h1.current.style.overflow = 'hidden'
        const text = span.textContent
        span.textContent = noWidow
        setOverflowing(h1.current.scrollWidth > h1.current.clientWidth)
        span.textContent = text
        h1.current.style.overflow = ''
      }
    }
  }, [width])
  return (
    <h1 ref={h1}>
      <style jsx>{`
        h1 {
          color: black;
          font-family: 'Inter', sans-serif;
          font-size: 3rem;
          font-style: italic;
          font-weight: 100;
          letter-spacing: -0.03em;
          line-height: 1.1;
          margin: 3rem 0.3em 3rem calc(1em / -16 - 0.25em);
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
          position: relative;
          user-select: none;
        }

        h1 > span {
          position: relative;
          user-select: all;
        }

        @media screen and (max-width: 600px) {
          h1 {
            font-size: 2em;
            margin-top: 2rem;
          }
        }
      `}</style>
      <div aria-hidden="true">
        <span>{title}</span>
      </div>
      <span>{title}</span>
    </h1>
  )
}

function Anchor({ href, children }: { href?: string; children?: ReactNode }) {
  return !href || /^https?:\/\//.test(href) ? (
    <a href={href} target="_blank">
      {children}
    </a>
  ) : (
    <Link href={href}>
      <a>{children}</a>
    </Link>
  )
}

function Image({
  src,
  alt,
  title,
  class: className,
  hero,
  ...rest
}: {
  src?: string
  alt?: string
  title?: string
  class?: string
  hero?: boolean
}) {
  return (
    <figure className={className || title}>
      <style jsx>{`
        figure {
          margin: 0;
        }
        img {
          display: block;
          margin: 2em 0 2em 50%;
          transform: translateX(-50%);
          max-width: 100%;
        }
        @media screen and (min-width: 768px) and (min-height: 500px) {
          img {
            max-width: calc(100% + 6em);
          }
        }
        figcaption {
          font-style: italic;
          margin: -1em 0 2em;
          opacity: 0.6;
          text-align: center;
        }
        @media screen {
          figure.overflow img {
            max-width: calc(
              100vw - env(safe-area-inset-left) - env(safe-area-inset-right)
            );
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
          }
        }
        @media screen and (min-width: 113ch) {
          figure.overflow img {
            max-width: calc(100% + 28ch);
          }
        }
      `}</style>
      <img alt={alt} src={src} {...rest} />
      {alt && <figcaption aria-hidden="true">{alt}</figcaption>}
    </figure>
  )
}

function P({ children }: { children?: ReactNode }) {
  // A block consisting of only an image will render as a block element,
  // so do not render a wrapping p tag around it.
  if (isValidElement(children) && children.props.mdxType === 'img') {
    return children
  }
  return <p>{children}</p>
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
