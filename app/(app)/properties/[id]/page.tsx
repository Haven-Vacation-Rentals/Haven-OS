import { notFound } from "next/navigation";
import { getProperty } from "@/lib/properties/actions";
import { PropertyDetail } from "@/components/properties/property-detail";

export default async function PropertyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const property = await getProperty(id);
  if (!property) notFound();
  return <PropertyDetail property={property} />;
}
