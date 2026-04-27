import { notFound } from "next/navigation";
import {
  getCase,
  listEvents,
  listPropertiesLite,
} from "@/lib/lost-items/actions";
import { getMembers } from "@/lib/work/actions";
import { LostItemDetail } from "@/components/lost-items/lost-item-detail";

export const dynamic = "force-dynamic";

export default async function LostItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [item, events, properties, members] = await Promise.all([
    getCase(id),
    listEvents(id),
    listPropertiesLite(),
    getMembers(),
  ]);
  if (!item) return notFound();
  return (
    <LostItemDetail
      item={item}
      events={events}
      properties={properties}
      members={members}
    />
  );
}
