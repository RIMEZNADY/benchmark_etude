"use client";

import {
    ApiVariantKey,
    Category,
    createCategory,
    createItem,
    fetchCategories,
    Item
} from "@/lib/api";
import { useRouter } from "next/navigation";
import { ChangeEvent, useEffect, useState, useTransition } from "react";

type SeedManagerProps = {
  categories: Category[];
  items: Item[];
  variant: ApiVariantKey;
  baseUrl: string;
  variantLabel: string;
};

type ItemFormState = {
  sku: string;
  name: string;
  price: string;
  stock: string;
  categoryId: string;
  description: string;
};

const SEED_CATEGORY_COUNT = 2000;
const PRODUCTS_PER_CATEGORY = 50;

const SEED_CATEGORIES: Array<{ code: string; name: string }> = Array.from(
  { length: SEED_CATEGORY_COUNT },
  (_, index) => {
    const codeNumber = (index + 1).toString().padStart(4, "0");
    return {
      code: `CAT${codeNumber}`,
      name: `Catégorie ${codeNumber}`
    };
  }
);

const SAMPLE_PRODUCT_NAMES = Array.from(
  { length: PRODUCTS_PER_CATEGORY },
  (_, index) => `Produit ${index + 1}`
);
const HEAVY_DESCRIPTION_SIZE = 5 * 1024;
const DESCRIPTION_FILLER =
  " Ce texte étendu simule un payload lourd pour les scénarios JMeter HEAVY-body.";

function buildHeavyDescription(category: Category, productName: string) {
  const header = `Description détaillée pour ${productName} associé à ${category.name} (${category.code}).`;
  let description = header;
  while (description.length < HEAVY_DESCRIPTION_SIZE) {
    description += `${DESCRIPTION_FILLER} ${productName} appartient à ${category.code}.`;
  }
  if (description.length > HEAVY_DESCRIPTION_SIZE) {
    description = description.slice(0, HEAVY_DESCRIPTION_SIZE);
  }
  return description;
}

export function SeedManager({
  categories,
  items,
  variant,
  baseUrl,
  variantLabel
}: SeedManagerProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isBulkLoading, setIsBulkLoading] = useState(false);
  const [isProductBulkLoading, setIsProductBulkLoading] = useState(false);

  const [categoryForm, setCategoryForm] = useState({
    code: "",
    name: ""
  });
  const [categoryMessage, setCategoryMessage] = useState<string | null>(null);

  const [itemForm, setItemForm] = useState<ItemFormState>({
    sku: "",
    name: "",
    price: "",
    stock: "",
    categoryId: categories[0]?.id ? String(categories[0].id) : "",
    description:
      categories[0] != null
        ? buildHeavyDescription(categories[0], SAMPLE_PRODUCT_NAMES[0])
        : ""
  });
  const [itemMessage, setItemMessage] = useState<string | null>(null);
  const [bulkMessage, setBulkMessage] = useState<string | null>(null);
  const [productBulkMessage, setProductBulkMessage] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (categories.length > 0) {
      setItemForm((prev) => ({
        ...prev,
        categoryId: prev.categoryId || String(categories[0].id),
        description:
          prev.description && prev.description.length > 0
            ? prev.description
            : buildHeavyDescription(categories[0], SAMPLE_PRODUCT_NAMES[0])
      }));
    }
  }, [categories]);

  const isConflictError = (error: unknown) =>
    error instanceof Error && /existe déjà/i.test(error.message);

  const handleItemInputChange =
    (field: "sku" | "name" | "price" | "stock") =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const { value } = event.target;
      setItemForm((prev) => ({
        ...prev,
        [field]: value
      }));
    };

  const handleItemDescriptionChange = (
    event: ChangeEvent<HTMLTextAreaElement>
  ) => {
    const { value } = event.target;
    setItemForm((prev) => ({
      ...prev,
      description: value
    }));
  };

  const handleItemCategoryChange = (
    event: ChangeEvent<HTMLSelectElement>
  ) => {
    const { value } = event.target;
    setItemForm((prev) => ({
      ...prev,
      categoryId: value
    }));
  };

  const handleCategorySubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setCategoryMessage(null);
    try {
      await createCategory(
        {
          code: categoryForm.code,
          name: categoryForm.name
        },
        { variant, baseUrl }
      );
      setCategoryMessage("Catégorie créée avec succès.");
      setCategoryForm({ code: "", name: "" });
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur inattendue.";
      setCategoryMessage(message);
    }
  };

  const handleItemSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setItemMessage(null);
    if (!itemForm.categoryId) {
      setItemMessage("Veuillez sélectionner une catégorie.");
      return;
    }
    if (!itemForm.description.trim()) {
      setItemMessage("Veuillez renseigner une description.");
      return;
    }

    try {
      await createItem(
        {
          sku: itemForm.sku,
          name: itemForm.name,
          price: Number(itemForm.price),
          stock: Number(itemForm.stock),
          categoryId: Number(itemForm.categoryId),
          description: itemForm.description
        },
        { variant, baseUrl }
      );
      setItemMessage("Article créé avec succès.");
      setItemForm((prev) => ({
        ...prev,
        sku: "",
        name: "",
        price: "",
        stock: "",
        description: (() => {
          const selectedCategory =
            categories.find((category) => String(category.id) === prev.categoryId) ??
            categories[0];
          return selectedCategory
            ? buildHeavyDescription(selectedCategory, SAMPLE_PRODUCT_NAMES[0])
            : "";
        })()
      }));
      startTransition(() => {
        router.refresh();
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur inattendue.";
      setItemMessage(message);
    }
  };

  const seedProductsForCategories = async (categoriesList: Category[]) => {
    for (const category of categoriesList) {
      for (let index = 0; index < SAMPLE_PRODUCT_NAMES.length; index += 1) {
        const productName = SAMPLE_PRODUCT_NAMES[index];
        const payload = {
          sku: `SKU-${category.code}-${(index + 1)
            .toString()
            .padStart(3, "0")}`,
          name: `${productName} ${category.name.toLowerCase()}`,
          price: Number((19.99 + index * 9.5 + category.id % 5).toFixed(2)),
          stock: 15 + ((category.id + index * 7) % 35),
          categoryId: category.id,
          description: buildHeavyDescription(category, productName)
        };

        try {
          await createItem(payload, { variant, baseUrl });
        } catch (error) {
          if (!isConflictError(error)) {
            throw error;
          }
        }
      }
    }
  };

  const handleSeedData = async () => {
    setBulkMessage(null);
    setIsBulkLoading(true);
    try {
      for (const category of SEED_CATEGORIES) {
        try {
          await createCategory(category, { variant, baseUrl });
        } catch (error) {
          if (!isConflictError(error)) {
            throw error;
          }
        }
      }

      const refreshed = await fetchCategories({
        page: 0,
        size: SEED_CATEGORY_COUNT,
        variant,
        baseUrl
      });
      await seedProductsForCategories(refreshed.content);

      setBulkMessage(
        `Jeu de test créé avec succès (${SEED_CATEGORY_COUNT.toLocaleString("fr-FR")} catégories & ${(SEED_CATEGORY_COUNT * PRODUCTS_PER_CATEGORY).toLocaleString("fr-FR")} articles).`
      );
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur lors de la génération.";
      setBulkMessage(message);
    } finally {
      setIsBulkLoading(false);
    }
  };

  const handleSeedProductsOnly = async () => {
    setProductBulkMessage(null);
    setIsProductBulkLoading(true);
    try {
      const refreshed = await fetchCategories({
        page: 0,
        size: SEED_CATEGORY_COUNT,
        variant,
        baseUrl
      });
      await seedProductsForCategories(refreshed.content);
      setProductBulkMessage(
        `Articles de test générés (${PRODUCTS_PER_CATEGORY} par catégorie).`
      );
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Erreur lors de la génération.";
      setProductBulkMessage(message);
    } finally {
      setIsProductBulkLoading(false);
    }
  };

  return (
    <div className="grid gap-8">
      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <header className="mb-4">
          <h2 className="text-xl font-semibold text-primary-700">
            Générer un jeu de test
          </h2>
          <p className="text-sm text-slate-600">
            {`Crée automatiquement ${SEED_CATEGORY_COUNT.toLocaleString("fr-FR")} catégories et ${PRODUCTS_PER_CATEGORY} articles répartis entre ces catégories. Les doublons sont ignorés.`}
          </p>
          <p className="text-xs text-slate-500">
            Variante ciblée : {variantLabel} ({baseUrl})
          </p>
        </header>
        <button
          type="button"
          onClick={handleSeedData}
          className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-300 disabled:cursor-not-allowed disabled:bg-primary-300"
          disabled={isBulkLoading}
        >
          {isBulkLoading
            ? "Création du jeu de test..."
            : `Créer ${SEED_CATEGORY_COUNT.toLocaleString("fr-FR")} catégories et ${(SEED_CATEGORY_COUNT * PRODUCTS_PER_CATEGORY).toLocaleString("fr-FR")} articles`}
        </button>
        <button
          type="button"
          onClick={handleSeedProductsOnly}
          className="mt-3 inline-flex items-center justify-center rounded-lg bg-primary-50 px-4 py-2 text-sm font-semibold text-primary-700 ring-1 ring-primary-100 transition hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-primary-300 disabled:cursor-not-allowed disabled:bg-primary-100 disabled:text-primary-300"
          disabled={isProductBulkLoading}
        >
          {isProductBulkLoading
            ? "Création des articles..."
            : `Créer ${PRODUCTS_PER_CATEGORY} articles par catégorie existante`}
        </button>
        {bulkMessage ? (
          <p
            className={`mt-3 text-sm ${
              bulkMessage.includes("succès")
                ? "text-emerald-600"
                : "text-red-600"
            }`}
          >
            {bulkMessage}
          </p>
        ) : null}
        {productBulkMessage ? (
          <p
            className={`mt-2 text-sm ${
              productBulkMessage.includes("générés")
                ? "text-emerald-600"
                : "text-red-600"
            }`}
          >
            {productBulkMessage}
          </p>
        ) : null}
      </section>

      <div className="grid gap-8 lg:grid-cols-2">
        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <header className="mb-4">
            <h2 className="text-xl font-semibold text-primary-700">
              Ajouter une catégorie
            </h2>
            <p className="text-sm text-slate-600">
              Créez de nouvelles catégories pour enrichir votre catalogue.
            </p>
          </header>
          <form className="space-y-4" onSubmit={handleCategorySubmit}>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Code
              </label>
              <input
                required
                value={categoryForm.code}
                onChange={(event) =>
                  setCategoryForm((prev) => ({
                    ...prev,
                    code: event.target.value
                  }))
                }
                placeholder="CAT001"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Nom
              </label>
              <input
                required
                value={categoryForm.name}
                onChange={(event) =>
                  setCategoryForm((prev) => ({
                    ...prev,
                    name: event.target.value
                  }))
                }
                placeholder="Électronique"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-300 disabled:cursor-not-allowed disabled:bg-primary-300"
              disabled={isPending}
            >
              {isPending ? "Enregistrement..." : "Créer la catégorie"}
            </button>
            {categoryMessage ? (
              <p
                className={`text-sm ${
                  categoryMessage.includes("succès")
                    ? "text-emerald-600"
                    : "text-red-600"
                }`}
              >
                {categoryMessage}
              </p>
            ) : null}
          </form>
        </section>

        <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <header className="mb-4">
            <h2 className="text-xl font-semibold text-primary-700">
              Ajouter un article
            </h2>
            <p className="text-sm text-slate-600">
              Associez vos articles à une catégorie existante.
            </p>
          </header>
          <form className="space-y-4" onSubmit={handleItemSubmit}>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                SKU
              </label>
              <input
                required
                value={itemForm.sku}
                onChange={handleItemInputChange("sku")}
                placeholder="SKU-0001"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Nom
              </label>
              <input
                required
                value={itemForm.name}
                onChange={handleItemInputChange("name")}
                placeholder="Clavier mécanique"
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Prix (€)
                </label>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  value={itemForm.price}
                  onChange={handleItemInputChange("price")}
                  placeholder="99.99"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Stock
                </label>
                <input
                  required
                  type="number"
                  min="0"
                  value={itemForm.stock}
                  onChange={handleItemInputChange("stock")}
                  placeholder="25"
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-slate-700">
                  Description (≈5 KB)
                </label>
                <span className="text-xs text-slate-500">
                  {itemForm.description.length.toLocaleString("fr-FR")} /{" "}
                  {HEAVY_DESCRIPTION_SIZE.toLocaleString("fr-FR")} caractères
                </span>
              </div>
              <textarea
                required
                value={itemForm.description}
                onChange={handleItemDescriptionChange}
                rows={6}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700">
                Catégorie
              </label>
              <select
                required
                value={itemForm.categoryId}
                onChange={handleItemCategoryChange}
                className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
              >
                <option value="">Sélectionner une catégorie</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name} ({category.code})
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-300 disabled:cursor-not-allowed disabled:bg-primary-300"
              disabled={isPending}
            >
              {isPending ? "Enregistrement..." : "Créer l'article"}
            </button>
            {itemMessage ? (
              <p
                className={`text-sm ${
                  itemMessage.includes("succès")
                    ? "text-emerald-600"
                    : "text-red-600"
                }`}
              >
                {itemMessage}
              </p>
            ) : null}
          </form>
        </section>
      </div>

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <header className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-primary-700">
              Catégories existantes
            </h2>
            <p className="text-sm text-slate-600">
              {categories.length} catégorie(s) disponibles.
            </p>
          </div>
        </header>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Code
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Nom
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Mise à jour
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {categories.map((category) => (
                <tr key={category.id}>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {category.code}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {category.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-500">
                    {new Date(category.updatedAt).toLocaleString("fr-FR")}
                  </td>
                </tr>
              ))}
              {categories.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-4 py-6 text-center text-sm text-slate-500"
                  >
                    Aucune catégorie encore disponible.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <header className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-primary-700">
              Articles existants
            </h2>
            <p className="text-sm text-slate-600">
              {items.length} article(s) enregistrés.
            </p>
          </div>
        </header>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  SKU
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Nom
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Catégorie
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Prix
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Stock
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {items.map((item) => (
                <tr key={item.id}>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {item.sku}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {item.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-700">
                    {item.categoryCode}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-slate-700">
                    {Number(item.price).toLocaleString("fr-FR", {
                      style: "currency",
                      currency: "EUR"
                    })}
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-slate-700">
                    {item.stock.toLocaleString("fr-FR")}
                  </td>
                </tr>
              ))}
              {items.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-sm text-slate-500"
                  >
                    Aucun article encore saisi.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

