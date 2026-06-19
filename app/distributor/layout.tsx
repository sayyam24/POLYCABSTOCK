import { RoleGuard } from '@/components/role-guard'

export default function DistributorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <RoleGuard allowedRole="distributor">{children}</RoleGuard>
}
