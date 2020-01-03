import React from 'react'
import { render as renderDOM, unmountComponentAtNode } from 'react-dom'
import { act } from 'react-dom/test-utils'
import { SharedHooksProvider, useShared } from '../useShared'
import { useSharedState } from '../sharedHooks'

let container: HTMLDivElement

beforeAll(() => {
  global.console.warn = function() {}
  global.console.error = function() {}
})

beforeEach(() => {
  container = document.createElement('div')
  document.body.appendChild(container)
})

afterEach(() => {
  if (container) {
    unmountComponentAtNode(container)
    container.remove()
  }
})

function render<P>(
  component: React.FunctionComponent<P>,
  props: P | null = null
) {
  act(() => {
    renderDOM(
      React.createElement(
        SharedHooksProvider,
        null,
        React.createElement(component, props)
      ),
      container
    )
  })
}

function click(element: Element | null) {
  act(() => {
    if (element) {
      element.dispatchEvent(new MouseEvent('click', { bubbles: true }))
    }
  })
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
    expect(() =>
      act(() => renderDOM(React.createElement(Component), container))
    ).toThrow('useShared: Cannot use outside of <SharedHooksProvider>.')
  })

  it('throws if hook function is not provided', () => {
    function Component() {
      // @ts-ignore
      useShared('key')
      return null
    }
    expect(() => render(Component)).toThrow(
      'useShared: Second argument must be a hook function.'
    )
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

    render(Component)
    useSecondRef = true
    expect(() => render(Component)).toThrow(
      'Rendered more hooks than during the previous render.'
    )
    unmountComponentAtNode(container)
    render(Component)
    useSecondRef = false
    expect(() => render(Component)).toThrow(
      'Rendered fewer hooks than expected.'
    )
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
    expect(() => render(Component)).toThrow(
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
    render(Component)
    expect(container.textContent).toEqual('0-0')

    // Click first counter
    click(container.firstElementChild)
    expect(container.textContent).toEqual('1-1')
  })

  it('supports update-in-render', () => {
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
    render(Component)
    expect(container.textContent).toEqual('2-2')
  })
})
