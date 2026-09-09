# Tutorial: How the Space Mountain Task Tracker Was Built

This is a beginner-friendly walkthrough of the Kanban board app in this repository. It assumes you've never written frontend code before, but are comfortable poking around files and running commands. By the end you should understand *what* was built, *why* each piece exists, and *how* the pieces fit together — well enough to make your own small changes with confidence.

## Table of contents

1. [What we built](#1-what-we-built)
2. [Technology summary](#2-technology-summary)
3. [High-level walkthrough](#3-high-level-walkthrough)
4. [Detailed code review](#4-detailed-code-review)
5. [Five ways this code could be improved](#5-five-ways-this-code-could-be-improved)

---

## 1. What we built

A single-page **Kanban board** (a "board with columns and cards" style task tracker, like a simplified Trello). It has:

- Five fixed columns (To Do, In Progress, Review, Blocked, Done) that you can rename.
- Cards with a title, a description, and an optional due date. Overdue cards turn red.
- Drag-and-drop to move cards between columns, plus click-to-edit for almost everything.
- An **AI chat assistant** ("Digital Assistant") that can add, edit, move, and delete cards on your behalf, and answer questions about your tasks, using a real large language model (LLM) via a service called OpenRouter.
- A wrestling-manager-flamboyant visual theme (dark background, gold/purple accents, a "Woooo!" sound effect when you move a card) — purely cosmetic, layered on top of the functional app.

There is **no database** — everything lives in the browser's memory for the current tab, and resets when you reload the page. That's a deliberate simplicity choice for this project, not an oversight (see the improvements section for how you'd change that).

---

## 2. Technology summary

| Technology | What it is | Why it's here |
|---|---|---|
| **Next.js** | A "framework" built on top of React — it gives you routing, a dev server, a build system, and a place to write server-side code, all in one tool. | It's the industry-standard way to build modern React apps. It also lets us run a small server-side API (for the AI chat) in the *same* project as the frontend, instead of standing up a separate backend. |
| **React** | A JavaScript library for building user interfaces out of reusable **components** (think: custom HTML tags like `<Card>` or `<Column>`) that re-render automatically when their data changes. | It's the most widely used way to build interactive UIs, and Next.js is built on it. |
| **TypeScript** | JavaScript with an added type-checking layer, e.g. you can say "this variable must always be a string." | Catches a large class of bugs (typos, wrong data shapes) *before* you ever run the code, by checking as you type/build. |
| **Tailwind CSS** | A CSS framework where you style things using short utility class names directly in your markup (e.g. `className="text-red-500 rounded-xl"`) instead of writing separate `.css` files. | Fast to build and change designs with, and keeps styling co-located with the component that uses it. |
| **@dnd-kit** | A drag-and-drop library for React. | Building drag-and-drop from scratch (tracking mouse position, detecting what you're hovering over, handling touch and keyboard) is surprisingly hard. This library handles it for us. |
| **lucide-react** | A library of simple icon components (trash can, pencil, calendar, etc). | Ready-made, consistent icons instead of hand-drawing SVGs. |
| **Vitest + React Testing Library** | A test runner (Vitest) and a toolkit for rendering components in a fake browser and interacting with them (React Testing Library), used for **unit tests**. | Unit tests check that one small piece of logic (a function, a component) behaves correctly, in isolation, in milliseconds. |
| **Playwright** | A tool that drives a *real* browser (Chromium) to click, type, and drag exactly like a human would, used for **end-to-end (E2E) tests**. | E2E tests check that the whole app works together correctly — the thing a human would actually experience — catching bugs unit tests can't see (e.g. "does the drag-and-drop actually work"). |
| **OpenRouter** | A service that gives you one API to talk to many different AI models from different companies. | Lets us call an AI model without signing up separately with each AI provider. |
| **`openai/gpt-oss-120b`** | The specific AI model we call through OpenRouter — an open-weight language model from OpenAI capable of "tool calling" (see below). | Chosen by request; it supports the tool-calling feature the assistant relies on. |

### A few concepts worth understanding up front

- **Component**: a JavaScript function that returns UI (written in a syntax called JSX that looks like HTML mixed with JavaScript). Components can be nested inside each other, like `<Board>` containing several `<Column>`s, each containing several `<Card>`s.
- **Props**: the "arguments" you pass into a component, e.g. `<Card card={someCardData} />` — `card` is a prop.
- **State**: data a component remembers between renders and can change over time (e.g. "is this card currently in edit mode?"). In React you manage it with the `useState` hook.
- **Hook**: a special React function (always starting with `use`) that lets a component tap into React features — remembering state (`useState`), running code after render (`useEffect`), or reading shared data (`useContext`).
- **Client vs. server code**: Next.js code can run in the browser ("client") or on a server before the page even reaches the browser ("server"). We use server code exactly once here: to keep our secret AI API key hidden from the browser (more on this in the code review).
- **Tool calling / function calling**: a feature of modern AI models where, instead of just replying with text, the model can say "call this specific function with these specific arguments" — e.g. `move_card({ cardId: "card-4", toColumnId: "col-5" })`. The app defines what functions exist; the AI decides when and how to use them.

---

## 3. High-level walkthrough

### 3.1 Project layout

```
kanban/
├── .env                        # secret OpenRouter API key (never committed to git)
├── AGENTS.md                   # the original spec/instructions for this project
└── frontend/                   # the actual Next.js app
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx        # the one and only page — renders the whole app
    │   │   ├── layout.tsx      # wraps every page (fonts, <html>/<body> tags)
    │   │   ├── globals.css     # global styles + our color theme
    │   │   └── api/chat/route.ts   # server-side endpoint the AI chat talks to
    │   ├── components/         # all the UI building blocks (Board, Card, etc.)
    │   └── lib/                 # non-UI logic: data types, state management, AI plumbing
    ├── e2e/                    # Playwright end-to-end tests
    └── package.json            # dependencies + npm scripts (dev, build, test, ...)
```

### 3.2 The mental model: state flows one way

Almost every interactive app follows a loop like this, and this app is a clean example of it:

```
 ┌─────────────┐      user clicks/types/drags      ┌──────────────┐
 │  UI renders │ ───────────────────────────────▶  │ dispatch an  │
 │ from state  │                                    │   "action"   │
 └─────────────┘                                    └──────┬───────┘
        ▲                                                   │
        │                                                   ▼
        │                                          ┌───────────────────┐
        └────────────  new state  ◀────────────────│  reducer computes  │
                                                     │   the new state    │
                                                     └───────────────────┘
```

- The **state** is one JavaScript object: `{ columns: [...], cards: [...] }`.
- The UI never edits that object directly. Instead, a component says "here's what happened" by calling `dispatch({ type: "DELETE_CARD", cardId: "card-3" })`.
- A single function, the **reducer**, is the only place allowed to compute a *new* state object from the old one plus the action.
- React then re-renders anything that depends on the parts of the state that changed.

This pattern (**state + actions + a reducer**) is called **Flux/Redux-style state management**, and React has it built in via the `useReducer` hook — no extra library needed. It's a great pattern to learn early because you'll see it (or something inspired by it) in almost every serious frontend framework.

### 3.3 Feature walkthrough

**Loading the board.** When you open the page, `BoardProvider` initializes state from `seed-data.ts` (some realistic-looking dummy tasks) using `useReducer`. `Board` reads that state and renders one `Column` per column, each rendering one `Card` per card that belongs to it.

**Dragging a card.** `@dnd-kit`'s `DndContext` wraps the whole board. While you drag, it tracks what you're hovering over. When you drop, `Board`'s `handleDragEnd` figures out the destination column and position, and dispatches a `MOVE_CARD` action — then plays the "Woooo!" sound.

**Editing a card.** Clicking the pencil icon flips that one `Card` into "edit mode" locally (its own `isEditing` state) — no dispatch happens until you click **Save**, which then fires an `UPDATE_CARD` action. **Cancel** just throws away the local edits.

**Due dates.** Each card renders a small `DueDateBadge`. It compares the due date string to today's date (as plain `YYYY-MM-DD` strings, which sort/compare correctly) to decide whether to render red ("overdue") styling.

**The AI assistant.** This is the most involved feature, so it gets its own section below — see [4.5](#45-the-ai-assistant).

---

## 4. Detailed code review

### 4.1 The data model — `lib/types.ts`

```ts
export type CardData = {
  id: string;
  title: string;
  details: string;
  columnId: string;
  /** ISO date string (YYYY-MM-DD), or null if no due date is set. */
  dueDate: string | null;
};

export type ColumnData = {
  id: string;
  title: string;
};

export type BoardState = {
  columns: ColumnData[];
  cards: CardData[];
};
```

This is the entire "shape" of the app's data, described with TypeScript `type`s. Notice `cards` is one **flat list**, not "a list of cards inside each column." Each card just remembers which column it belongs to via `columnId`. This is a common and useful pattern: it makes "move a card to another column" as simple as changing one field, rather than removing it from one array and inserting it into another.

### 4.2 Seed data — `lib/seed-data.ts`

```ts
export const seedBoard: BoardState = {
  columns: [
    { id: "col-1", title: "To Do" },
    { id: "col-2", title: "In Progress" },
    // ...
  ],
  cards: [
    {
      id: "card-1",
      title: "Design onboarding flow",
      details: "Sketch the first-run experience for new users.",
      columnId: "col-1",
      dueDate: "2026-09-25",
    },
    // ...
  ],
};
```

Just a plain starting value matching the `BoardState` type above. Because there's no backend, this *is* the database — it only exists for as long as the tab is open.

### 4.3 The reducer — `lib/board-reducer.ts`

This is the heart of the app's logic, and a great file to study if you want to understand the reducer pattern.

```ts
export type BoardAction =
  | { type: "ADD_CARD"; columnId: string; title: string; details: string; dueDate?: string | null }
  | { type: "UPDATE_CARD"; cardId: string; title?: string; details?: string; dueDate?: string | null }
  | { type: "DELETE_CARD"; cardId: string }
  | { type: "RENAME_COLUMN"; columnId: string; title: string }
  | { type: "MOVE_CARD"; cardId: string; toColumnId: string; toIndex: number };
```

This is a **discriminated union**: `BoardAction` can be *one of these five shapes*, and TypeScript uses the `type` field to know which one you're looking at. This is how the reducer knows, and how it protects you from typos — try dispatching `{ type: "DELET_CARD" }` and TypeScript will refuse to compile.

The `DELETE_CARD` case is the simplest possible reducer logic — filter the array, keeping everything except the one being deleted:

```ts
case "DELETE_CARD": {
  return { ...state, cards: state.cards.filter((c) => c.id !== action.cardId) };
}
```

`{ ...state, cards: ... }` is important: it creates a **brand new object** that copies every field from the old state, then overwrites `cards`. React relies on getting a new object reference to know "something changed, please re-render" — mutating the old object in place (`state.cards.splice(...)`) would silently break the UI.

`UPDATE_CARD` shows how to update *only the fields that were actually provided*, leaving everything else on the card untouched:

```ts
case "UPDATE_CARD": {
  return {
    ...state,
    cards: state.cards.map((c) =>
      c.id === action.cardId
        ? {
            ...c,
            ...(action.title !== undefined ? { title: action.title } : {}),
            ...(action.details !== undefined ? { details: action.details } : {}),
            ...(action.dueDate !== undefined ? { dueDate: action.dueDate } : {}),
          }
        : c
    ),
  };
}
```

This lets both the "edit title/details" form *and* the "edit due date" badge *and* the AI assistant all reuse the same action, each only sending the field(s) they actually changed.

`MOVE_CARD` is the trickiest bit of logic in the whole app: it has to (1) find the card, (2) remove it from wherever it currently sits in the flat array, (3) figure out the correct array position so that it lands at the right visual spot within its *new* column, and (4) re-insert it there. It's worth reading slowly in the actual file if you want a satisfying "aha" on array manipulation.

### 4.4 Sharing state with React Context — `lib/board-context.tsx`

`useReducer` alone only works within *one* component. To let `Board`, every `Column`, and every `Card` all read the same state and dispatch actions, we wrap them in a **React Context**:

```tsx
const BoardContext = createContext<BoardContextValue | null>(null);

export function BoardProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(boardReducer, seedBoard);
  return <BoardContext value={{ state, dispatch }}>{children}</BoardContext>;
}

export function useBoard() {
  const context = useContext(BoardContext);
  if (!context) throw new Error("useBoard must be used within a BoardProvider");
  return context;
}
```

Think of `BoardProvider` as putting a box labeled "board state" at the top of the component tree; any component nested inside it can call `useBoard()` to reach into that box, no matter how deeply nested it is — without every component in between having to pass it down manually as props ("prop drilling").

### 4.5 Drag and drop — `components/Board.tsx`

```tsx
const sensors = useSensors(
  useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
);
```

A "sensor" is *how* a drag can be started — with a mouse/touch pointer, or with a keyboard (for accessibility: press Tab to focus a card, Space to pick it up, arrow keys to move it, Space again to drop). The `distance: 8` on the pointer sensor means you have to move the mouse 8 pixels before a drag "counts" — otherwise every single click (like clicking the delete button) would register as a micro-drag.

```tsx
function handleDragEnd(event: DragEndEvent) {
  setActiveId(null);
  const { active, over } = event;
  if (!over) return; // dropped somewhere that isn't a valid target

  const overId = over.id as string;
  const isOverColumn = state.columns.some((col) => col.id === overId);
  const toColumnId = isOverColumn ? overId : state.cards.find((c) => c.id === overId)?.columnId;
  if (!toColumnId) return;

  const columnCards = state.cards.filter((c) => c.columnId === toColumnId);
  const toIndex = isOverColumn ? columnCards.length : columnCards.findIndex((c) => c.id === overId);

  dispatch({ type: "MOVE_CARD", cardId: active.id as string, toColumnId, toIndex });
  playWoo();
}
```

`@dnd-kit` tells us what's being dragged (`active`) and what it's currently hovering over (`over`) — which could be another card, or an empty column. This function's whole job is to translate "hovering over X" into "which column, and at which position" — then it's just one `dispatch` call, exactly like every other change in the app.

### 4.6 A component with local edit state — `components/Card.tsx`

`Card` is a good example of a component that has *both* kinds of state: it reads shared board state (via `dispatch`) and keeps its own private, temporary state (`isEditing`, and draft `title`/`details` while typing):

```tsx
const [isEditing, setIsEditing] = useState(false);
const [title, setTitle] = useState(card.title);
const [details, setDetails] = useState(card.details);

function handleSave(e: FormEvent) {
  e.preventDefault();
  const trimmedTitle = title.trim();
  if (!trimmedTitle) return;
  dispatch({ type: "UPDATE_CARD", cardId: card.id, title: trimmedTitle, details: details.trim() });
  setIsEditing(false);
}
```

While `isEditing` is `false`, the component's `return` renders the normal card view. While it's `true`, it renders a totally different `<form>` instead (an inline title input + textarea + Save/Cancel). Nothing is dispatched to the shared board state until **Save** is clicked — so **Cancel** is "free," it just throws away local state.

One subtle-but-important detail: buttons nested *inside* a draggable card (Edit, Delete, and the due-date badge) all call `e.stopPropagation()` on pointer and keyboard events:

```tsx
<button
  type="button"
  aria-label="Delete card"
  onPointerDown={(e) => e.stopPropagation()}
  onKeyDown={(e) => e.stopPropagation()}
  onClick={() => dispatch({ type: "DELETE_CARD", cardId: card.id })}
>
```

Without this, clicking (or pressing Enter inside) these controls would also bubble up to the card's drag handlers and could accidentally start a drag instead of registering your click. This was actually a real bug found and fixed during development — see the improvements section for the general lesson.

### 4.7 Styling — Tailwind + a custom theme (`app/globals.css`)

Instead of a separate stylesheet per component, styling is done with Tailwind utility classes directly in the JSX, e.g. `className="bg-purple-secondary text-white rounded-lg px-3 py-1"`. The five brand colors from the spec (and a couple of stock Tailwind colors like `green-400` for the "add card" button) are registered once as reusable names:

```css
@theme inline {
  --color-accent-yellow: #ecad0a;
  --color-blue-primary: #209dd7;
  --color-purple-secondary: #753991;
  --color-dark-navy: #032147;
  --color-gray-text: #888888;
}
```

Declaring them here means every component can just write `text-accent-yellow` or `bg-purple-secondary` and Tailwind generates the matching CSS automatically — one source of truth for the whole app's palette.

### 4.8 The AI assistant

This is really three small pieces working together: a **tool menu** the AI is given, a **server endpoint** that talks to the AI safely, and a **chat UI** that carries out whatever the AI decides to do.

**a) Defining what the AI is allowed to do — `lib/chat-tools.ts`**

```ts
export const CHAT_TOOLS = [
  {
    type: "function",
    function: {
      name: "move_card",
      description: "Move a card to a different column, e.g. from To Do to Done.",
      parameters: {
        type: "object",
        properties: {
          cardId: { type: "string" },
          toColumnId: { type: "string", description: "The id of the destination column." },
        },
        required: ["cardId", "toColumnId"],
      },
    },
  },
  // ...add_card, update_card, delete_card follow the same shape
] as const;
```

This isn't code the AI *runs* — it's a menu, described in a standard JSON format, that we hand to the AI model saying "here are the actions you're allowed to request, and here's what information each one needs." The AI reads this and decides, based on your message, whether to just reply in plain English or to request one of these actions with specific arguments filled in.

We also build a **system prompt** — instructions the AI sees before your message — which includes a live snapshot of the whole board (every column and card, with their ids):

```ts
export function buildSystemPrompt(board: ChatApiRequest["board"]): string {
  const today = new Date().toISOString().slice(0, 10);
  return `You are the digital assistant... Today's date is ${today}.
Current board state as JSON: ${JSON.stringify(board)}
Rules:
- Always reference existing cards and columns by the "id" fields from the board state above...`;
}
```

This is how the AI can understand "move the auth bug to Done" — it looks up which card's title matches "auth bug" in the board JSON it was just given, and finds that card's real `id` to use in its `move_card` request.

**b) Keeping the API key secret — `app/api/chat/route.ts`**

This file lives under `app/api/`, which Next.js treats specially: instead of becoming a page you can visit, `route.ts` becomes a small server-side program that only your own frontend code can call. This matters because it's the **only** place the app ever reads the OpenRouter API key:

```ts
export async function POST(req: NextRequest) {
  const apiKey = process.env.OpenRouter_API_Key;
  if (!apiKey) {
    return NextResponse.json({ error: "Server is missing the OpenRouter API key." }, { status: 500 });
  }

  const { messages, board } = (await req.json()) as ChatApiRequest;

  const response = await fetch(OPENROUTER_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "openai/gpt-oss-120b",
      messages: [{ role: "system", content: buildSystemPrompt(board) }, ...messages],
      tools: CHAT_TOOLS,
      tool_choice: "auto",
    }),
  });
  // ...
}
```

If we called OpenRouter directly from the browser instead, the API key would have to be baked into the JavaScript that ships to every visitor — anyone could open their browser's dev tools and steal it. Routing the call through our own server means the key never leaves the server.

The response from OpenRouter can include `tool_calls` — the AI's requested actions. We unpack those into a simple `{ name, arguments }` shape and hand them back to the browser:

```ts
const toolCalls: ToolCall[] = (message.tool_calls ?? []).map((tc) => ({
  name: tc.function.name as ToolCall["name"],
  arguments: JSON.parse(tc.function.arguments || "{}") as Record<string, string>,
}));

return NextResponse.json({ content: message.content, toolCalls });
```

Note this endpoint's *only* job is to talk to the AI and report back what it said — it never touches the board itself. That's deliberate: this app has no server-side database to update, so the actual board mutation has to happen back in the browser.

**c) Carrying out the AI's requests — `components/ChatWidget.tsx`**

The chat widget sends your message (plus the full conversation so far, plus the current board) to `/api/chat`, then acts on whatever comes back:

```tsx
const summaries = data.toolCalls.map(applyToolCall);
```

`applyToolCall` is a `switch` statement that turns each requested tool call into exactly the same `dispatch(...)` calls a human clicking buttons would trigger:

```tsx
case "delete_card": {
  if (!tc.arguments.cardId) return "Couldn't delete the card — missing id.";
  const summary = describeToolCall(tc, state);
  dispatch({ type: "DELETE_CARD", cardId: tc.arguments.cardId });
  return summary;
}
```

This is a nice illustration of the reducer pattern paying off: the AI assistant didn't need any special "AI-only" way to change the board — it just dispatches the exact same actions everything else in the app already uses.

**d) Loading the secret key from the project root — `lib/load-root-env.ts`**

One extra wrinkle: the `.env` file holding the API key lives in the *project root* (`kanban/.env`), one folder above the actual Next.js app (`kanban/frontend/`), because that's where you asked to keep it. Next.js only auto-loads `.env` files from its own folder, so a tiny helper loads it explicitly:

```ts
import { loadEnvConfig } from "@next/env";
import path from "path";

loadEnvConfig(path.join(process.cwd(), ".."));
```

`route.ts` imports this file purely for its side effect (`import "@/lib/load-root-env"`) before reading `process.env`.

### 4.9 Testing

Two layers of tests exist, matching the two tools introduced earlier.

**Unit test example** (`lib/board-reducer.test.ts`) — testing one function in complete isolation, no browser involved:

```ts
it("DELETE_CARD removes only the target card", () => {
  const state = makeState();
  const next = boardReducer(state, { type: "DELETE_CARD", cardId: "card-2" });
  expect(next.cards.map((c) => c.id)).toEqual(["card-1", "card-3"]);
});
```

**End-to-end test example** (`e2e/drag-drop.spec.ts`) — driving a real Chromium browser exactly like a person would, mouse movements included:

```ts
test("dragging a card moves it to another column", async ({ page }) => {
  await page.goto("/");
  // ...locate the card and the target column...
  await page.mouse.move(cardBox.x + cardBox.width / 2, cardBox.y + cardBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + 20, { steps: 15 });
  await page.mouse.up();

  await expect(targetColumn.getByText("Design onboarding flow")).toBeVisible();
});
```

Run them yourself from `kanban/frontend`:

```bash
npm test         # unit tests (fast, no browser)
npm run test:e2e # end-to-end tests (slower, opens a real browser)
```

---

## 5. Five ways this code could be improved

Being honest about a codebase's weak spots is as important as explaining how it works. Here are five real, specific opportunities for improvement — roughly in order of what I'd tackle first if this were going into production:

1. **No persistence.** All state lives in a `useReducer` in memory — refresh the page and every card you added, moved, or deleted is gone. For a real tool, the next step would be either `localStorage` (quick, per-browser) or a real backend with a database (multi-device, multi-user, durable). The reducer pattern used throughout actually makes this easier to retrofit than most apps: since every change already flows through one `dispatch` function, you could add a `useEffect` that saves state to `localStorage` (or calls a save API) whenever it changes, with minimal changes elsewhere.

2. **No rate limiting or usage cap on `/api/chat`.** Every message sent through the chat widget makes a real, billed call to OpenRouter, and there's currently nothing stopping someone from firing off hundreds of requests in a loop (accidentally, via a bug, or on purpose) and running up an unexpectedly large bill. A production version should add at least basic per-session or per-IP rate limiting on that route.

3. **Loose validation of the AI's tool-call arguments.** The route handler trusts that `JSON.parse(tc.function.arguments)` produces exactly the fields we asked for, and the client only does light checks like `if (!tc.arguments.cardId) return ...`. Language models occasionally return slightly malformed or unexpected data. A schema validation library (like Zod) applied to each tool call's arguments before acting on them would catch bad data with a clear error, instead of risking a confusing runtime bug.

4. **Chat history grows without limit.** Every message you've ever sent in a session gets resent to the AI model on every new message (so it has context) — which means a long conversation gets slower and more expensive with every turn, and it will eventually bump into the model's maximum context length. A real implementation would trim old messages or periodically summarize them.

5. **Some duplicated form UI between `AddCardForm` and `Card`'s edit mode.** Both render a very similar title-input + details-textarea + Cancel/Save-style form, styled almost identically, with the styling repeated rather than shared. Extracting a small shared `CardFieldsForm` component (title, details, and optionally due date) would remove that duplication and make future styling tweaks apply in one place instead of two.

---

That's the whole app, front to back. The best way to cement this is to make one small change yourself — try changing a color in `globals.css`, or adding a new field to a card in `types.ts` and following the TypeScript errors to every place that needs updating.
