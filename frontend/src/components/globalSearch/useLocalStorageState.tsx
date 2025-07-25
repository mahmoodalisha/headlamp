/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useEffect, useState } from 'react';

/** Store listeners to allow updates outside of the hook */
const updateListeners: Record<string, Array<(newValue: any) => void>> = {};

/**
 * Custom hook to manage state synchronized with localStorage.
 * Value must by serializable to JSON.
 *
 * @template T - The type of the state value.
 * @param {string} key - The key under which the state is stored in localStorage.
 * @param {T} defaultValue - The default value to use if no value is found in localStorage.
 * @returns Returns a tuple containing the current state and a function to update the state.
 *
 * @example
 * const [value, setValue] = useLocalStorageState<string>('myKey', 'default');
 * setValue((oldValue) => 'newValue');
 */
export function useLocalStorageState<T>(key: string, defaultValue: T) {
  const get = () => {
    const maybeValue = localStorage.getItem(key);
    if (maybeValue) {
      return JSON.parse(maybeValue);
    }
    return defaultValue;
  };
  const put = (value: T) => localStorage.setItem(key, JSON.stringify(value));

  const [state, setState] = useState<T>(() => get());

  const set = (updater: (old: T) => T) => {
    const newValue = updater(state);
    put(newValue);
    setState(newValue);
  };

  // Listen to any updates to local storage
  useEffect(() => {
    const listener = (newValue: any) => set(() => newValue);

    updateListeners[key] ??= [];
    updateListeners[key].push(listener);

    return () => {
      updateListeners[key] = updateListeners[key].filter(it => it !== listener);
    };
  }, [key]);

  return [state, set] as const;
}

/**
 * Update the value in local storage and notify all `useLocalStorageState` hooks
 *
 * @param key - local storage key
 * @param value - local storage value
 */
useLocalStorageState.update = (key: string, value: any) => {
  updateListeners[key]?.forEach(fn => fn(value));
};
