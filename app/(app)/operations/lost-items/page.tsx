import {
  listCases,
  listPropertiesLite,
  getCaseStats,
} from "@/lib/lost-items/actions";
import { getMembers } from "@/lib/work/actions";
import { LostItemsDirectory } from "@/components/lost-items/lost-items-directory";

export const dynamic = "force-dynamic";

export default async function LostItemsPage() {
  const [cases, properties, members, stats] = await Promise.all([
    listCases(),
    listPropertiesLite(),
    getMembers(),
    getCaseStats(),
  ]);
  return (
    <LostItemsDirectory
      cases={cases}
      properties={properties}
      members={members}
      stats={stats}
    />
  );
}
