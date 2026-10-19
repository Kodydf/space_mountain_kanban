# From Jira Tickets to a Legal Drafting Assistant: What I Learned Building Prelegal with an LLM

*How I directed an AI coding agent to build a full-stack application, and why the product ended up being a conversation instead of a form.*

---

## The problem worth solving

Over the years I have helped friends and colleagues with their small businesses, and one pattern kept repeating. Someone needs a mutual NDA, a data processing agreement, or a cloud service agreement. They cannot justify a legal retainer for a routine document, so they search for a template, paste it into a word processor, and guess at what each blank means.

That is a product problem before it is a technical one. The templates already exist and are of high quality. What people lack is a guide who asks the right questions in the right order and explains what each term means.

That guide is what I set out to build. **Prelegal** is a platform for drafting common legal agreements through a conversation with an AI assistant. The user describes what they need, the assistant asks for the missing details, and a live document preview fills in beside the chat. When the draft is ready, the user downloads it as a PDF.

Repository: [github.com/Kodydf/prelegal](https://github.com/Kodydf/prelegal)

*[Screenshot placeholder: the chat panel on the left with the live document preview on the right]*

## My role: product owner, not typist

I want to be precise about what I did, because it is the point of this post. I did not write the application code by hand. I acted as the product manager and the engineering lead, and I used an LLM-based coding agent (Claude Code) as the implementation team.

My contributions were the artifacts that steer the work:

- **A `CLAUDE.md` file** that gives the agent the project overview, the development process, the AI design constraints, the technical design, and the color scheme.
- **A `README.md`** that documents the architecture and how to run and test the system.
- **The Jira tickets.** Every feature began as a ticket I wrote.

The last item deserves emphasis. My instructions to the agent were simple: read the ticket from Jira, develop the feature following a defined seven step process, test it thoroughly, open a pull request, and address review feedback until the PR is approved. The workflow is the same one a human team follows, and it worked for the same reason: clear tickets produce clear results.

*[Screenshot placeholder: the Jira board showing the KAN tickets]*

Writing for an LLM turned out to be a sharpening exercise in product management. Vague acceptance criteria produce vague software, and an agent will happily build exactly what you wrote, including your ambiguities. Each ticket got better as I learned to state the outcome, the constraints, and the definition of done.

## The product decisions that mattered

Two decisions shaped the product more than any technical choice did. Both were mine.

### 1. The assistant does not "wing it"

If a user asks for a document Prelegal cannot generate, the assistant says so plainly and offers the closest supported document. It does not improvise a legal agreement from its general training data.

In most software, failing to produce an answer feels like a defect. In legal drafting, a confident but invented clause is a liability. I made a deliberate trade: narrower coverage in exchange for trustworthy output. The system supports 11 agreement types today (Mutual NDA, Cloud Service Agreement, Design Partner Agreement, SLA, Professional Services Agreement, Data Processing Agreement, Software License Agreement, Partnership Agreement, Business Associate Agreement, Pilot Agreement, and AI Addendum), and it is honest about everything outside that list.

### 2. Every draft is labeled as a draft

Each document carries a disclaimer that it is a draft subject to legal review, on screen and in the exported PDF. Prelegal helps people prepare a document. It does not replace a lawyer, and the product says so at the moment it matters.

Both decisions follow one principle. In a regulated or high-stakes domain, an AI product earns trust through what it declines to do and how clearly it states its limits.

## Architecture in brief

For readers who want to look under the hood, here is how the system fits together.

**The legal text is never written by the model.** The templates come from the open-source [Common Paper](https://github.com/CommonPaper/) repository. Each generated document is a cover page built from the user's answers, followed by the verbatim standard terms from the template. The LLM's job is limited to conducting the conversation and extracting values. This separation is the most important architectural choice in the project, because it keeps the legally meaningful text deterministic and auditable.

**Structured outputs turn conversation into data.** The chat endpoint calls `openai/gpt-oss-120b` through OpenRouter (with Cerebras as the inference provider) using LiteLLM. The model returns a schema-validated object containing a reply, an optional document choice, and a list of field updates. The server then validates that response: unknown document IDs and unknown field keys are dropped, oversized values are rejected, and switching documents resets the draft. The model proposes, and the server decides.

**Definitions are data, not code.** A hand-written definitions file lists, for each agreement, the party roles and key-term fields the assistant must collect. A parser reads each template into typed blocks. Adding a new document means adding a template, a catalog entry, and a definition. A test fails if any variable referenced in a template lacks a matching field, which catches drift between the legal text and the collection logic.

**The rest of the stack:**

| Layer | Choice |
|---|---|
| Frontend | Next.js, statically exported, styled with Tailwind |
| Backend | FastAPI in a uv project, serving both `/api/*` and the static frontend |
| Persistence | SQLite, recreated on each start |
| Authentication | Email and password, scrypt-hashed, server-side sessions in an HttpOnly cookie |
| Packaging | Multi-stage Dockerfile, with start and stop scripts for Mac, Linux and Windows |
| Testing | pytest (LLM mocked, plus opt-in live tests) and vitest, including real PDF generation |

A single block model feeds both the on-screen preview and the PDF, so what the user sees is what they download. Every conversation is saved automatically per user, and can be reopened, continued or deleted from a "My documents" page.

*[Screenshot placeholder: the My documents page or a completed draft]*

## Quality: the agent tested its own work, and other agents checked it

Building with an LLM raises an obvious question: how do you trust the output? My answer was to build verification into the process instead of relying on my own inspection alone.

- **10 bugs were found by the coding agent during its own testing**, before any pull request was opened.
- **18 more were found by separate review agents** that examined each pull request.

The review pass caught real problems. One example was a crash in PDF generation, the kind of defect that a demo can hide and a user finds on the first download. Other review findings covered input limits, LLM timeout handling, race conditions around the "Start over" action, and accessibility.

The commit history shows the pattern: a feature commit followed by a commit titled for the ticket's review, such as "Address KAN-7 review: validation errors, commit timing, history limits, accessibility". Two independent layers of checking found 28 issues in total. I would not have caught all of them alone, and this is the strongest argument I can make for treating agent review as a standard step, just as a team treats code review.

## Honest limits

Prelegal is a V1, and I want to be clear about what that means.

- **The database resets on every restart.** This was a deliberate scoping decision. It let me prove the full product loop (sign up, converse, save, reopen) without taking on database migrations and hosting concerns. Accounts and saved documents do not survive a server restart.
- **It is a drafting aid, not legal advice.** The disclaimer exists for this reason.
- **The project is in progress.** I expect to complete the current scope by 2026-09-24.
- **The chat depends on a third-party model API**, so the assistant is unavailable without a configured key, and the app says so instead of failing silently.

I would rather show a small, honest, working system than a broad, fragile one.

## What this project demonstrates

For a product leader evaluating an AI product manager, here is what I believe Prelegal shows:

1. **I can ship an application, not just a page.** It has authentication, persistence, an LLM integration, a document pipeline and a container build.
2. **I can direct AI agents through a real delivery process.** Jira tickets in, reviewed pull requests out.
3. **I design AI features around failure modes.** Refusing unsupported requests, validating model output on the server, and labeling drafts are product decisions as much as engineering ones.
4. **I treat the conversation as the interface.** The assistant is the front door to the product and drives the document, and that changes how the whole system is designed.
5. **I measure quality and report it honestly.** Twenty-eight defects found by machines, disclosed limits, and a stated completion date.

The larger lesson is that the bottleneck in AI-assisted development has moved. Writing code is no longer the scarce skill. Defining the problem, setting constraints, sequencing work in clear tickets, and deciding what the system must refuse to do are the skills that determine whether the result is worth using. Those are product management skills, and they are the ones I have been building.

## Try it and tell me what you think

The source is available at [github.com/Kodydf/prelegal](https://github.com/Kodydf/prelegal), and the legal templates come from [Common Paper](https://github.com/CommonPaper/). If you are building AI products for enterprise customers and want to compare notes on agent-driven delivery, I would welcome the conversation.
