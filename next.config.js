const withMDX = require('next-mdx-enhanced')
const remark = require('remark-parse')
const visitRemark = require('unist-util-visit')

module.exports = withMDX({
  layoutPath: 'components',
  extendFrontMatter: {
    process: (mdxContent, frontMatter) => {
      const sansFrontMatter = mdxContent.replace(/^(---\n.+?\n---\n)?/s, '')
      const ast = new remark.Parser(null, sansFrontMatter).parse()
      const firstParagraph = ast.children.find(
        node => node.type === 'paragraph'
      )
      let synopsis = ''
      if (firstParagraph) {
        visitRemark(firstParagraph, 'text', node => {
          synopsis += node.value
        })
      }
      return {
        slug: frontMatter.__resourcePath.split('.')[0].replace(/\/index$/, ''),
        wordCount: sansFrontMatter.split(/\s+/g).length,
        synopsis
      }
    }
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
          loader: require.resolve('./imageLoader'),
          options: {
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
