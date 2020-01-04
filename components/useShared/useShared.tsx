import * as React from 'react'
import { forEach } from 'iterall'

/////////////////////

/*
TODO:
Unit tests!
  - nested useShared?
  - throw/suspend during render?
  - concurrent mode support?
*/

type HooksDispatcher = {
  isSharedDispatcher?: boolean
  useContext: typeof React.useContext
  useState: typeof React.useState
  useReducer: typeof React.useReducer
  useEffect: typeof React.useEffect
  useLayoutEffect: typeof React.useLayoutEffect
  useCallback: typeof React.useCallback
  useMemo: typeof React.useMemo
  useRef: typeof React.useRef
}

type SharedHooks = {
  isRendering: boolean
  numMounted: number
  firstHook: SharedHook<any> | null
  currentHook: SharedHook<any> | null
}

type SharedHook<H> = {
  value: H
  next: SharedHook<any> | null
}

const ReactSharedInternals =
  // @ts-ignore Can't fire me I already quit.
  React.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED

const ReactCurrentDispatcher: { current: HooksDispatcher } =
  ReactSharedInternals.ReactCurrentDispatcher

let LocalHooks: HooksDispatcher
let currentSharedHooks: SharedHooks
let currentMountEffects: Array<React.EffectCallback>

const SharedHooksContext = React.createContext<Map<any, SharedHooks>>(
  null as any
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
  if (process.env.NODE_ENV !== 'production') {
    if (typeof hook !== 'function') {
      throw new TypeError('useShared: Second argument must be a hook function.')
    }
  }

  // Get current thread-local variables so they can be reset in the
  // finally block below.
  const prevDispatcher = ReactCurrentDispatcher.current
  const prevSharedHooks = currentSharedHooks
  const prevMountEffects = currentMountEffects

  try {
    if (process.env.NODE_ENV !== 'production') {
      React.useDebugValue(key)
      // @ts-ignore Show a clearer name for dev tools
      useSharedHooksDispatcher.displayName = '(Internal)'
    }
    useSharedHooksDispatcher(key)
    return hook.apply(null, args)
  } finally {
    if (currentSharedHooks) {
      // Reset current shared hooks to default state
      currentSharedHooks.isRendering = false
    }
    // TODO: do hooks get discarded if a render throws?
    ReactCurrentDispatcher.current = prevDispatcher
    currentSharedHooks = prevSharedHooks
    currentMountEffects = prevMountEffects
  }
}

function useSharedHooksDispatcher(key: string) {
  // Keep track of previous hooks and dispatchers
  if (!ReactCurrentDispatcher.current.isSharedDispatcher) {
    LocalHooks = ReactCurrentDispatcher.current
  }

  const hooksByKey = LocalHooks.useContext(SharedHooksContext)
  if (process.env.NODE_ENV !== 'production') {
    if (!hooksByKey) {
      throw new Error('useShared: Cannot use outside of <SharedHooksProvider>.')
    }
  }

  // Get the shared hooks by cached key or create a new one.
  const cachedHooksForKey = hooksByKey.get(key)
  const hooksForKey = cachedHooksForKey || {
    isRendering: false,
    numMounted: 0,
    firstHook: null,
    currentHook: null
  }
  if (!cachedHooksForKey) {
    hooksByKey.set(key, hooksForKey)
  }

  // The current hook should be unset when starting
  if (hooksForKey.isRendering) {
    throw new Error(
      'useShared: The same key cannot be used in a nested useShared call.'
    )
  }

  // Reset current hook
  hooksForKey.isRendering = true
  hooksForKey.currentHook = null

  // Set of effects to call during mount of the component using the shared hook.
  const mountEffects: Array<React.EffectCallback> = []

  // Avoid SSR warning by using useEffect. Use useLayoutEffect in the browser
  // to avoid painting an inconsistent state. Note that this means SSR may
  // render an inconsistent state in cases where shared state is updated during
  // rendering.
  const useIsomorphicLayoutEffect =
    typeof window === 'undefined'
      ? LocalHooks.useEffect
      : LocalHooks.useLayoutEffect

  useIsomorphicLayoutEffect(() => {
    ++hooksForKey.numMounted
    // Assign any subscribers
    const unmounts = mountEffects.map(effect => effect())
    return () => {
      unmounts.forEach(uneffect => uneffect && uneffect())
      if (--hooksForKey.numMounted === 0) {
        // GC hooks after last component sharing this is unmounted.
        hooksByKey.delete(key)
      }
    }
  }, [])

  // Update thread-locals
  currentSharedHooks = hooksForKey
  currentMountEffects = mountEffects
  ReactCurrentDispatcher.current = {
    ...ReactCurrentDispatcher.current,
    isSharedDispatcher: true,
    useState,
    useReducer,
    useEffect: useEffect.bind(null, false),
    useLayoutEffect: useEffect.bind(null, true),
    useCallback,
    useMemo,
    useRef
  }
}

function getNextHook<H>(initial: () => H): H {
  if (!currentSharedHooks.currentHook) {
    if (!currentSharedHooks.firstHook) {
      currentSharedHooks.firstHook = {
        value: initial(),
        next: null
      }
    }
    currentSharedHooks.currentHook = currentSharedHooks.firstHook
  } else {
    if (!currentSharedHooks.currentHook.next) {
      currentSharedHooks.currentHook.next = {
        value: initial(),
        next: null
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
    if (!a || !b || a.length !== b.length) {
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

type SharedStateHook<S> = {
  state: S
  dispatchers: Map<
    React.Dispatch<React.SetStateAction<S>>,
    React.Dispatch<React.SetStateAction<S>>
  >
}

function useState<S = undefined>(
  initialState?: S | (() => S)
): [S, React.Dispatch<React.SetStateAction<S>>] {
  const hook: SharedStateHook<S> = getNextHook(() => ({
    // @ts-ignore S cannot be a function
    state: typeof initialState === 'function' ? initialState() : initialState,
    dispatchers: new Map()
  }))

  const [state, localSetState] = LocalHooks.useState<S>(hook.state)

  let dispatch = hook.dispatchers.get(localSetState)
  if (!dispatch) {
    const dispatcher = (dispatch = action => {
      const newState =
        // @ts-ignore S cannot be a function
        typeof action === 'function' ? action(hook.state) : action
      if (!Object.is(newState, hook.state)) {
        // Update shared state
        hook.state = newState
        // Update this local state first
        localSetState(newState)
        // Update all other subscribers' local states
        forEach(hook.dispatchers.keys(), subscriber => {
          if (subscriber !== localSetState) {
            subscriber(newState)
          }
        })
      }
    })

    currentMountEffects.push(() => {
      // Update in case shared state changed between render and mount
      localSetState(hook.state)
      hook.dispatchers.set(localSetState, dispatcher)
      return () => {
        hook.dispatchers.delete(localSetState)
      }
    })
  }

  return [state, dispatch]
}

// useSharedReducer

type SharedReducerHook<R extends React.Reducer<any, any>> = {
  reducer: R
  state: React.ReducerState<R>
  dispatchers: Map<
    React.Dispatch<React.ReducerState<R>>,
    React.Dispatch<React.ReducerAction<R>>
  >
}

function useReducer<R extends React.Reducer<any, any>, I>(
  reducer: R,
  initializerArg: I & React.ReducerState<R>,
  initializer?: (arg: I) => React.ReducerState<R>
): [React.ReducerState<R>, React.Dispatch<React.ReducerAction<R>>] {
  const hook: SharedReducerHook<R> = getNextHook(() => ({
    reducer,
    state:
      initializer !== undefined ? initializer(initializerArg) : initializerArg,
    dispatchers: new Map()
  }))

  // Always use the latest reducer, in case of closed-over variables.
  hook.reducer = reducer

  // Use simple reducer as state to ensure local hook is same as shared hook.
  const [state, localSetState] = LocalHooks.useReducer<SimpleReducer<R>>(
    simpleReducer,
    hook.state
  )

  let dispatch = hook.dispatchers.get(localSetState)
  if (!dispatch) {
    const dispatcher = (dispatch = action => {
      const newState = hook.reducer.call(null, hook.state, action)
      if (!Object.is(newState, hook.state)) {
        // Update shared state
        hook.state = newState
        // Update this local state first
        localSetState(newState)
        // Update all other subscribers' local states
        forEach(hook.dispatchers.keys(), subscriber => {
          if (subscriber !== localSetState) {
            subscriber(newState)
          }
        })
      }
    })

    currentMountEffects.push(() => {
      // Update in case shared state changed between render and mount
      localSetState(hook.state)
      hook.dispatchers.set(localSetState, dispatcher)
      return () => {
        hook.dispatchers.delete(localSetState)
      }
    })
  }

  return [state, dispatch]
}

type SimpleReducer<R extends React.Reducer<any, any>> = React.Reducer<
  React.ReducerState<R>,
  React.ReducerState<R>
>

function simpleReducer<T>(_state: T, action: T): T {
  return action
}

// useSharedEffect / useSharedLayoutEffect

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

// useMemo / useCallback

type SharedMemoHook<T> = {
  value: T
  deps: React.DependencyList | undefined
}

function useMemo<T>(
  factory: () => T,
  deps: React.DependencyList | undefined
): T {
  const hook: SharedMemoHook<T> = getNextHook(() => ({
    value: factory(),
    deps
  }))
  if (!isSameDeps(deps, hook.deps)) {
    hook.value = factory()
    hook.deps = deps
  }
  if (process.env.NODE_ENV !== 'production') {
    LocalHooks.useMemo(() => hook.value, hook.deps)
  }
  return hook.value
}

type SharedCallbackHook<T> = {
  callback: T
  deps: React.DependencyList
}

function useCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  const hook: SharedCallbackHook<T> = getNextHook(() => ({
    callback,
    deps
  }))
  if (!isSameDeps(deps, hook.deps)) {
    hook.callback = callback
    hook.deps = deps
  }
  if (process.env.NODE_ENV !== 'production') {
    LocalHooks.useCallback(hook.callback, hook.deps)
  }
  return hook.callback
}

// useRef

type SharedRefHook<T> = {
  current: T
  ref: React.MutableRefObject<T>
  localRefs: Set<React.MutableRefObject<T>>
}

function useRef<T>(initialValue?: T): React.MutableRefObject<T> {
  // In a dev environment, maintain parallel local hooks for improved
  // dev tools legibility.
  if (process.env.NODE_ENV !== 'production') {
    const hook: SharedRefHook<T> = getNextHook(() => ({
      current: initialValue as T,
      ref: Object.seal(
        Object.defineProperty({}, 'current', {
          enumerable: true,
          get() {
            return hook.current
          },
          set(value: T) {
            forEach(hook.localRefs, localRef => {
              localRef.current = value
            })
            hook.current = value
          }
        })
      ),
      localRefs: new Set()
    }))

    const localRef = LocalHooks.useRef<T>(hook.current)
    if (!hook.localRefs.has(localRef)) {
      currentMountEffects.push(() => {
        localRef.current = hook.current
        hook.localRefs.add(localRef)
        return () => {
          hook.localRefs.delete(localRef)
        }
      })
    }
    return hook.ref
  }

  // In production a simple object has the correct behavior.
  return getNextHook(() => ({ current: initialValue as T }))
}
