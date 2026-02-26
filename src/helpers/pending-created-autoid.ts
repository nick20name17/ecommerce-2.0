type Entity = 'order' | 'proposal'

interface PendingWaiter {
  id: number
  entity: Entity
  resolve: (autoid: string) => void
  reject: (reason: Error) => void
  timeoutId: ReturnType<typeof setTimeout>
}

const pendingWaiters: PendingWaiter[] = []
let nextId = 0
const DEFAULT_TIMEOUT_MS = 15000

export function waitForCreatedAutoid(
  entity: Entity,
  timeoutMs = DEFAULT_TIMEOUT_MS
): Promise<string> {
  return new Promise((resolve, reject) => {
    const id = nextId++
    const timeoutId = setTimeout(() => {
      const idx = pendingWaiters.findIndex((w) => w.id === id)
      if (idx !== -1) {
        const [waiter] = pendingWaiters.splice(idx, 1)
        waiter.reject(new Error(`Timeout waiting for ${entity} created notification`))
      }
    }, timeoutMs)
    pendingWaiters.push({ id, entity, resolve, reject, timeoutId })
  })
}

export function resolvePendingCreatedAutoid(entity: string, autoid: string): void {
  const idx = pendingWaiters.findIndex((w) => w.entity === entity)
  if (idx === -1) return
  const [waiter] = pendingWaiters.splice(idx, 1)
  clearTimeout(waiter.timeoutId)
  waiter.resolve(autoid)
}

export function cancelPendingCreatedAutoid(entity: Entity): void {
  const idx = pendingWaiters.findIndex((w) => w.entity === entity)
  if (idx === -1) return
  const [waiter] = pendingWaiters.splice(idx, 1)
  clearTimeout(waiter.timeoutId)
  waiter.reject(new Error(`Cancelled: ${entity} create did not complete`))
}
