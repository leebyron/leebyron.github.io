import { useCallback, useEffect, useRef } from 'react'
import { setCurrentRange, getCurrentRange } from './selectionUtil'

export function copyToClipboard(content: string): void {
  const prevRange = getCurrentRange()
  const textarea = document.createElement('textarea')
  textarea.value = content
  textarea.setAttribute('readonly', '')
  textarea.style.userSelect = 'all'
  textarea.style.position = 'absolute'
  textarea.style.top = '-9999px'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  document.body.removeChild(textarea)
  setCurrentRange(prevRange)
}

type CopyEffect<Ctx> = (ctx: Ctx | undefined) => string | undefined

export function useCopyEffect<Ctx>(
  copyEffect: CopyEffect<Ctx>
): (ctx: Ctx) => void {
  const effectRef = useRef<CopyEffect<Ctx>>(copyEffect)
  effectRef.current = copyEffect
  const ctxRef = useRef<Ctx | undefined>()
  useEffect(() => {
    function onCopy(event: ClipboardEvent) {
      if (event.clipboardData) {
        const replacementData = effectRef.current(ctxRef.current)
        if (replacementData) {
          event.clipboardData.setData('text/plain', replacementData)
          event.preventDefault()
        }
      }
    }
    document.addEventListener('copy', onCopy)
    return () => {
      document.removeEventListener('copy', onCopy)
    }
  }, [])
  return useCallback(ctx => {
    ctxRef.current = ctx
    document.execCommand('copy')
    ctxRef.current = undefined
  }, [])
}
