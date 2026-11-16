import { adminSection } from '@/features/admin/section'
import { customerSection } from '@/features/customer/section'
import { farmerSection } from '@/features/farmer/section'
import { inspectorSection } from '@/features/inspector/section'
import type { Role, Section } from './types'

export const sections: Section[] = [farmerSection, customerSection, inspectorSection, adminSection]

export const sectionByRole: Record<Role, Section> = {
  farmer: farmerSection,
  customer: customerSection,
  inspector: inspectorSection,
  admin: adminSection,
}
