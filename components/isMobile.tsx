let _isMobile: boolean | undefined
export function isMobile() {
  if (typeof window !== 'object') {
    return false
  }
  if (_isMobile === undefined) {
    const query = window.matchMedia(
      '(min-width: 768px) and (min-height: 500px)'
    )
    _isMobile = !query.matches
    // https://developer.mozilla.org/en-US/docs/Web/API/MediaQueryList
    ;(query.addListener as any)((event: any) => {
      _isMobile = !event.matches
    })
  }
  return _isMobile
}
