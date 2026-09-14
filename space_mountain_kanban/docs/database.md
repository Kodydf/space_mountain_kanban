# Database

SQLite, one file at `backend/data/kanban.db` (created automatically if missing, volume-mounted so it survives container restarts). Schema in full: [`db-schema.json`](./db-schema.json).

## Why this shape

**Four tables, matching the frontend's existing data model one-to-one.** `users` and `boards` are separate tables (rather than one) so that "one board per user" can be a real database constraint (`boards.user_id UNIQUE`) instead of just something the application code happens to enforce. `board_columns` and `cards` mirror the frontend's `ColumnData`/`CardData` types field-for-field — this was a deliberate choice so that Part 6 (backend API) and Part 7 (frontend integration) stay mechanical rather than requiring any data reshaping at the boundary.

**`cards` is a flat table**, not nested under columns — matching the frontend reducer's existing flat-array-with-`columnId` design (see `frontend/src/lib/board-reducer.ts`). A card only needs to know which column it belongs to.

**`position` columns on `board_columns` and `cards`.** SQLite doesn't guarantee that rows come back in insertion order, but both the order of the 5 columns and the order of cards within a column are meaningful to the UI. Rather than relying on incidental row order, `position` is stored and maintained explicitly — recomputed only for whichever column(s) are affected by an add, move, or delete, the same way the frontend's `MOVE_CARD` reducer case already recomputes array positions today.

**`due_date` is `TEXT`, storing an ISO `YYYY-MM-DD` string or `NULL`.** This exactly matches the frontend's `dueDate: string | null` field, so there is zero date parsing or conversion needed anywhere in the backend — it passes through as-is.

## Auth (from Part 4, already implemented)

`users.password_hash` stores a salted PBKDF2-HMAC-SHA256 hash as a single `"salt$digest"` string (stdlib `hashlib`/`secrets` only — no extra dependency). At startup, if the `users` table is empty, one row is seeded: `username='user'`, password hashed from the MVP's hardcoded `'password'`. Login looks this row up and verifies the hash — the "hardcoded" part is only the *seed value*, not the runtime check, so the schema and auth logic are already genuinely ready for a second user to be added later as a data change, not a code change.

## What's next (Part 6)

`backend/schema.sql` will contain the literal `CREATE TABLE IF NOT EXISTS` statements matching this document. On an empty database, the backend also seeds one board, the 5 fixed columns, and the same 8 dummy cards currently hardcoded in `frontend/src/lib/seed-data.ts`, so a fresh install's out-of-the-box experience is unchanged from today's demo.
