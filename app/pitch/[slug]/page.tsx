import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPitchBySlug, type SalesPitch } from "@/lib/sales/actions";
import { PitchTemplate } from "@/components/sales/pitch-template";
import { ExpiredPitch } from "@/components/sales/expired-pitch";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const pitch = await getPitchBySlug(slug);
  if (!pitch) {
    return { title: "Pitch — Haven Vacation Rentals" };
  }
  return {
    title: `Your property pitch — Haven Vacation Rentals`,
    description: `A custom revenue projection and management proposal from Haven Vacation Rentals for ${pitch.owner_name}.`,
    robots: { index: false, follow: false },
    openGraph: {
      title: "Haven Vacation Rentals — Property Pitch",
      description: `A personalized property management proposal for ${pitch.owner_name}.`,
      images: pitch.hero_image_url ? [{ url: pitch.hero_image_url }] : [],
    },
  };
}

export default async function PitchPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const pitch: SalesPitch | null = await getPitchBySlug(slug);
  if (!pitch) notFound();

  const isExpired = new Date(pitch.expires_at).getTime() < Date.now();
  if (isExpired || pitch.status === "archived") {
    return <ExpiredPitch ownerName={pitch.owner_name} />;
  }

  return <PitchTemplate pitch={pitch} />;
}
