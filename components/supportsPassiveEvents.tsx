let supportsPassive: boolean | undefined
export function supportsPassiveEvents(): boolean {
  if (supportsPassive === undefined) {
    // Test via a getter in the options object to see if the passive property
    // is accessed
    supportsPassive = false
    try {
      const opts = Object.defineProperty({}, 'passive', {
        get: function() {
          supportsPassive = true
        }
      })
      // @ts-ignore fake event
      window.addEventListener('testPassive', null, opts)
      // @ts-ignore fake event
      window.removeEventListener('testPassive', null, opts)
    } catch (e) {}
  }
  return supportsPassive
}
