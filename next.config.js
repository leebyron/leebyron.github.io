const withMDX = require('next-mdx-enhanced')

module.exports = withMDX({
  layoutPath: 'components',
  extendFrontMatter: {
    process: (mdxContent, frontMatter) => ({
      slug: frontMatter.__resourcePath.split('.')[0].replace(/\/index$/, ''),
      wordCount: mdxContent
        .split(/^(---\n.+?\n---\n)/s)
        .pop()
        .split(/\s+/g).length
    })
  }
})({
  serverRuntimeConfig:
    process.env.NODE_ENV === 'production'
      ? undefined
      : { FAUNA_SECRET: process.env.FAUNA_SECRET },
  exportPathMap(defaultPathMap) {
    // Not sure why this happens, but remove it
    delete defaultPathMap['/index']
    return defaultPathMap
  },
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
