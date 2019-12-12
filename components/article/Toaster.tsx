import {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
  useEffect
} from 'react'

const TOAST_TIME = 2000
let uid = 1

export type ToastRef = { toast: (message: string) => void }
type Props = {
  popUnder?: boolean
}

export default forwardRef<ToastRef | undefined, Props>(function Toaster(
  { popUnder = false },
  ref
) {
  const [toasts, setState] = useState<[string, number][]>([])
  const isMounted = useRef(true)
  useEffect(() => () => {
    isMounted.current = false
  })
  useImperativeHandle(ref, () => ({
    toast(toast: string) {
      setState(toasts => [...toasts, [toast, uid++]])
      setTimeout(() => {
        if (isMounted.current) {
          setState(toasts => toasts.slice(1))
        }
      }, TOAST_TIME)
    }
  }))
  return (
    <div className={popUnder ? 'toaster popUnder' : 'toaster'}>
      <style jsx>{`
        .toaster {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        .toaster > span {
          animation: 2s ease-in-out both toast;
          background: #f6f6f6;
          border-radius: 0.75em;
          color: black;
          padding: 0.25em 0.75em;
          position: absolute;
          top: 0;
          white-space: nowrap;
        }

        .toaster.popUnder > span {
          animation: 2s ease-in-out both toast-under;
          top: 0.5em;
        }

        @keyframes toast {
          from,
          to {
            transform: translateY(0);
            opacity: 0;
          }
          10%,
          90% {
            transform: translateY(-2.25em);
            opacity: 0.9;
          }
        }
        @keyframes toast-under {
          from,
          to {
            transform: translateY(0);
            opacity: 0;
          }
          10%,
          90% {
            transform: translateY(2.25em);
            opacity: 0.9;
          }
        }
      `}</style>
      {toasts.map(([toast, key]) => (
        <span key={key}>{toast}</span>
      ))}
    </div>
  )
})
