import React from 'react'
import App from 'next/app'
import { SharedHooksProvider } from '../components/useShared/useShared'

export default class extends App {
  // Disable static file generation
  static async getInitialProps(appContext: any) {
    return await App.getInitialProps(appContext)
  }

  render() {
    const { Component, pageProps } = this.props
    return (
      <SharedHooksProvider>
        <Component {...pageProps} />
      </SharedHooksProvider>
    )
  }
}
