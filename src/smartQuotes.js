const visitRemark = require('unist-util-visit')

module.exports = function smartQuotes() {
  return tree =>
    visitRemark(tree, 'text', node => {
      node.value = smartify(node.value)
    })
}

const punctuationRx = /[.!?,;:-]/
const quoteRx = /['"]/
const whitespaceRx = /\s/
const wordRx = /[a-zA-Z0-9]/
const open = { "'": '\u2018', '"': '\u201C' }
const close = { "'": '\u2019', '"': '\u201D' }
const apostrophe = '\u02BC'

function smartify(text) {
  const isOpen = { "'": 0, '"': 0 }
  return text.replace(/["']/g, (quote, i) => {
    const prev = text[i - 1]
    const next = text[i + 1]

    if (
      quote === "'" &&
      prev &&
      next &&
      wordRx.test(prev) &&
      (wordRx.test(next) || prev === 's' && whitespaceRx.test(next))
    ) {
      return apostrophe
    }

    if (isOpen[quote] === 0 || !prev || whitespaceRx.test(prev)) {
      isOpen[quote]++
      return open[quote]
    } else {
      isOpen[quote]--
      return close[quote]
    }
  })

  if (isOpen['"'] > 0) {
    console.error('unbalanced "')
  }
  if (isOpen["'"] > 0) {
    console.error("unbalanced '")
  }
}
