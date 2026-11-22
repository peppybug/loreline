"use client";

import { useRouter } from "next/navigation";

export function EventPicker({ options, value }: { options: { slug: string; title: string }[]; value: string }) {
  const router = useRouter();
  return (
    <div>
      <label htmlFor="picker" className="text-xs font-semibold">Centre on</label>
      <select id="picker" value={value} onChange={(e) => router.push(`/connections/${e.target.value}/`)} className="mt-1 block max-w-full rounded-sm border border-line-strong bg-surface px-2.5 py-2 text-sm">
        {options.map((o) => <option key={o.slug} value={o.slug}>{o.title}</option>)}
      </select>
    </div>
  );
}
