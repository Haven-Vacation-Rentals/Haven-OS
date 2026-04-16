import { getProperties, getPropertyFacets } from "@/lib/properties/actions";
import { PropertiesView } from "@/components/properties/properties-view";

export default async function PropertiesPage() {
  const [properties, facets] = await Promise.all([
    getProperties(),
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
            Haven&apos;s rental portfolio — {properties.length} units across the Smokies
          </p>
        </div>
      </div>

      <PropertiesView properties={properties} facets={facets} />
    </div>
  );
}
