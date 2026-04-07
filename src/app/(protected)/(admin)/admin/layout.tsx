import { AdminShell } from "@/components/admin/layout/admin-shell";
import { requireAdminSession, roleToLabel } from "@/lib/admin/permissions";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdminSession();

  return (
    <AdminShell
      user={{
        name: admin.user.name,
        email: admin.user.email,
        username: admin.user.username,
      }}
      roleLabel={roleToLabel(admin.role)}
    >
      {children}
    </AdminShell>
  );
}
