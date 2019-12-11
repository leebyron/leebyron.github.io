import { useEffect, useState } from 'react'

export function useWindowSize(): { width: number; height: number } {
  const [state, setState] = useState({ width: 1200, height: 800 })
  useEffect(() => {
    const update = () =>
      setState(prev =>
        prev.width === window.innerWidth && prev.height === window.innerHeight
          ? prev
          : { width: window.innerWidth, height: window.innerHeight }
      )
    update()
    window.addEventListener('resize', update)
    window.addEventListener('load', update)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('load', update)
    }
  }, [])
  return state
}
