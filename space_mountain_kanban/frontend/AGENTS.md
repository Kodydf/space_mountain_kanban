<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Frontend codebase guide

This app is the frontend half of Space Mountain Task Tracker — a single-board Kanban app. It is being converted to a static export (`output: "export"`) served by a Python FastAPI backend at `/`; see `../backend/plan.md` for the full backend build plan and `../agents/AGENTS.md` for the project's business/technical requirements.

## Data model and state

`src/lib/types.ts` defines the whole shape: `BoardState = { columns: ColumnData[], cards: CardData[] }`. Cards are a **flat array**, not nested per column — each `CardData` carries its own `columnId`. There are always exactly 5 fixed columns (never added/removed, only renamed); column order is the order of the `columns` array.

`src/lib/board-reducer.ts` is a pure `(state, action) => state` reducer — the single place all board mutations happen. Action variants: `ADD_CARD`, `UPDATE_CARD` (merges only the fields provided), `DELETE_CARD`, `RENAME_COLUMN`, `MOVE_CARD` (removes the card from the flat array and recomputes its splice position so it lands at the right index within its new column, preserving other columns' order).

`src/lib/board-context.tsx` wraps `useReducer(boardReducer, ...)` in a React Context (`BoardProvider`/`useBoard()`), so every component reads `{state, dispatch}` directly — no prop-drilling.

`src/lib/seed-data.ts` is the dummy starting data (5 columns, 8 cards with due dates).

## Component tree

`src/app/page.tsx` is the only page. It renders the header, `<Board>` (dynamically imported with `ssr: false` — required because `@dnd-kit`'s internal id generator differs between server and client render, causing a hydration mismatch otherwise), and `<ChatWidget>`, all inside `<BoardProvider>`.

- `Board.tsx` — owns the `@dnd-kit` `DndContext` (pointer + keyboard sensors), dispatches `MOVE_CARD` on drag end.
- `Column.tsx` — one per column; droppable target + `SortableContext` of cards + `AddCardForm`.
- `ColumnHeader.tsx` — click-to-edit column title, dispatches `RENAME_COLUMN`.
- `Card.tsx` — draggable card; has its own inline edit mode (title/details) dispatching `UPDATE_CARD`, and a delete button dispatching `DELETE_CARD`. Buttons/inputs nested inside the draggable card root call `e.stopPropagation()` on pointer *and* keyboard events — without this, clicks/keypresses on them bubble into `@dnd-kit`'s drag handlers.
- `DueDateBadge.tsx` — click-to-edit due date; exports `isOverdue(dueDate)` (plain ISO-string comparison against today); dispatches `UPDATE_CARD`.
- `AddCardForm.tsx` — collapsed "+ Add card" trigger expands to a form; dispatches `ADD_CARD`.
- `ChatWidget.tsx` — the AI "Digital Assistant" floating chat panel; posts to the backend and applies whatever board update comes back.

## Testing conventions

Unit tests (Vitest, jsdom, React Testing Library) mock the whole state layer: `vi.mock("@/lib/board-context", () => ({ useBoard: () => ({ state, dispatch: vi.fn() }) }))`. Network calls are mocked with `vi.stubGlobal("fetch", vi.fn())`. Prefer `getByRole`/`getByPlaceholderText`/`data-testid` over CSS selectors. `board-reducer.test.ts` tests the reducer as a pure function with no mocking.

E2E tests (Playwright, `e2e/`) run against a real built app. Established `data-testid`s: `column`, `column-drop-area`, `card`, `due-date` — reuse these rather than inventing new ones. Network-dependent features (the chat backend) are mocked via `page.route("**/api/chat", async (route) => { ...; await route.fulfill({...}); })`, asserting on `route.request().postDataJSON()` where the outgoing request shape matters.

## Styling

Tailwind v4, no `tailwind.config.js` — theme tokens are declared in `src/app/globals.css` via `@theme inline` and consumed as plain utility classes: `accent-yellow` (#ecad0a), `blue-primary` (#209dd7), `purple-secondary` (#753991), `dark-navy` (#032147), `gray-text` (#888888). Common patterns: primary buttons use `bg-purple-secondary text-white ... ring-1 ring-accent-yellow/50`; form inputs use `text-dark-navy rounded-md border border-gray-200 focus:border-blue-primary`; panels use `bg-gradient-to-br from-white to-yellow-50 border border-accent-yellow/40`. The page background and chat panel use a dark navy/purple theme with gold glow accents — match this for any new full-page UI (e.g. a login screen).
