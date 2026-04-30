import {
  getPropertiesPaginated,
  getPropertyFacets,
} from "@/lib/properties/actions";
import { PropertiesView } from "@/components/properties/properties-view";
import type {
  PropertyFilter,
  PropertyStatus,
  PropertyTier,
} from "@/lib/properties/types";

export const dynamic = "force-dynamic";

const DEFAULT_PAGE_SIZE = 50;

export default async function PropertiesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;

  function str(v: string | string[] | undefined): string | undefined {
    return Array.isArray(v) ? v[0] : v;
  }

  const page = Math.max(0, Number.parseInt(str(sp.page) ?? "0", 10) || 0);
  const filters: PropertyFilter = {
    search: str(sp.search) || undefined,
    status: (str(sp.status) as PropertyStatus | "all" | undefined) ?? "all",
    tier: (str(sp.tier) as PropertyTier | "all" | undefined) ?? "all",
    region: str(sp.region) ?? "all",
    account_manager: str(sp.account_manager) ?? "all",
    airbnb_account: str(sp.airbnb_account) ?? "all",
  };

  const [paginated, facets] = await Promise.all([
    getPropertiesPaginated({
      ...filters,
      page,
      page_size: DEFAULT_PAGE_SIZE,
    }),
    getPropertyFacets(),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="font-heading text-display-3 font-bold tracking-tight">
            Properties
          </h1>
          <p className="text-sm text-muted-foreground">
            Haven&apos;s rental portfolio — {paginated.total.toLocaleString()} units
            across the Smokies
          </p>
        </div>
      </div>

      <PropertiesView
        properties={paginated.properties}
        total={paginated.total}
        page={paginated.page}
        pageSize={paginated.page_size}
        hasMore={paginated.has_more}
        initialFilters={filters}
        facets={facets}
      />
    </div>
  );
}
