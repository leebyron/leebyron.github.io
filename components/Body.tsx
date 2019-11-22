import { ReactNode } from 'react'

export default ({ children }: { children: ReactNode }) => {
  return (
    <>
      <style jsx>{`
        @import url('https://use.typekit.net/xpu4mdb.css');

        :global(html, body) {
          margin: 0;
        }

        :global(body) {
          font: 17px/22px 'courier-prime', courier, monospace;
          color: #505050;
        }

        @media (min-width: 641px) {
          :global(body) {
            background: #794c35;
            background-image:
              url(${require('../assets/walnut.jpg')}),
              url(${require('../assets/walnut-lofi.jpg')});
            background-size: cover;
            background-position: center center;
            background-attachment: fixed;
          }
        }

        @media (max-width: 640px) {
          :global(body) {
            background: #fff;
          }
        }

        :global(*) {
          user-select: none;
        }

        :global(a) {
          -webkit-tap-highlight-color: rgba(109, 169, 182, 0.2);
          pointer-events: auto !important;
        }

        :global(h2), :global(p) {
          user-select: text;
        }
      `}</style>
      {children}
    </>
  )
}
