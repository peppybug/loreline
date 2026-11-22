import Link from "next/link";

export function Facts({ items }: { items: [string, React.ReactNode][] }) {
  const shown = items.filter(([, v]) => v !== null && v !== undefined && v !== "" && v !== false);
  if (!shown.length) return null;
  return (
    <dl className="grid gap-3 text-sm">
      {shown.map(([k, v]) => (
        <div key={k} className="grid grid-cols-[6.5rem_1fr] gap-3 border-b border-line pb-3 last:border-0 last:pb-0">
          <dt className="text-muted">{k}</dt>
          <dd className="min-w-0">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

export function LinkList({ items }: { items: { href: string; label: string; detail?: string | null }[] }) {
  if (!items.length) return null;
  return (
    <ul className="grid gap-2 text-sm">
      {items.map((i) => (
        <li key={i.href}>
          <Link className="link font-medium" href={i.href}>{i.label}</Link>
          {i.detail ? <span className="block text-xs text-muted">{i.detail}</span> : null}
        </li>
      ))}
    </ul>
  );
}

export function Aside({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-sm border border-line bg-surface p-5">
      <h2 className="font-sans text-sm font-semibold">{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}
