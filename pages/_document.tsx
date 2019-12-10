import Document, {
  Html,
  Head,
  Main,
  NextScript,
  DocumentContext
} from 'next/document'

const SHARE_HOST = 'lwb.io'
const PUBLIC_HOST = 'leebyron.com'

export default class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    return { pathname: ctx.pathname, ...(await Document.getInitialProps(ctx)) }
  }

  render() {
    return (
      <Html>
        <Head />
        <body>
          <script
            dangerouslySetInnerHTML={{
              __html:
                `if (window.location.host === '${SHARE_HOST}') {` +
                'window.location.href = ' +
                `window.location.href.replace('${SHARE_HOST}', '${PUBLIC_HOST}')` +
                '}'
            }}
          />
          <Main />
          <NextScript />
          <script
            dangerouslySetInnerHTML={{
              __html:
                `(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){` +
                `(i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),` +
                `m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)` +
                `})(window,document,'script','//www.google-analytics.com/analytics.js','ga');` +
                `ga('create', 'UA-61714711-1', 'auto');` +
                `ga('send', 'pageview');`
            }}
          />
        </body>
      </Html>
    )
  }
}
