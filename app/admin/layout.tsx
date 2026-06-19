import { RoleGuard } from '@/components/role-guard'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard allowedRole="admin">{children}</RoleGuard>
}
