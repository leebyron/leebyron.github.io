import {
  createElement,
  isValidElement,
  ReactNode,
  useEffect,
  useRef,
  useState
} from 'react'
import Head from 'next/head'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { MDXProvider } from '@mdx-js/react'

import Body from './Body'
import { isMobile } from './isMobile'
import { ExplodingLogo } from './ExplodingLogo'
import { useWindowSize } from './useWindowSize'
import { AllArticlesList } from './article/AllArticlesList'
import { isoDate, shortDate, longDate } from './article/dateUtil'
import { FeedbackProvider, Feedback } from './article/Feedback'
import { FrontMatter } from './article/frontMatter'
import { SelectionAnchor } from './article/SelectionAnchor'
import { SelectionActions } from './article/SelectionActions'
import { ShareActions } from './article/ShareActions'
import { canonicalURL, shareURL, shareImage } from './article/shareUtil'

const headshot = require('../assets/me.jpg')

export default (frontMatter: FrontMatter) => ({
  children
}: {
  children: ReactNode
}) => {
  const router = useRouter()
  const initialSelection =
    typeof router.query.$ === 'string' ? router.query.$ : undefined
  const readMin = Math.round(frontMatter.wordCount / 250)
  const ogImage = shareImage(children, frontMatter.slug, initialSelection)
  return (
    <Body>
      <Head>
        <title>{frontMatter.title}</title>
        <link rel="canonical" href={canonicalURL(frontMatter.slug)} />
        {!frontMatter.published && <meta name="robots" content="noindex" />}
        <meta
          property="og:url"
          content={shareURL(frontMatter.slug, initialSelection)}
        />
        <meta property="og:type" content="article" />
        <meta property="og:title" content={frontMatter.title} />
        <meta property="og:description" content={frontMatter.synopsis} />
        <meta name="description" content={frontMatter.synopsis} />
        <meta property="og:image" content={ogImage.src} />
        <meta property="og:image:secure_url" content={ogImage.src} />
        <meta property="og:image:type" content={ogImage.mime || 'image/png'} />
        <meta
          property="og:image:width"
          content={String(ogImage.width || 900)}
        />
        <meta
          property="og:image:height"
          content={String(ogImage.height || 470)}
        />
        <meta property="og:image:alt" content="" />
        <meta property="article:author" content="https://leebyron.com/" />
        <meta
          property="article:published_time"
          content={isoDate(frontMatter.date)}
        />
        {frontMatter.tags &&
          frontMatter.tags.map(tag => (
            <meta key={tag} property="article:tag" content={tag} />
          ))}
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
              datePublished: isoDate(frontMatter.date),
              dateModified: isoDate(
                frontMatter.dateModified || frontMatter.date
              ),
              headline: frontMatter.title,
              image: {
                '@type': 'ImageObject',
                url: ogImage.src,
                width: ogImage.width,
                height: ogImage.height
              },
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
                  url: headshot.src,
                  width: headshot.width,
                  height: headshot.height
                }
              },
              keywords: frontMatter.tags
                ? frontMatter.tags.join(', ')
                : undefined,
              wordCount: frontMatter.wordCount,
              timeRequired: `PT${readMin}M`,
              mainEntityOfPage: canonicalURL(frontMatter.slug)
            })
          }}
        />
      </Head>
      <FeedbackProvider article={frontMatter.slug}>
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

            :global(blockquote > p) {
              background: url(${require('../assets/bg-highlight.svg')}) top
                  center / auto 1.5rem padding-box space no-repeat,
                #fff181 content-box;
              box-decoration-break: clone;
              color: black;
              display: inline;
              padding: 0 2ch 0 1ch;
              margin-right: -1ch;
            }

            article {
              hanging-punctuation: first allow-end last;
              overflow-wrap: break-word;
              overflow-wrap: anywhere;
            }

            article > :global(:first-child) {
              margin-top: 0;
            }

            header {
              position: relative;
              z-index: 1;
            }

            .footerActions {
              align-items: center;
              display: flex;
              justify-content: space-between;
              margin: 2rem 0;
            }
          `}</style>
          <header>
            <Link href="/">
              <a className="articleLogo" aria-label="homepage">
                <ExplodingLogo offset={isMobile() ? 10 : 50} />
              </a>
            </Link>
            <TitleHeading>{frontMatter.title}</TitleHeading>
            {!router.query.screenshot && (
              <HeaderMeta frontMatter={frontMatter} />
            )}
          </header>
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
                  img: BlockImage,
                  p: P,
                  h1: Heading('h1'),
                  h2: Heading('h2'),
                  h3: Heading('h3'),
                  h4: Heading('h4'),
                  h5: Heading('h5'),
                  h6: Heading('h6')
                }}
              >
                {children}
              </MDXProvider>
            </article>
          </SelectionAnchor>
          <footer>
            <div className="footerActions">
              <Feedback />
              <ShareActions frontMatter={frontMatter} />
            </div>
            <AuthorInfo />
            <h2>Additional Reading</h2>
            <AllArticlesList exclude={frontMatter.slug} />
          </footer>
        </Page>
      </FeedbackProvider>
    </Body>
  )
}

function HeaderMeta({ frontMatter }: { frontMatter: FrontMatter }) {
  return (
    <div className="meta">
      <style jsx>{`
        .meta {
          margin: -1rem 0 2rem;
          display: flex;
          flex-direction: column;
          align-items: start;
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
          margin-top: 0.8em;
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
          background: #ffffff;
          padding: 0 1ch;
          margin: 0 -1ch;
        }

        .data > a {
          text-decoration: none;
        }

        .data > a:hover {
          text-decoration: underline;
        }
      `}</style>
      <div className="data">
        <a
          href={canonicalURL(frontMatter.slug)}
          title={longDate(frontMatter.date)}
        >
          {shortDate(frontMatter.date)}
        </a>
        {` · ${Math.round(frontMatter.wordCount / 250)} min read`}
      </div>
      <div className="share">
        <ShareActions frontMatter={frontMatter} />
      </div>
    </div>
  )
}

function AuthorInfo() {
  return (
    <div>
      <style jsx>{`
        div {
          border-bottom: 1px solid #ddd;
          border-top: 1px solid #ddd;
          margin: 2rem 0;
          padding: 2rem 0 1rem;
          position: relative;
        }

        a {
          text-decoration: none;
        }

        img {
          border-radius: 3.5rem;
          display: block;
          height: 7rem;
          margin: -0.5rem;
          position: absolute;
          width: 7rem;
        }

        h3 {
          margin-top: 0;
        }

        h3,
        p {
          margin-left: 13ch;
        }

        @media screen and (max-width: 600px) {
          div {
            padding: 1rem 0;
          }

          img {
            position: relative;
            height: 3rem;
            width: 3rem;
            margin: 0;
          }

          h3 {
            margin: -2rem 0 1.5rem calc(3rem + 1ch);
          }

          p {
            margin-left: 0;
          }
        }
      `}</style>
      <Link href="/">
        <a tabIndex={-1}>
          <img
            alt="Headshot"
            {...headshot}
            {...srcset(
              require('../assets/me-96.jpg'),
              require('../assets/me-144.jpg'),
              require('../assets/me-224.jpg'),
              headshot
            )}
            sizes="(max-width: 600px) 3rem, 7rem"
          />
        </a>
      </Link>
      <h3>
        <Link href="/">
          <a>Lee Byron</a>
        </Link>
      </h3>
      <p>
        Co-creator of GraphQL, Executive Director of the GraphQL Foundation, and
        Engineering Manager at Robinhood. Opinions are my own. I like snacks.
      </p>
    </div>
  )
}

function srcset(...sources: any[]): { srcSet: string } {
  return {
    srcSet: sources.map(source => `${source.src} ${source.width}w`).join()
  }
}

function TitleHeading({ children }: { children: string }) {
  const h1 = useRef<HTMLHeadingElement | null>(null)
  const [isOverflowing, setOverflowing] = useState<boolean>(false)
  const noWidow = children.replace(/\s+(\S+)$/, (match, lastWord, position) =>
    lastWord.length < position * 0.75 ? `\u00A0${lastWord}` : match
  )
  const title = isOverflowing ? children : noWidow
  const { width } = useWindowSize()
  useEffect(() => {
    if (h1.current && noWidow !== children) {
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
          font-family: 'Inter', -apple-system, 'Segoe UI', Roboto, ui-system,
            sans-serif;
          font-size: 3rem;
          font-style: italic;
          font-weight: 100;
          letter-spacing: -0.03em;
          line-height: 1.1;
          margin-left: calc(1em / -16 - 0.25em);
          margin-right: -0.75em;
          position: relative;
        }

        h1 span {
          padding: 0 1em 0 0.25em;
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
            margin-top: 2.5rem;
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

function Heading(level: string) {
  return function Heading({ children }: { children?: ReactNode }) {
    const stringChildren = reactToString(children)
    const id =
      stringChildren && stringChildren.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    return (
      <>
        <style jsx global>{`
          .heading > a:last-child {
            display: none;
          }
          @media screen and (min-width: 600px) {
            .heading {
              position: relative;
            }
            .heading > a:last-child {
              display: inline;
              font-style: normal;
              font-weight: normal;
              left: -2ch;
              margin: -1ch;
              opacity: 0;
              padding: 1ch;
              position: absolute;
              text-decoration: none;
              top: -0.08rem;
              transition: opacity 0.3s ease-out;
            }
            .heading:hover > a:last-child,
            .heading:focus > a:last-child,
            .heading > a:last-child:focus {
              opacity: 0.6;
              transition: opacity 0.1s ease-in;
            }
            .heading:hover > a:last-child:hover,
            .heading:focus > a:last-child:hover,
            .heading > a:last-child:hover {
              opacity: 1;
            }
          }
        `}</style>
        {createElement(
          level,
          { id, className: 'heading' },
          <>
            {children}
            {id && (
              <a href={`#${id}`} tabIndex={-1}>
                §
              </a>
            )}
          </>
        )}
      </>
    )
  }
}

function reactToString(node: ReactNode): string | null {
  if (
    typeof node === 'string' ||
    typeof node === 'number' ||
    typeof node === 'boolean'
  ) {
    return String(node)
  }
  if (Array.isArray(node)) {
    return node.map(reactToString).join('')
  }
  if (isValidElement(node)) {
    if (typeof node.type === 'function') {
      // @ts-ignore
      return reactToString(node.type(node.props))
    }
    if (typeof node.type === 'string') {
      return reactToString(node.props.children)
    }
  }
  return null
}

function Anchor({ href, children }: { href?: string; children?: ReactNode }) {
  return !href || /^https?:\/\//.test(href) ? (
    <a href={href} target="_blank" rel="noopener">
      {children}
    </a>
  ) : (
    <Link href={href}>
      <a>{children}</a>
    </Link>
  )
}

function P({ children }: { children?: ReactNode }) {
  // A block consisting of only an image should render as a block element,
  // so do not render a wrapping p tag around it.
  if (isValidElement(children) && children.props.mdxType === 'img') {
    return children
  }
  // Otherwise all images found inside the paragraph should be inline.
  return (
    <p>
      <MDXProvider components={{ img: InlineImage }}>{children}</MDXProvider>
    </p>
  )
}

function InlineImage(props: { src?: string; alt?: string; title?: string }) {
  return <img {...props} />
}

function BlockImage({
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
          height: auto;
          margin: 2em 0 2em 50%;
          max-width: 100%;
          transform: translateX(-50%);
          width: auto;
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
          figure.top img {
            margin-top: -7em;
          }
        }
        @media screen and (min-width: 113ch) {
          figure.overflow img {
            max-width: calc(100% + 28ch);
          }
        }
        @media screen and (max-width: 600px) {
          figure.top img {
            margin-top: -6em;
          }
        }
        @media screen and (max-width: 459px) {
          figure.top img {
            margin-top: -8.5em;
          }
        }
      `}</style>
      <img
        alt=""
        src={src}
        {...rest}
        decoding="async"
        // @ts-ignore
        importance="low"
      />
      {alt && <figcaption aria-hidden="true">{alt}</figcaption>}
    </figure>
  )
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
            padding: 8rem 10ch 6rem;
            margin: 6rem auto 14rem;
            width: 70vw;
            max-width: 65ch;
          }
        }

        @media not screen and (min-width: 768px) and (min-height: 500px) {
          .page {
            padding: calc(5vw + 1.5rem) 5vw calc(5vw + 2rem);
            margin: calc(6vh + env(safe-area-inset-top)) auto
              calc(20vh + env(safe-area-inset-bottom));
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
