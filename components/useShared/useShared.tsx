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
Proper types for all exported bits
Devtools help?
*/

type SharedHooksByKey = Map<string, SharedHooks>

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
let sharedHooks: SharedHooks | undefined
let currentCleanups: Array<() => void> | undefined

const SharedHooksContext = React.createContext<SharedHooksByKey | null>(null)

export function SharedHooksProvider(props: {
  children?: React.ReactNode
}): React.ReactElement {
  // @ts-ignore
  return React.createElement(SharedHooksContext.Provider, {
    value: new Map(),
    children: props.children
  })
}

export function useLocal<T>(builder: () => T): T {
  const prevDispatcher = ReactCurrentDispatcher.current
  try {
    if (LocalHooks) {
      ReactCurrentDispatcher.current = LocalHooks
    }
    // @ts-ignore Show clearer name in Dev Tools
    builder.displayName = 'Local Hooks'
    return builder()
  } finally {
    ReactCurrentDispatcher.current = prevDispatcher
  }
}

export function useShared<T>(key: string, builder: () => T): T {
  // Get current thread-local variables so they can be reset in the
  // finally block below.
  const prevSharedHooks = sharedHooks
  const prevCleanups = currentCleanups
  const prevDispatcher = ReactCurrentDispatcher.current

  try {
    React.useDebugValue(key)

    if (process.env.NODE_ENV !== 'production') {
      // @ts-ignore Show a clearer name for dev tools
      setupSharedHooks.displayName = '(Internal)'
    }
    setupSharedHooks(key)

    // @ts-ignore Show clearer name in Dev Tools
    builder.displayName = 'Shared Hooks'
    const returnVal = builder()

    if (process.env.NODE_ENV !== 'production') {
      // Detect different call orders and warn
      if (sharedHooks) {
        if (sharedHooks.currentHook === undefined) {
          sharedHooks.firstHook = null
          console.warn('useShared: No hooks used inside')
        } else if (sharedHooks.currentHook) {
          if (sharedHooks.currentHook.next === undefined) {
            sharedHooks.currentHook.next = null
          } else if (sharedHooks.currentHook.next !== null) {
            console.warn(
              'useShared: a different number of hooks used (too few)'
            )
          }
        }
      }
    }
    return returnVal
  } finally {
    if (sharedHooks) {
      // Reset current shared hooks to default state
      sharedHooks.currentHook = undefined
    }
    // TODO: do hooks get discarded if a render throws?
    sharedHooks = prevSharedHooks
    currentCleanups = prevCleanups
    ReactCurrentDispatcher.current = prevDispatcher
  }
}

function setupSharedHooks(key: string) {
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
  React.useEffect(function cleanup() {
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
  }, [])

  // Keep track of previous hooks and dispatchers
  if (!ReactCurrentDispatcher.current.isSharedDispatcher) {
    LocalHooks = ReactCurrentDispatcher.current
  }

  // Update thread-locals
  sharedHooks = hooksForKey
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

function getNextHook<H>(initial: () => H): H {
  if (!sharedHooks) {
    throw new Error('useShared: Called a shared hook outside of useShared?')
  }
  if (process.env.NODE_ENV !== 'production') {
    if (
      sharedHooks.currentHook === null ||
      (sharedHooks.currentHook && sharedHooks.currentHook.next === null)
    ) {
      console.warn('useShared: a different number of hooks used (too many)')
    }
  }
  if (!sharedHooks.currentHook) {
    if (!sharedHooks.firstHook) {
      sharedHooks.firstHook = {
        value: initial(),
        next: undefined
      }
    }
    sharedHooks.currentHook = sharedHooks.firstHook
  } else {
    if (!sharedHooks.currentHook.next) {
      sharedHooks.currentHook.next = {
        value: initial(),
        next: undefined
      }
    }
    sharedHooks.currentHook = sharedHooks.currentHook.next
  }
  return sharedHooks.currentHook.value
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

export function useSharedState<S = undefined>(
  key: string,
  initialState: S | (() => S)
): [S, React.Dispatch<React.SetStateAction<S>>] {
  return useShared(key, () => React.useState<S>(initialState))
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
    // @ts-ignore
    state: typeof initialState === 'function' ? initialState() : initialState,
    dispatch(action) {
      const newState =
        // @ts-ignore
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
    // TODO: could this be called more than once?
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
  key: string,
  reducer: R,
  initializerArg: I & React.ReducerState<R>,
  initializer: (arg: I) => React.ReducerState<R>
): [React.ReducerState<R>, React.Dispatch<React.ReducerAction<R>>] {
  return useShared(key, () =>
    React.useReducer<R, I>(reducer, initializerArg, initializer)
  )
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
  key: string,
  effect: React.EffectCallback,
  deps?: React.DependencyList
): void {
  return useShared(key, () => React.useEffect(effect, deps))
}

export function useSharedLayoutEffect(
  key: string,
  effect: React.EffectCallback,
  deps?: React.DependencyList
): void {
  return useShared(key, () => React.useLayoutEffect(effect, deps))
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

  const hook = getNextHook<SharedEffectHook>(() => ({
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
      value: effect.name || effect.displayName
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
  key: string,
  callback: T,
  deps: React.DependencyList
): T {
  return useShared(key, () => React.useCallback(callback, deps))
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
  key: string,
  factory: () => T,
  deps: React.DependencyList | undefined
): T {
  return useShared(key, () => React.useMemo(factory, deps))
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
  key: string,
  initialValue: T
): React.MutableRefObject<T> {
  return useShared(key, () => React.useRef(initialValue))
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
            console.log('updating ref', value)
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
