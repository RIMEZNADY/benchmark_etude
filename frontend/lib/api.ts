export type PageResponse<T> = {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
};

export type Category = {
  id: number;
  code: string;
  name: string;
  updatedAt: string;
};

export type Item = {
  id: number;
  sku: string;
  name: string;
  price: number;
  stock: number;
  categoryId: number | null;
  categoryCode: string | null;
  updatedAt: string;
  description: string;
};

const EXTERNAL_BASE_URLS = {
  restcontroller:
    process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8081",
  jersey:
    process.env.NEXT_PUBLIC_JERSEY_API_BASE_URL ?? "http://localhost:8082",
  "spring-data-rest":
    process.env.NEXT_PUBLIC_SPRING_DATA_REST_API_BASE_URL ??
    "http://localhost:8083"
} satisfies Record<ApiVariantKey, string>;

const INTERNAL_BASE_URLS = {
  restcontroller:
    process.env.API_BASE_URL_INTERNAL ?? "http://backend-restcontroller:8081",
  jersey:
    process.env.JERSEY_API_BASE_URL_INTERNAL ?? "http://backend-jersey:8082",
  "spring-data-rest":
    process.env.SPRING_DATA_REST_API_BASE_URL_INTERNAL ??
    "http://backend-spring-data:8083"
} satisfies Record<ApiVariantKey, string>;

export type ApiVariantKey =
  | "restcontroller"
  | "jersey"
  | "spring-data-rest";

type VariantConfig = {
  label: string;
  baseUrl: string;
  internalBaseUrl: string;
};

export const API_VARIANTS: Record<ApiVariantKey, VariantConfig> = {
  restcontroller: {
    label: "Spring MVC (@RestController)",
    baseUrl: EXTERNAL_BASE_URLS.restcontroller,
    internalBaseUrl: INTERNAL_BASE_URLS.restcontroller
  },
  jersey: {
    label: "Jersey (JAX-RS)",
    baseUrl: EXTERNAL_BASE_URLS.jersey,
    internalBaseUrl: INTERNAL_BASE_URLS.jersey
  },
  "spring-data-rest": {
    label: "Spring Data REST",
    baseUrl: EXTERNAL_BASE_URLS["spring-data-rest"],
    internalBaseUrl: INTERNAL_BASE_URLS["spring-data-rest"]
  }
};

type FetchOptions = {
  baseUrl?: string;
  variant?: ApiVariantKey;
};

function resolveBaseUrl(options?: FetchOptions): string {
  if (options?.baseUrl) {
    return options.baseUrl;
  }

  const variant = options?.variant ?? "restcontroller";
  const config = API_VARIANTS[variant];
  const isBrowser = typeof window !== "undefined";

  return isBrowser ? config.baseUrl : config.internalBaseUrl;
}

async function fetchJson<T>(pathname: string, options?: FetchOptions): Promise<T> {
  const baseUrl = resolveBaseUrl(options);

  const response = await fetch(`${baseUrl}${pathname}`, {
    cache: "no-store",
    headers: {
      Accept: "application/json"
    }
  });

  if (!response.ok) {
    throw new Error(
      `Impossible de récupérer ${pathname} : ${response.status}`
    );
  }

  return (await response.json()) as T;
}

type PaginationOptions = FetchOptions & {
  page?: number;
  size?: number;
};

type DataRestPage<T> = {
  _embedded?: Record<string, T[]>;
  page?: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
};

function normalizeDataRestPage<T, R>(
  data: DataRestPage<T>,
  mapItem: (item: T) => R,
  embeddedKeyFallback: string
): PageResponse<R> {
  const embeddedKey =
    Object.keys(data?._embedded ?? {})[0] ?? embeddedKeyFallback;
  const rawItems = (data?._embedded?.[embeddedKey] as T[]) ?? [];
  const content = rawItems.map(mapItem);

  return {
    content,
    totalElements:
      data.page?.totalElements ?? content.length,
    totalPages: data.page?.totalPages ?? 1,
    size: data.page?.size ?? content.length,
    number: data.page?.number ?? 0
  };
}

export async function fetchCategories(
  params: PaginationOptions = {}
): Promise<PageResponse<Category>> {
  const { page = 0, size = 100, variant, baseUrl } = params;
  const resolvedBaseUrl = resolveBaseUrl({ baseUrl, variant });

  if (variant === "spring-data-rest") {
    const data = await fetchJson<DataRestPage<any>>(
      `/api/categories?page=${page}&size=${size}`,
      { baseUrl: resolvedBaseUrl }
    );
    return normalizeDataRestPage(
      data,
      (category: any) => ({
        id: category.id,
        code: category.code,
        name: category.name,
        updatedAt: category.updatedAt
      }),
      "categories"
    );
  }

  return fetchJson<PageResponse<Category>>(
    `/api/categories?page=${page}&size=${size}`,
    { baseUrl: resolvedBaseUrl }
  );
}

export async function fetchItems(
  params: PaginationOptions = {}
): Promise<PageResponse<Item>> {
  const { page = 0, size = 100, variant, baseUrl } = params;
  const resolvedBaseUrl = resolveBaseUrl({ baseUrl, variant });

  if (variant === "spring-data-rest") {
    const data = await fetchJson<DataRestPage<any>>(
      `/api/items?page=${page}&size=${size}`,
      { baseUrl: resolvedBaseUrl }
    );
    return normalizeDataRestPage(
      data,
      (item: any) => ({
        id: item.id,
        sku: item.sku,
        name: item.name,
        price: Number(item.price ?? 0),
        stock: Number(item.stock ?? 0),
        categoryId: item.categoryId ?? null,
        categoryCode: item.categoryCode ?? null,
        updatedAt: item.updatedAt,
        description: item.description ?? ""
      }),
      "items"
    );
  }

  const data = await fetchJson<PageResponse<Item>>(
    `/api/items?page=${page}&size=${size}`,
    { baseUrl: resolvedBaseUrl }
  );
  return {
    ...data,
    content: data.content.map((item) => ({
      ...item,
      description: item.description ?? ""
    }))
  };
}

export async function fetchItemsByCategory(
  categoryId: number,
  params: PaginationOptions = {}
): Promise<PageResponse<Item>> {
  const { page = 0, size = 100, variant, baseUrl } = params;
  const resolvedBaseUrl = resolveBaseUrl({ baseUrl, variant });

  if (variant === "spring-data-rest") {
    const data = await fetchJson<DataRestPage<any>>(
      `/api/categories/${categoryId}/items?page=${page}&size=${size}`,
      { baseUrl: resolvedBaseUrl }
    );
    return normalizeDataRestPage(
      data,
      (item: any) => ({
        id: item.id,
        sku: item.sku,
        name: item.name,
        price: Number(item.price ?? 0),
        stock: Number(item.stock ?? 0),
        categoryId: item.categoryId ?? null,
        categoryCode: item.categoryCode ?? null,
        updatedAt: item.updatedAt,
        description: item.description ?? ""
      }),
      "items"
    );
  }

  const data = await fetchJson<PageResponse<Item>>(
    `/api/categories/${categoryId}/items?page=${page}&size=${size}`,
    { baseUrl: resolvedBaseUrl }
  );
  return {
    ...data,
    content: data.content.map((item) => ({
      ...item,
      description: item.description ?? ""
    }))
  };
}

type CategoryPayload = {
  code: string;
  name: string;
};

type ItemPayload = {
  sku: string;
  name: string;
  price: number;
  stock: number;
  categoryId: number;
  description: string;
};

export async function createCategory(
  payload: CategoryPayload,
  options?: FetchOptions
) {
  const baseUrl = resolveBaseUrl(options);

  const response = await fetch(`${baseUrl}/api/categories`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      errorBody.message ?? `Erreur création catégorie (${response.status})`
    );
  }

  return response.json() as Promise<Category>;
}

export async function createItem(
  payload: ItemPayload,
  options?: FetchOptions
) {
  const baseUrl = resolveBaseUrl(options);

  const response = await fetch(`${baseUrl}/api/items`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(
      errorBody.message ?? `Erreur création article (${response.status})`
    );
  }

  return response.json() as Promise<Item>;
}

