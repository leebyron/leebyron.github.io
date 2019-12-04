import { ReactNode } from 'react'

const SHARE_HOST = 'lwb.io'
const PUBLIC_HOST = 'leebyron.com'

export default ({ children }: { children: ReactNode }) => {
  return (
    <>
      <script
        type="application/json"
        dangerouslySetInnerHTML={{
          __html:
            `if (window.location.host === '${SHARE_HOST}') {` +
            'window.location.href = ' +
            `window.location.href.replace('${SHARE_HOST}', '${PUBLIC_HOST}')` +
            '}'
        }}
      />
      <style global jsx>{`
        @font-face {
          font-family: 'courier-prime';
          src: url('https://use.typekit.net/af/78b949/0000000000000000000134f9/23/l?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=i7&v=3')
              format('woff2'),
            url('https://use.typekit.net/af/78b949/0000000000000000000134f9/23/d?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=i7&v=3')
              format('woff'),
            url('https://use.typekit.net/af/78b949/0000000000000000000134f9/23/a?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=i7&v=3')
              format('opentype');
          font-display: fallback;
          font-style: italic;
          font-weight: 700;
        }

        @font-face {
          font-family: 'courier-prime';
          src: url('https://use.typekit.net/af/53deb2/0000000000000000000134f8/23/l?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n7&v=3')
              format('woff2'),
            url('https://use.typekit.net/af/53deb2/0000000000000000000134f8/23/d?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n7&v=3')
              format('woff'),
            url('https://use.typekit.net/af/53deb2/0000000000000000000134f8/23/a?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n7&v=3')
              format('opentype');
          font-display: fallback;
          font-style: normal;
          font-weight: 700;
        }

        @font-face {
          font-family: 'courier-prime';
          src: url('https://use.typekit.net/af/8caa58/0000000000000000000134f7/23/l?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=i4&v=3')
              format('woff2'),
            url('https://use.typekit.net/af/8caa58/0000000000000000000134f7/23/d?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=i4&v=3')
              format('woff'),
            url('https://use.typekit.net/af/8caa58/0000000000000000000134f7/23/a?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=i4&v=3')
              format('opentype');
          font-display: fallback;
          font-style: italic;
          font-weight: 400;
        }

        @font-face {
          font-family: 'courier-prime';
          src: url('https://use.typekit.net/af/3538fb/0000000000000000000134f6/23/l?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n4&v=3')
              format('woff2'),
            url('https://use.typekit.net/af/3538fb/0000000000000000000134f6/23/d?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n4&v=3')
              format('woff'),
            url('https://use.typekit.net/af/3538fb/0000000000000000000134f6/23/a?primer=7cdcb44be4a7db8877ffa5c0007b8dd865b3bbc383831fe2ea177f62257a9191&fvd=n4&v=3')
              format('opentype');
          font-display: fallback;
          font-style: normal;
          font-weight: 400;
        }

        html,
        body {
          margin: 0;
        }

        body,
        h1,
        h2,
        p,
        a {
          -webkit-text-size-adjust: 100%;
          font-family: 'courier-prime', courier, monospace;
          font-display: auto;
          font-size: 1rem;
          line-height: 1.3125;
          color: #303030;
        }

        body {
          background: #794c35;
          background-image: url(${require('../assets/walnut.jpg')}),
            url(${require('../assets/walnut-lofi.jpg')});
          background-size: cover;
          background-position: center center;
          background-attachment: fixed;
        }

        @media not screen and (min-width: 768px) and (min-height: 500px) {
          body {
            background-size: auto 100vh;
            background-position: top center;
            background-repeat: repeat-y;
          }
        }

        @media not screen and (min-width: 768px) and (min-height: 500px) and (min-aspect-ratio: 4/3) {
          body {
            background-size: 100vw auto;
            background-position: center center;
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
        p,
        p > * {
          user-select: text;
        }

        h1 {
          font-weight: bold;
          font-style: italic;
          margin: 3em 0 2em;
        }

        h2 {
          font-weight: normal;
          font-style: italic;
          margin: 3em 0 1em;
        }

        a {
          text-decoration: underline;
        }

        a:hover {
          text-decoration: none;
        }
      `}</style>
      {children}
    </>
  )
}
