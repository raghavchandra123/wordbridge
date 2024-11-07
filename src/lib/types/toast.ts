import * as React from "react"
import type { ToastProps } from "@/components/ui/toast"

export type ToastActionElement = React.ReactElement

export type ToasterToast = ToastProps & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: ToastActionElement
  duration?: number
}

export type State = {
  toasts: ToasterToast[]
}