import * as React from 'react'
import { forEach } from 'iterall'

/////////////////////

/*
TODO:
Unit tests!
  - nested useShared?
  - setState during render?
  - throw/suspend during render?
  - concurrent mode support?
*/

type SharedHooks = {
  numMounted: number
  firstHook: SharedHook<any> | null | undefined
  currentHook: SharedHook<any> | null | undefined
}

type SharedHook<H> = {
  value: H
  next: SharedHook<any> | null | undefined
}

type HooksDispatcher = {
  isSharedDispatcher?: boolean
  useState: typeof React.useState
  useReducer: typeof React.useReducer
  useEffect: typeof React.useEffect
  useLayoutEffect: typeof React.useLayoutEffect
  useCallback: typeof React.useCallback
  useMemo: typeof React.useMemo
  useRef: typeof React.useRef
}

const ReactSharedInternals =
  // @ts-ignore Can't fire me I already quit.
  React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED
const ReactCurrentDispatcher: { current: HooksDispatcher } =
  ReactSharedInternals.ReactCurrentDispatcher

let LocalHooks: HooksDispatcher | undefined
let currentSharedHooks: SharedHooks | undefined
let currentCleanups: Array<() => void> | undefined

const SharedHooksContext = React.createContext<Map<any, SharedHooks> | null>(
  null
)

export function SharedHooksProvider(props: {
  children?: React.ReactNode
}): React.ReactElement {
  return React.createElement(
    SharedHooksContext.Provider,
    { value: new Map() },
    props.children
  )
}

export function useLocal<T, A extends any[]>(
  hook: (...args: A) => T,
  ...args: A
): T {
  const prevDispatcher = ReactCurrentDispatcher.current
  try {
    if (LocalHooks) {
      ReactCurrentDispatcher.current = LocalHooks
    }
    return hook.apply(null, args)
  } finally {
    ReactCurrentDispatcher.current = prevDispatcher
  }
}

export function useShared<T, A extends any[]>(
  key: any,
  hook: (...args: A) => T,
  ...args: A
): T {
  // Get current thread-local variables so they can be reset in the
  // finally block below.
  const prevDispatcher = ReactCurrentDispatcher.current
  const prevSharedHooks = currentSharedHooks
  const prevCleanups = currentCleanups

  try {
    if (process.env.NODE_ENV !== 'production') {
      React.useDebugValue(key)
      // @ts-ignore Show a clearer name for dev tools
      useSharedHooksDispatcher.displayName = '(Internal)'
    }
    useSharedHooksDispatcher(key)

    const returnVal = hook.apply(null, args)

    if (process.env.NODE_ENV !== 'production') {
      // Detect different call orders and warn
      if (currentSharedHooks) {
        if (currentSharedHooks.currentHook === undefined) {
          currentSharedHooks.firstHook = null
          console.warn('useShared: No hooks used inside')
        } else if (currentSharedHooks.currentHook) {
          if (currentSharedHooks.currentHook.next === undefined) {
            currentSharedHooks.currentHook.next = null
          } else if (currentSharedHooks.currentHook.next !== null) {
            console.warn(
              'useShared: a different number of hooks used (too few)'
            )
          }
        }
      }
    }
    return returnVal
  } finally {
    if (currentSharedHooks) {
      // Reset current shared hooks to default state
      currentSharedHooks.currentHook = undefined
    }
    // TODO: do hooks get discarded if a render throws?
    ReactCurrentDispatcher.current = prevDispatcher
    currentSharedHooks = prevSharedHooks
    currentCleanups = prevCleanups
  }
}

function useSharedHooksDispatcher(key: string) {
  const hooksByKey = React.useContext(SharedHooksContext)
  if (!hooksByKey) {
    throw new Error('Missing SharedProvider')
  }

  // Get the shared hooks by cached key or create a new one.
  const cachedHooksForKey = hooksByKey.get(key)
  const hooksForKey = cachedHooksForKey || {
    numMounted: 0,
    firstHook: undefined,
    currentHook: undefined
  }
  if (!cachedHooksForKey) {
    hooksByKey.set(key, hooksForKey)
  }

  // The current hook should be unset when starting
  if (hooksForKey.currentHook) {
    throw new Error('useShared: the same key cannot be nested')
  }

  const cleanups: React.MutableRefObject<
    Array<() => void> | undefined
  > = React.useRef([])

  // Cleanup hooks after last component sharing this is unmounted.
  React.useEffect(
    sharedHooksCleanupEffect(hooksByKey, hooksForKey, key, cleanups),
    []
  )

  // Keep track of previous hooks and dispatchers
  if (!ReactCurrentDispatcher.current.isSharedDispatcher) {
    LocalHooks = ReactCurrentDispatcher.current
  }

  // Update thread-locals
  currentSharedHooks = hooksForKey
  currentCleanups = cleanups.current
  ReactCurrentDispatcher.current = {
    ...ReactCurrentDispatcher.current,
    isSharedDispatcher: true,
    useState: useState,
    useReducer: useReducer,
    useEffect: useEffect.bind(null, false),
    useLayoutEffect: useEffect.bind(null, true),
    useCallback: useCallback,
    useMemo: useMemo,
    useRef: useRef
  }
}

function sharedHooksCleanupEffect(
  hooksByKey: Map<any, SharedHooks>,
  hooksForKey: SharedHooks,
  key: any,
  cleanups: React.MutableRefObject<Array<() => void> | undefined>
) {
  return function cleanup() {
    ++hooksForKey.numMounted
    return () => {
      if (cleanups.current) {
        cleanups.current.forEach(cleanupFn => cleanupFn())
        cleanups.current = undefined
      }
      if (--hooksForKey.numMounted === 0) {
        hooksByKey.delete(key)
      }
    }
  }
}

function getNextHook<H>(initial: () => H): H {
  if (!currentSharedHooks) {
    throw new Error('useShared: Called a shared hook outside of useShared?')
  }
  if (process.env.NODE_ENV !== 'production') {
    if (
      currentSharedHooks.currentHook === null ||
      (currentSharedHooks.currentHook &&
        currentSharedHooks.currentHook.next === null)
    ) {
      console.warn('useShared: a different number of hooks used (too many)')
    }
  }
  if (!currentSharedHooks.currentHook) {
    if (!currentSharedHooks.firstHook) {
      currentSharedHooks.firstHook = {
        value: initial(),
        next: undefined
      }
    }
    currentSharedHooks.currentHook = currentSharedHooks.firstHook
  } else {
    if (!currentSharedHooks.currentHook.next) {
      currentSharedHooks.currentHook.next = {
        value: initial(),
        next: undefined
      }
    }
    currentSharedHooks.currentHook = currentSharedHooks.currentHook.next
  }
  return currentSharedHooks.currentHook.value
}

function isSameDeps(
  a: React.DependencyList | undefined,
  b: React.DependencyList | undefined
): boolean {
  if (a !== b) {
    if (a === undefined || b === undefined || a.length !== b.length) {
      return false
    }
    for (let i = 0; i < a.length; i++) {
      if (!Object.is(a[i], b[i])) {
        return false
      }
    }
  }
  return true
}

// useSharedState

export function useSharedState<S>(
  key: any,
  initialState: S | (() => S)
): [S, React.Dispatch<React.SetStateAction<S>>]
export function useSharedState<S = undefined>(
  key: any
): [S | undefined, React.Dispatch<React.SetStateAction<S | undefined>>]
export function useSharedState<S>(
  key: any,
  initialState?: S | (() => S)
): [S, React.Dispatch<React.SetStateAction<S>>] {
  // @ts-ignore Not all React.useState signatures can be satisfied
  return useShared(key, React.useState, initialState)
}

type SharedStateHook<S> = {
  state: S
  dispatch: React.Dispatch<React.SetStateAction<S>>
  subscribers: Set<(value: S) => void>
}

function useState<S = undefined>(
  initialState?: S | (() => S)
): [S, React.Dispatch<React.SetStateAction<S>>] {
  if (!LocalHooks) {
    throw new Error('Must be called within useShared()')
  }

  const hook = getNextHook<SharedStateHook<S>>(() => ({
    // @ts-ignore S cannot be a function
    state: typeof initialState === 'function' ? initialState() : initialState,
    dispatch(action) {
      const newState =
        // @ts-ignore S cannot be a function
        typeof action === 'function' ? action(hook.state) : action
      if (!Object.is(newState, hook.state)) {
        hook.state = newState
        // NOTE: iterall types should really handle this without annotation
        forEach(hook.subscribers, (subscriber: (value: S) => void) => {
          subscriber(newState)
        })
      }
    },
    subscribers: new Set()
  }))

  let isInitial = false
  const [state, setState] = LocalHooks.useState<S>(() => {
    // TODO: could this be called more than once? maybe if suspended?
    isInitial = true
    return hook.state
  })
  if (isInitial) {
    hook.subscribers.add(setState)

    // Unsubscribe on unmount
    currentCleanups?.push(function unsubscribe() {
      hook.subscribers.delete(setState)
    })
  }

  return [state, hook.dispatch]
}

// useSharedReducer

export function useSharedReducer<R extends React.Reducer<any, any>, I>(
  key: any,
  reducer: R,
  initializerArg: I & React.ReducerState<R>,
  initializer: (arg: I & React.ReducerState<R>) => React.ReducerState<R>
): [React.ReducerState<R>, React.Dispatch<React.ReducerAction<R>>]
export function useSharedReducer<R extends React.Reducer<any, any>, I>(
  key: any,
  reducer: R,
  initializerArg: I,
  initializer: (arg: I) => React.ReducerState<R>
): [React.ReducerState<R>, React.Dispatch<React.ReducerAction<R>>]
export function useSharedReducer<R extends React.Reducer<any, any>>(
  key: any,
  reducer: R,
  initialState: React.ReducerState<R>,
  initializer?: undefined
): [React.ReducerState<R>, React.Dispatch<React.ReducerAction<R>>]
export function useSharedReducer<R extends React.Reducer<any, any>, I>(
  key: any,
  reducer: R,
  initializerArg: I & React.ReducerState<R>,
  initializer?: (arg: I) => React.ReducerState<R>
): [React.ReducerState<R>, React.Dispatch<React.ReducerAction<R>>] {
  // @ts-ignore Not all React.useReducer signatures can be satisfied
  return useShared(key, React.useReducer, reducer, initializerArg, initializer)
}

type SharedReducerHook<R extends React.Reducer<any, any>> = {
  reducer: R
  state: React.ReducerState<R>
  dispatch: React.Dispatch<React.ReducerAction<R>>
  subscribers: Set<(value: React.ReducerState<R>) => void>
}

function useReducer<R extends React.Reducer<any, any>, I>(
  reducer: R,
  initializerArg: I & React.ReducerState<R>,
  initializer?: (arg: I) => React.ReducerState<R>
): [React.ReducerState<R>, React.Dispatch<React.ReducerAction<R>>] {
  if (!LocalHooks) {
    throw new Error('Must be called within useShared()')
  }

  const hook = getNextHook<SharedReducerHook<R>>(() => ({
    reducer,
    state:
      initializer !== undefined ? initializer(initializerArg) : initializerArg,
    dispatch(action) {
      const newState = hook.reducer.call(null, hook.state, action)
      if (!Object.is(newState, hook.state)) {
        hook.state = newState
        // NOTE: iterall types should really handle this without annotation
        forEach(
          hook.subscribers,
          (subscriber: (value: React.ReducerState<R>) => void) => {
            subscriber(newState)
          }
        )
      }
    },
    subscribers: new Set()
  }))

  // Always use the latest reducer, in case of closed-over variables.
  hook.reducer = reducer

  // Use simple reducer as state to ensure local hook is same as shared hook.
  let isInitial = false
  const [state, setState] = LocalHooks.useReducer(
    (_: any, next: React.ReducerState<R>) => next,
    hook.state,
    init => {
      isInitial = true
      return init
    }
  )
  if (isInitial) {
    hook.subscribers.add(setState)

    // Unsubscribe on unmount
    currentCleanups?.push(function unsubscribe() {
      hook.subscribers.delete(setState)
    })
  }

  return [state, hook.dispatch]
}

// useSharedEffect / useSharedLayoutEffect

export function useSharedEffect(
  key: any,
  effect: React.EffectCallback,
  deps?: React.DependencyList
): void {
  return useShared(key, React.useEffect, effect, deps)
}

export function useSharedLayoutEffect(
  key: any,
  effect: React.EffectCallback,
  deps?: React.DependencyList
): void {
  return useShared(key, React.useLayoutEffect, effect, deps)
}

type SharedEffectHook = {
  effect: React.EffectCallback
  cleanup: (() => void | undefined) | void
  counter: number
}

function useEffect(
  isLayoutEffect: boolean,
  effect: React.EffectCallback,
  deps?: React.DependencyList
): void {
  if (!LocalHooks) {
    throw new Error('Must be called within useShared()')
  }

  const hook: SharedEffectHook = getNextHook(() => ({
    effect,
    cleanup: undefined,
    counter: 0
  }))

  // Always use the latest effect callback, in case of closed-over variables.
  hook.effect = effect

  /*
  TODO:
  Called once when the first component mounts. Not called when others mount (unless deps change).
  Called once when deps change. Not called when others re-render with same deps.
  Called once when last component unmounts. Not called when a component unmounts if others are mounted.
  Should be called once if deps change between components in a single render pass. This is probably currently broken...
      A->B->A :: no effect
      A->A->B :: effect
      Perhaps effect should *always* fire, and we compare the deps there in the limit
      But then how do we know when all cleanups are actually all unmounts?
  */
  const effectCallback = () => {
    if (hook.counter++ === 0) {
      const effectFn = hook.effect
      hook.cleanup = effectFn()
    }
    return () => {
      if (--hook.counter === 0 && hook.cleanup) {
        const cleanupFn = hook.cleanup
        cleanupFn()
      }
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    Object.defineProperty(effectCallback, 'name', {
      // @ts-ignore improve legibility in dev tools
      value: effect.displayName || effect.name
    })
  }

  if (isLayoutEffect) {
    LocalHooks.useLayoutEffect(effectCallback, deps)
  } else {
    LocalHooks.useEffect(effectCallback, deps)
  }
}

// useCallback / useMemo

export function useSharedCallback<T extends (...args: any[]) => any>(
  key: any,
  callback: T,
  deps: React.DependencyList
): T {
  return useShared(key, React.useCallback, callback, deps)
}

function useCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  const hook = getNextHook<SharedMemoHook<T>>(() => ({
    value: callback,
    deps
  }))
  if (!isSameDeps(deps, hook.deps)) {
    hook.value = callback
    hook.deps = deps
  }
  return hook.value
}

export function useSharedMemo<T>(
  key: any,
  factory: () => T,
  deps: React.DependencyList | undefined
): T {
  return useShared(key, React.useMemo, factory, deps)
}

type SharedMemoHook<T> = {
  value: T
  deps: React.DependencyList | undefined
}

function useMemo<T>(
  factory: () => T,
  deps: React.DependencyList | undefined
): T {
  const hook = getNextHook<SharedMemoHook<T>>(() => ({
    value: factory(),
    deps
  }))
  if (!isSameDeps(deps, hook.deps)) {
    hook.value = factory()
    hook.deps = deps
  }
  return hook.value
}

// useRef

export function useSharedRef<T>(
  key: any,
  initialValue: T
): React.MutableRefObject<T>
export function useSharedRef<T>(
  key: any,
  initialValue: T | null
): React.RefObject<T>
export function useSharedRef<T = undefined>(
  key: any
): React.MutableRefObject<T | undefined>
export function useSharedRef<T>(
  key: any,
  initialValue?: T
): React.MutableRefObject<T> {
  // @ts-ignore Not all React.useRef signatures can be satisfied
  return useShared(key, React.useRef, initialValue)
}

type SharedRefHook<T> = {
  current: T | undefined
  ref: React.MutableRefObject<T>
  subscribers: Set<React.MutableRefObject<T>>
}

function useRef<T>(initialValue?: T): React.MutableRefObject<T> {
  if (process.env.NODE_ENV !== 'production') {
    if (!LocalHooks) {
      throw new Error('Must be called within useShared()')
    }
    const hook: SharedRefHook<T> = getNextHook(() => ({
      current: initialValue,
      ref: Object.seal(
        Object.defineProperty({}, 'current', {
          get() {
            return hook.current
          },
          set(value: T) {
            forEach(hook.subscribers, (localRef: React.MutableRefObject<T>) => {
              localRef.current = value
            })
            hook.current = value
          }
        })
      ),
      subscribers: new Set()
    }))
    const localRef = LocalHooks.useRef<any>(Symbol.for('unset'))
    if (localRef.current === Symbol.for('unset')) {
      hook.subscribers.add(localRef)
      currentCleanups?.push(function unsubscribe() {
        hook.subscribers.delete(localRef)
      })
    }
    return hook.ref
  }
  return getNextHook(() => ({ current: initialValue as T }))
}
