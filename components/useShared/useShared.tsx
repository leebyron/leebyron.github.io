import * as React from 'react'

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

type SharedHooksByKey = {
  [key: string]: SharedHooks | undefined
}

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

const SharedHooksContext = React.createContext<SharedHooksByKey | null>(null)

export function SharedHooksProvider(props: {
  children?: React.ReactNode
}): React.ReactElement {
  return React.createElement(SharedHooksContext.Provider, {
    value: Object.create(null),
    children: props.children
  })
}

let LocalHooks: HooksDispatcher | undefined
let sharedHooks: SharedHooks | undefined

export function useLocal<T>(builder: () => T): T {
  const prevDispatcher = ReactCurrentDispatcher.current
  try {
    if (LocalHooks) {
      ReactCurrentDispatcher.current = LocalHooks
    }
    return builder()
  } finally {
    ReactCurrentDispatcher.current = prevDispatcher
  }
}

export function useShared<T>(key: string, builder: () => T): T {
  const hooksByKey = React.useContext(SharedHooksContext)
  if (!hooksByKey) {
    throw new Error('Missing SharedProvider')
  }

  // Get the shared hooks by cached key or create a new one.
  const hooksForKey =
    hooksByKey[key] ||
    (hooksByKey[key] = {
      numMounted: 0,
      firstHook: undefined,
      currentHook: undefined
    })

  // Cleanup hooks after last component sharing this is unmounted.
  React.useEffect(() => {
    ++hooksForKey.numMounted
    return () => {
      if (--hooksForKey.numMounted === 0) {
        delete hooksByKey[key]
      }
    }
  }, [])

  // The current hook should be unset when starting
  if (hooksForKey.currentHook) {
    throw new Error('useShared: the same key cannot be nested')
  }

  // Keep track of previous hooks and dispatchers
  const prevSharedHooks = sharedHooks
  sharedHooks = hooksForKey
  const prevDispatcher = ReactCurrentDispatcher.current
  if (!prevDispatcher.isSharedDispatcher) {
    LocalHooks = prevDispatcher
  }

  try {
    ReactCurrentDispatcher.current = {
      ...prevDispatcher,
      isSharedDispatcher: true,
      useState: $useSharedState,
      useReducer: $useSharedReducer,
      useEffect: $useSharedEffect.bind(null, false),
      useLayoutEffect: $useSharedEffect.bind(null, true),
      useCallback: $useSharedCallback,
      useMemo: $useSharedMemo,
      useRef: $useSharedRef
    }
    const returnVal = builder()

    // Detect different call orders
    if (process.env.NODE_ENV !== 'production') {
      if (sharedHooks.currentHook === undefined) {
        sharedHooks.firstHook = null
        console.warn('useShared: No hooks used inside')
      } else if (sharedHooks.currentHook) {
        if (sharedHooks.currentHook.next === undefined) {
          sharedHooks.currentHook.next = null
        } else if (sharedHooks.currentHook.next !== null) {
          console.warn('useShared: a different number of hooks used (too few)')
        }
      }
    }
    return returnVal
  } finally {
    // TODO: do hooks get discarded if a render throws?
    sharedHooks.currentHook = undefined
    sharedHooks = prevSharedHooks
    ReactCurrentDispatcher.current = prevDispatcher
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

function $useSharedState<S = undefined>(
  initialState?: S | (() => S)
): [S, React.Dispatch<React.SetStateAction<S>>] {
  return $useSharedReducer<typeof stateReducer, S | (() => S)>(
    stateReducer,
    // @ts-ignore
    initialState,
    stateInitializer
  )
}

function stateReducer<S>(state: S, action: React.SetStateAction<S>): S {
  if (typeof action === 'function') {
    // @ts-ignore
    return action(state)
  }
  return action
}

function stateInitializer<S>(initialState: S | (() => S)): S {
  if (typeof initialState === 'function') {
    // @ts-ignore
    return initialState()
  }
  return initialState
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
  subscribers: Array<(value: React.ReducerState<R>) => void>
}

function $useSharedReducer<R extends React.Reducer<any, any>, I>(
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
        for (const subscriber of hook.subscribers) {
          subscriber(newState)
        }
      }
    },
    subscribers: []
  }))

  // Always use the latest reducer, in case of closed-over variables.
  hook.reducer = reducer

  let isInitial = false
  const [state, setState] = LocalHooks.useState<React.ReducerState<R>>(() => {
    // TODO: could this be called more than once?
    isInitial = true
    return hook.state
  })
  if (isInitial) {
    hook.subscribers.push(setState)
  }

  // Unsubscribe on unmount
  LocalHooks.useEffect(
    () => () => {
      const index = hook.subscribers.indexOf(setState)
      if (index >= 0) {
        const last = hook.subscribers[hook.subscribers.length - 1]
        if (--hook.subscribers.length > 0) {
          hook.subscribers[index] = last
        }
      }
    },
    []
  )

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

function $useSharedEffect(
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
      hook.cleanup = hook.effect()
    }
    return () => {
      if (--hook.counter === 0 && hook.cleanup) {
        hook.cleanup()
      }
    }
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

function $useSharedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T {
  return $useSharedMemo(() => callback, deps)
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

function $useSharedMemo<T>(
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

function $useSharedRef<T>(initialValue?: T): React.MutableRefObject<T> {
  return getNextHook(() => {
    const ref = { current: initialValue as T }
    if (process.env.NODE_ENV !== 'production') {
      Object.seal(ref)
    }
    return ref
  })
}
