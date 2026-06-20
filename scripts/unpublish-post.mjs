#!/usr/bin/env node
import process from "node:process";
import { loadDotEnvLocal, unpublishPosts } from "./lib/obsidian-publisher.mjs";

function fail(message) {
  console.error(`Error: ${message}`);
  process.exit(1);
}

function parseArgs(argv) {
  const files = [];
  let mode = "soft";
  let push = false;

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--mode") {
      mode = argv[index + 1] ?? "soft";
      index += 1;
    } else if (arg === "--push") {
      push = true;
    } else if (arg === "--help" || arg === "-h") {
      console.log(
        [
          'Usage: npm run unpublish:post -- "YYYY-MM-DD-slug.md" [--mode soft|hard] [--push]',
          "",
          "Default mode is soft.",
          "Without --push, the command modifies the published copy, runs build, and creates a local commit only.",
          "With --push, it commits and pushes the current branch after build succeeds.",
          "Hard mode removes the published Markdown file and public/images/posts/{slug}/ from the current tree.",
          "Git history is not rewritten.",
        ].join("\n"),
      );
      process.exit(0);
    } else if (arg.startsWith("--")) {
      fail(`Unknown option: ${arg}`);
    } else {
      files.push(arg);
    }
  }

  if (files.length !== 1) {
    fail('Usage: npm run unpublish:post -- "YYYY-MM-DD-slug.md" [--mode soft|hard] [--push]');
  }
  if (!["soft", "hard"].includes(mode)) fail('--mode must be "soft" or "hard"');

  return { files, mode, push };
}

async function main() {
  await loadDotEnvLocal();
  const { files, mode, push } = parseArgs(process.argv.slice(2));
  const result = await unpublishPosts(files, {
    mode,
    commit: true,
    push,
    logger: (message) => console.log(message),
  });

  if (result.committed) console.log("Committed unpublish changes.");
  if (result.pushed) console.log("Pushed current branch.");
  if (!result.pushed) console.log("Push skipped. Run with --push to publish the removal remotely.");
}

main().catch((error) => fail(error instanceof Error ? error.message : String(error)));
