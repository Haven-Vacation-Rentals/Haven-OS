import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getLeadMagnetBySlug,
  type LeadMagnet,
} from "@/lib/gtm/lead-magnets/actions";
import { LeadMagnetTemplate } from "@/components/gtm/lead-magnets/lead-magnet-template";
import { ExpiredLeadMagnet } from "@/components/gtm/lead-magnets/expired-lead-magnet";
import { canonicalUrl } from "@/lib/canonical-url";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function generateMetadata(props: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await props.params;
  const magnet = await getLeadMagnetBySlug(slug);
  const url = canonicalUrl(`/lead-magnet/${slug}`);
  if (!magnet) {
    return {
      title: "Haven Vacation Rentals",
      alternates: { canonical: url },
    };
  }
  const description =
    magnet.subtitle ?? "A free resource from Haven Vacation Rentals.";
  return {
    title: `${magnet.title} — Haven Vacation Rentals`,
    description,
    alternates: { canonical: url },
    robots: { index: false, follow: false },
    openGraph: {
      title: magnet.title,
      description,
      url,
      images: magnet.hero_image_url ? [{ url: magnet.hero_image_url }] : [],
    },
  };
}

export default async function LeadMagnetPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await props.params;
  const magnet: LeadMagnet | null = await getLeadMagnetBySlug(slug);
  if (!magnet) notFound();

  const isExpired = new Date(magnet.expires_at).getTime() < Date.now();
  if (isExpired || magnet.status !== "active") {
    return <ExpiredLeadMagnet title={magnet.title} />;
  }

  return <LeadMagnetTemplate magnet={magnet} />;
}
