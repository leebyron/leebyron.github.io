import { ReactNode, useRef, useEffect, useState } from 'react'
import { SelectionActions } from './SelectionActions'
import {
  getCurrentRange,
  setCurrentRange,
  isSameRange,
  encodeRange,
  decodeRange
} from './selectionUtil'

export function SelectionAnchor({
  showActions,
  initialSelection,
  createShareLink,
  children
}: {
  showActions: boolean
  initialSelection: string | undefined
  createShareLink: (encoded: string) => string
  children: ReactNode
}) {
  const rootNode = useRef<HTMLDivElement | null>(null)
  const decodedRef = useRef<{ range: Range; isOutdated: boolean } | null>(null)
  const [encodedRange, setEncodedRange] = useState<string | null>(null)

  useEffect(() => {
    // Given an encoded initial selection decode it, apply it, and scroll to it.
    if (initialSelection && rootNode.current) {
      const decoded = decodeRange(rootNode.current, initialSelection)
      if (decoded) {
        // Apply selection
        setCurrentRange(decoded.range)

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
      const range = getCurrentRange()
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
