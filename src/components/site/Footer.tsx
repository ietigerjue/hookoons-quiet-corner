export function Footer() {
  return (
    <footer className="mt-24 border-t border-border">
      <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-5 py-10 text-sm text-muted-foreground sm:flex-row sm:items-center">
        <div>
          <div className="font-display text-foreground">Hookoon&rsquo;s Blog</div>
          <div className="mt-1 text-[13px]">
            A quiet space for structured thinking and long-form writing.
          </div>
        </div>
        <div className="text-[13px]">
          © {new Date().getFullYear()} Hookoon · Built with care
        </div>
      </div>
    </footer>
  );
}
