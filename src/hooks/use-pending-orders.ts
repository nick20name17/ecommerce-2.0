import { useSyncExternalStore } from 'react'

let pendingCount = 0
const listeners = new Set<() => void>()

const notify = () => listeners.forEach((l) => l())

export const addPendingOrder = () => {
  pendingCount++
  notify()
}

export const removePendingOrder = () => {
  pendingCount = Math.max(0, pendingCount - 1)
  notify()
}

export const usePendingOrders = () =>
  useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    () => pendingCount,
  )
