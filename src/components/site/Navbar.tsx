import { Link } from "@tanstack/react-router";

const links = [
  { to: "/", label: "Home" },
  { to: "/posts", label: "Posts" },
  { to: "/tags", label: "Tags" },
  { to: "/about", label: "About" },
  { to: "/write", label: "Write" },
] as const;

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/75 backdrop-blur-md">
      <nav className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
        <Link
          to="/"
          className="font-display text-[17px] tracking-tight text-foreground"
        >
          Hookoon&rsquo;s Blog
        </Link>
        <ul className="flex items-center gap-1 text-[13.5px] text-muted-foreground">
          {links.map((l) => (
            <li key={l.to}>
              <Link
                to={l.to}
                activeOptions={{ exact: l.to === "/" }}
                className="rounded-md px-3 py-1.5 transition-colors hover:bg-secondary hover:text-foreground"
                activeProps={{ className: "text-foreground bg-secondary" }}
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}
