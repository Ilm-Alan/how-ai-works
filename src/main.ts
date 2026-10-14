import "./styles.css";
import { Marked } from "marked";
import markedKatex from "marked-katex-extension";
import { lessons, parts } from "./lessons";
import type { Lesson } from "./types";
import { h } from "./ui/kit";

// MathML output renders natively in current browsers, so no KaTeX stylesheet or fonts ship.
const md = new Marked(markedKatex({ throwOnError: false, nonStandard: true, output: "mathml" }));
const DONE_KEY = "ai-course:done";

const done = new Set<string>(JSON.parse(localStorage.getItem(DONE_KEY) ?? "[]"));
function markDone(slug: string) {
  done.add(slug);
  localStorage.setItem(DONE_KEY, JSON.stringify([...done]));
  renderSidebar();
}

const app = document.getElementById("app")!;
const sidebar = h("nav", { class: "sidebar", "aria-label": "Lessons" });
const main = h("main", { class: "main" });
app.append(h("div", { class: "app" }, sidebar, main));

let cleanup: (() => void) | undefined;

function currentSlug(): string {
  return decodeURIComponent(location.hash.replace(/^#\/?/, ""));
}

function renderSidebar() {
  const slug = currentSlug();
  sidebar.replaceChildren(h("h1", null, h("a", { href: "#/" }, "How AI works")));
  for (const part of parts) {
    const list = h("ol");
    for (const l of lessons) {
      if (l.part !== part.id) continue;
      const n = lessons.indexOf(l) + 1;
      list.append(
        h(
          "li",
          { class: done.has(l.slug) ? "done" : "" },
          h(
            "a",
            { class: "lesson-link", href: `#/${l.slug}`, "aria-current": l.slug === slug ? "page" : undefined },
            h("span", { class: "num" }, done.has(l.slug) ? "✓" : String(n)),
            h("span", null, l.title),
          ),
        ),
      );
    }
    sidebar.append(h("h2", null, part.title), list);
  }
}

function renderHome() {
  const el = h("article", { class: "lesson home" });
  el.innerHTML = md.parse(HOME) as string;
  const first = lessons[0];
  if (first) el.append(h("p", null, h("a", { href: `#/${first.slug}` }, `Start: ${first.title} →`)));
  main.replaceChildren(el);
}

function renderLesson(lesson: Lesson) {
  const idx = lessons.indexOf(lesson);
  const el = h("article", { class: "lesson" });
  const partTitle = parts.find((p) => p.id === lesson.part)?.title ?? "";
  el.append(h("p", { class: "kicker" }, `${idx + 1} · ${partTitle}`), h("h1", null, lesson.title));

  const body = h("div", { class: "body" });
  body.innerHTML = md.parse(lesson.body) as string;
  el.append(body);

  const labRoot = h("section", { class: "lab", "aria-label": "Lab" }, h("h2", null, `Lab · ${lesson.lab.title}`));
  const marker = [...body.querySelectorAll("p")].find((p) => p.textContent?.trim() === "{{lab}}");
  if (marker) marker.replaceWith(labRoot);
  else body.append(labRoot);

  el.append(renderQuiz(lesson));
  if (lesson.sources.length) {
    el.append(
      h(
        "section",
        { class: "sources" },
        h("h2", null, "Sources"),
        h("ol", null, ...lesson.sources.map((s) => h("li", null, h("a", { href: s.url, target: "_blank", rel: "noopener" }, s.label)))),
      ),
    );
  }
  const prev = lessons[idx - 1];
  const next = lessons[idx + 1];
  el.append(
    h(
      "nav",
      { class: "pager" },
      prev ? h("a", { href: `#/${prev.slug}` }, `← ${prev.title}`) : h("span"),
      next ? h("a", { href: `#/${next.slug}` }, `${next.title} →`) : h("span"),
    ),
  );
  main.replaceChildren(el);

  const content = h("div");
  labRoot.append(content);
  try {
    cleanup = lesson.lab.mount(content) ?? undefined;
  } catch (err) {
    content.append(h("p", { class: "lab-error" }, `Lab failed to start: ${err instanceof Error ? err.stack : String(err)}`));
    console.error(err);
  }
}

function renderQuiz(lesson: Lesson): HTMLElement {
  const answered = new Map<number, boolean>();
  const list = h("ol");
  lesson.quiz.forEach((q, qi) => {
    const why = h("p", { class: "why", hidden: true }, q.why);
    const buttons = q.choices.map((c, ci) =>
      h(
        "button",
        {
          type: "button",
          class: "choice",
          onclick: () => {
            const right = ci === q.answer;
            buttons[ci]!.classList.add(right ? "right" : "wrong");
            if (!right) return;
            why.hidden = false;
            answered.set(qi, true);
            if (answered.size === lesson.quiz.length) markDone(lesson.slug);
          },
        },
        c,
      ),
    );
    list.append(h("li", { class: "question" }, h("div", null, q.q), h("div", { class: "choices" }, ...buttons), why));
  });
  return h("section", { class: "quiz" }, h("h2", null, "Check yourself"), list);
}

function route() {
  cleanup?.();
  cleanup = undefined;
  const slug = currentSlug();
  const lesson = lessons.find((l) => l.slug === slug);
  if (lesson) renderLesson(lesson);
  else renderHome();
  renderSidebar();
  document.title = lesson ? `${lesson.title} · How AI works` : "How AI works";
  window.scrollTo(0, 0);
}

const HOME = `# How AI works

How modern AI works, from fitting a curve to building agents. Each lesson is a 2-minute read and a hands-on lab that runs in your browser.

You need to know how to program and some high-school algebra. Everything else is explained.

Answer a lesson's questions to mark it done. Progress is saved in this browser.`;

window.addEventListener("hashchange", route);
route();
