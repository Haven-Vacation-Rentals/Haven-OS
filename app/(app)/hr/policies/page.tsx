import { listDocs } from "@/lib/hr/actions";
import { DocsList } from "@/components/hr/docs-list";

export const dynamic = "force-dynamic";

export default async function PoliciesPage() {
  const docs = await listDocs("policy");
  return <DocsList kind="policy" docs={docs} />;
}
