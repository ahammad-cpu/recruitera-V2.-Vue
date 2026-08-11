# Claude Code Prompts — Recruitera V2

Copy-paste prompts for working on `github.com/a7mad-hadhoud/recruitera-V2.-Vue` (your fork of
`ahammad-cpu/recruitera-V2.-Vue`) with Claude Code.

These pair with `CLAUDE.md` in this same folder (`D:\Recruitera Product\CLAUDE.md`) — that file has
the project's build rules; this file has the *process* prompts. Read the note at the bottom of
CLAUDE.md if you're wondering why these two files aren't sitting inside the actual repo.

---

## PROMPT 1 — One-time setup

> Use this the very first time you set up a machine for this project.

```
I'm joining an existing Nuxt 4 frontend project and I need you to set up my
machine and explain each step in plain language BEFORE you run it.

I work from a fork: https://github.com/a7mad-hadhoud/recruitera-V2.-Vue.git
The original/teammate's repo is: https://github.com/ahammad-cpu/recruitera-V2.-Vue.git

Work through these one at a time. Stop after each step and wait for me to confirm
before moving to the next.

1. Check my environment: `git --version`, `node --version` (need 20+), and whether
   the GitHub CLI (`gh`) is installed. If anything's missing, tell me exactly what
   to install and where — do NOT install it yourself.

2. Run `gh auth status`. If I'm not signed in, tell me to run `gh auth login`
   myself and wait. Never ask me for a password or token, never put one in a file
   or command.

3. Confirm I have push access to MY fork (not the teammate's repo) — that's all
   I need, since I never push to the teammate's repo directly, only via PR.

4. Clone MY fork into this folder and cd into it, then add the teammate's repo as
   a second remote:
   git clone https://github.com/a7mad-hadhoud/recruitera-V2.-Vue.git
   git remote add upstream https://github.com/ahammad-cpu/recruitera-V2.-Vue.git
   Run `git remote -v` and show me the result — I should see `origin` (my fork)
   and `upstream` (the teammate's repo).

5. Read D:\Recruitera Product\CLAUDE.md and summarise the project's rules back to
   me in 5 bullets, so I know you've picked them up. Note: that file lives outside
   the repo on purpose — don't move it in.

6. Run `npm install` inside the repo.

7. Run `npm run lint` and `npm run test` on the untouched code and report results.
   If either fails on a clean checkout, say so clearly — pre-existing, not caused
   by us.

8. Start the dev server and tell me the URL. If port 3000 is already in use by
   something else on my machine, use a different port rather than fighting for it.

9. Show me `git log --oneline -10` and `git branch -a`.

Ground rules from here on, matching CLAUDE.md:
- Branch new work off `upstream/main`, not `origin/main`.
- Push to `origin` (my fork) freely once I've said to put work up — that
  authorization covers the rest of that task's follow-up commits, not just one push.
- Never push to `upstream`, never open a PR, without me explicitly asking in that turn.
- Never run `git push --force`, `git reset --hard`, `git rebase`, or delete a
  branch without asking first and explaining what it does.
```

---

## PROMPT A — Start new work (push to my fork as we go, never touch the teammate's repo)

> Use this to start any piece of work. It lets you push increments to YOUR fork
> continuously as you iterate — that's already a green light, not a one-time
> exception — but it never touches the teammate's repo and never opens a PR.
> Fill in the blank.

```
I want to work on: ___________________________________

How this session works:
- Branch off upstream/main (fetch it first if it's been a while).
- Iterate with me in the browser until I'm happy.
- Push increments to origin (my fork) as we go — you don't need to ask me again
  before each push once we're mid-task; that's already covered. Use your judgement
  on commit granularity: one commit per reviewable chunk of work, not one giant
  commit at the end.
- Do NOT run `gh pr create`, do NOT merge or push to `upstream`, do NOT merge into
  origin/main unless I ask for that specifically (that's the move that updates my
  fork's live Vercel URL — useful sometimes, but ask first each time since it
  changes what's on my production link).

STEP 1 — Branch
Confirm you're branching off upstream/main, not origin/main. Tell me the branch name.

STEP 2 — Understand before building
Read the closest already-finished page or component and use it as your template —
CLAUDE.md has a table mapping common page types to reference files. Tell me which
file you picked and why.

STEP 3 — Plan first, code second
Before writing code, show me a short plan: which files change, which brand/
settings primitives you'll reuse, what any new MSW handler returns, anything
you're unsure about. Wait for my go-ahead.

STEP 4 — Build
Follow CLAUDE.md's hard rules (tokens not hex, reuse primitives, MSW for any new
endpoint, loading/empty/error states, run lint + test after every change).

STEP 5 — Show me
Run the dev server, give me the URL, and actually check the result yourself in
the browser before telling me it's done — don't just describe the diff.

STEP 6 — Iterate
Keep making changes and pushing increments until I say I'm satisfied. "Looks
good" is approval of the code, not a request to open a PR — that's always a
separate, explicit ask from me.
```

---

## PROMPT B — Open the PR

> Only paste this once you're actually happy with the result and want the
> teammate to see it.

```
I'm satisfied with this. Open the PR.

1. Run `npm run lint`, `npm run test`, and `npm run build`. If anything fails,
   fix it and tell me what you changed — don't open a PR on a broken branch.
2. Make sure the branch is pushed to origin and up to date.
3. Open a pull request FROM my fork's branch TO upstream's main
   (gh pr create --repo ahammad-cpu/recruitera-V2.-Vue --base main --head
   a7mad-hadhoud:<branch>). In the description write:
   - what changed and why
   - how to test it (which page, what to click)
   - anything you weren't sure about or want reviewed closely
   - explicitly call out any commit that touches a shared file (nuxt.config.ts,
     a shadcn ui/ primitive, a brand/ component) — those need a second look since
     they affect more than this one feature
4. Give me the PR link.

Vercel will comment on the PR with a preview link automatically within a minute
or two.
```

---

## PROMPT C — Port an HTML prototype into the Vue app, exactly

> Use this when the starting point is a finished standalone HTML file (in
> `Recruitera Settings/`) rather than a blank page. The whole point of this
> prompt is to stop "design system defaults" from quietly overriding real,
> deliberate prototype styling — that's happened before on this project and the
> result looked visibly worse until corrected.

```
Source of truth: [path to the HTML file]
Target: [Vue page/route this becomes]

The HTML file is the spec for LAYOUT, BEHAVIOUR, and STATES — treat it as final,
not a rough draft. Do not simplify, "clean up", or drop anything it does just
because a shared component makes something easier. If matching it exactly
conflicts with a design-system default, tell me and let me choose — don't
silently pick the system default.

STEP 1 — Read the whole file first
Read the entire HTML/CSS/JS before writing anything. Note: every distinct visual
element (icon tiles, colored badges, exact button widths/positions, hover
states, empty states, every modal/drawer), every data shape, and every
interaction (sort, filter, bulk actions, row menus — read what options each menu
actually has, don't assume).

STEP 2 — Colour audit before writing code
For every hex value in the file, check it against app/assets/css/main.css's
--brand-* tokens. Report three buckets: exact matches, near matches (should snap
to the same token — no visible difference), and orphans (no matching token —
these need a decision from me, and when proposing a candidate rank by semantic
name first, RGB distance second). Don't invent new tokens without listing them
for approval first.

STEP 3 — Component map before writing code
For every block in the HTML, name the existing Brand*/ui/settings component it
becomes. If nothing fits, say so — don't build ad hoc markup that duplicates a
primitive that already exists elsewhere in the app.

STEP 4 — Write a short spec doc
Save the plan from steps 1-3 as docs/superpowers/specs/<date>-<feature>-spec.md,
matching the format of existing specs in that folder. Show it to me before
writing any component code.

STEP 5 — Build, then verify side by side
After building, open both the HTML file and the new Vue page in the browser at
the same viewport size and compare them directly — computed styles, not just a
glance. Anything that doesn't match either gets fixed or gets flagged to me as a
deliberate, approved deviation (record deviations in the spec doc's "Design
deviations" section).

Don't push until step 5 is done and I've looked at both side by side myself.
```

---

## PROMPT D — Sync my fork with the teammate's repo

> A SessionStart hook already does this automatically at the top of every
> session (see CLAUDE.md) — you'll see a summary of new upstream commits before
> you even ask. Use this prompt only when you want to force a sync mid-session,
> or actually merge those upstream changes into your local branch.

```
Bring my fork's local main up to date with the teammate's repo:

1. git checkout main && git fetch upstream
2. Show me git log --oneline main..upstream/main and summarise in plain language
   what the teammate has added. Flag anything that touches a file I'm currently
   working on.
3. git merge upstream/main. If there are conflicts, STOP, explain each one in
   plain language, and let me decide — don't resolve them on your own judgement.
4. git push origin main.
5. npm install (dependencies may have changed), then lint + test, tell me if the
   baseline is clean.

Reminder: this only updates my fork and my fork's Vercel deployment. It doesn't
touch the teammate's repo.
```

---

## PROMPT E — Handle review comments on an open PR

```
My PR got review comments. Please:

1. gh pr view --comments — show me every comment in plain language before
   anything changes.
2. For each one, tell me whether you agree and what you'd change. If a comment
   is wrong or would break something, say so — don't just comply.
3. Wait for me to decide which ones to act on.
4. Make only the approved changes, on the same branch.
5. Lint + test, then commit and push to origin.

Don't force-push, don't rebase, don't close or reopen the PR.
```

---

## Everyday cheat sheet

| You want to... | Say this |
|---|---|
| See what's happening | "Show me git status and which branch I'm on" |
| Look at your work in the browser | "Run the dev server and give me the URL" |
| Check before pushing | "Run lint and test and show me the results" |
| Push what we have so far | "Push this to my fork" |
| Update my fork's live Vercel URL | "Merge this into your fork's main" |
| Undo since your last commit | "Show me what's changed, then help me undo it" |
| Understand a file | "Explain what app/pages/x.vue does, in plain language" |
| Find where something lives | "Which file controls the sidebar navigation?" |

---

## Safety notes

- **Never** paste a GitHub token, password, or API key into a chat or a file.
  `gh auth login` handles it in your browser — that's the only place credentials belong.
- If Claude Code proposes `--force`, `reset --hard`, or `rebase`, stop and ask what
  it does first.
- Nothing on a branch — including pushes to your own fork — reaches the
  teammate's repo until a PR is opened and merged. Pushing to your fork is safe
  and reversible; opening the PR is the real gate.
- The whole app runs on a mock API (MSW). No data is real and nothing persists —
  that's expected, not a bug.
