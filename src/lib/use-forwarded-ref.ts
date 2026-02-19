import type { Ref } from 'react'

export function useForwardedRef<T>(forwardedRef: Ref<T> | undefined) {
  return (instance: T | null) => {
    if (typeof forwardedRef === 'function') {
      forwardedRef(instance)
    } else if (forwardedRef) {
      ;(forwardedRef as React.MutableRefObject<T | null>).current = instance
    }
  }
}
