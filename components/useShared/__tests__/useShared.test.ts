import React from 'react'
import { render as renderDOM, unmountComponentAtNode } from 'react-dom'
import { act } from 'react-dom/test-utils'
import { SharedHooksProvider, useShared } from '../useShared'

const warnings: Array<string> = []
let container: HTMLDivElement | null = null

jest.mock('../warn', () => ({
  warn(warning: string) {
    warnings.push(warning)
  }
}))

beforeEach(() => {
  warnings.length = 0
  container = document.createElement('div')
  document.body.appendChild(container)
})

afterEach(() => {
  expect(warnings).toEqual([])
  if (container) {
    unmountComponentAtNode(container)
    container.remove()
    container = null
  }
})

function expectWarnings(...expected: Array<string>) {
  expect(warnings).toEqual(expected)
  warnings.length = 0;
}

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

describe('useShared', () => {
  it('throws if hook function is not provided', () => {
    expect(() => {
      // @ts-ignore
      useShared()
    }).toThrow('useShared: Second argument must be a hook function')
  })

  it('warns if hook does not look like a hook', () => {
    function Component() {
      useShared('x', function notAHook() {
        React.useRef()
      })
      return null
    }
    render(Component)
    expectWarnings(
      'useShared: Second argument expected to be a hook function, but got a function named "notAHook"'
    )
  })

  it('does not warn if hook has no name', () => {
    function Component() {
      useShared('x', () => {
        React.useRef()
      })
      return null
    }
    render(Component)
  })
})
