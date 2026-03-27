import { useSyncExternalStore } from 'react'

let pendingOrders = 0
let pendingProposals = 0
const listeners = new Set<() => void>()

const notify = () => listeners.forEach((l) => l())

export const addPendingOrder = () => { pendingOrders++; notify() }
export const removePendingOrder = () => { pendingOrders = Math.max(0, pendingOrders - 1); notify() }

export const addPendingProposal = () => { pendingProposals++; notify() }
export const removePendingProposal = () => { pendingProposals = Math.max(0, pendingProposals - 1); notify() }

const subscribe = (cb: () => void) => {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export const usePendingOrders = () =>
  useSyncExternalStore(subscribe, () => pendingOrders)

export const usePendingProposals = () =>
  useSyncExternalStore(subscribe, () => pendingProposals)
