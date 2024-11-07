import { State } from "../types/toast"
import { reducer } from "../utils/toastReducer"

export const listeners: Array<(state: State) => void> = []
export let memoryState: State = { toasts: [] }

export function dispatch(action: Parameters<typeof reducer>[1]) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}