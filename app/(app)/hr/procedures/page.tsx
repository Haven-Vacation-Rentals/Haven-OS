import { listDocs } from "@/lib/hr/actions";
import { DocsList } from "@/components/hr/docs-list";

export const dynamic = "force-dynamic";

export default async function ProceduresPage() {
  const docs = await listDocs("procedure");
  return <DocsList kind="procedure" docs={docs} />;
}
