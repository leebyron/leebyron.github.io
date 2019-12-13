import Head from 'next/head'
import { ReactNode } from 'react'

import Body from '../components/Body'
import { ExplodingLogo } from '../components/ExplodingLogo'
import { useScrollAndHeight } from '../components/useScrollAndHeight'
import { isMobile } from '../components/isMobile'
import { AllArticlesList } from '../components/article/AllArticlesList'

export default () => (
  <Body>
    <Head>
      <meta property="og:title" content="Lee Byron" />
      <meta property="og:url" content="https://leebyron.com/" />
      <meta property="og:image" content={require('../assets/me.jpg')} />
      <meta property="og:image:width" content="745" />
      <meta property="og:image:height" content="765" />
      <meta property="og:type" content="profile" />
      <meta property="og:profile:first_name" content="Lee" />
      <meta property="og:profile:last_name" content="Byron" />
      <meta property="og:profile:username" content="leebyron" />
      <meta property="og:profile:gender" content="male" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org/',
            '@type': 'Person',
            name: 'Lee Byron',
            image: require('../assets/me.jpg'),
            gender: 'https://schema.org/Male'
          })
        }}
      />
    </Head>
    <Header />
    <Page>
      <style jsx>{`
        @media screen and (min-width: 768px) {
          p {
            max-width: 55ch;
          }
        }

        @media not screen and (min-width: 768px) and (min-height: 500px) {
          .logo {
            display: none;
          }
        }
      `}</style>
      <img className="logo" src={require('../assets/logo.svg')} width="200" />
      <p>
        Lee is the co-creator of GraphQL and Executive Director of the GraphQL
        Foundation. He works at Robinhood as an Engineering Manager and
        previously worked at Facebook. Lee has had a hand in open source
        libraries used by millions of developers worldwide including GraphQL,
        React, Immutable.js, Flow, Relay, Dataloader, and more.
      </p>
      <h2>Speaking</h2>
      <Talks />
      <h2>Articles & Essays</h2>
      <AllArticlesList />
    </Page>
  </Body>
)

function Talks() {
  return (
    <div>
      <style jsx>{`
        a {
          display: block;
          margin-bottom: 2em;
        }

        img {
          width: 100%;
          display: block;
          margin-bottom: 0.5em;
        }

        @media screen and (min-width: 350px) {
          div {
            display: flex;
            flex-wrap: wrap;
            margin-bottom: -2em;
            margin-left: -2ch;
          }

          a {
            min-width: 24px;
            width: calc(50% - 2ch);
            margin-left: 2ch;
          }
        }

        @media screen and (min-width: 700px) {
          a {
            width: calc(33.3% - 2ch);
          }
        }
      `}</style>
      <a href="https://youtu.be/vG8WpLr6y_U" target="_blank">
        <img src={require('../assets/talks/1999.jpg')} />
        Program like it's 1999
      </a>
      <a href="https://youtu.be/VjHWkBr3tjI" target="_blank">
        <img src={require('../assets/talks/graphql-history.jpg')} />
        Brief history of GraphQL
      </a>
      <a href="https://youtu.be/oTcDmnAXZ4E" target="_blank">
        <img src={require('../assets/talks/idea-architecture.jpg')} />
        The IDEA Architecture
      </a>
      <a href="https://youtu.be/Oh5oC98ztvI" target="_blank">
        <img src={require('../assets/talks/data-language.jpg')} />
        Designing a data language
      </a>
      <a href="https://youtu.be/WQLzZf34FJ8" target="_blank">
        <img src={require('../assets/talks/exploring-graphql.jpg')} />
        Exploring GraphQL
      </a>
      <a href="https://youtu.be/I7IdS-PbEgI" target="_blank">
        <img src={require('../assets/talks/immutable-data.jpg')} />
        Immutable data in React
      </a>
    </div>
  )
}

function Page({ children }: { children: ReactNode }) {
  return (
    <div className="page">
      <style jsx>{`
        .page {
          background: white;
        }

        @media screen and (min-width: 768px) and (min-height: 500px) {
          .page {
            box-shadow: 0 1px 8px 1px rgba(0, 0, 0, 0.2);
            padding: 8em 10ch 10em;
            margin: 6em auto 12em;
            width: 70vw;
            max-width: 850px;
          }
        }

        @media not screen and (min-width: 768px) and (min-height: 500px) {
          .page {
            padding: 6em 5vw 3em;
            margin: 0 auto calc(12vmax + env(safe-area-inset-bottom));
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

function Header() {
  const { scroll: ms, height: hei } = useScrollAndHeight(1)

  return (
    <div className="cardSurface">
      <style jsx>{`
        .cardBack {
          align-items: start;
          display: flex;
          flex-direction: column;
        }

        .cardBack em {
          display: block;
          margin: 1em 0;
        }

        .cardBack a {
          color: #505050;
          text-decoration: none;
          display: block;
        }

        .cardBack a:hover {
          text-decoration: underline;
        }

        :global(.explodinglogo) {
          overflow: visible;
          position: relative;
          width: 100%;
          height: 100%;
        }

        @media screen and (min-width: 768px) and (min-height: 500px) {
          :global(.explodinglogo) {
            padding: 50vh 50vw;
            margin: -50vh -50vw;
          }

          .cardSurface {
            overflow: hidden;
            padding-top: 200vh;
            position: relative;
            width: 100vw;
          }

          .card {
            pointer-events: none;
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            margin: 50vh auto;

            -webkit-perspective: 1600px;
            perspective: 1600px;
            -webkit-transform-style: preserve-3d;
            transform-style: preserve-3d;

            -webkit-transform: translate3d(0, -50%, 0);
            transform: translate3d(0, -50%, 0);

            width: 80vm;
            width: 80vmin;
            height: 44vm;
            height: 44vmin;
            max-width: 600px;
            max-height: 330px;
            min-width: 440px;
            min-height: 242px;
          }

          .card.flipping {
            position: fixed;
          }

          .card.flipped {
            top: 100vh;
          }

          .cardFront {
            height: 100%;
            background: white;
            box-shadow: 0 1px 8px 1px rgba(0, 0, 0, 0.2);

            box-sizing: border-box;
            padding: 13%;

            -webkit-backface-visibility: hidden;
            backface-visibility: hidden;
            -webkit-transform: translate3d(0, 0, 3px);
            transform: translate3d(0, 0, 3px);
          }

          .cardBack {
            box-sizing: border-box;
            position: absolute;
            top: -40.90909%;
            left: 22.5%;
            right: 22.5%;
            bottom: -40.90909%;

            padding: 1.5em;

            background: white;
            box-shadow: 0 1px 8px 1px rgba(0, 0, 0, 0.2);

            -webkit-backface-visibility: hidden;
            backface-visibility: hidden;
            -webkit-transform: translate3d(0, 0, 0) rotateX(180deg)
              rotateZ(90deg);
            transform: translate3d(0, 0, 0) rotateX(180deg) rotateZ(90deg);
          }

          .cardBottomEdge {
            position: absolute;
            bottom: 0;
            top: 0;
            left: 0;
            right: 0;
            -webkit-backface-visibility: hidden;
            backface-visibility: hidden;
            -webkit-transform: translateY(-50%) rotateX(0.25turn);
            transform: translateY(-50%) rotateX(0.25turn);
          }

          .cardBottomEdge::after {
            display: block;
            content: '';
            position: absolute;
            bottom: 50%;
            width: 100%;
            height: 3px;
            background: #ff744c;
          }
        }

        @media not screen and (min-width: 768px) and (min-height: 500px) {
          /* MOBILE */

          .card {
            background: white;
            pointer-events: none;
            padding: 34vh 5vw 0;
            margin: calc(6vh + env(safe-area-inset-top)) auto 0;
            width: calc(
              86vw - env(safe-area-inset-left) - env(safe-area-inset-right)
            );
            max-width: 69ch;
          }

          .cardFront {
            position: relative;
            max-width: 280px;
          }

          .cardBottomEdge {
            display: none;
          }
        }
      `}</style>

      <div className={ms === hei ? "card flipped" : ms > 0 ? "card flipping" : "card"}>
        <div className="cardFront" style={cardMove(ms, hei)}>
          <ExplodingLogo
            offset={isMobile() ? 10 : 50}
            position={hei * 0.45}
            className="explodinglogo"
          />
        </div>

        <div className="cardBottomEdge" style={cardMoveEdge(ms, hei)} />

        <div className="cardBack" style={cardMoveBack(ms, hei)}>
          <em>Design Technologist</em>
          <a href="https://twitter.com/leeb" target="_blank">
            @leeb
          </a>
          <a href="mailto&#58;&#108;&#37;65e&#64;leebyron&#46;c&#111;&#109;">
            l&#101;e&#64;&#108;e&#101;&#98;&#121;&#114;on&#46;&#99;om
          </a>
          <a href="https://github.com/leebyron" target="_blank">
            github.com/leebyron
          </a>
          <a href="https://keybase.io/leeb" target="_blank">
            keybase.io/leeb
          </a>
        </div>
      </div>
    </div>
  )
}

function t(s: string) {
  return {
    transform: s,
    WebkitTransform: s
  }
}

function cardMove(s: number, hh: number) {
  if (s === 0 || isMobile()) {
    return {}
  }
  if (s < 0) {
    return t('translate3d(0,' + -s + 'px,0)')
  }

  var notimes = Math.min(1, s / hh)

  // var times = 1-notimes;//Math.max(0, (hh - s)/hh);

  // var cosmo = (1 + Math.cos(Math.PI * notimes)) / 2;

  var notimes2 = Math.max(0, Math.min(1, (1.4 * s) / hh - 0.2))
  var cosmo2 = (1 + Math.cos(Math.PI * notimes2)) / 2

  var dz = 100 * ((1 - Math.cos(2 * Math.PI * notimes2)) / 2)

  var dy =
    Math.min(hh, s) - (1 - notimes) * s * Math.sin(2 * Math.PI * notimes) - s
  return t(
    `translate3d(0,${dy}px,${dz}px)` +
      `rotateZ(${0.25 - 0.25 * cosmo2}turn)` +
      `rotateX(${0.5 - 0.5 * cosmo2}turn)` +
      'translateZ(3px)'
  )
}

function cardMoveBack(s: number, hh: number) {
  if (s === 0 || isMobile()) {
    return {}
  }
  var notimes = Math.min(1, s / hh)
  // var times = 1-notimes;//Math.max(0, (hh - s)/hh);

  // var cosmo = (1 + Math.cos(Math.PI * notimes)) / 2;

  var notimes2 = Math.max(0, Math.min(1, (1.4 * s) / hh - 0.2))
  var cosmo2 = (1 + Math.cos(Math.PI * notimes2)) / 2

  var dz = 100 * ((1 - Math.cos(2 * Math.PI * notimes2)) / 2)

  var dy =
    Math.min(hh, s) - (1 - notimes) * s * Math.sin(2 * Math.PI * notimes) - s
  return t(
    `translate3d(0,${dy}px,${dz}px)` +
      `rotateZ(${-0.25 - 0.25 * cosmo2}turn)` +
      `rotateX(${1 + 0.5 * cosmo2}turn)` +
      'rotateZ(90deg)'
  )
}

function cardMoveEdge(s: number, hh: number) {
  if (s === 0 || isMobile()) {
    return {}
  }
  // return {};
  var notimes = Math.min(1, s / hh)
  // var times = 1-notimes;//Math.max(0, (hh - s)/hh);

  // var cosmo = (1 + Math.cos(Math.PI * notimes)) / 2;

  var notimes2 = Math.max(0, Math.min(1, (1.4 * s) / hh - 0.2))
  var cosmo2 = (1 + Math.cos(Math.PI * notimes2)) / 2

  var dz = 100 * ((1 - Math.cos(2 * Math.PI * notimes2)) / 2)

  var dy =
    Math.min(hh, s) - (1 - notimes) * s * Math.sin(2 * Math.PI * notimes) - s
  return t(
    `translate3d(0,${dy}px,${dz}px)` +
      `rotateZ(${0.25 - 0.25 * cosmo2}turn)` +
      `rotateX(${1 - 0.5 * cosmo2}turn)` +
      'translateY(-50%)' +
      'rotateX(0.25turn)'
  )
}
