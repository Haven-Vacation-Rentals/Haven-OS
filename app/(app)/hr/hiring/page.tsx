import { listRoles } from "@/lib/hr/actions";
import { RolesList } from "@/components/hr/roles-list";

export const dynamic = "force-dynamic";

export default async function HiringPage() {
  const roles = await listRoles();
  return <RolesList roles={roles} />;
}
