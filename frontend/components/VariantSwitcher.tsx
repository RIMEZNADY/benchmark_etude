"use client";

import { API_VARIANTS, ApiVariantKey } from "@/lib/api";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ChangeEvent } from "react";

type VariantSwitcherProps = {
  current: ApiVariantKey;
};

export function VariantSwitcher({ current }: VariantSwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value as ApiVariantKey;
    const params = new URLSearchParams(searchParams.toString());
    params.set("variant", value);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <label className="flex items-center gap-2 text-sm text-slate-600">
      <span>Variante backend :</span>
      <select
        value={current}
        onChange={handleChange}
        className="rounded-lg border border-slate-300 bg-white px-3 py-1 text-sm font-medium text-slate-700 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-200"
      >
        {Object.entries(API_VARIANTS).map(([key, variant]) => (
          <option key={key} value={key}>
            {variant.label}
          </option>
        ))}
      </select>
    </label>
  );
}

