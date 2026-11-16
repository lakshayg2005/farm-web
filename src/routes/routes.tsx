import { Navigate, Outlet, type RouteObject } from 'react-router'
import { RoleLayout } from '@/components/RoleLayout'
import { SectionPage } from '@/components/SectionPage'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { RedirectIfSignedIn, RequireRole } from '@/features/auth/guards'
import { LoginPage } from '@/features/auth/LoginPage'
import { NoAccessPage } from '@/features/auth/NoAccessPage'
import { RegisterPage } from '@/features/auth/RegisterPage'
import { VerifyPage } from '@/features/auth/VerifyPage'
import { HomePage } from '@/features/home/HomePage'
import { NotFoundPage } from '@/features/home/NotFoundPage'
import { sections } from './sections'

/**
 * Every section lives at /<role>/<page>, behind a RequireRole guard.
 * To build a page, set `element` on it in features/<role>/section.ts.
 */
export const routes: RouteObject[] = [
  {
    element: (
      <AuthProvider>
        <Outlet />
      </AuthProvider>
    ),
    children: [
      { path: '/', element: <HomePage /> },
      {
        element: <RedirectIfSignedIn />,
        children: [
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
        ],
      },
      { path: '/verify', element: <VerifyPage /> },
      { path: '/no-access', element: <NoAccessPage /> },
      ...sections.map(
        (section): RouteObject => ({
          element: <RequireRole role={section.role} />,
          children: [
            {
              path: `/${section.role}`,
              element: <RoleLayout section={section} />,
              children: [
                { index: true, element: <Navigate to={section.pages[0].path} replace /> },
                ...section.pages.map((page) => ({ path: page.path, element: <SectionPage page={page} /> })),
              ],
            },
          ],
        }),
      ),
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]
