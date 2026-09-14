import sqlite3
import uuid

from app.models import BoardOut, CardOut, ColumnOut


class NotFoundError(Exception):
    """Raised when a requested board, column, or card doesn't exist (or isn't the user's)."""


def _get_board_id(conn: sqlite3.Connection, user_id: int) -> int:
    row = conn.execute("SELECT id FROM boards WHERE user_id = ?", (user_id,)).fetchone()
    if row is None:
        raise NotFoundError("Board not found")
    return row["id"]


def _ensure_column_in_board(conn: sqlite3.Connection, column_id: str, board_id: int) -> None:
    row = conn.execute(
        "SELECT id FROM board_columns WHERE id = ? AND board_id = ?", (column_id, board_id)
    ).fetchone()
    if row is None:
        raise NotFoundError(f"Column {column_id} not found")


def _renumber_column(conn: sqlite3.Connection, column_id: str) -> None:
    rows = conn.execute(
        "SELECT id FROM cards WHERE column_id = ? ORDER BY position", (column_id,)
    ).fetchall()
    for position, row in enumerate(rows):
        conn.execute("UPDATE cards SET position = ? WHERE id = ?", (position, row["id"]))


def get_board(conn: sqlite3.Connection, user_id: int) -> BoardOut:
    board_id = _get_board_id(conn, user_id)
    columns = [
        ColumnOut(id=row["id"], title=row["title"])
        for row in conn.execute(
            "SELECT id, title FROM board_columns WHERE board_id = ? ORDER BY position", (board_id,)
        ).fetchall()
    ]
    cards = [
        CardOut(id=row["id"], title=row["title"], details=row["details"], dueDate=row["due_date"], columnId=row["column_id"])
        for row in conn.execute(
            """
            SELECT c.id, c.title, c.details, c.due_date, c.column_id
            FROM cards c
            JOIN board_columns bc ON c.column_id = bc.id
            WHERE bc.board_id = ?
            ORDER BY bc.position, c.position
            """,
            (board_id,),
        ).fetchall()
    ]
    return BoardOut(columns=columns, cards=cards)


def add_card(
    conn: sqlite3.Connection, user_id: int, column_id: str, title: str, details: str, due_date: str | None
) -> CardOut:
    board_id = _get_board_id(conn, user_id)
    _ensure_column_in_board(conn, column_id, board_id)

    count = conn.execute(
        "SELECT COUNT(*) AS n FROM cards WHERE column_id = ?", (column_id,)
    ).fetchone()["n"]
    card_id = str(uuid.uuid4())
    conn.execute(
        "INSERT INTO cards (id, column_id, title, details, due_date, position) VALUES (?, ?, ?, ?, ?, ?)",
        (card_id, column_id, title, details, due_date, count),
    )
    conn.commit()
    return CardOut(id=card_id, title=title, details=details, dueDate=due_date, columnId=column_id)


def update_card(conn: sqlite3.Connection, user_id: int, card_id: str, **fields: str | None) -> CardOut:
    board_id = _get_board_id(conn, user_id)
    row = conn.execute(
        """
        SELECT c.* FROM cards c
        JOIN board_columns bc ON c.column_id = bc.id
        WHERE c.id = ? AND bc.board_id = ?
        """,
        (card_id, board_id),
    ).fetchone()
    if row is None:
        raise NotFoundError(f"Card {card_id} not found")

    column_for_field = {"title": "title", "details": "details", "dueDate": "due_date"}
    updates = {column_for_field[key]: value for key, value in fields.items() if key in column_for_field}
    if updates:
        set_clause = ", ".join(f"{col} = ?" for col in updates)
        conn.execute(f"UPDATE cards SET {set_clause} WHERE id = ?", (*updates.values(), card_id))
        conn.commit()

    updated = conn.execute("SELECT * FROM cards WHERE id = ?", (card_id,)).fetchone()
    return CardOut(
        id=updated["id"],
        title=updated["title"],
        details=updated["details"],
        dueDate=updated["due_date"],
        columnId=updated["column_id"],
    )


def delete_card(conn: sqlite3.Connection, user_id: int, card_id: str) -> None:
    board_id = _get_board_id(conn, user_id)
    row = conn.execute(
        """
        SELECT c.column_id FROM cards c
        JOIN board_columns bc ON c.column_id = bc.id
        WHERE c.id = ? AND bc.board_id = ?
        """,
        (card_id, board_id),
    ).fetchone()
    if row is None:
        raise NotFoundError(f"Card {card_id} not found")

    conn.execute("DELETE FROM cards WHERE id = ?", (card_id,))
    _renumber_column(conn, row["column_id"])
    conn.commit()


def rename_column(conn: sqlite3.Connection, user_id: int, column_id: str, title: str) -> ColumnOut:
    board_id = _get_board_id(conn, user_id)
    _ensure_column_in_board(conn, column_id, board_id)
    conn.execute("UPDATE board_columns SET title = ? WHERE id = ?", (title, column_id))
    conn.commit()
    return ColumnOut(id=column_id, title=title)


def move_card(conn: sqlite3.Connection, user_id: int, card_id: str, to_column_id: str, to_index: int) -> None:
    board_id = _get_board_id(conn, user_id)
    _ensure_column_in_board(conn, to_column_id, board_id)

    row = conn.execute(
        """
        SELECT c.column_id FROM cards c
        JOIN board_columns bc ON c.column_id = bc.id
        WHERE c.id = ? AND bc.board_id = ?
        """,
        (card_id, board_id),
    ).fetchone()
    if row is None:
        raise NotFoundError(f"Card {card_id} not found")
    from_column_id = row["column_id"]

    target_card_ids = [
        r["id"]
        for r in conn.execute(
            "SELECT id FROM cards WHERE column_id = ? AND id != ? ORDER BY position",
            (to_column_id, card_id),
        ).fetchall()
    ]
    index = max(0, min(to_index, len(target_card_ids)))
    target_card_ids.insert(index, card_id)

    for position, cid in enumerate(target_card_ids):
        conn.execute(
            "UPDATE cards SET column_id = ?, position = ? WHERE id = ?", (to_column_id, position, cid)
        )

    if from_column_id != to_column_id:
        _renumber_column(conn, from_column_id)

    conn.commit()
