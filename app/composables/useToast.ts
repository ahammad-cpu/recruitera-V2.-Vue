export type ToastKind = 'success' | 'error'

export interface Toast {
  id: number
  kind: ToastKind
  message: string
}

/** How long a toast stays on screen, in ms. Matches the prototype's timing. */
const DURATION = 3200

let seq = 0

/**
 * Transient success/error confirmations. `<BrandToast />` is mounted once in the
 * default layout and renders whatever this composable holds — call it from anywhere:
 *
 *   const toast = useToast()
 *   toast.success('Talent pool created.')
 */
export function useToast() {
  const toasts = useState<Toast[]>('brand-toasts', () => [])

  function dismiss(id: number) {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }

  function push(kind: ToastKind, message: string) {
    const id = ++seq
    toasts.value = [...toasts.value, { id, kind, message }]
    // No timers during SSR — the toast would expire before the client ever renders it.
    if (import.meta.client) setTimeout(() => dismiss(id), DURATION)
  }

  return {
    toasts,
    dismiss,
    success: (message: string) => push('success', message),
    error: (message: string) => push('error', message),
  }
}
