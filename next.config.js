const withMDX = require('next-mdx-enhanced')

module.exports = withMDX({
  layoutPath: 'components',
  extendFrontMatter: {
    process: mdxContent => ({
      wordCount: mdxContent
        .split(/^(---\n.+?\n---\n)/s)
        .pop()
        .split(/\s+/g).length
    })
  }
})({
  // TODO: fix this awfulness
  ...(process.env.NODE_ENV === 'production'
    ? {}
    : {
        serverRuntimeConfig: {
          FAUNA_SECRET: process.env.FAUNA_SECRET
        }
      }),
  exportTrailingSlash: true,
  webpack(config, options) {
    config.module.rules.push({
      test: /\.(jpe?g|png|svg|gif|ico|webp|woff2?)$/,
      use: [
        {
          loader: require.resolve('url-loader'),
          options: {
            esModule: false,
            limit: 1024,
            publicPath: `/_next/static/images/`,
            outputPath: `${options.isServer ? '../' : ''}static/images/`,
            name: '[name]-[hash].[ext]'
          }
        }
      ]
    })
    return config
  }
})
