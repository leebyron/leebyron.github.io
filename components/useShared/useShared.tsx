import { forEach } from 'iterall'
import React from 'react'

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

type SharedHooksContext = {
  hooksByKey: Map<any, SharedHooks>
  cleanupKeys: Array<any> | null
  enqueueCleanupKey: (task: any) => void
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

const SharedHooksContext = React.createContext<SharedHooksContext>(null as any)

export function SharedHooksProvider(props: {
  children?: React.ReactNode
}): React.ReactElement {
  const [, forceRender] = React.useReducer((_s: any, _a: void) => ({}), {})
  const sharedHooks = React.useRef<SharedHooksContext>()
  if (!sharedHooks.current) {
    sharedHooks.current = {
      hooksByKey: new Map(),
      cleanupKeys: null,
      enqueueCleanupKey(key) {
        if (sharedHooks.current) {
          if (sharedHooks.current.cleanupKeys) {
            sharedHooks.current.cleanupKeys.push(key)
          } else {
            sharedHooks.current.cleanupKeys = [key]
          }
          forceRender()
        }
      }
    }
  }
  React.useEffect(() => {
    /* istanbul ignore else */
    if (sharedHooks.current) {
      const { hooksByKey, cleanupKeys } = sharedHooks.current
      if (cleanupKeys) {
        // If the last component using the shared hooks for a given key unmounts
        // then it will enqueue that key to be checked and cleaned up.
        sharedHooks.current.cleanupKeys = null
        safelyCleanupKeys(hooksByKey, cleanupKeys, false)
      }
    }
  })
  React.useEffect(
    () => () => {
      /* istanbul ignore else */
      if (sharedHooks.current) {
        // When the provider unmounts, remove the shared hooks ref and cleanup
        // all keys
        const { hooksByKey } = sharedHooks.current
        sharedHooks.current = undefined
        safelyCleanupKeys(hooksByKey, hooksByKey.keys(), true)
      }
    },
    []
  )
  return React.createElement(SharedHooksContext.Provider, {
    value: sharedHooks.current,
    children: props.children
  })
}

function safelyCleanupKeys(
  hooksByKey: Map<any, SharedHooks>,
  keys: Iterable<any>,
  fromUnmount: boolean
) {
  let encounteredError
  forEach(keys, key => {
    const hooksForKey = hooksByKey.get(key)
    if (hooksForKey && (fromUnmount || hooksForKey.numMounted === 0)) {
      hooksByKey.delete(key)
      let hook = hooksForKey.firstHook
      while (hook) {
        const cleanupFn = hook.value.cleanup
        if (cleanupFn) {
          hook.value.cleanup = null
          try {
            cleanupFn()
          } catch (error) {
            // Ensure all hooks are cleaned up by catching any errors thrown
            // during effect cleanup and rethrowing them after the loop exits.
            encounteredError = error
          }
        }
        hook = hook.next
      }
    }
  })
  if (encounteredError) {
    throw encounteredError
  }
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
    currentSharedHooks = prevSharedHooks
    currentMountEffects = prevMountEffects
    ReactCurrentDispatcher.current = prevDispatcher
    if (
      !ReactCurrentDispatcher.current ||
      !ReactCurrentDispatcher.current.isSharedDispatcher
    ) {
      // @ts-ignore
      LocalHooks = undefined
    }
  }
}

function useSharedHooksDispatcher(key: string) {
  // Keep track of previous hooks and dispatchers
  if (!ReactCurrentDispatcher.current.isSharedDispatcher) {
    LocalHooks = ReactCurrentDispatcher.current
  }

  const sharedHooks = LocalHooks.useContext(SharedHooksContext)
  if (process.env.NODE_ENV !== 'production') {
    if (!sharedHooks) {
      throw new Error('useShared: Cannot use outside of <SharedHooksProvider>.')
    }
  }
  const { hooksByKey, enqueueCleanupKey } = sharedHooks

  // Get the shared hooks by cached key or create a new one.
  const cachedHooksForKey = hooksByKey.get(key)
  const hooksForKey = cachedHooksForKey || {
    isRendering: false,
    numMounted: 0,
    firstHook: null,
    currentHook: null
  }
  if (!cachedHooksForKey) {
    // If shared hooks for this key were not found in the cache, add them there
    // so other hooks used during this same render will use the same hooks.
    hooksByKey.set(key, hooksForKey)
    // Also schedule this key to be checked for cleanup, in case this component
    // fails to mount later (due to error or suspense) to avoid a memory leak.
    enqueueCleanupKey(key)
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

  // Avoid SSR warning by using useEffect on the server. However use
  // useLayoutEffect in the browser to avoid painting an inconsistent state in
  // the scenario that a component dispatches a state update during render.
  // Note: This means SSR may render an inconsistent state in cases where shared
  // state is updated during rendering.
  const useIsomorphicLayoutEffect =
    typeof window === 'undefined'
      ? LocalHooks.useEffect
      : LocalHooks.useLayoutEffect

  // TODO: a component which suspends may have created a shared hook which is
  // releasing before mounting. There are two problems here. One is
  // that if the suspended component eventually mounts and updates, it could get
  // a new instance of the hooks if nothing else was using this. Two is that if
  // it does eventually mount after a sibling using the state, it could cause a
  // store collision. This needs some testing...
  useIsomorphicLayoutEffect(() => {
    hooksForKey.numMounted += 1
    const unmountEffects = mountEffects.map(effect => effect())
    return () => {
      unmountEffects.forEach(uneffect => uneffect && uneffect())
      hooksForKey.numMounted -= 1
      if (hooksForKey.numMounted === 0) {
        // Garbage collect shared hooks for this key after the last component
        // using it is unmounted. If the count of mounted components using these
        // shared hooks drops to zero another component using it may be about to
        // mounted in the same transation. Schedule a check to see if the count
        // remains zero after other work in the React transaction has completed.
        enqueueCleanupKey(key)
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
    useEffect,
    useLayoutEffect,
    useCallback,
    useMemo,
    useRef
  }
}

function getNextHook<H>(initial: () => H, update?: (hook: H) => void): H {
  let didCreate = false
  if (!currentSharedHooks.currentHook) {
    if (!currentSharedHooks.firstHook) {
      didCreate = true
      currentSharedHooks.firstHook = {
        value: initial(),
        next: null
      }
    }
    currentSharedHooks.currentHook = currentSharedHooks.firstHook
  } else {
    if (!currentSharedHooks.currentHook.next) {
      didCreate = true
      currentSharedHooks.currentHook.next = {
        value: initial(),
        next: null
      }
    }
    currentSharedHooks.currentHook = currentSharedHooks.currentHook.next
  }
  if (!didCreate && update) {
    update(currentSharedHooks.currentHook.value)
  }
  return currentSharedHooks.currentHook.value
}

function areDepsEqual(
  next: React.DependencyList | undefined,
  prev: React.DependencyList | undefined
): boolean {
  if (!next || !prev) {
    if (process.env.NODE_ENV !== 'production') {
      if (next !== prev) {
        throw new Error(
          'useShared: The dependency list changed ' +
            `from ${prev && `[${prev.join(', ')}]`} ` +
            `to ${next && `[${next.join(', ')}]`}. ` +
            'Even though it is optional the type cannot change between renders.'
        )
      }
    }
    return false
  }
  if (process.env.NODE_ENV !== 'production') {
    if (next.length !== prev.length) {
      throw new Error(
        'useShared: The dependency list changed ' +
          `from ${prev && `[${prev.join(', ')}]`} ` +
          `to ${next && `[${next.join(', ')}]`}. ` +
          'The order and size of this array must remain constant.'
      )
    }
  }
  for (let i = 0; i < next.length; i++) {
    if (!Object.is(next[i], prev[i])) {
      return false
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
  effect: React.EffectCallback | null
  deps: React.DependencyList | undefined
  cleanup: (() => void | undefined) | null
  localEffect: React.EffectCallback
}

function useEffect(
  effect: React.EffectCallback,
  deps?: React.DependencyList
): void {
  const hook = getNextHook<SharedEffectHook>(
    () => createEffectHook(effect, deps),
    hook => updateEffectHook(hook, effect, deps)
  )
  LocalHooks.useEffect(hook.localEffect)
}

function useLayoutEffect(
  effect: React.EffectCallback,
  deps?: React.DependencyList
): void {
  const hook = getNextHook<SharedEffectHook>(
    () => createEffectHook(effect, deps),
    hook => updateEffectHook(hook, effect, deps)
  )
  LocalHooks.useLayoutEffect(hook.localEffect)
}

function createEffectHook(
  effect: React.EffectCallback,
  deps?: React.DependencyList
) {
  const hook: SharedEffectHook = {
    effect,
    deps,
    cleanup: null,
    localEffect: () => {
      const effectFn = hook.effect
      if (effectFn) {
        hook.effect = null
        hook.cleanup = effectFn() || null
      }
      return () => {
        const cleanupFn = hook.cleanup
        if (hook.effect && cleanupFn) {
          hook.cleanup = null
          cleanupFn()
        }
      }
    }
  }
  return hook
}

function updateEffectHook(
  hook: SharedEffectHook,
  effect: React.EffectCallback,
  deps: React.DependencyList | undefined
) {
  if (!areDepsEqual(deps, hook.deps)) {
    hook.effect = effect
    hook.deps = deps
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
  const hook: SharedMemoHook<T> = getNextHook(
    () => createMemoHook(factory, deps),
    hook => updateMemoHook(hook, factory, deps)
  )
  if (process.env.NODE_ENV !== 'production') {
    LocalHooks.useMemo(() => hook.value, [hook.value])
  }
  return hook.value
}

function useCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  const hook: SharedMemoHook<T> = getNextHook(
    () => createMemoHook(() => callback, deps),
    hook => updateMemoHook(hook, () => callback, deps)
  )
  if (process.env.NODE_ENV !== 'production') {
    LocalHooks.useCallback(hook.value, [hook.value])
  }
  return hook.value
}

function createMemoHook<T>(
  factory: () => T,
  deps: React.DependencyList | undefined
) {
  return { value: factory(), deps }
}

function updateMemoHook<T>(
  hook: SharedMemoHook<T>,
  factory: () => T,
  deps: React.DependencyList | undefined
) {
  if (!areDepsEqual(deps, hook.deps)) {
    hook.value = factory()
    hook.deps = deps
  }
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
