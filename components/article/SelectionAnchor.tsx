import {
  Children,
  cloneElement,
  ReactElement,
  ReactNode,
  useRef,
  useEffect,
  useState
} from 'react'
import {
  getCurrentRange,
  setCurrentRange,
  isSameRange,
  encodeRange,
  decodeRange
} from './selectionUtil'

export type DecodedSelection = {
  range: Range
  isOutdated: boolean
}

export function SelectionAnchor({
  initialSelection,
  actions,
  children
}: {
  initialSelection: string | undefined
  actions: (props: { encoded: string; decoded: DecodedSelection }) => ReactNode
  children: ReactElement
}) {
  const rootNode = useRef<HTMLDivElement | null>(null)
  const decodedRef = useRef<DecodedSelection | null>(null)
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
      {cloneElement(Children.only(children), { ref: rootNode })}
      {encodedRange &&
        decodedRef.current &&
        actions({ encoded: encodedRange, decoded: decodedRef.current })}
    </>
  )
}
