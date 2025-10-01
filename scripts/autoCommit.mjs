import { exec } from "child_process";
import chokidar from "chokidar";
import path from "path";
import process from "process";
import { promisify } from "util";

const sh = promisify(exec);
const ROOT = process.cwd();
const DEBOUNCE_MS = 4000;
let timer = null;
let running = false;

const SHOULD_PUSH = process.env.AUTO_COMMIT_PUSH === "1";

async function hasChanges() {
  try {
    await sh("git diff --quiet --exit-code");
    return false;
  } catch {
    return true;
  }
}

async function stageAndCommit() {
  if (running) return;
  running = true;
  try {
    if (!(await hasChanges())) return;
    await sh("git add -A");
    const ts = new Date().toISOString().replace(/[:T]/g, "-").slice(0, 19);
    const msg = `chore:auto ${ts}`;
    await sh(`git commit -m "${msg}" || true`);
    if (SHOULD_PUSH) {
      await sh("git push || true");
    }
    console.log(`[auto-commit] committed ${msg}${SHOULD_PUSH ? " (pushed)" : ""}`);
  } catch (e) {
    console.error("[auto-commit] error:", e.stderr || e.message);
  } finally {
    running = false;
  }
}

function schedule() {
  if (timer) clearTimeout(timer);
  timer = setTimeout(stageAndCommit, DEBOUNCE_MS);
}

console.log(`[auto-commit] watching ${path.relative(ROOT, "src")} (push=${SHOULD_PUSH})`);
chokidar
  .watch(["src", "public", "package.json", "tsconfig.json"], {
    ignoreInitial: true,
    ignored: /(^|[/\\])\../
  })
  .on("add", schedule)
  .on("change", schedule)
  .on("unlink", schedule);
