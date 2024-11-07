import { TOAST_REMOVE_DELAY } from "../constants/toast"
import { dispatch } from "../store/toastStore"

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>()

export const addToRemoveQueue = (toastId: string, duration: number = TOAST_REMOVE_DELAY) => {
  console.log('⏱️ Setting toast timeout:', {
    toastId,
    requestedDuration: duration,
    actualDuration: duration || TOAST_REMOVE_DELAY,
    existingTimeout: toastTimeouts.has(toastId),
    timestamp: new Date().toISOString()
  });

  if (toastTimeouts.has(toastId)) {
    console.log('🔄 Clearing existing timeout for toast:', toastId);
    clearTimeout(toastTimeouts.get(toastId)!);
    toastTimeouts.delete(toastId);
  }

  const timeout = setTimeout(() => {
    console.log('⌛ Toast timeout triggered:', {
      toastId,
      duration,
      timestamp: new Date().toISOString()
    });
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, duration || TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}