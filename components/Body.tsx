import { ReactNode } from 'react'
import Head from 'next/head'

export default function Body({ children }: { children: ReactNode }) {
  return (
    <>
      <Head>
        <title>Lee Byron</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, viewport-fit=cover"
        />
        {[192, 96, 32, 16].map(size => (
          <link
            key={size}
            rel="icon"
            type="image/png"
            sizes={size + 'x' + size}
            href={require(`../assets/icon-${size}.png`)}
          />
        ))}
        {[180, 152, 144, 120, 114, 76, 72, 60, 57].map(size => (
          <link
            key={size}
            rel="apple-touch-icon"
            sizes={size + 'x' + size}
            href={require(`../assets/icon-${size}.png`)}
          />
        ))}
        <meta name="theme-color" content="#ffffff" />
        <meta name="msapplication-TileColor" content="#ffffff" />
        <meta
          name="msapplication-TileImage"
          content={require('../assets/icon-144.png')}
        />
        <meta name="robots" content="index,follow" />
        <meta name="referrer" content="unsafe-url" />
        <meta name="author" content="Lee Byron" />
        <meta property="og:site_name" content="Lee Byron" />
        <meta property="fb:app_id" content="46273233281" />
        <meta name="twitter:site" content="@leeb" />
        <meta name="twitter:creator" content="@leeb" />
        <link
          rel="preload"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
          href="https://rsms.me/inter/font-files/Inter-ThinItalic.woff2"
        />
        <link
          rel="preload"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
          href="https://use.typekit.net/af/3538fb/0000000000000000000134f6/23/l?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n4&v=3"
        />
        <link
          rel="preload"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
          href="https://use.typekit.net/af/8caa58/0000000000000000000134f7/23/l?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=i4&v=3"
        />
        <link
          rel="preload"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
          href="https://use.typekit.net/af/53deb2/0000000000000000000134f8/23/l?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n7&v=3"
        />
        <link
          rel="preload"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
          href="https://use.typekit.net/af/78b949/0000000000000000000134f9/23/l?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=i7&v=3"
        />
      </Head>
      <>
        <style global jsx>{`
          @font-face {
            font-family: 'Inter';
            font-style: italic;
            font-weight: 100;
            font-display: fallback;
            src: url('https://rsms.me/inter/font-files/Inter-ThinItalic.woff2')
                format('woff2'),
              url('https://rsms.me/inter/font-files/Inter-ThinItalic.woff')
                format('woff');
          }

          @font-face {
            font-family: 'courier-prime';
            src: url('https://use.typekit.net/af/3538fb/0000000000000000000134f6/23/l?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n4&v=3')
                format('woff2'),
              url('https://use.typekit.net/af/3538fb/0000000000000000000134f6/23/d?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n4&v=3')
                format('woff');
            font-display: fallback;
            font-style: normal;
            font-weight: 400;
          }

          @font-face {
            font-family: 'courier-prime';
            src: url('https://use.typekit.net/af/8caa58/0000000000000000000134f7/23/l?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=i4&v=3')
                format('woff2'),
              url('https://use.typekit.net/af/8caa58/0000000000000000000134f7/23/d?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=i4&v=3')
                format('woff');
            font-display: fallback;
            font-style: italic;
            font-weight: 400;
          }

          @font-face {
            font-family: 'courier-prime';
            src: url('https://use.typekit.net/af/53deb2/0000000000000000000134f8/23/l?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n7&v=3')
                format('woff2'),
              url('https://use.typekit.net/af/53deb2/0000000000000000000134f8/23/d?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n7&v=3')
                format('woff');
            font-display: fallback;
            font-style: normal;
            font-weight: 700;
          }

          @font-face {
            font-family: 'courier-prime';
            src: url('https://use.typekit.net/af/78b949/0000000000000000000134f9/23/l?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=i7&v=3')
                format('woff2'),
              url('https://use.typekit.net/af/78b949/0000000000000000000134f9/23/d?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=i7&v=3')
                format('woff');
            font-display: fallback;
            font-style: italic;
            font-weight: 700;
          }

          html,
          body {
            margin: 0;
          }

          body,
          h1,
          h2,
          h3,
          h4,
          h5,
          p,
          blockquote,
          figcaption,
          pre,
          code,
          a {
            color: #303030;
            font-display: auto;
            font-family: 'courier-prime', courier, monospace;
            font-size: 1rem;
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
            line-height: 1.5;
            text-rendering: optimizeLegibility;
            text-size-adjust: none;
          }

          body {
            background: #794c35;
            background-image: url(${require('../assets/walnut.jpg')}),
              url(${require('../assets/walnut-lofi.jpg')});
            background-size: cover;
            background-position: center top;
            background-attachment: fixed;
          }

          @media not screen and (min-width: 768px) and (min-height: 500px) {
            body {
              background-size: auto 100vh;
              background-position: center top;
              background-repeat: repeat-y;
            }
          }

          @media not screen and (min-width: 768px) and (min-height: 500px) and (min-aspect-ratio: 4/3) {
            body {
              background-size: 100vw auto;
              background-position: center top;
            }
          }

          * {
            user-select: none;
          }

          a {
            -webkit-tap-highlight-color: rgba(109, 169, 182, 0.2);
            pointer-events: auto !important;
          }

          h1,
          h2,
          h3,
          h4,
          h5,
          p,
          p > *,
          blockquote,
          blockquote > *,
          figcaption {
            user-select: text;
          }

          h1 {
            font-weight: bold;
            font-style: italic;
            margin: 4rem 0 2rem;
          }

          h2 {
            font-weight: bold;
            font-style: italic;
            margin: 4rem 0 2rem;
          }

          h3 {
            font-weight: bold;
            font-style: italic;
            margin: 3rem 0 1rem;
          }

          h4 {
            font-weight: normal;
            font-style: italic;
            margin: 3rem 0 1rem;
          }

          h5 {
            font-weight: normal;
            font-style: italic;
            margin: 2rem 0 1rem;
          }

          p {
            margin: 1.5rem 0;
          }

          blockquote {
            margin: 2rem 3ch;
            font-style: italic;
          }

          a {
            text-decoration: underline;
          }

          a:hover {
            text-decoration: none;
          }

          code {
            user-select: all;
          }

          pre {
            background: #f6f6f6;
            margin: 1ch;
            max-width: calc(100% - 2ch);
            overflow: scroll;
            -webkit-overflow-scrolling: touch;
            white-space: nowrap;
            width: intrinsic;
            width: fit-content;
          }

          pre > code {
            color: #202020;
            display: table;
            padding: 1ch;
            white-space: pre;
          }

          :not(pre) > code {
            background: #f3f3f3;
            color: #202020;
            margin: 0 -0.3ch;
            padding: 0 0.3ch;
          }

          ol,
          ul {
            margin: 2rem 0;
            padding-inline-end: 3ch;
            padding-inline-start: 4ch;
          }

          ul {
            list-style: none;
          }

          li {
            position: relative;
          }

          li::before {
            content: '•';
            position: absolute;
            left: -2ch;
          }

          @media screen and (max-width: 600px) {
            blockquote {
              margin: 2rem 1ch;
            }

            pre {
              margin: 1rem 0;
              max-width: 100%;
            }

            ol,
            ul {
              padding-inline-end: 1ch;
              padding-inline-start: 2ch;
            }
          }
        `}</style>
        {children}
      </>
    </>
  )
}
