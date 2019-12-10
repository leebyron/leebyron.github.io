import React from 'react'
import App from 'next/app'

export default class extends App {
  // Disable static file generation
  static async getInitialProps(appContext: any) {
    return await App.getInitialProps(appContext);
  }

  render() {
    const { Component, pageProps } = this.props
    return <Component {...pageProps} />
  }
}
