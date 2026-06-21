import { createFileRoute } from "@tanstack/react-router";
import { ExternalLink, Github, MessageCircle } from "lucide-react";
import { buildSeo } from "@/lib/seo";

export const Route = createFileRoute("/about")({
  head: () =>
    buildSeo({
      title: "About",
      description:
        "About Hookoon and this blog: AI agents, personal projects, materials learning, price action notes, and long-term thinking. 关于 Hookoon，以及这个个人博客记录的方向：AI Agent、个人项目、材料学习、价格行为学笔记和长期思考。",
      path: "/about",
    }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-5 sm:py-20">
      <header className="fade-up">
        <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">About</div>
        <h1 className="mt-2 text-balance font-display text-[clamp(2.25rem,11vw,3.75rem)] font-medium leading-[1.08] tracking-tight text-foreground">
          Hi, I&rsquo;m Hookoon.
        </h1>
        <p className="mt-6 space-y-3 text-[16.5px] leading-[1.8] text-muted-foreground sm:text-[18px]">
          <span className="block">
            I write about AI tools, agent workflows, materials science, product building, and
            personal learning systems. I&rsquo;m also a fan of Al Brooks, so this blog includes
            notes on price action and market structure alongside my project logs and long-form
            reflections.
          </span>
          <span className="block">
            我会在这里记录 AI 工具、Agent 工作流、材料学习、产品构建和个人学习系统。我也是 Al Brooks
            的粉丝，所以博客也会持续分享价格行为学、市场结构和交易观察相关笔记。
          </span>
        </p>
      </header>

      <section className="mt-12 grid gap-9 sm:mt-14 sm:gap-10">
        <Block title="Current focus">
          <div className="space-y-3">
            <p>
              Building small agent systems for everyday research, preparing for the MATE program at
              HKUST, and turning recurring learning work into durable notes.
            </p>
            <p>
              目前我在搭建日常研究用的小型 Agent 系统，准备 HKUST 的 MATE
              项目，也在把重复出现的学习任务整理成可以长期复用的笔记。
            </p>
          </div>
        </Block>

        <Block title="Topics I write about">
          <ul className="grid gap-2 sm:grid-cols-2">
            {[
              "AI agents & workflows",
              "Materials Science",
              "Price action notes",
              "Product building",
              "Research notes",
              "Coding journal",
              "Personal growth",
            ].map((t) => (
              <li
                key={t}
                className="rounded-xl border border-border bg-card px-4 py-3 text-[14.5px] text-foreground"
              >
                {t}
              </li>
            ))}
          </ul>
        </Block>

        <Block title="Contact">
          <div className="flex flex-wrap gap-2">
            {[
              {
                label: "GitHub",
                href: "https://github.com/ietigerjue",
                icon: Github,
              },
              {
                label: "X",
                href: "https://x.com/GuanZou95926",
                icon: ExternalLink,
              },
              {
                label: "小红书",
                href: "https://www.xiaohongshu.com/user/profile/623c184f000000001000f359",
                icon: MessageCircle,
              },
            ].map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border bg-secondary px-4 py-2 text-[13.5px] text-muted-foreground transition-colors hover:border-[color:var(--ink-faint)] hover:text-foreground"
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {label}
              </a>
            ))}
          </div>
        </Block>
      </section>
    </div>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="fade-up">
      <h2 className="font-display text-xl text-foreground">{title}</h2>
      <div className="mt-4 text-[15.5px] leading-[1.75] text-muted-foreground">{children}</div>
    </div>
  );
}
