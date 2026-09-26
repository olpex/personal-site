import { site } from "@/content/site";

export function Header() {
  return (
    <header className="gutter sticky top-0 z-50 border-b border-line bg-paper/85 backdrop-blur-md">
      <div className="shell flex h-14 items-center justify-between gap-6">
        <a
          href="#top"
          className="text-sm font-extrabold tracking-[-0.02em] transition-colors hover:text-accent"
        >
          {site.shortName}
        </a>

        <nav aria-label="Основна навігація" className="hidden items-center gap-7 md:flex">
          {[
            { href: "#about", label: "Про мене" },
            { href: "#work", label: "Проєкти" },
            { href: "#certs", label: "Сертифікати" },
          ].map((item) => (
            <a key={item.href} href={item.href} className="label link-underline text-ink-soft">
              {item.label}
            </a>
          ))}
        </nav>

        <a
          href={`mailto:${site.email}`}
          className="label border border-line-strong px-3 py-1.5 text-ink transition-colors hover:border-accent hover:text-accent"
        >
          Написати
        </a>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="gutter rule border-b-0">
      <div className="shell flex flex-col gap-4 py-8 md:flex-row md:items-center md:justify-between">
        <p className="label">
          © {new Date().getFullYear()} {site.name}
        </p>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <a href={`mailto:${site.email}`} className="label link-underline">
            {site.email}
          </a>
          <a href="#top" className="label link-underline">
            Вгору ↑
          </a>
        </div>
      </div>
    </footer>
  );
}
