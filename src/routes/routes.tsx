import { Navigate, type RouteObject } from 'react-router'
import { RoleLayout } from '@/components/RoleLayout'
import { SectionPage } from '@/components/SectionPage'
import { HomePage } from '@/features/home/HomePage'
import { NotFoundPage } from '@/features/home/NotFoundPage'
import { sections } from './sections'

/**
 * Every section lives at /<role>/<page>. Role guards (issue #3) wrap the RoleLayout element.
 * To build a page, set `element` on it in features/<role>/section.ts.
 */
export const routes: RouteObject[] = [
  { path: '/', element: <HomePage /> },
  ...sections.map(
    (section): RouteObject => ({
      path: `/${section.role}`,
      element: <RoleLayout section={section} />,
      children: [
        { index: true, element: <Navigate to={section.pages[0].path} replace /> },
        ...section.pages.map((page) => ({ path: page.path, element: <SectionPage page={page} /> })),
      ],
    }),
  ),
  { path: '*', element: <NotFoundPage /> },
]
