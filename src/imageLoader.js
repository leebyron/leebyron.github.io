const sizeOf = require('image-size')
const mime = require('mime')
const Module = require('module')
const urlLoader = require('url-loader')

module.exports = function imageLoader(src) {
  this.query.esModule = false
  const urlModule = new Module()
  urlModule._compile(urlLoader.call(this, src), this.resourcePath)
  const url = urlModule.exports
  const dimensions = getDimensions(this.resourcePath)
  return `module.exports = Object.defineProperties(${JSON.stringify({
    src: url,
    width: dimensions && dimensions.width,
    height: dimensions && dimensions.height
  })}, {
  mime: { value: ${JSON.stringify(mime.getType(this.resourcePath))} },
  toString: { value() { return this.src } }
});`
}

function getDimensions(path) {
  try {
    return sizeOf(path)
  } catch (error) {
    if (!(error instanceof TypeError)) {
      throw error
    }
  }
}

module.exports.raw = true
