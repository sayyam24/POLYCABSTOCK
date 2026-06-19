import { RoleGuard } from '@/components/role-guard'

export default function SubDistributorLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <RoleGuard allowedRole="sub_distributor">{children}</RoleGuard>
}
