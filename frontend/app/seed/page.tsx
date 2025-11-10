import { SeedManager } from "@/components/SeedManager";
import { VariantSwitcher } from "@/components/VariantSwitcher";
import {
    API_VARIANTS,
    ApiVariantKey,
    fetchCategories,
    fetchItems
} from "@/lib/api";
import Link from "next/link";

export const metadata = {
  title: "Remplir la base de données | Tableau de bord Benchmark REST"
};

type SeedPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

function resolveVariantKey(value?: string | string[]): ApiVariantKey {
  const normalized = Array.isArray(value) ? value[0] : value;
  if (normalized && normalized in API_VARIANTS) {
    return normalized as ApiVariantKey;
  }
  return "restcontroller";
}

export default async function SeedPage({ searchParams }: SeedPageProps) {
  const variantKey = resolveVariantKey(searchParams?.variant);
  const variantConfig = API_VARIANTS[variantKey];

  const [categoriesPage, itemsPage] = await Promise.all([
    fetchCategories({
      page: 0,
      size: 200,
      variant: variantKey,
      baseUrl: variantConfig.internalBaseUrl
    }),
    fetchItems({
      page: 0,
      size: 200,
      variant: variantKey,
      baseUrl: variantConfig.internalBaseUrl
    })
  ]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <header className="mb-10 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-wide text-primary-600">
            Outillage
          </p>
          <h1 className="mt-2 text-4xl font-bold text-slate-900">
            Remplir la base de données
          </h1>
          <p className="mt-4 max-w-3xl text-base text-slate-600">
            Utilisez cette interface pour créer rapidement des catégories et des
            articles via les web services REST. Les données apparaîtront
            immédiatement dans le tableau de bord principal.
          </p>
        </div>
        <div className="flex flex-col items-start gap-3 md:items-end">
          <VariantSwitcher current={variantKey} />
          <Link
            href={`/?variant=${variantKey}`}
            className="inline-flex items-center justify-center rounded-lg bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-700 ring-1 ring-primary-100 transition hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-primary-300"
          >
            Retour au tableau de bord
          </Link>
        </div>
      </header>

      <SeedManager
        categories={categoriesPage.content}
        items={itemsPage.content}
        variant={variantKey}
        baseUrl={variantConfig.baseUrl}
        variantLabel={variantConfig.label}
      />
    </main>
  );
}

