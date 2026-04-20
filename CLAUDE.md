# Insyt — Project Context for Claude Code

This file is read automatically at the start of every Claude Code session in this repository. It orients the session to the project's goals, constraints, and operating conventions. Do not delete or restructure this file without explicit founder approval.

## What this project is

Insyt is a context-intelligence platform for Indian enterprise brands. The immediate build goal is a working prototype to demonstrate to Dr. Sajeev Chemmany, CMO of Kalyan Jewellers, in a 10-day sprint. The meeting outcome determines whether we close a ₹4.5L/month 90-day POC contract.

We are building a prototype, not a product. Every decision should optimize for the Day 11 meeting, not for long-term production robustness.

## Authoritative reference documents

Read these three documents before writing any code. They are the source of truth for all architectural, visual, and domain decisions:

- **`docs/insyt_kalyan_handoff_brief.md`** — Technical and strategic specification. Covers scope, architecture, stack, ingestion plan, analysis pipeline, UI specifications, the January 2025 case study methodology, daily sprint plan, and done-definitions. This is the primary build specification.

- **`docs/insyt_brand_reference.md`** — Complete brand system. Typography, palette, voice principles, Tailwind configuration, Shadcn adaptation guidance, surface treatment strategy. All visual and copy decisions derive from this document.

- **`docs/kalyan_taxonomy_v1.md`** — Entity taxonomy for Kalyan Jewellers. Company entities, executives, brand ambassadors, sub-brands, competitors, regional media sources, crisis categories, regulatory entities. All ingestion and analysis configuration derives from this document.

When any of these documents conflicts with your instinct or with suggestions in conversation, the documents win. If you believe a document needs updating, raise it to the founder — do not silently diverge.

## Stack — non-negotiable

- Frontend: Next.js 14+ App Router, TypeScript, Tailwind CSS, Shadcn/ui
- Backend: Python 3.11+, FastAPI, Celery, Redis
- Database: PostgreSQL 15+
- Search: Typesense
- Storage: S3-compatible (Wasabi or Backblaze B2 for cost)
- LLMs: Claude Haiku 4.5 (high-volume), Claude Sonnet 4.6 (complex reasoning)
- Frontend deployment: Vercel
- Backend deployment: Railway
- Observability: Sentry for errors, Axiom for logs

Do not introduce Kubernetes, microservices, Kafka, Airflow, Elasticsearch, GraphQL, or similar enterprise-scale infrastructure. They are inappropriate for sprint scope and will not be approved if suggested.

## Brand enforcement

The brand system is strict. During the build:

- Never hardcode colors. All colors derive from Tailwind tokens (`ink`, `ochre`, `slate`, `stone`, `parchment`, `paper`, `white`).
- Never hardcode fonts. All typography derives from the three configured families (`display`, `body`, `mono`).
- Never hardcode type sizes outside the defined scale.
- Never use drop shadows, gradients, rounded-full pills, or emoji.
- Ochre is used only in five specific contexts — see brand reference.
- The voice principles apply to all generated content, UI copy, error messages, and comments users might see.

If something cannot be expressed in brand tokens, escalate rather than hardcoding.

## Working conventions

**Commit discipline:** Small, frequent commits. Clear conventional-commit messages (`feat:`, `fix:`, `refactor:`, `docs:`, `chore:`). Every commit should leave the codebase in a working state.

**Branch strategy:** Work on feature branches named `feat/<area>-<description>` (e.g., `feat/ingestion-news`, `feat/ui-brief-view`). Never commit directly to `main`. The founder merges to `main` manually after review.

**File organization:** Follow the repository structure specified in Section 3 of the handoff brief. Do not create parallel hierarchies or reorganize without discussion.

**Testing:** Happy-path testing only during sprint. Do not invest in comprehensive test suites, mocking frameworks, or test infrastructure. Verify things work end-to-end, move on.

**Error handling:** Fail loudly in development, gracefully in demo environments. Log errors to Sentry. Do not suppress errors to make things "look clean."

**Documentation:** Code comments only where genuinely non-obvious. Prefer clear naming over comments. README files in each major directory explaining what lives there.

## Scope discipline

The sprint has explicit in-scope and out-of-scope items listed in Section 2 of the handoff brief. When in doubt about whether to build something:

- Ask: "Is this required for the Day 11 meeting?" If no, defer.
- Ask: "Is there a simpler version that demonstrates the capability?" If yes, build that.
- Ask: "Is this a placeholder-acceptable area?" Section 6 of the brief specifies which views can be partial.

Scope creep is the biggest risk to sprint success. Active resistance to scope creep is encouraged.

## Decisions that require founder input

Claude Code should escalate to the founder (rather than deciding autonomously) when:

- Architectural choices beyond what the handoff brief specifies
- Taxonomy additions or modifications
- Brand voice decisions on non-obvious cases
- Commercial terms, pricing, or positioning language
- Scope additions or deletions
- Third-party service selections
- Security, privacy, or compliance questions
- Anything affecting the January 2025 case study (the hero asset — Section 7 of brief)

Decisions Claude Code can make autonomously:

- Implementation details within the specified stack
- Database query optimization
- UI component composition using Shadcn primitives
- File organization within agent's territory
- Naming of internal functions, variables, test data
- Prompt refinements within voice guidelines
- Development tooling choices (linters, formatters, etc.)

## What "done" looks like

The sprint succeeds when all items in Section 10 (Done-definitions) and Section 11 (Demo readiness checklist) of the handoff brief are satisfied. Reference these as you work, not at the end.

## How to handle ambiguity

When the handoff brief, brand reference, or taxonomy leaves something ambiguous:

1. Check if the answer can be derived from principles already stated
2. If yes, apply the principle and document the decision in code comments
3. If no, write the question in `docs/founder_questions.md` with context, and continue with a reasonable default marked as `// TODO: confirm with founder`
4. Raise accumulated questions to the founder at natural breakpoints rather than interrupting constantly

## The meta-principle

This is a sprint to demonstrate a product to a CMO in 10 days. Every choice — architectural, visual, operational — should be made with that outcome in mind. Elegance, completeness, and robustness are secondary to "does this make the meeting succeed?"

Build fast. Build well within the scope. Ship.

---

*Last updated: April 2026 | Maintained by: founder*
