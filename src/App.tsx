import { QueryClientProvider } from '@tanstack/react-query'
import { MotionConfig } from 'motion/react'
import { useState } from 'react'
import { createBrowserRouter, RouterProvider } from 'react-router'
import { createQueryClient } from '@/api/queryClient'
import { I18nProvider } from '@/i18n/I18nProvider'
import { routes } from '@/routes/routes'

const router = createBrowserRouter(routes)

export function App() {
  const [queryClient] = useState(createQueryClient)
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <MotionConfig reducedMotion="user">
          <RouterProvider router={router} />
        </MotionConfig>
      </I18nProvider>
    </QueryClientProvider>
  )
}
