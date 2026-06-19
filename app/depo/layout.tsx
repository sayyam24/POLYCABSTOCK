import { RoleGuard } from '@/components/role-guard'

export default function DepoLayout({ children }: { children: React.ReactNode }) {
  return <RoleGuard allowedRole="depo">{children}</RoleGuard>
}
