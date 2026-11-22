export function IndexPage({ title, intro, children }: { title: string; intro?: string; children: React.ReactNode }) {
  return (
    <div className="container-page pt-10">
      <h1 className="text-3xl">{title}</h1>
      {intro ? <p className="mt-3 max-w-2xl text-lg text-ink-2">{intro}</p> : null}
      <div className="mt-8">{children}</div>
    </div>
  );
}
