import { ReactNode, useRef, useEffect, useState } from 'react'
import { SelectionActions } from './SelectionActions'

export function SelectionAnchor({
  showActions,
  initialSelection,
  createShareLink,
  children
}: {
  showActions: boolean
  initialSelection: any
  createShareLink: (encoded: string) => string
  children: ReactNode
}) {
  const rootNode = useRef<HTMLDivElement | null>(null)
  const decodedRef = useRef<{ range: Range; isOutdated: boolean } | null>(null)
  const [encodedRange, setEncodedRange] = useState<string | null>(null)

  useEffect(() => {
    // Given an encoded initial selection decode it, apply it, and scroll to it.
    if (typeof initialSelection === 'string' && rootNode.current) {
      const decoded = decodeRange(rootNode.current, initialSelection)
      if (decoded) {
        // Apply selection
        const selection = document.getSelection()
        if (selection) {
          selection.empty()
          selection.addRange(decoded.range)
        }

        // Scroll
        const rect = decoded.range.getBoundingClientRect()
        const top = rect.top
        const topOffset = Math.max(
          20,
          Math.floor((window.innerHeight - rect.height) * 0.4)
        )
        window.scrollTo(0, window.scrollY + top - topOffset)

        // Update state to render
        decodedRef.current = decoded
        setEncodedRange(initialSelection)
      }
    }

    // If there is currently a selection on the page, render a link encoding it.
    function handleSelectionChange() {
      const range = getDocumentSelectionRange()
      if (
        rootNode.current &&
        !isSameRange(range, decodedRef.current && decodedRef.current.range)
      ) {
        decodedRef.current = range ? { range, isOutdated: false } : null
        setEncodedRange(range ? encodeRange(rootNode.current, range) : null)
      }
    }

    document.addEventListener('selectionchange', handleSelectionChange)
    return () => {
      document.removeEventListener('selectionchange', handleSelectionChange)
    }
  }, [initialSelection])

  return (
    <>
      <article ref={rootNode}>{children}</article>
      {showActions && encodedRange && decodedRef.current && (
        <SelectionActions
          encoded={encodedRange}
          decoded={decodedRef.current}
          createShareLink={createShareLink}
        />
      )}
    </>
  )
}

// RFC4648 url-safe base-64 encoding
const URL64Code =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_'

function getDocumentSelectionRange(): Range | null {
  const selection = document.getSelection()
  if (!selection || selection.isCollapsed) {
    return null
  }
  return selection.getRangeAt(0)
}

function isSameRange(r1: Range | null, r2: Range | null): boolean {
  return (
    r1 === r2 ||
    (r1 !== null &&
      r2 !== null &&
      r1.compareBoundaryPoints(Range.START_TO_START, r2) === 0 &&
      r1.compareBoundaryPoints(Range.END_TO_END, r2) === 0)
  )
}

// Encodes the range of a selection on the page as a string. The string is a
// URL-safe Base64 encoded hexad stream. While we could have used a byte stream,
// using hexads removes the need to convert Base64's hexads to bytes.
// A range is encoded as three lists of unsigned ints. The first list is the
// tree traversal path to the common ancestor node of the selection. The second
// is the tree traversal path from the common node to the start container,
// followed by the index into the text at that node, and the third is from the
// common node to the end container and the end text index.
function encodeRange(rootNode: Node, range: Range): string | null {
  let encoded = ''
  const startPath = encodeNodePath(rootNode, range.startContainer)
  const endPath = encodeNodePath(rootNode, range.endContainer)
  if (!startPath || !endPath) {
    return null
  }
  const commonPath = getCommonPath(startPath, endPath)
  writeList(commonPath)
  writeList(startPath.slice(commonPath.length).concat(range.startOffset))
  writeList(endPath.slice(commonPath.length).concat(range.endOffset))
  writeInt(getFNVChecksum(range.toString()))
  return encoded

  // Unsigned ints are represented in a go-style varint encoding. Each hexad
  // holds 5 bits of value and a MSB indicating if there are subsequent hexads
  // representing this int.
  function writeInt(number: number) {
    do {
      encoded += URL64Code[(number & 0x1f) | (number > 0x1f ? 0x20 : 0)]
      number >>= 5
    } while (number > 0)
  }

  // Lists are written as one int indicating the list's length, followed by each
  // element in that list.
  function writeList(list: Array<number>) {
    writeInt(list.length)
    for (var i = 0; i < list.length; i++) {
      writeInt(list[i])
    }
  }
}

function decodeRange(
  rootNode: Node,
  encoded: string
): { range: Range; isOutdated: boolean } | null {
  const URL64Decode = new Array(64)
  for (let i = 0; i < 64; i++) {
    URL64Decode[URL64Code.charCodeAt(i)] = i
  }
  let offset = 0
  const commonPath = readList()
  const startPath = readList()
  const endPath = readList()
  const expectedChecksum = readInt()
  if (!commonPath || !startPath || !endPath || expectedChecksum === undefined) {
    return null
  }
  const startOffset = startPath.pop()
  const startNode = decodeNodePath(rootNode, commonPath.concat(startPath))
  const endOffset = endPath.pop()
  const endNode = decodeNodePath(rootNode, commonPath.concat(endPath))
  if (
    startOffset === undefined ||
    !startNode ||
    endOffset === undefined ||
    !endNode
  ) {
    return null
  }
  const range = document.createRange()
  try {
    range.setStart(startNode, startOffset)
    range.setEnd(endNode, endOffset)
  } catch {
    return null
  }
  const isOutdated =
    expectedChecksum !== undefined &&
    expectedChecksum !== getFNVChecksum(range.toString())
  return { range, isOutdated }

  function readInt(): number | undefined {
    let number = 0
    let sign = 0
    while (offset < encoded.length) {
      const byte = URL64Decode[encoded.charCodeAt(offset++)]
      number |= (byte & 0x1f) << sign
      sign += 5
      if (byte < 0x20) {
        return number
      }
    }
  }

  function readList(): Array<number> | undefined {
    const length = readInt()
    if (length != undefined) {
      const list = new Array(length)
      for (let i = 0; i < length; i++) {
        list[i] = readInt()
      }
      return list
    }
  }
}

// A node's identity is encoded as a list of integers representing the tree
// traversal path from the root node.
function encodeNodePath(rootNode: Node, node: Node): Array<number> | null {
  const path = []
  while (node != rootNode) {
    const parentNode = node.parentNode
    if (!parentNode) {
      return null
    }
    path.push(Array.prototype.indexOf.call(parentNode.childNodes, node))
    node = parentNode
  }
  return path.reverse()
}

function decodeNodePath(rootNode: Node, path: Array<number>): Node | null {
  let node: Node = rootNode
  for (let i = 0; i < path.length; i++) {
    node = node.childNodes[path[i]]
    if (!node) {
      return null
    }
  }
  return node
}

// Given two arrays of integers, returns the common prefix of the two.
function getCommonPath(p1: Array<number>, p2: Array<number>): Array<number> {
  var i = 0
  while (i < p1.length && i < p2.length && p1[i] === p2[i]) {
    i++
  }
  return p1.slice(0, i)
}

// Given a string, produce a 15-bit unsigned int checksum.
// Later used to catch if a range may have changed since the link was created.
function getFNVChecksum(str: string): number {
  var sum = 0x811c9dc5
  for (var i = 0; i < str.length; ++i) {
    sum ^= str.charCodeAt(i)
    sum += (sum << 1) + (sum << 4) + (sum << 7) + (sum << 8) + (sum << 24)
  }
  return ((sum >> 15) ^ sum) & 0x7fff
}
