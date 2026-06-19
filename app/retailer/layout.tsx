import { RoleGuard } from '@/components/role-guard'

export default function RetailerLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard allowedRole="retailer">{children}</RoleGuard>
}
