import { Navigate, Outlet, type RouteObject } from 'react-router'
import { RoleLayout } from '@/components/RoleLayout'
import { SectionPage } from '@/components/SectionPage'
import { AuthProvider } from '@/features/auth/AuthProvider'
import { RedirectIfSignedIn, RequireRole } from '@/features/auth/guards'
import { LoginPage } from '@/features/auth/LoginPage'
import { NoAccessPage } from '@/features/auth/NoAccessPage'
import { RegisterPage } from '@/features/auth/RegisterPage'
import { VerifyPage } from '@/features/auth/VerifyPage'
import { NotFoundPage } from '@/features/home/NotFoundPage'
import { FarmPage } from '@/features/shop/FarmPage'
import { ProfilePage } from '@/features/auth/ProfilePage'
import { TeamPage } from '@/features/team/TeamPage'
import { ToastProvider } from '@/components/Toast'
import { sections } from './sections'

/**
 * Every section lives at /<role>/<page>, behind a RequireRole guard.
 * To build a page, set `element` on it in features/<role>/section.ts.
 */
export const routes: RouteObject[] = [
  {
    element: (
      <AuthProvider>
        <ToastProvider>
          <Outlet />
        </ToastProvider>
      </AuthProvider>
    ),
    children: [
      {
        // The start page is the sign-in form; signed-in people go straight to their workspace.
        element: <RedirectIfSignedIn />,
        children: [
          { path: '/', element: <LoginPage /> },
          { path: '/login', element: <LoginPage /> },
          { path: '/register', element: <RegisterPage /> },
        ],
      },
      { path: '/farm/:id', element: <FarmPage /> },
      { path: '/profile', element: <ProfilePage /> },
      { path: '/team', element: <TeamPage /> },
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
