import React from 'react'
import { render as renderDOM, unmountComponentAtNode } from 'react-dom'
import { renderToString } from 'react-dom/server'
import { act } from 'react-dom/test-utils'
import { SharedHooksProvider, useShared } from '../useShared'
import { useSharedState } from '../sharedHooks'

let container = document.createElement('div')

// TODO: this should really be part of whatever DOM shim Jest uses
const htmlProto = Object.getPrototypeOf(container)
if (!Reflect.getOwnPropertyDescriptor(htmlProto, 'innerText')) {
  const HIDDEN_TYPES = { style: true, script: true, head: true, link: true }
  Object.defineProperty(htmlProto, 'innerText', {
    configurable: true,
    get() {
      let innerText = ''
      const stack: Array<Node> = [this]
      let node
      while ((node = stack.pop())) {
        switch (node.nodeType) {
          case Node.TEXT_NODE:
            innerText += node.nodeValue
            break
          case Node.ELEMENT_NODE:
            const style = (node as Element).getAttribute('style')
            if (
              !(node.nodeName in HIDDEN_TYPES) &&
              (node as Element).getAttribute('hidden') === null &&
              (!style || !/display: *none/.test(style))
            ) {
              const children = node.childNodes
              for (let i = children.length - 1; i >= 0; i--) {
                stack.push(children[i])
              }
            }
            break
        }
      }
      return innerText
    }
  })
}

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
  // Avoid repeated console spew from errors
  window.addEventListener('error', preventDefault)
})

afterEach(() => {
  if (container) {
    unmountComponentAtNode(container)
    container.remove()
  }
  window.removeEventListener('error', preventDefault)
})

function preventDefault(event: Event) {
  event.preventDefault()
}

function render(element: React.ReactElement) {
  let caughtError: Error | undefined

  class ErrorBoundary extends React.Component {
    state = { error: null }

    static getDerivedStateFromError(error: Error) {
      return { error }
    }

    componentDidCatch(error: Error) {
      caughtError = error
    }

    render() {
      return this.state.error ? String(this.state.error) : this.props.children
    }
  }

  act(() => {
    renderDOM(<ErrorBoundary>{element}</ErrorBoundary>, container)
  })

  if (caughtError) {
    throw caughtError
  }
}

function ssrRender(element: React.ReactElement): string {
  const globalWindow = Reflect.getOwnPropertyDescriptor(global, 'window')
  try {
    // @ts-ignore Remove window during SSR
    delete global.window
    return renderToString(<SharedHooksProvider>{element}</SharedHooksProvider>)
  } finally {
    if (globalWindow) {
      Object.defineProperty(global, 'window', globalWindow)
    }
  }
}

function click(element: Element | null) {
  act(() => {
    if (element) {
      element.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    }
  })
}

type AsyncValue<T> =
  | { loading: true; promise: Promise<void>; value?: T }
  | { loading: false; value: T }

function createSuspender<T>(): [AsyncValue<T>, (value: T) => Promise<void>] {
  let resolve: (value: T) => void
  const asyncValue: AsyncValue<T> = {
    loading: true,
    promise: new Promise<T>(_resolve => {
      resolve = _resolve
    }).then(value => {
      // @ts-ignore
      delete asyncValue.promise
      asyncValue.loading = false
      asyncValue.value = value
    })
  }
  const resolveAct = (value: T) =>
    act(async () => {
      const promise = asyncValue.promise
      if (promise) {
        resolve(value)
        // Not sure why we need this. It seems like a bug in react-test-utils.
        await new Promise(setImmediate)
      }
    })

  return [asyncValue, resolveAct]
}

describe('misuse', () => {
  it('throws if called outside a component', () => {
    expect(() => {
      useShared('key', React.useRef)
    }).toThrow(
      'Invalid hook call. Hooks can only be called inside of the body of ' +
        'a function component.'
    )
  })

  it('throws if rendered outside a provider', () => {
    function Component() {
      useShared('key', React.useRef)
      return null
    }
    expect(() => render(<Component />)).toThrow(
      'useShared: Cannot use outside of <SharedHooksProvider>.'
    )
  })

  it('throws if hook function is not provided', () => {
    function Component() {
      // @ts-ignore
      useShared('key')
      return null
    }
    expect(() =>
      render(
        <SharedHooksProvider>
          <Component />
        </SharedHooksProvider>
      )
    ).toThrow('useShared: Second argument must be a hook function.')
  })

  it('throws if different number of hooks are used per render', () => {
    function Component() {
      useShared('key', useBroken)
      return null
    }

    let useSecondRef = false
    function useBroken() {
      React.useRef()
      if (useSecondRef) {
        React.useRef()
      }
    }

    render(
      <SharedHooksProvider>
        <Component />
      </SharedHooksProvider>
    )
    useSecondRef = true
    expect(() =>
      render(
        <SharedHooksProvider>
          <Component />
        </SharedHooksProvider>
      )
    ).toThrow('Rendered more hooks than during the previous render.')
    unmountComponentAtNode(container)
    render(
      <SharedHooksProvider>
        <Component />
      </SharedHooksProvider>
    )
    useSecondRef = false
    expect(() =>
      render(
        <SharedHooksProvider>
          <Component />
        </SharedHooksProvider>
      )
    ).toThrow('Rendered fewer hooks than expected.')
  })

  it('throws if key is used in a nested hook', () => {
    function Component() {
      useShared('key', useA)
      return null
    }
    function useA() {
      useShared('key', useB)
    }
    function useB() {
      React.useRef()
    }
    expect(() =>
      render(
        <SharedHooksProvider>
          <Component />
        </SharedHooksProvider>
      )
    ).toThrow(
      'useShared: The same key cannot be used in a nested useShared call.'
    )
  })
})

describe('useSharedState', () => {
  it('shares state across components', () => {
    function Counter() {
      const [state, setState] = useSharedState('key', 0)
      return <div onClick={() => setState(i => i + 1)}>{state}</div>
    }
    function Component() {
      return (
        <>
          <Counter />
          {'-'}
          <Counter />
        </>
      )
    }
    render(
      <SharedHooksProvider>
        <Component />
      </SharedHooksProvider>
    )
    expect(container.innerText).toEqual('0-0')

    // Click first counter
    click(container.firstElementChild)
    expect(container.innerText).toEqual('1-1')
  })

  describe('update-in-render', () => {
    function Counter() {
      const [state, setState] = useSharedState('key', 0)
      const ref = React.useRef(false)
      if (!ref.current) {
        ref.current = true
        setState(i => i + 1)
      }
      return <div>{state}</div>
    }

    function Component() {
      return (
        <>
          <Counter />
          {'-'}
          <Counter />
        </>
      )
    }

    it('supports update-in-render', () => {
      render(
        <SharedHooksProvider>
          <Component />
        </SharedHooksProvider>
      )
      expect(container.innerText).toEqual('2-2')
    })

    it('SSR will not update previous elements after update-in-render', () => {
      const ssr = ssrRender(<Component />)
      container.innerHTML = ssr
      expect(container.innerText).toEqual('1-2')
    })
  })

  describe('suspense', () => {
    xit('hmm', async () => {
      const [asyncVal, resolve] = createSuspender<string>()
      function Counter() {
        const [state, setState] = useSharedState('key', () => {
          console.log('init shared state')
          return 0
        })
        React.useState(() => {
          console.log('init local state')
          return 0
        })
        console.log('rendering with asyncValue', asyncVal)
        if (asyncVal.loading) {
          throw asyncVal.promise
        }
        const r = React.useRef<boolean>(false)
        if (!r.current) {
          r.current = true
          setState(n => n + 1)
        }
        return (
          <div>
            Counter-{asyncVal.value}-{state}
          </div>
        )
      }
      function Unrelated() {
        const [state, setState] = useSharedState('key2', () => {
          //console.log('init unrelated shared state')
          return 0
        })
        React.useState(() => {
          //console.log('init unrelated local state')
          return 0
        })
        const r = React.useRef<boolean>(false)
        if (!r.current) {
          r.current = true
          setState(n => n + 1)
        }
        return <div>Unrelated-{state}</div>
      }
      function Component() {
        return (
          <div>
            <React.Suspense fallback={<div>loading...</div>}>
              ok
              <div>
                no way
                <Counter />
              </div>
              <div>
                wow
                <Unrelated />
              </div>
            </React.Suspense>
          </div>
        )
      }
      //console.log('step 1')
      render(
        <SharedHooksProvider>
          <Component />
        </SharedHooksProvider>
      )
      expect(container.innerText).toEqual('loading...')

      //console.log('step 2')
      await resolve('loaded')
      expect(container.innerText).toEqual('loaded-0')

      //console.log('step 3')
    })
  })
})
