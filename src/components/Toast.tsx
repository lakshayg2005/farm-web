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
          className="fixed inset-x-4 bottom-20 z-[2000] mx-auto max-w-sm rounded-md bg-on-surface px-4 py-2.5 text-sm text-background shadow-lg sm:right-6 sm:bottom-6 sm:left-auto sm:mx-0 lg:bottom-6"
        >
          {message}
        </div>
      )}
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(ToastContext)
