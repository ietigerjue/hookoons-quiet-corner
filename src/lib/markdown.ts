export type TocItem = {
  id: string;
  text: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function escapeAttr(value: string) {
  return escapeHtml(value).replace(/'/g, "&#39;");
}

function slugifyHeading(value: string) {
  return value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/(^-|-$)/g, "");
}

function safeUrl(value: string) {
  const trimmed = value.trim();
  if (trimmed.startsWith("/") || trimmed.startsWith("#")) return trimmed;

  try {
    const url = new URL(trimmed);
    if (["http:", "https:", "mailto:"].includes(url.protocol)) return trimmed;
  } catch {
    return "#";
  }

  return "#";
}

function isExternalUrl(value: string) {
  try {
    const url = new URL(value.trim());
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

function fallbackAlt(src: string) {
  const clean = src.split("#")[0].split("?")[0];
  const filename = clean.split("/").pop() ?? "";
  try {
    return decodeURIComponent(filename.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "));
  } catch {
    return filename.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
  }
}

function inlineMarkdown(value: string) {
  const codeTokens: string[] = [];
  const tokenized = value.replace(/`([^`]+)`/g, (_, code: string) => {
    const token = `@@CODE_${codeTokens.length}@@`;
    codeTokens.push(`<code>${escapeHtml(code)}</code>`);
    return token;
  });

  let html = escapeHtml(tokenized)
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_, alt: string, src: string) => {
      const safeSrc = safeUrl(src);
      const safeAlt = alt.trim() || fallbackAlt(src);
      return `<img src="${escapeAttr(safeSrc)}" alt="${escapeAttr(safeAlt)}" loading="lazy" decoding="async" data-markdown-image="true" role="button" tabindex="0" aria-label="Open image preview: ${escapeAttr(safeAlt)}" />`;
    })
    .replace(/!\[\[([^|\]]+)\|([^\]]+)\]\]/g, (_, ref: string, alt: string) => {
      const safeSrc = escapeAttr(ref.trim());
      const safeAlt = alt.trim() || fallbackAlt(ref);
      return `<img src="${safeSrc}" alt="${escapeAttr(safeAlt)}" loading="lazy" decoding="async" data-markdown-image="true" role="button" tabindex="0" aria-label="Open image preview: ${escapeAttr(safeAlt)}" />`;
    })
    .replace(/!\[\[([^\]]+)\]\]/g, (_, ref: string) => {
      const safeSrc = escapeAttr(ref.trim());
      const safeAlt = fallbackAlt(ref);
      return `<img src="${safeSrc}" alt="${escapeAttr(safeAlt)}" loading="lazy" decoding="async" data-markdown-image="true" role="button" tabindex="0" aria-label="Open image preview: ${escapeAttr(safeAlt)}" />`;
    })
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label: string, href: string) => {
      const safeHref = safeUrl(href);
      const externalAttrs = isExternalUrl(safeHref)
        ? ' target="_blank" rel="noopener noreferrer"'
        : "";
      return `<a href="${escapeAttr(safeHref)}"${externalAttrs}>${label}</a>`;
    })
    .replace(/\[\[([^|\]]+)\|([^\]]+)\]\]/g, "$2")
    .replace(/\[\[([^\]]+)\]\]/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");

  codeTokens.forEach((token, index) => {
    html = html.replace(`@@CODE_${index}@@`, token);
  });

  return html;
}

export function extractTOC(markdown: string): TocItem[] {
  return markdown
    .split("\n")
    .filter((line) => line.startsWith("## "))
    .map((line) => {
      const text = line.slice(3).trim();
      return { id: slugifyHeading(text), text };
    });
}

export function renderMarkdown(markdown: string, { headingIds = false } = {}) {
  const lines = markdown.split("\n");
  let html = "";
  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (line.startsWith("```")) {
      index++;
      let code = "";
      while (index < lines.length && !lines[index].startsWith("```")) {
        code += `${lines[index]}\n`;
        index++;
      }
      index++;
      html += `<pre><code>${escapeHtml(code.trimEnd())}</code></pre>`;
      continue;
    }

    if (line.startsWith("# ")) {
      const text = line.slice(2);
      const id = headingIds ? ` id="${slugifyHeading(text)}"` : "";
      html += `<h1${id}>${inlineMarkdown(text)}</h1>`;
      index++;
      continue;
    }

    if (line.startsWith("## ")) {
      const text = line.slice(3);
      const id = headingIds ? ` id="${slugifyHeading(text)}"` : "";
      html += `<h2${id}>${inlineMarkdown(text)}</h2>`;
      index++;
      continue;
    }

    if (line.startsWith("### ")) {
      const text = line.slice(4);
      const id = headingIds ? ` id="${slugifyHeading(text)}"` : "";
      html += `<h3${id}>${inlineMarkdown(text)}</h3>`;
      index++;
      continue;
    }

    if (line.startsWith("#### ")) {
      const text = line.slice(5);
      const id = headingIds ? ` id="${slugifyHeading(text)}"` : "";
      html += `<h4${id}>${inlineMarkdown(text)}</h4>`;
      index++;
      continue;
    }

    if (/^\s*---+\s*$/.test(line)) {
      html += "<hr />";
      index++;
      continue;
    }

    if (line.startsWith("> ")) {
      let quote = line.slice(2);
      index++;
      while (index < lines.length && lines[index].startsWith("> ")) {
        quote += ` ${lines[index].slice(2)}`;
        index++;
      }
      html += `<blockquote>${inlineMarkdown(quote)}</blockquote>`;
      continue;
    }

    if (/^[-*]\s+\[[ xX]\]\s+/.test(line)) {
      let items = "";
      while (index < lines.length && /^[-*]\s+\[[ xX]\]\s+/.test(lines[index])) {
        const checked = /^[-*]\s+\[[xX]\]\s+/.test(lines[index]);
        const text = lines[index].replace(/^[-*]\s+\[[ xX]\]\s+/, "");
        items += `<li class="task-list-item"><input type="checkbox" disabled${checked ? " checked" : ""} />${inlineMarkdown(text)}</li>`;
        index++;
      }
      html += `<ul class="task-list">${items}</ul>`;
      continue;
    }

    if (/^[-*] /.test(line)) {
      let items = "";
      while (index < lines.length && /^[-*] /.test(lines[index])) {
        items += `<li>${inlineMarkdown(lines[index].slice(2))}</li>`;
        index++;
      }
      html += `<ul>${items}</ul>`;
      continue;
    }

    if (/^\d+[.)]\s+/.test(line)) {
      let items = "";
      while (index < lines.length && /^\d+[.)]\s+/.test(lines[index])) {
        items += `<li>${inlineMarkdown(lines[index].replace(/^\d+[.)]\s+/, ""))}</li>`;
        index++;
      }
      html += `<ol>${items}</ol>`;
      continue;
    }

    if (line.startsWith("|") && lines[index + 1]?.includes("---")) {
      const header = line
        .split("|")
        .slice(1, -1)
        .map((cell) => `<th>${inlineMarkdown(cell.trim())}</th>`)
        .join("");
      index += 2;
      let body = "";
      while (index < lines.length && lines[index].startsWith("|")) {
        const row = lines[index]
          .split("|")
          .slice(1, -1)
          .map((cell) => `<td>${inlineMarkdown(cell.trim())}</td>`)
          .join("");
        body += `<tr>${row}</tr>`;
        index++;
      }
      html += `<div class="prose-table"><table><thead><tr>${header}</tr></thead><tbody>${body}</tbody></table></div>`;
      continue;
    }

    if (line.trim() === "") {
      index++;
      continue;
    }

    let paragraph = line;
    index++;
    while (
      index < lines.length &&
      lines[index].trim() !== "" &&
      !lines[index].startsWith("#") &&
      !lines[index].startsWith(">") &&
      !lines[index].startsWith("```") &&
      !/^\s*---+\s*$/.test(lines[index]) &&
      !/^[-*] /.test(lines[index]) &&
      !/^\d+[.)]\s+/.test(lines[index]) &&
      !lines[index].startsWith("|")
    ) {
      paragraph += ` ${lines[index]}`;
      index++;
    }
    html += `<p>${inlineMarkdown(paragraph)}</p>`;
  }

  return html;
}
