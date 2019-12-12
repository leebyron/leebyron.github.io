import { useState, useEffect, useRef, RefObject, memo } from 'react'
import { API_HOST } from './shareUtil'

export const MAX_FEEDBACK_COUNT = 50

type Props = {
  article: string
}

export const Feedback = memo(({ article }: Props) => {
  const [response, updateCount] = useFeedback(article)
  const [isActive, setActive] = useState<{
    fromCount: number
    mode: 'mouse' | 'touch'
  } | null>(null)
  const [isCovering, setCovering] = useState<boolean>(false)
  const count = clientFeedbackCount(response)
  const removeCount = () => updateCount(() => 0)
  const snackEmoji = getEmoji(count)

  const r1 = useRef<any>()
  const r2 = useRef<any>()
  const r3 = useRef<any>()
  const r4 = useRef<any>()
  const snackRing = useRef<any>()
  const rings = useRef<any>()
  const snack = useRef<any>()
  const sparkles = useRef<any>()

  const didBecomeActive = (mode: 'mouse' | 'touch') => {
    setActive({ fromCount: count, mode })
    rings.current.style.transition = 'transform'
    rings.current.style.transitionDuration = '0.15s'
    rings.current.style.transitionTimingFunction = 'ease-in'
    rings.current.style.transform = 'scale(1)'
    if (count >= MAX_FEEDBACK_COUNT) {
      return
    }
    r1.current.style.transition = 'transform'
    r2.current.style.transition = 'transform'
    r3.current.style.transition = 'transform'
    r4.current.style.transition = 'transform'
    const transitionDuration = `${mode === 'touch' ? 0.1 : 1}s`
    r1.current.style.transitionDuration = transitionDuration
    r2.current.style.transitionDuration = transitionDuration
    r3.current.style.transitionDuration = transitionDuration
    r4.current.style.transitionDuration = transitionDuration
    r1.current.style.transitionTimingFunction = 'ease-in'
    r2.current.style.transitionTimingFunction = 'ease-in'
    r3.current.style.transitionTimingFunction = 'ease-in'
    r4.current.style.transitionTimingFunction = 'ease-in'
    r1.current.style.transform = 'rotate(180deg)'
    r2.current.style.transform = 'rotate(180deg)'
    r3.current.style.transform = 'rotate(90deg)'
    r4.current.style.transform = 'rotate(360deg)'
  }

  const didBecomeInactive = () => {
    setActive(null)
    setCovering(false)
    rings.current.style.transition = null
    rings.current.style.transform = null
    if (count >= MAX_FEEDBACK_COUNT) {
      return
    }
    r1.current.style.transitionDuration = '0.5s'
    r2.current.style.transitionDuration = '0.5s'
    r3.current.style.transitionDuration = '0.5s'
    r4.current.style.transitionDuration = '0.5s'
    r1.current.style.transitionTimingFunction = 'ease-in'
    r2.current.style.transitionTimingFunction = 'ease-in'
    r3.current.style.transitionTimingFunction = 'ease-in'
    r4.current.style.transitionTimingFunction = 'ease-in'
    r1.current.style.transform = null
    r2.current.style.transform = null
    r3.current.style.transform = null
    r4.current.style.transform = null
  }

  const didEndTransition = () => {
    if (!isActive || count >= MAX_FEEDBACK_COUNT) {
      return
    }
    snackRing.current.style.transition = 'none'
    snackRing.current.style.transform = 'scale(1.2)'
    snack.current.style.transition = 'none'
    snack.current.style.transform = 'scale(1.3)'
    sparkles.current.setAttribute('class', 'sparkles-off')
    r1.current.style.transition = 'none'
    r2.current.style.transition = 'none'
    r3.current.style.transition = 'none'
    r4.current.style.transition = 'none'
    r1.current.style.transform = null
    r2.current.style.transform = null
    r3.current.style.transform = null
    r4.current.style.transform = null
    setImmediate(() => {
      snackRing.current.style.transition =
        'transform 0.5s cubic-bezier(0.19, 1, 0.22, 1)'
      snackRing.current.style.transform = null
      snack.current.style.transition =
        'transform 0.5s cubic-bezier(0.19, 1, 0.22, 1)'
      snack.current.style.transform = null
      sparkles.current.setAttribute('class', 'sparkles-on')
      sparkles.current.style.transform = `rotate(${((count + 1) * 137) %
        360}deg)`
      if (count < MAX_FEEDBACK_COUNT - 1) {
        r1.current.style.transition = 'transform'
        r2.current.style.transition = 'transform'
        r3.current.style.transition = 'transform'
        r4.current.style.transition = 'transform'
        r1.current.style.transitionDuration = '0.3s'
        r2.current.style.transitionDuration = '0.3s'
        r3.current.style.transitionDuration = '0.3s'
        r4.current.style.transitionDuration = '0.3s'
        r1.current.style.transitionTimingFunction = 'linear'
        r2.current.style.transitionTimingFunction = 'linear'
        r3.current.style.transitionTimingFunction = 'linear'
        r4.current.style.transitionTimingFunction = 'linear'
        r1.current.style.transform = 'rotate(180deg)'
        r2.current.style.transform = 'rotate(180deg)'
        r3.current.style.transform = 'rotate(90deg)'
        r4.current.style.transform = 'rotate(360deg)'
      }
      updateCount(s => s + 1)
    })
  }

  useTouchActions(snackRing, {
    start(event, touch) {
      event.preventDefault()
      setCovering(touchDistance(snackRing.current, touch) < 30)
      if (!isActive) {
        didBecomeActive('touch')
      }
    },
    move(event, touch) {
      event.preventDefault()
      setCovering(touchDistance(snackRing.current, touch) < 30)
    },
    end: didBecomeInactive,
    cancel: didBecomeInactive
  })

  return (
    <div className="feedback">
      <style jsx>{`
        .feedback {
          align-items: center;
          display: flex;
          flex: 1;
          margin: 0 10px 0 -10px;
          position: relative;
        }
        .snackRing {
          cursor: grab;
          height: 50px;
          position: relative;
          width: 50px;
        }
        .snackRing > * {
          pointer-events: none;
        }
        .looper {
          font-size: 27px;
          left: 0;
          overflow: visible;
          position: absolute;
          top: 0;
        }
        .rings {
          transform: scale(1.09);
          transition: transform 0.15s ease-out 0.3s;
        }
        .a90,
        .a180 {
          transform: rotate(0);
          transition: transform 0.5s ease-in;
        }
        .a180x {
          transform: rotate(180deg);
          transition: transform 0.5s ease-in;
        }
        .uncover {
          transition: transform 0.25s ease-out;
        }
        .uncovered {
          transform: translate(0, -50px);
        }
        :global(.sparkles-off) .t {
          visibility: hidden;
          pointer-events: none;
        }
        :global(.sparkles-on) .t {
          pointer-events: none;
          visibility: visible;
          animation: 0.6s sparkles both cubic-bezier(0.19, 1, 0.22, 1);
        }
        @keyframes sparkles {
          from {
            opacity: 0;
            transform: translate(0, -22px) scale(0.12) rotate(35deg);
          }
          5% {
            opacity: 1;
            transform: translate(0, -27px) scale(0.38) rotate(30deg);
          }
          to {
            opacity: 0;
            transform: rotate(10deg) translate(0, -43px) scale(0.24)
              rotate(-10deg);
          }
        }
        .zero {
          appearance: none;
          background: none;
          border: none;
          cursor: pointer;
          display: block;
          height: 18px;
          left: 16px;
          opacity: 0.25;
          padding: 2px;
          position: absolute;
          transition: transform 0.3s ease-in-out, opacity 0.1s ease-out;
          width: 18px;
        }
        .zero.zero-active {
          transform: translate(-45px);
        }
        @media not screen and (min-width: 768px) and (min-height: 500px) {
          .zero.zero-active {
            transform: translate(0, 40px);
          }
        }
        .zero:hover {
          opacity: 1;
        }
      `}</style>
      <button
        className={count > 0 ? 'zero zero-active' : 'zero'}
        onClick={removeCount}
      >
        <svg viewBox="0 0 100 100" width="14" height="14" fill="#444">
          <path d="M93.5,86.5L57.1,50l36.4-36.5c2-2,2-5.1,0-7.1l0,0c-2-2-5.1-2-7.1,0L50,42.9L13.6,6.5c-2-2-5.1-2-7.1,0c-2,2-2,5.1,0,7.1  L42.9,50L6.5,86.5c-2,2-2,5.1,0,7.1c2,2,5.1,2,7.1,0L50,57.1l36.5,36.5c2,2,5.1,2,7.1,0C95.5,91.6,95.5,88.4,93.5,86.5z" />
        </svg>
      </button>
      <div
        className="snackRing"
        ref={snackRing}
        onMouseEnter={() => {
          if (!isActive) {
            didBecomeActive('mouse')
          }
        }}
        onMouseLeave={didBecomeInactive}
      >
        <svg width="50" height="50" className="looper">
          <g transform="translate(25,25)">
            <g mask="url(#circle)">
              <mask id="half">
                <path
                  fill="white"
                  className="a180"
                  ref={r1}
                  onTransitionEnd={didEndTransition}
                  d="M0,25A25,25,0,0,1,0,-25L0,-22A22,22,0,1,0,0,22z"
                />
              </mask>
              <mask id="circle">
                <circle fill="white" r="25" />
              </mask>
              <g ref={rings} className="rings">
                <circle fill="white" r="25" />
                <g fill="#444">
                  <path
                    d="M0,-25A25,25,0,0,1,0,25L0,22A22,22,0,1,0,0,-22z"
                    mask="url(#half)"
                  />
                  <path
                    className="a180"
                    ref={r2}
                    d="M0,-25A25,25,0,0,1,0,25L0,22A22,22,0,1,0,0,-22z"
                    mask="url(#half)"
                  />
                  <path
                    className="a90"
                    ref={r3}
                    d="M0,-25A25,25,0,0,1,0,25L0,22A22,22,0,1,0,0,-22z"
                    mask="url(#half)"
                  />
                </g>
                <g
                  style={{
                    transition: isActive
                      ? 'fill 0.1s ease-out'
                      : 'fill 0.15s ease-out 0.3s',
                    fill:
                      count === 0 || (isActive && isActive.fromCount === count)
                        ? '#ddd'
                        : '#444'
                  }}
                >
                  <path
                    d="M0,25A25,25,0,0,1,0,-25L0,-22A22,22,0,1,0,0,22z"
                    mask="url(#half)"
                  />
                  <path
                    className="a180x"
                    ref={r4}
                    d="M0,25A25,25,0,0,1,0,-25L0,-22A22,22,0,1,0,0,22z"
                    mask="url(#half)"
                  />
                </g>
              </g>
            </g>
            <g className={isCovering ? 'uncover uncovered' : 'uncover'}>
              <g ref={snack}>
                {count > 0 && (
                  <text
                    textAnchor="middle"
                    y={/iPad|iPhone|iOS/.test(navigator.userAgent) ? 8 : 11}
                  >
                    {snackEmoji}
                  </text>
                )}
              </g>
              {count === 0 && (
                <g transform="translate(-16,-16)scale(0.5)">
                  <path d="M55.56,32c0-0.743,0.484-1.693,0.953-2.613c0.697-1.37,1.419-2.786,1.032-4.231c-0.401-1.503-1.827-2.425-3.086-3.238c-0.839-0.542-1.706-1.103-2.052-1.7c-0.356-0.616-0.411-1.663-0.465-2.675c-0.081-1.553-0.166-3.159-1.246-4.239c-1.081-1.081-2.688-1.165-4.24-1.247c-1.012-0.053-2.059-0.108-2.674-0.464c-0.598-0.346-1.159-1.214-1.701-2.053c-0.813-1.257-1.734-2.683-3.237-3.085c-0.264-0.07-0.543-0.106-0.83-0.106c-1.165,0-2.302,0.579-3.401,1.139C33.693,7.956,32.743,8.44,32,8.44c-0.743,0-1.694-0.484-2.613-0.953c-1.1-0.56-2.236-1.139-3.401-1.139c-0.287,0-0.566,0.036-0.83,0.106c-1.503,0.402-2.424,1.828-3.237,3.086c-0.542,0.839-1.103,1.707-1.7,2.052c-0.616,0.357-1.663,0.412-2.675,0.465c-1.554,0.082-3.16,0.166-4.24,1.247s-1.165,2.687-1.246,4.24c-0.053,1.012-0.108,2.059-0.464,2.674c-0.346,0.597-1.213,1.158-2.052,1.7c-1.258,0.813-2.684,1.735-3.086,3.238c-0.387,1.445,0.334,2.861,1.032,4.23C7.956,30.306,8.44,31.257,8.44,32s-0.484,1.694-0.953,2.613c-0.698,1.37-1.419,2.785-1.032,4.231c0.402,1.503,1.828,2.424,3.086,3.237c0.839,0.542,1.707,1.104,2.052,1.7c0.357,0.616,0.412,1.663,0.465,2.675c0.082,1.553,0.166,3.159,1.247,4.239c1.08,1.081,2.687,1.165,4.24,1.247c1.012,0.053,2.058,0.107,2.674,0.464c0.597,0.346,1.158,1.213,1.7,2.052c0.813,1.259,1.735,2.685,3.238,3.086c0.264,0.071,0.543,0.106,0.83,0.106c1.166,0,2.302-0.579,3.401-1.139c0.919-0.469,1.87-0.953,2.613-0.953    s1.694,0.484,2.613,0.953c1.1,0.56,2.235,1.139,3.4,1.139h0.001c0.286,0,0.565-0.035,0.829-0.106c1.504-0.401,2.425-1.827,3.238-3.086c0.542-0.839,1.103-1.706,1.699-2.052c0.616-0.356,1.663-0.411,2.675-0.465c1.554-0.082,3.16-0.166,4.24-1.247c1.081-1.08,1.165-2.687,1.247-4.24c0.053-1.012,0.107-2.059,0.464-2.674c0.346-0.598,1.214-1.158,2.054-1.701c1.257-0.812,2.683-1.733,3.084-3.235c0.387-1.446-0.335-2.863-1.032-4.232C56.044,33.693,55.56,32.743,55.56,32z M55.613,38.328c-0.203,0.757-1.237,1.426-2.238,2.072c-1.038,0.671-2.111,1.364-2.698,2.379c-0.598,1.032-0.665,2.323-0.731,3.571c-0.062,1.177-0.125,2.393-0.663,2.931    s-1.755,0.602-2.932,0.664c-1.248,0.065-2.539,0.134-3.571,0.731c-1.014,0.587-1.707,1.659-2.377,2.697c-0.647,1.001-1.316,2.036-2.075,2.239c-0.097,0.025-0.199,0.038-0.312,0.038c-0.686,0-1.604-0.468-2.493-0.921c-1.13-0.575-2.298-1.171-3.521-1.171c-1.223,0-2.391,0.596-3.521,1.171c-1.036,0.528-2.124,1.061-2.806,0.883c-0.758-0.203-1.428-1.238-2.075-2.239c-0.67-1.038-1.364-2.11-2.377-2.697c-1.033-0.598-2.323-0.665-3.571-0.731c-1.176-0.062-2.393-0.125-2.931-0.663c-0.538-0.537-0.602-1.754-0.664-2.931c-0.066-1.248-0.134-2.538-0.731-3.571c-0.587-1.014-1.66-1.707-2.698-2.378c-1.001-0.647-2.037-1.316-2.24-2.074c-0.188-0.705,0.356-1.773,0.882-2.807c0.576-1.13,1.171-2.298,1.171-3.521c0-1.223-0.595-2.391-1.17-3.521c-0.526-1.033-1.071-2.102-0.883-2.806c0.203-0.758,1.238-1.427,2.24-2.075c1.038-0.67,2.111-1.364,2.698-2.378c0.597-1.032,0.665-2.323,0.73-3.571c0.062-1.177,0.125-2.393,0.663-2.931c0.538-0.538,1.754-0.602,2.931-0.664c1.249-0.066,2.539-0.134,3.572-0.731c1.014-0.587,1.707-1.66,2.378-2.698c0.647-1.001,1.316-2.037,2.074-2.239c0.681-0.188,1.77,0.354,2.807,0.882c1.13,0.575,2.298,1.17,3.521,1.17c1.223,0,2.391-0.595,3.521-1.17c1.037-0.528,2.132-1.063,2.807-0.883c0.758,0.203,1.427,1.238,2.074,2.239c0.671,1.038,1.364,2.112,2.379,2.699c1.032,0.597,2.322,0.665,3.57,0.73c1.177,0.062,2.394,0.125,2.932,0.663c0.537,0.538,0.602,1.754,0.663,2.93c0.065,1.249,0.134,2.54,0.731,3.572c0.587,1.014,1.659,1.707,2.697,2.377c1.001,0.647,2.036,1.316,2.239,2.075c0.188,0.705-0.356,1.773-0.883,2.807c-0.575,1.13-1.171,2.298-1.171,3.521c0,1.223,0.595,2.391,1.171,3.521C55.257,36.554,55.802,37.622,55.613,38.328z" />
                  <circle r="2" cx="23" cy="23" />
                  <circle r="2" cx="32" cy="23" />
                  <circle r="2" cx="41" cy="23" />
                  <circle r="2" cx="18.5" cy="32" />
                  <circle r="2" cx="27.5" cy="32" />
                  <circle r="2" cx="36.5" cy="32" />
                  <circle r="2" cx="45.5" cy="32" />
                  <circle r="2" cx="23" cy="41" />
                  <circle r="2" cx="32" cy="41" />
                  <circle r="2" cx="41" cy="41" />
                </g>
              )}
            </g>
            <g ref={sparkles} className="sparkles-off">
              <g transform="rotate(0)scale(0.99)">
                <g className="t">
                  <text textAnchor="middle">{snackEmoji}</text>
                </g>
              </g>
              <g transform="rotate(51)scale(1.01)">
                <g className="t">
                  <text textAnchor="middle">{snackEmoji}</text>
                </g>
              </g>
              <g transform="rotate(103)scale(0.98)">
                <g className="t">
                  <text textAnchor="middle">{snackEmoji}</text>
                </g>
              </g>
              <g transform="rotate(154)scale(1.0)">
                <g className="t">
                  <text textAnchor="middle">{snackEmoji}</text>
                </g>
              </g>
              <g transform="rotate(206)scale(0.99)">
                <g className="t">
                  <text textAnchor="middle">{snackEmoji}</text>
                </g>
              </g>
              <g transform="rotate(257)scale(1.01)">
                <g className="t">
                  <text textAnchor="middle">{snackEmoji}</text>
                </g>
              </g>
              <g transform="rotate(309)scale(1.0)">
                <g className="t">
                  <text textAnchor="middle">{snackEmoji}</text>
                </g>
              </g>
            </g>
          </g>
        </svg>
      </div>
      <FeedbackPhrase response={response} />
    </div>
  )
})

function FeedbackPhrase({ response }: { response: AsyncFeedback }) {
  return (
    <div className="phrase">
      {' '}
      <style jsx>{`
        .phrase {
          flex: 1;
          margin-left: 1ch;
          overflow: hidden;
          padding-top: 0.2em;
          word-break: break-all;
        }
        @media screen and (max-width: 600px) {
          .phrase > .long {
            display: none;
          }
        }
      `}</style>
      {response.state === 'loading' ? (
        '...'
      ) : response.state === 'error' ? (
        response.error.message
      ) : (
        <>
          {totalFeedbackCount(response.value) === 0 ? (
            <>
              <span className="long">Be the first to </span>leave a snack
            </>
          ) : (
            <>
              {totalFeedbackCount(response.value)} snacks
              <span className="long">
                {' '}
                left by {totalClients(response.value)} people
              </span>
            </>
          )}
          {response.state === 'loaded' ? '.' : ''}
        </>
      )}
    </div>
  )
}

function touchDistance(element: Element, touch: Touch): number {
  const rect = element.getBoundingClientRect()
  const dx = rect.left + rect.width / 2 - touch.clientX
  const dy = rect.top + rect.height / 2 - touch.clientY
  return Math.sqrt(dx * dx + dy * dy)
}

type TouchActions = {
  start?: (event: TouchEvent, touch: Touch) => void
  move?: (event: TouchEvent, touch: Touch) => void
  end?: (event: TouchEvent, touch: Touch) => void
  cancel?: (event: TouchEvent, touch: Touch) => void
}

function useTouchActions(
  ref: RefObject<EventTarget>,
  actions: TouchActions
): void {
  const actionsRef = useRef<TouchActions>(actions)
  actionsRef.current = actions

  useEffect(() => {
    const offs: Array<() => void> = []
    function on(
      node: EventTarget,
      event: string,
      handler: (event: any) => void
    ): () => void {
      node.addEventListener(event, handler)
      const off = () => {
        const idx = offs.indexOf(off)
        if (idx >= 0) {
          if (idx === offs.length - 1) {
            offs.pop()
          } else {
            offs[idx] = offs.pop() as any
          }
        }
        node.removeEventListener(event, handler)
      }
      offs.push(off)
      return off
    }

    function getTouch(event: TouchEvent, id: number): Touch | undefined {
      return Array.prototype.find.call(
        event.changedTouches,
        touch => touch.identifier === id
      )
    }

    if (!ref.current) {
      throw new Error('Missing touch ref')
    }

    on(ref.current, 'touchstart', (startEvent: TouchEvent) => {
      const startTouch = startEvent.changedTouches.item(0) as Touch
      const startTouchID = startTouch.identifier
      actionsRef.current.start &&
        actionsRef.current.start(startEvent, startTouch)
      const moveOff = on(window, 'touchmove', (moveEvent: TouchEvent) => {
        const moveTouch = getTouch(moveEvent, startTouchID)
        if (moveTouch) {
          actionsRef.current.move &&
            actionsRef.current.move(moveEvent, moveTouch)
        }
      })
      const endOff = on(window, 'touchend', (endEvent: TouchEvent) => {
        const endTouch = getTouch(endEvent, startTouchID)
        if (endTouch) {
          moveOff()
          endOff()
          cancelOff()
          actionsRef.current.end && actionsRef.current.end(endEvent, endTouch)
        }
      })
      const cancelOff = on(window, 'touchcancel', (cancelEvent: TouchEvent) => {
        const cancelTouch = getTouch(cancelEvent, startTouchID)
        if (cancelTouch) {
          moveOff()
          endOff()
          cancelOff()
          actionsRef.current.cancel &&
            actionsRef.current.cancel(cancelEvent, cancelTouch)
        }
      })
    })

    return () => offs.forEach(off => off())
  }, [])
}

function clientFeedbackCount(feedback: AsyncFeedback): number {
  return (
    ('value' in feedback &&
      feedback.value.nativeFeedback.clientFeedbackCount) ||
    0
  )
}

function totalFeedbackCount(feedback: FeedbackResponse): number {
  const { mediumFeedback, nativeFeedback } = feedback
  return (
    (mediumFeedback ? mediumFeedback.clapCount : 0) +
    nativeFeedback.totalFeedbackCount
  )
}

function totalClients(feedback: FeedbackResponse): number {
  const { mediumFeedback, nativeFeedback } = feedback
  return (
    (mediumFeedback ? mediumFeedback.voterCount : 0) +
    nativeFeedback.totalClients
  )
}

const SNACKS = [
  '🍇',
  '🍈',
  '🍉',
  '🍊',
  '🍋',
  '🍌',
  '🍍',
  '🥭',
  '🍎',
  '🍏',
  '🍐',
  '🍑',
  '🍒',
  '🍓',
  '🥝',
  '🥐',
  '🥨',
  '🥞',
  '🧀',
  '🍗',
  '🍔',
  '🍟',
  '🍕',
  '🌭',
  '🥪',
  '🌮',
  '🌯',
  '🥙',
  '🍿',
  '🍘',
  '🍙',
  '🍢',
  '🍣',
  '🥮',
  '🍡',
  '🥟',
  '🥠',
  '🍦',
  '🍧',
  '🍨',
  '🍩',
  '🍪',
  '🍰',
  '🧁',
  '🥧',
  '🍫',
  '🍬',
  '🍭',
  '🍮'
]

function getEmoji(count: number): string {
  return SNACKS[(count * 279470273 + 43) % SNACKS.length]
}

type AsyncFeedback =
  | {
      state: 'loading'
      nonce?: string
    }
  | {
      state: 'optimistic'
      nonce?: string
      value: FeedbackResponse
    }
  | {
      state: 'loaded'
      value: FeedbackResponse
    }
  | {
      state: 'error'
      error: Error
    }

export type FeedbackResponse = {
  nonce?: string
  nativeFeedback: NativeFeedback
  mediumFeedback?: MediumPostFeedback
}

export type NativeFeedback = {
  now: { '@ts': string }
  totalClients: number
  totalFeedbackCount: number
  clientFeedbackCount?: number
}

export type MediumPostFeedback = {
  clapCount: number
  voterCount: number
}

function useFeedback(
  article: string
): [AsyncFeedback, (updater: (prevCount: number) => number) => void] {
  const cacheKey = `feedback:${article}`
  const [response, setResponse] = useState<AsyncFeedback>({ state: 'loading' })
  const signalRef = useRef<AbortSignal | undefined>()
  useEffect(() => {
    const controller = new AbortController()
    signalRef.current = controller.signal
    return () => {
      controller.abort()
    }
  }, [article])

  useEffect(() => {
    const cacheValue = localStorageGet(cacheKey)
    if (cacheValue) {
      setResponse({ state: 'optimistic', value: cacheValue })
    }
    fetchFeedback(article, signalRef.current).then(
      value => {
        setResponse({
          state: 'loaded',
          value:
            // If get response is newer, merge it into the cached response,
            // otherwise just used the cached response directly.
            cacheValue
              ? new Date(value.nativeFeedback.now['@ts']) >
                new Date(cacheValue.nativeFeedback.now['@ts'])
                ? mergeDeep(cacheValue, value)
                : cacheValue
              : value
        })
      },
      error => {
        if (error.name !== 'AbortError') {
          setResponse({ state: 'error', error })
        }
      }
    )
  }, [article])

  const updateCount = (updater: (prevCount: number) => number) => {
    const nonce = makeUUID()
    const count = updater(clientFeedbackCount(response))
    let optimisticValue: FeedbackResponse | undefined
    if ('value' in response) {
      // Compute an optimistic value based on merging in the new count
      const {
        totalClients,
        totalFeedbackCount,
        clientFeedbackCount
      } = response.value.nativeFeedback
      optimisticValue = mergeDeep(response.value, {
        nativeFeedback: {
          now: { '@ts': new Date().toISOString() },
          totalClients:
            totalClients -
            (count === 0 ? 1 : 0) +
            (clientFeedbackCount ? 0 : 1),
          totalFeedbackCount:
            totalFeedbackCount + count - (clientFeedbackCount || 0),
          clientFeedbackCount: count
        }
      })
      setResponse({ state: 'optimistic', nonce, value: optimisticValue })
    } else {
      setResponse({ state: 'loading', nonce })
    }

    debouncedPostFeedback(article, count, nonce, signalRef.current).then(
      value => {
        // Merge post feedback into the optimistic value
        const mergedValue = optimisticValue
          ? mergeDeep(optimisticValue, value)
          : value
        localStorageSet(cacheKey, mergedValue)
        setResponse(prev =>
          // Check nonce before setting state in case this request is old
          prev && 'nonce' in prev && prev.nonce !== nonce
            ? prev
            : { state: 'loaded', value: mergedValue }
        )
      },
      error => {
        if (error.name !== 'AbortError') {
          setResponse(prev =>
            // Check nonce before setting state in case this request is old
            prev && 'nonce' in prev && prev.nonce !== nonce
              ? prev
              : { state: 'error', error }
          )
        }
      }
    )
  }

  return [response, updateCount]
}

function localStorageSet(key: string, value: any) {
  if (typeof localStorage === 'object') {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(error)
    }
  }
}

function localStorageGet(key: string) {
  if (typeof localStorage === 'object') {
    try {
      const raw = localStorage.getItem(key)
      if (raw !== null) {
        try {
          return JSON.parse(raw)
        } catch {
          return raw
        }
      }
    } catch (error) {
      console.error(error)
    }
  }
  return null
}

function mergeDeep<T>(...objs: T[]): T {
  const into: T = {} as any
  for (let i = 0; i < objs.length; i++) {
    const obj = objs[i]
    for (const key in obj) {
      into[key] =
        typeof into[key] === 'object' && typeof obj[key] === 'object'
          ? mergeDeep(into[key], obj[key])
          : obj[key]
    }
  }
  return into
}

// Create a sticky UUID to represent this client
function getClientUUID(): string {
  const local = localStorageGet('uuid')
  const cookieMatch = /uuid=(.+?);/.exec(document.cookie)
  const cookie = cookieMatch && decodeURIComponent(cookieMatch[1])
  const uuid = local || cookie || makeUUID()
  if (local !== uuid) {
    localStorageSet('uuid', uuid)
  }
  if (cookie !== uuid) {
    document.cookie = `uuid=${uuid}; path=/; expires=Fri, 31 Dec 9999 23:59:59 GMT`
  }
  return uuid
}

// Create a v4 uuid
function makeUUID(): string {
  return '00000000-0000-4000-8000-000000000000'.replace(/[08]/g, (a: any) =>
    (a ^ ((Math.random() * 16) >> (a / 4))).toString(16)
  )
}

async function fetchFeedback(
  article: string,
  signal: AbortSignal | undefined
): Promise<FeedbackResponse> {
  const response = await fetch(
    `${API_HOST}/api/article/${encodeURIComponent(article)}/feedback`,
    {
      mode: 'cors',
      headers: { Accept: 'application/json' },
      signal
    }
  )
  if (response.ok) {
    return await response.json()
  }
  throw new Error(await response.text())
}

const DEBOUNCE_TIME = 1500
let lastCall: NodeJS.Timeout
function debouncedPostFeedback(
  article: string,
  count: number | null,
  nonce: string,
  signal: AbortSignal | undefined
): Promise<FeedbackResponse> {
  return new Promise(resolve => {
    clearTimeout(lastCall)
    lastCall = setTimeout(() => {
      resolve(postFeedback(article, count, nonce, signal))
    }, DEBOUNCE_TIME)
  })
}

async function postFeedback(
  article: string,
  count: number | null,
  nonce: string,
  signal: AbortSignal | undefined
): Promise<FeedbackResponse> {
  const response = await fetch(
    `${API_HOST}/api/article/${encodeURIComponent(article)}/feedback`,
    {
      method: 'POST',
      mode: 'cors',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ nonce, count, client: getClientUUID() }),
      signal
    }
  )
  if (response.ok) {
    return await response.json()
  }
  throw new Error(await response.text())
}
