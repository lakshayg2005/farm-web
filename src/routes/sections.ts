import { adminSection } from '@/features/admin/section'
import { customerSection } from '@/features/customer/section'
import { farmerSection } from '@/features/farmer/section'
import type { Role, Section } from './types'

export const sections: Section[] = [farmerSection, customerSection, adminSection]

export const sectionByRole: Record<Role, Section> = {
  farmer: farmerSection,
  customer: customerSection,
  admin: adminSection,
}
