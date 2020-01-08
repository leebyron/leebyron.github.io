import React from 'react'
import ReactDOM from 'react-dom'
import { renderToString } from 'react-dom/server'
import { act } from 'react-dom/test-utils'
import { SharedHooksProvider, useShared, useLocal } from '../useShared'
import {
  useSharedState,
  useSharedReducer,
  useSharedEffect,
  useSharedLayoutEffect,
  useSharedMemo,
  useSharedCallback,
  useSharedRef
} from '../sharedHooks'

function createContainer(): HTMLDivElement {
  const container = document.createElement('div')

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

  return container
}

function inDevAndProd(builder: () => void) {
  // @ts-ignore
  const jestIt = global.it
  // @ts-ignore
  global.it = (name, test) => itInDevAndProd(jestIt, name, test)
  // @ts-ignore
  global.it.only = (name, test) => itInDevAndProd(jestIt.only, name, test)

  builder()

  // @ts-ignore
  global.it = jestIt
  // @ts-ignore
  function itInDevAndProd(it, name, test) {
    it(name + ' [dev]', test)
    it(name + ' [prod]', () => {
      const prevEnv = process.env
      try {
        process.env = { ...prevEnv, NODE_ENV: 'production' }
        test()
      } finally {
        process.env = prevEnv
      }
    })
  }
}

function trackHooksUsed<T>(into: Array<string>, builder: () => T): T {
  const ReactCurrentDispatcher =
    // @ts-ignore
    React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
      .ReactCurrentDispatcher
  const prevDispatcher = ReactCurrentDispatcher.current
  try {
    ReactCurrentDispatcher.current = { ...prevDispatcher }
    for (const hookName in prevDispatcher) {
      ReactCurrentDispatcher.current[hookName] = function tracker() {
        into.push(hookName)
        return prevDispatcher[hookName].apply(null, arguments)
      }
    }
    return builder()
  } finally {
    ReactCurrentDispatcher.current = prevDispatcher
  }
}

let container: HTMLDivElement

beforeEach(() => {
  container = createContainer()
  document.body.appendChild(container)
  // Avoid repeated console spew from errors
  window.addEventListener('error', preventDefault)
  // @ts-ignore
  console.nativeWarn = console.warn
  // @ts-ignore
  console.nativeError = console.error
  console.warn = jest.fn()
  console.error = jest.fn()
})

afterEach(() => {
  try {
    if (container) {
      act(() => {
        ReactDOM.unmountComponentAtNode(container)
      })
      container.remove()
    }
    window.removeEventListener('error', preventDefault)
    expect(console.warn).not.toHaveBeenCalled()
    expect(console.error).not.toHaveBeenCalled()
  } finally {
    // @ts-ignore
    console.warn = console.nativeWarn
    // @ts-ignore
    console.error = console.nativeError
  }
})

function preventDefault(event: ErrorEvent) {
  event.preventDefault()
}

class ErrorBoundary extends React.Component {
  static caughtError: Error | null = null

  static getDerivedStateFromError(error: Error) {
    ErrorBoundary.caughtError = error
    return {}
  }

  render() {
    return ErrorBoundary.caughtError
      ? String(ErrorBoundary.caughtError)
      : this.props.children
  }
}

function render(element: React.ReactElement) {
  ErrorBoundary.caughtError = null
  act(() => {
    ReactDOM.render(<ErrorBoundary>{element}</ErrorBoundary>, container)
  })
  const caughtError = ErrorBoundary.caughtError
  if (caughtError) {
    ErrorBoundary.caughtError = null
    throw caughtError
  }
}

function renderSSR(element: React.ReactElement): string {
  const globalWindow = Reflect.getOwnPropertyDescriptor(global, 'window')
  try {
    // @ts-ignore Remove window during SSR
    delete global.window
    return renderToString(element)
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
  const resolveValue = (value: T) =>
    new Promise<void>(resolveOuter => {
      const promise = asyncValue.promise
      if (promise) {
        resolve(value)
      }
      resolveOuter(promise)
    })

  return [asyncValue, resolveValue]
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
    ReactDOM.unmountComponentAtNode(container)
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

    // React dev also logs a console error
    expect(console.error).toHaveBeenCalledTimes(1)
    // @ts-ignore
    console.error.mockClear()
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

describe('useLocal', () => {
  inDevAndProd(() => {
    it('can be used outside of a shared state', () => {
      function useCounter() {
        return useLocal(() => React.useState(0))
      }
      function Counter() {
        const [state, setState] = useCounter()
        return <div onClick={() => setState(i => i + 1)}>{state}</div>
      }

      render(<Counter />)
      expect(container.innerText).toEqual('0')
      click(container.firstElementChild)
      expect(container.innerText).toEqual('1')
    })
  })
})

describe('useSharedState', () => {
  it('uses a single useState native hook after shared set (in dev)', () => {
    const used: Array<string> = []
    function Component() {
      const [state] = trackHooksUsed(used, () => useSharedState('key', 'X'))
      return <div>{state}</div>
    }
    render(
      <SharedHooksProvider>
        <Component />
      </SharedHooksProvider>
    )
    expect(used).toEqual([
      'useDebugValue',
      'useContext',
      'useLayoutEffect',
      'useState'
    ])
  })

  inDevAndProd(() => {
    it('shares state across components', () => {
      function Clicker({ id }: { id: string }) {
        const [state, setState] = useSharedState('key', 'X')
        return (
          <div id={id} onClick={() => setState(id)}>
            {state}
          </div>
        )
      }
      function Component() {
        return (
          <>
            <Clicker id="A" />
            {'-'}
            <Clicker id="B" />
          </>
        )
      }
      render(
        <SharedHooksProvider>
          <Component />
        </SharedHooksProvider>
      )
      expect(container.innerText).toEqual('X-X')

      click(document.getElementById('A'))
      expect(container.innerText).toEqual('A-A')

      click(document.getElementById('B'))
      expect(container.innerText).toEqual('B-B')
    })

    it('allows for functions to update state', () => {
      function Counter({ id }: { id: string }) {
        const [state, setState] = useSharedState('key', 0)
        return (
          <div id={id} onClick={() => setState(i => i + 1)}>
            {state}
          </div>
        )
      }
      function Component() {
        return (
          <>
            <Counter id="A" />
            {'-'}
            <Counter id="B" />
          </>
        )
      }
      render(
        <SharedHooksProvider>
          <Component />
        </SharedHooksProvider>
      )
      expect(container.innerText).toEqual('0-0')

      click(document.getElementById('A'))
      expect(container.innerText).toEqual('1-1')

      click(document.getElementById('B'))
      expect(container.innerText).toEqual('2-2')
    })

    it('allows for functions to get initial state', () => {
      let initializerWasCalled: number = 0
      function Counter() {
        const [state] = useSharedState('key', () => {
          initializerWasCalled++
          return 10
        })
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
      render(
        <SharedHooksProvider>
          <Component />
        </SharedHooksProvider>
      )
      expect(container.innerText).toEqual('10-10')
      expect(initializerWasCalled).toEqual(1)
    })

    it('update with same value does not cause re-render', () => {
      let renderWasCalled = 0
      let setStateWasCalled = 0
      function Clicker({ id }: { id: string }) {
        renderWasCalled++
        const [state, setState] = useSharedState('key', 'X')
        return (
          <div
            id={id}
            onClick={() =>
              setState(() => {
                setStateWasCalled++
                return id
              })
            }
          >
            {state}
          </div>
        )
      }
      function Component() {
        return (
          <>
            <Clicker id="A" />
            {'-'}
            <Clicker id="B" />
          </>
        )
      }
      render(
        <SharedHooksProvider>
          <Component />
        </SharedHooksProvider>
      )
      expect(container.innerText).toEqual('X-X')
      expect(renderWasCalled).toEqual(2)

      renderWasCalled = 0
      click(document.getElementById('A'))
      expect(container.innerText).toEqual('A-A')
      expect(renderWasCalled).toEqual(2)
      expect(setStateWasCalled).toEqual(1)

      renderWasCalled = 0
      setStateWasCalled = 0
      click(document.getElementById('A'))
      expect(container.innerText).toEqual('A-A')
      expect(renderWasCalled).toEqual(0)
      expect(setStateWasCalled).toEqual(1)
    })

    it('clears state when all unmount', () => {
      function Counter() {
        const [state, setState] = useSharedState('key', 0)
        return <div onClick={() => setState(i => i + 1)}>{state}</div>
      }
      function Component({
        first,
        second
      }: {
        first: boolean
        second: boolean
      }) {
        return (
          <>
            {first && <Counter />} {second && <Counter />}
          </>
        )
      }
      render(
        <SharedHooksProvider>
          <Component first={true} second={true} />
        </SharedHooksProvider>
      )
      expect(container.innerText).toEqual('0 0')

      // Click first counter
      click(container.firstElementChild)
      expect(container.innerText).toEqual('1 1')

      render(
        <SharedHooksProvider>
          <Component first={false} second={true} />
        </SharedHooksProvider>
      )
      expect(container.innerText).toEqual(' 1')

      render(
        <SharedHooksProvider>
          <Component first={true} second={false} />
        </SharedHooksProvider>
      )
      expect(container.innerText).toEqual('1 ')

      render(
        <SharedHooksProvider>
          <Component first={false} second={true} />
        </SharedHooksProvider>
      )
      expect(container.innerText).toEqual(' 1')

      render(
        <SharedHooksProvider>
          <Component first={true} second={true} />
        </SharedHooksProvider>
      )
      expect(container.innerText).toEqual('1 1')

      render(
        <SharedHooksProvider>
          <Component first={false} second={false} />
        </SharedHooksProvider>
      )
      expect(container.innerText).toEqual(' ')

      render(
        <SharedHooksProvider>
          <Component first={true} second={true} />
        </SharedHooksProvider>
      )
      expect(container.innerText).toEqual('0 0')

      // Click first counter
      click(container.firstElementChild)
      expect(container.innerText).toEqual('1 1')

      render(<div />)
      expect(container.innerText).toEqual('')

      render(
        <SharedHooksProvider>
          <Component first={true} second={true} />
        </SharedHooksProvider>
      )
      expect(container.innerText).toEqual('0 0')
    })

    it('does not clear state if remounted in same transaction', () => {
      function Counter() {
        const [state, setState] = useSharedState('key', 0)
        return <div onClick={() => setState(i => i + 1)}>{state}</div>
      }
      render(
        <SharedHooksProvider>
          <Counter key="A" />
        </SharedHooksProvider>
      )
      expect(container.innerText).toEqual('0')

      // Click first counter
      click(container.firstElementChild)
      expect(container.innerText).toEqual('1')

      render(
        <SharedHooksProvider>
          <Counter key="B" />
        </SharedHooksProvider>
      )
      expect(container.innerText).toEqual('1')
    })

    describe('update in render', () => {
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
            <Counter /> <Counter />
          </>
        )
      }

      it('supports update-in-render', () => {
        render(
          <SharedHooksProvider>
            <Component />
          </SharedHooksProvider>
        )
        expect(container.innerText).toEqual('2 2')
      })

      it('SSR will not update previous elements after update-in-render', () => {
        const ssr = renderSSR(
          <SharedHooksProvider>
            <Component />
          </SharedHooksProvider>
        )
        container.innerHTML = ssr
        expect(container.innerText).toEqual('1 2')

        // A client-side hydration will apply effects to unify the state.
        act(() => {
          ReactDOM.hydrate(
            <SharedHooksProvider>
              <Component />
            </SharedHooksProvider>,
            container
          )
        })
        expect(container.innerText).toEqual('2 2')
      })
    })

    it('supports nested useShared', () => {
      function useCustom(): [string, () => void] {
        const [stateA, setStateA] = React.useState(1)
        const [stateB, setStateB] = useSharedState('key', 1)
        const [stateC, setStateC] = React.useState(1)
        function increment() {
          setStateA(n => n + 1)
          setStateB(n => n + 1)
          setStateC(n => n + 1)
        }
        return [`${stateA}-${stateB}-${stateC}`, increment]
      }

      function Counter({ k, id }: { k: string; id: string }) {
        const [state, increment] = useShared(k, useCustom)
        return (
          <div id={id} onClick={() => increment()}>
            {state}
          </div>
        )
      }

      function Component() {
        return (
          <>
            <Counter k="a" id="a1" /> <Counter k="a" id="a2" />{' '}
            <Counter k="b" id="b1" /> <Counter k="b" id="b2" />
          </>
        )
      }

      render(
        <SharedHooksProvider>
          <Component />
        </SharedHooksProvider>
      )
      expect(container.innerText).toEqual('1-1-1 1-1-1 1-1-1 1-1-1')
      click(document.getElementById('a1'))
      expect(container.innerText).toEqual('2-2-2 2-2-2 1-2-1 1-2-1')
    })

    it('supports nested useLocal', () => {
      function useCustom(): [string, () => void] {
        const [stateA, setStateA] = React.useState(1)
        const [stateB, setStateB] = useLocal(() => React.useState(1))
        function increment() {
          setStateA(n => n + 1)
          setStateB(n => n + 1)
        }
        return [`${stateA}-${stateB}`, increment]
      }

      function Counter({ id }: { id: string }) {
        const [state, increment] = useShared('key', useCustom)
        return (
          <div id={id} onClick={() => increment()}>
            {state}
          </div>
        )
      }

      function Component() {
        return (
          <>
            <Counter id="a" /> <Counter id="b" />
          </>
        )
      }

      render(
        <SharedHooksProvider>
          <Component />
        </SharedHooksProvider>
      )
      expect(container.innerText).toEqual('1-1 1-1')
      click(document.getElementById('a'))
      expect(container.innerText).toEqual('2-2 2-1')
    })

    describe('cleanup', () => {
      function useCounter() {
        return React.useState(0)
      }
      function Thrower(): null {
        const [state] = useShared('key', useCounter)
        throw new Error(`Thrower-${state}`)
      }
      function Advancer() {
        const [state, setState] = useShared('key', useCounter)
        const ref = React.useRef(false)
        if (!ref.current) {
          ref.current = true
          setState(n => n + 1)
        }
        return <div>Advancer-{state}</div>
      }
      class Catcher extends React.Component {
        state: { error?: Error } = {}
        static getDerivedStateFromError(error: Error) {
          return { error }
        }
        render() {
          return this.state.error
            ? this.state.error.message
            : this.props.children
        }
      }

      it('cleans up if a component fails to mount', () => {
        render(
          <SharedHooksProvider>
            <Catcher>
              <Advancer />
              <Thrower />
            </Catcher>
          </SharedHooksProvider>
        )
        expect(container.innerText).toEqual('Thrower-1')
        render(
          <SharedHooksProvider>
            <Advancer />
          </SharedHooksProvider>
        )
        expect(container.innerText).toEqual('Advancer-1')
      })

      it('cleans up if a sibling component throws during render', () => {
        render(
          <SharedHooksProvider>
            <Advancer />
            <Catcher>
              <Advancer />
              <Thrower />
            </Catcher>
          </SharedHooksProvider>
        )
        expect(container.innerText).toEqual('Advancer-2Thrower-2')

        // Unmount and remount shows proper reset of state
        render(<SharedHooksProvider />)
        render(
          <SharedHooksProvider>
            <Advancer />
            <Catcher>
              <Advancer />
              <Thrower />
            </Catcher>
          </SharedHooksProvider>
        )
        expect(container.innerText).toEqual('Advancer-2Thrower-2')
      })
    })

    // describe('suspense', () => {
    //   it('not sure what is being tested just yet', async () => {
    //     console.log('suspense test from', process.env.NODE_ENV)
    //     const [asyncVal, resolveVal] = createSuspender<string>()
    //     function Suspender() {
    //       const [state, setState] = useSharedState('key', () => {
    //         console.log('init shared state')
    //         return 0
    //       })
    //       React.useState(() => {
    //         console.log('init local state')
    //         return 0
    //       })
    //       console.log('rendering with asyncValue', asyncVal)
    //       if (asyncVal.loading) {
    //         throw asyncVal.promise
    //       }
    //       const r = React.useRef<boolean>(false)
    //       if (!r.current) {
    //         r.current = true
    //         setState(n => n + 1)
    //       }
    //       return (
    //         <div>
    //           {asyncVal.value}-{state}
    //         </div>
    //       )
    //     }
    //     function Counter() {
    //       const [state, setState] = useSharedState('key', 0)
    //       return <div onClick={() => setState(n => n + 1)}>Counter-{state}</div>
    //     }
    //     function Unrelated() {
    //       const [state, setState] = useSharedState('key2', () => {
    //         //console.log('init unrelated shared state')
    //         return 0
    //       })
    //       React.useState(() => {
    //         //console.log('init unrelated local state')
    //         return 0
    //       })
    //       const r = React.useRef<boolean>(false)
    //       if (!r.current) {
    //         r.current = true
    //         setState(n => n + 1)
    //       }
    //       return <div>Unrelated-{state}</div>
    //     }
    //     function Component() {
    //       return (<>
    //         <Counter />{' '}
    //         <React.Suspense fallback="loading...">
    //           <Suspender /> <Unrelated /> <Counter />
    //         </React.Suspense>
    //         </>
    //       )
    //     }
    //     //console.log('step 1')
    //     render(
    //       <SharedHooksProvider>
    //         <Component />
    //       </SharedHooksProvider>
    //     )
    //     console.log(container.innerHTML)
    //     expect(container.innerText).toEqual('Counter-0 loading...')

    //     console.log('clicking')
    //     click(container.firstElementChild)
    //     expect(container.innerText).toEqual('Counter-1 loading...')

    //     //console.log('step 2')
    //     console.log('...resolving...')
    //     await act(async () => {
    //       await resolveVal('loaded')
    //     })
    //     console.log(container.innerHTML)
    //     expect(container.innerText).toEqual('Counter-2 loaded-2 Unrelated-1 Counter-2')

    //     await new Promise(setImmediate)

    //     //console.log('step 3')
    //   })
    // })
  })
})

describe('useSharedReducer', () => {
  it('uses a single useReducer native hook after shared set (in dev)', () => {
    const used: Array<string> = []
    function Component() {
      const [state] = trackHooksUsed(used, () =>
        useSharedReducer('key', s => s, 'X')
      )
      return <div>{state}</div>
    }
    render(
      <SharedHooksProvider>
        <Component />
      </SharedHooksProvider>
    )
    expect(used).toEqual([
      'useDebugValue',
      'useContext',
      'useLayoutEffect',
      'useReducer'
    ])
  })

  inDevAndProd(() => {
    function sum(state: number, action: number): number {
      return state + action
    }

    it('shares state across components', () => {
      function Counter() {
        const [state, addState] = useSharedReducer('key', sum, 0)
        return <div onClick={() => addState(1)}>{state}</div>
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

    it('calls initializer once', () => {
      function initializer(n: number): number {
        return n + 10
      }
      function Counter() {
        const [state, addState] = useSharedReducer('key', sum, 0, initializer)
        return <div onClick={() => addState(1)}>{state}</div>
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
      expect(container.innerText).toEqual('10-10')

      // Click first counter
      click(container.firstElementChild)
      expect(container.innerText).toEqual('11-11')
    })

    it('update with same value does not cause re-render', () => {
      let renderWasCalled = 0
      function Clicker({ id }: { id: string }) {
        renderWasCalled++
        const [state, setState] = useSharedReducer('key', (_, a) => a, 'X')
        return (
          <div id={id} onClick={() => setState(id)}>
            {state}
          </div>
        )
      }
      function Component() {
        return (
          <>
            <Clicker id="A" />
            {'-'}
            <Clicker id="B" />
          </>
        )
      }
      render(
        <SharedHooksProvider>
          <Component />
        </SharedHooksProvider>
      )
      expect(container.innerText).toEqual('X-X')
      expect(renderWasCalled).toEqual(2)

      renderWasCalled = 0
      click(document.getElementById('A'))
      expect(container.innerText).toEqual('A-A')
      expect(renderWasCalled).toEqual(2)

      renderWasCalled = 0
      click(document.getElementById('A'))
      expect(container.innerText).toEqual('A-A')
      expect(renderWasCalled).toEqual(0)
    })

    it('clears state when all unmount', () => {
      function Counter() {
        const [state, addState] = useSharedReducer('key', sum, 0)
        return <div onClick={() => addState(1)}>{state}</div>
      }
      function Component({
        first,
        second
      }: {
        first: boolean
        second: boolean
      }) {
        return (
          <>
            {first && <Counter />} {second && <Counter />}
          </>
        )
      }
      render(
        <SharedHooksProvider>
          <Component first={true} second={true} />
        </SharedHooksProvider>
      )
      expect(container.innerText).toEqual('0 0')

      // Click first counter
      click(container.firstElementChild)
      expect(container.innerText).toEqual('1 1')

      render(
        <SharedHooksProvider>
          <Component first={false} second={true} />
        </SharedHooksProvider>
      )
      expect(container.innerText).toEqual(' 1')

      render(
        <SharedHooksProvider>
          <Component first={true} second={false} />
        </SharedHooksProvider>
      )
      expect(container.innerText).toEqual('1 ')

      render(
        <SharedHooksProvider>
          <Component first={true} second={true} />
        </SharedHooksProvider>
      )
      expect(container.innerText).toEqual('1 1')

      render(
        <SharedHooksProvider>
          <Component first={false} second={false} />
        </SharedHooksProvider>
      )
      expect(container.innerText).toEqual(' ')

      render(
        <SharedHooksProvider>
          <Component first={true} second={true} />
        </SharedHooksProvider>
      )
      expect(container.innerText).toEqual('0 0')

      // Click first counter
      click(container.firstElementChild)
      expect(container.innerText).toEqual('1 1')

      render(<div />)
      expect(container.innerText).toEqual('')

      render(
        <SharedHooksProvider>
          <Component first={true} second={true} />
        </SharedHooksProvider>
      )
      expect(container.innerText).toEqual('0 0')
    })

    describe('update in render', () => {
      function Counter() {
        const [state, addState] = useSharedReducer('key', sum, 0)
        const ref = React.useRef(false)
        if (!ref.current) {
          ref.current = true
          addState(1)
        }
        return <div>{state}</div>
      }

      function Component() {
        return (
          <>
            <Counter /> <Counter />
          </>
        )
      }

      it('supports update-in-render', () => {
        render(
          <SharedHooksProvider>
            <Component />
          </SharedHooksProvider>
        )
        expect(container.innerText).toEqual('2 2')
      })

      it('SSR will not update previous elements after update-in-render', () => {
        const ssr = renderSSR(
          <SharedHooksProvider>
            <Component />
          </SharedHooksProvider>
        )
        container.innerHTML = ssr
        expect(container.innerText).toEqual('1 2')

        // A client-side hydration will apply effects to unify the state.
        act(() => {
          ReactDOM.hydrate(
            <SharedHooksProvider>
              <Component />
            </SharedHooksProvider>,
            container
          )
        })
        expect(container.innerText).toEqual('2 2')
      })
    })

    it('supports nested useShared', () => {
      function useCustom(): [string, () => void] {
        const [stateA, addStateA] = React.useReducer(sum, 1)
        const [stateB, addStateB] = useSharedReducer('key', sum, 1)
        const [stateC, addStateC] = React.useReducer(sum, 1)
        function increment() {
          addStateA(1)
          addStateB(1)
          addStateC(1)
        }
        return [`${stateA}-${stateB}-${stateC}`, increment]
      }

      function Counter({ k, id }: { k: string; id: string }) {
        const [state, increment] = useShared(k, useCustom)
        return (
          <div id={id} onClick={() => increment()}>
            {state}
          </div>
        )
      }

      function Component() {
        return (
          <>
            <Counter k="a" id="a1" /> <Counter k="a" id="a2" />{' '}
            <Counter k="b" id="b1" /> <Counter k="b" id="b2" />
          </>
        )
      }

      render(
        <SharedHooksProvider>
          <Component />
        </SharedHooksProvider>
      )
      expect(container.innerText).toEqual('1-1-1 1-1-1 1-1-1 1-1-1')
      click(document.getElementById('a1'))
      expect(container.innerText).toEqual('2-2-2 2-2-2 1-2-1 1-2-1')
    })

    it('supports nested useLocal', () => {
      function useCustom(): [string, () => void] {
        const [stateA, addStateA] = React.useReducer(sum, 1)
        const [stateB, addStateB] = useLocal(() => React.useReducer(sum, 1))
        function increment() {
          addStateA(1)
          addStateB(1)
        }
        return [`${stateA}-${stateB}`, increment]
      }

      function Counter({ id }: { id: string }) {
        const [state, increment] = useShared('key', useCustom)
        return (
          <div id={id} onClick={() => increment()}>
            {state}
          </div>
        )
      }

      function Component() {
        return (
          <>
            <Counter id="a" /> <Counter id="b" />
          </>
        )
      }

      render(
        <SharedHooksProvider>
          <Component />
        </SharedHooksProvider>
      )
      expect(container.innerText).toEqual('1-1 1-1')
      click(document.getElementById('a'))
      expect(container.innerText).toEqual('2-2 2-1')
    })
  })
})

for (const effectHook of ['useEffect', 'useLayoutEffect']) {
  const useSharedEffectHook =
    effectHook === 'useEffect' ? useSharedEffect : useSharedLayoutEffect
  describe(useSharedEffectHook.name, () => {
    it(`uses a single ${effectHook} native hook after shared set (in dev)`, () => {
      const used: Array<string> = []
      function Component() {
        trackHooksUsed(used, () => useSharedEffectHook('key', () => {}))
        return <div />
      }
      render(
        <SharedHooksProvider>
          <Component />
        </SharedHooksProvider>
      )
      expect(used).toEqual([
        'useDebugValue',
        'useContext',
        'useLayoutEffect',
        effectHook
      ])
    })

    describe('misuse', () => {
      it('throws if deps change type to undefined', () => {
        let deps: any = ['oops']
        function Component() {
          useSharedEffectHook('key', () => {}, deps)
          return <div />
        }
        render(
          <SharedHooksProvider>
            <Component />
          </SharedHooksProvider>
        )
        deps = undefined
        expect(() =>
          render(
            <SharedHooksProvider>
              <Component />
            </SharedHooksProvider>
          )
        ).toThrow(
          'useShared: The dependency list changed from [oops] to undefined. ' +
            'Even though it is optional the type cannot change between renders.'
        )
      })

      it('throws if deps change type from undefined', () => {
        let deps: any = undefined
        function Component() {
          useSharedEffectHook('key', () => {}, deps)
          return <div />
        }
        render(
          <SharedHooksProvider>
            <Component />
          </SharedHooksProvider>
        )
        deps = ['oops']
        expect(() =>
          render(
            <SharedHooksProvider>
              <Component />
            </SharedHooksProvider>
          )
        ).toThrow(
          'useShared: The dependency list changed from undefined to [oops]. ' +
            'Even though it is optional the type cannot change between renders.'
        )
      })

      it('throws if deps change size', () => {
        let deps: any = [1]
        function Component() {
          useSharedEffectHook('key', () => {}, deps)
          return <div />
        }
        render(
          <SharedHooksProvider>
            <Component />
          </SharedHooksProvider>
        )
        deps = [1, 2]
        expect(() =>
          render(
            <SharedHooksProvider>
              <Component />
            </SharedHooksProvider>
          )
        ).toThrow(
          'useShared: The dependency list changed from [1] to [1, 2]. ' +
            'The order and size of this array must remain constant.'
        )
      })
    })

    inDevAndProd(() => {
      it('mount/unmount effect called once, capturing initial state', () => {
        const effects: Array<string> = []
        function Effector({ id }: { id: string }) {
          useSharedEffectHook(
            'key',
            () => {
              effects.push(`mount from ${id}`)
              return () => {
                effects.push(`unmount from ${id}`)
              }
            },
            []
          )
          return null
        }
        function Component({
          first,
          second
        }: {
          first: boolean
          second: boolean
        }) {
          return (
            <>
              {first && <Effector id="first" />}
              {second && <Effector id="second" />}
            </>
          )
        }

        render(
          <SharedHooksProvider>
            <Component first={true} second={true} />
          </SharedHooksProvider>
        )
        expect(effects).toEqual(['mount from first'])
        effects.length = 0

        render(
          <SharedHooksProvider>
            <Component first={true} second={false} />
          </SharedHooksProvider>
        )
        expect(effects).toEqual([])

        render(
          <SharedHooksProvider>
            <Component first={false} second={true} />
          </SharedHooksProvider>
        )
        expect(effects).toEqual([])

        render(
          <SharedHooksProvider>
            <Component first={false} second={false} />
          </SharedHooksProvider>
        )
        expect(effects).toEqual(['unmount from first'])
        effects.length = 0

        render(
          <SharedHooksProvider>
            <Component first={false} second={true} />
          </SharedHooksProvider>
        )
        expect(effects).toEqual(['mount from second'])
        effects.length = 0

        render(<div />)
        expect(effects).toEqual(['unmount from second'])
      })

      it('always effect called once per render', () => {
        const effects: Array<string> = []
        function Effector({ id }: { id: string }) {
          useSharedEffectHook('key', () => {
            effects.push(`effect from ${id}`)
            return () => {
              effects.push(`cleanup from ${id}`)
            }
          })
          return null
        }
        function Component({
          first,
          second
        }: {
          first: boolean
          second: boolean
        }) {
          return (
            <>
              {first && <Effector id="first" />}
              {second && <Effector id="second" />}
            </>
          )
        }

        render(
          <SharedHooksProvider>
            <Component first={true} second={true} />
          </SharedHooksProvider>
        )
        expect(effects).toEqual(['effect from second'])
        effects.length = 0

        render(
          <SharedHooksProvider>
            <Component first={true} second={false} />
          </SharedHooksProvider>
        )
        expect(effects).toEqual(['cleanup from second', 'effect from first'])
        effects.length = 0

        render(
          <SharedHooksProvider>
            <Component first={false} second={true} />
          </SharedHooksProvider>
        )
        expect(effects).toEqual(['cleanup from first', 'effect from second'])
        effects.length = 0

        render(
          <SharedHooksProvider>
            <Component first={false} second={false} />
          </SharedHooksProvider>
        )
        expect(effects).toEqual(['cleanup from second'])
        effects.length = 0

        render(
          <SharedHooksProvider>
            <Component first={false} second={true} />
          </SharedHooksProvider>
        )
        expect(effects).toEqual(['effect from second'])
        effects.length = 0

        render(<div />)
        expect(effects).toEqual(['cleanup from second'])
      })

      it('calls all cleanups even if one throws', () => {
        const effects: Array<string> = []
        function Component() {
          useSharedEffect(
            'a',
            () => {
              effects.push('mount a')
              return () => {
                effects.push('unmount a')
                throw new Error('thrown from unmount a')
              }
            },
            []
          )
          useSharedEffect(
            'b',
            () => {
              effects.push('mount b')
              return () => {
                effects.push('unmount b')
              }
            },
            []
          )
          return <div />
        }

        render(
          <SharedHooksProvider>
            <Component />
          </SharedHooksProvider>
        )
        expect(effects).toEqual(['mount a', 'mount b'])
        effects.length = 0

        expect(() => {
          render(
            <SharedHooksProvider>
              <div />
            </SharedHooksProvider>
          )
        }).toThrow('thrown from unmount a')
        expect(effects).toEqual(['unmount a', 'unmount b'])
        effects.length = 0

        render(
          <SharedHooksProvider>
            <Component />
            <div />
          </SharedHooksProvider>
        )
        expect(effects).toEqual(['mount a', 'mount b'])
        effects.length = 0

        expect(() => {
          render(<div />)
        }).toThrow('thrown from unmount a')
        expect(effects).toEqual(['unmount a', 'unmount b'])
      })
    })
  })
}

describe('useSharedMemo', () => {
  it('uses a single useMemo native hook after shared set (in dev)', () => {
    const used: Array<string> = []
    function Component() {
      const memo: string = trackHooksUsed(used, () =>
        useSharedMemo('key', () => 'X', [])
      )
      return <div>{memo}</div>
    }
    render(
      <SharedHooksProvider>
        <Component />
      </SharedHooksProvider>
    )
    expect(used).toEqual([
      'useDebugValue',
      'useContext',
      'useLayoutEffect',
      'useMemo'
    ])
  })

  inDevAndProd(() => {
    it('memo created once per dep-list', () => {
      let renderWasCalled = 0
      let memoWasCalled = 0

      function WithMemo() {
        renderWasCalled++
        const memo = useSharedMemo(
          'key',
          () => {
            memoWasCalled++
            return 10
          },
          []
        )
        return <>{memo}</>
      }
      function Component() {
        return (
          <>
            <WithMemo /> <WithMemo />
          </>
        )
      }
      render(
        <SharedHooksProvider>
          <Component />
        </SharedHooksProvider>
      )
      expect(container.innerText).toEqual('10 10')
      expect(renderWasCalled).toBe(2)
      expect(memoWasCalled).toBe(1)

      render(
        <SharedHooksProvider>
          <Component />
        </SharedHooksProvider>
      )
      expect(container.innerText).toEqual('10 10')
      expect(renderWasCalled).toBe(4)
      expect(memoWasCalled).toBe(1)
    })

    it('updated if dep-list changes', () => {
      let renderWasCalled = 0
      let memoWasCalled = 0

      function WithMemo({ n }: { n: number }) {
        renderWasCalled++
        const memo = useSharedMemo(
          'key',
          () => {
            memoWasCalled++
            return n * 10
          },
          [n]
        )
        return <>{memo}</>
      }
      function Component({ n }: { n: number }) {
        return (
          <>
            <WithMemo n={n} /> <WithMemo n={n} />
          </>
        )
      }
      render(
        <SharedHooksProvider>
          <Component n={1} />
        </SharedHooksProvider>
      )
      expect(container.innerText).toEqual('10 10')
      expect(renderWasCalled).toBe(2)
      expect(memoWasCalled).toBe(1)

      render(
        <SharedHooksProvider>
          <Component n={1} />
        </SharedHooksProvider>
      )
      expect(container.innerText).toEqual('10 10')
      expect(renderWasCalled).toBe(4)
      expect(memoWasCalled).toBe(1)

      render(
        <SharedHooksProvider>
          <Component n={2} />
        </SharedHooksProvider>
      )
      expect(container.innerText).toEqual('20 20')
      expect(renderWasCalled).toBe(6)
      expect(memoWasCalled).toBe(2)
    })
  })
})

describe('useSharedCallback', () => {
  it('uses a single useCallback native hook after shared set (in dev)', () => {
    const used: Array<string> = []
    function Component() {
      const memo: () => string = trackHooksUsed(used, () =>
        useSharedCallback('key', () => 'X', [])
      )
      return <div>{memo()}</div>
    }
    render(
      <SharedHooksProvider>
        <Component />
      </SharedHooksProvider>
    )
    expect(used).toEqual([
      'useDebugValue',
      'useContext',
      'useLayoutEffect',
      'useCallback'
    ])
  })

  inDevAndProd(() => {
    it('callback created once per dep-list', () => {
      let renderWasCalled = 0
      let uniqueCallbacks = new Set()

      function WithCallback() {
        renderWasCalled++
        const callback = useSharedCallback('key', () => {}, [])
        uniqueCallbacks.add(callback)
        return <div onClick={callback} />
      }
      function Component() {
        return (
          <>
            <WithCallback /> <WithCallback />
          </>
        )
      }
      render(
        <SharedHooksProvider>
          <Component />
        </SharedHooksProvider>
      )
      expect(renderWasCalled).toBe(2)
      expect(uniqueCallbacks.size).toBe(1)

      render(
        <SharedHooksProvider>
          <Component />
        </SharedHooksProvider>
      )
      expect(renderWasCalled).toBe(4)
      expect(uniqueCallbacks.size).toBe(1)
    })

    it('updated if dep-list changes', () => {
      let renderWasCalled = 0
      let uniqueCallbacks = new Set()

      function WithCallback({ n }: { n: number }) {
        renderWasCalled++
        const callback = useSharedCallback('key', () => {}, [n])
        uniqueCallbacks.add(callback)
        return <div onClick={callback} />
      }
      function Component({ n }: { n: number }) {
        return (
          <>
            <WithCallback n={n} /> <WithCallback n={n} />
          </>
        )
      }
      render(
        <SharedHooksProvider>
          <Component n={1} />
        </SharedHooksProvider>
      )
      expect(renderWasCalled).toBe(2)
      expect(uniqueCallbacks.size).toBe(1)

      render(
        <SharedHooksProvider>
          <Component n={1} />
        </SharedHooksProvider>
      )
      expect(renderWasCalled).toBe(4)
      expect(uniqueCallbacks.size).toBe(1)

      render(
        <SharedHooksProvider>
          <Component n={2} />
        </SharedHooksProvider>
      )
      expect(renderWasCalled).toBe(6)
      expect(uniqueCallbacks.size).toBe(2)
    })
  })
})

describe('useSharedRef', () => {
  it('uses a single useMemo native hook after shared set (in dev)', () => {
    const used: Array<string> = []
    function Component() {
      const ref = trackHooksUsed(used, () => useSharedRef('key', 'X'))
      return <div>{ref.current}</div>
    }
    render(
      <SharedHooksProvider>
        <Component />
      </SharedHooksProvider>
    )
    expect(used).toEqual([
      'useDebugValue',
      'useContext',
      'useLayoutEffect',
      'useRef'
    ])
  })

  inDevAndProd(() => {
    it('ref created once, capturing initial state', () => {
      let renderedRef: React.MutableRefObject<number> = { current: 0 }

      function WithRef() {
        const ref = useSharedRef('key', 10)
        renderedRef = ref
        ref.current++
        return <>{ref.current}</>
      }
      function Component() {
        return (
          <>
            <WithRef /> <WithRef />
          </>
        )
      }
      render(
        <SharedHooksProvider>
          <Component />
        </SharedHooksProvider>
      )
      expect(container.innerText).toEqual('11 12')

      // Update doesn't force a render
      act(() => {
        renderedRef.current = 20
      })
      expect(container.innerText).toEqual('11 12')

      // But subsequent render will pick up the value.
      render(
        <SharedHooksProvider>
          <Component />
        </SharedHooksProvider>
      )
      expect(container.innerText).toEqual('21 22')
    })
  })
})
