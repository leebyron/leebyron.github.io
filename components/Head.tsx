import { ReactNode } from 'react'
import Head from 'next/head'

export default ({ children }: { children: ReactNode }) => (
  <Head>
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0, user-scalable=no, viewport-fit=cover"
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
    {children}
  </Head>
)
