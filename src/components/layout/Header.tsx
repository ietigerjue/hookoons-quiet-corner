import { Link } from "@tanstack/react-router";

const links = [
  { to: "/", label: "Home" },
  { to: "/blog", label: "Blog" },
  { to: "/projects", label: "Projects" },
  { to: "/tags", label: "Tags" },
  { to: "/about", label: "About" },
] as const;

export function Header() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/75 backdrop-blur-md">
      <nav className="mx-auto flex min-h-14 max-w-6xl items-center gap-3 px-4 py-2 sm:px-5">
        <Link
          to="/"
          className="shrink-0 rounded-md font-display text-[16px] tracking-tight text-foreground sm:text-[17px]"
          aria-label="Hookoon's Blog home"
        >
          Hookoon&rsquo;s Blog
        </Link>
        <ul className="ml-auto flex min-w-0 items-center gap-1 overflow-x-auto text-[13px] text-muted-foreground [scrollbar-width:none] sm:text-[13.5px] [&::-webkit-scrollbar]:hidden">
          {links.map((link) => (
            <li key={link.to} className="shrink-0">
              <Link
                to={link.to}
                activeOptions={{ exact: link.to === "/" }}
                className="block rounded-md px-2.5 py-2 transition-colors hover:bg-secondary hover:text-foreground sm:px-3 sm:py-1.5"
                activeProps={{ className: "text-foreground bg-secondary" }}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
