import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react'

type Notify = (message: string) => void
const ToastContext = createContext<Notify>(() => undefined)

/** A short confirmation at the bottom right ("Added to basket"). */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [message, setMessage] = useState('')
  const timer = useRef<number>(0)
  const notify = useCallback<Notify>((next) => {
    setMessage(next)
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setMessage(''), 2800)
  }, [])
  return (
    <ToastContext.Provider value={notify}>
      {children}
      {message && (
        <div
          role="status"
          className="fixed right-6 bottom-5 z-[2000] flex items-center gap-2.5 rounded-xl border border-border bg-surface-card px-4 py-2.5 text-xs text-on-surface shadow-xl"
        >
          <span className="material-symbols-outlined text-[18px] text-primary">check_circle</span>
          <span>{message}</span>
        </div>
      )}
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(ToastContext)
