import * as React from "react"

type ToastActionElement = React.ReactElement<any>

export interface Toast {
  title?: string
  description?: string
  action?: ToastActionElement
  variant?: "default" | "destructive"
}

export function useToast() {
  const toast = ({ title, description, variant }: Toast) => {
    // Simple implementation - you can enhance this
    if (variant === "destructive") {
      alert(`Error: ${title}\n${description}`)
    } else {
      alert(`${title}\n${description}`)
    }
  }

  return { toast }
}
