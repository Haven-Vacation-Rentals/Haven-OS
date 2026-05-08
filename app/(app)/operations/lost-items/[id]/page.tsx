import { notFound } from "next/navigation";
import {
  getCase,
  listEvents,
  listPropertiesLite,
} from "@/lib/lost-items/actions";
import { getMembers } from "@/lib/work/actions";
import { getPermissions } from "@/lib/auth/permissions";
import { LostItemDetail } from "@/components/lost-items/lost-item-detail";

export const dynamic = "force-dynamic";

export default async function LostItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [item, events, properties, members, perm] = await Promise.all([
    getCase(id),
    listEvents(id),
    listPropertiesLite(),
    getMembers(),
    getPermissions(),
  ]);
  if (!item) return notFound();
  return (
    <LostItemDetail
      item={item}
      events={events}
      properties={properties}
      members={members}
      isAdmin={perm.is_admin_or_above}
    />
  );
}
