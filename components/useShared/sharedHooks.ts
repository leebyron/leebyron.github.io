import * as React from 'react'
import { useShared } from './useShared'

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

export function useSharedCallback<T extends (...args: any[]) => any>(
  key: any,
  callback: T,
  deps: React.DependencyList
): T {
  return useShared(key, React.useCallback, callback, deps)
}

export function useSharedMemo<T>(
  key: any,
  factory: () => T,
  deps: React.DependencyList | undefined
): T {
  return useShared(key, React.useMemo, factory, deps)
}

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
