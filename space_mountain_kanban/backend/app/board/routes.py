from fastapi import APIRouter, Depends, HTTPException, status

from app.auth.session import get_current_user
from app.board import repository
from app.board.repository import NotFoundError
from app.db import get_connection
from app.models import BoardOut, CardCreate, CardMove, CardOut, CardUpdate, ColumnOut, ColumnRename

router = APIRouter(prefix="/api/board", tags=["board"])


@router.get("", response_model=BoardOut)
def get_board(user_id: int = Depends(get_current_user)) -> BoardOut:
    conn = get_connection()
    try:
        return repository.get_board(conn, user_id)
    finally:
        conn.close()


@router.post("/cards", response_model=CardOut, status_code=status.HTTP_201_CREATED)
def add_card(payload: CardCreate, user_id: int = Depends(get_current_user)) -> CardOut:
    conn = get_connection()
    try:
        return repository.add_card(
            conn, user_id, payload.columnId, payload.title, payload.details, payload.dueDate
        )
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e
    finally:
        conn.close()


@router.patch("/cards/{card_id}", response_model=CardOut)
def update_card(card_id: str, payload: CardUpdate, user_id: int = Depends(get_current_user)) -> CardOut:
    conn = get_connection()
    try:
        fields = payload.model_dump(exclude_unset=True)
        return repository.update_card(conn, user_id, card_id, **fields)
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e
    finally:
        conn.close()


@router.delete("/cards/{card_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_card(card_id: str, user_id: int = Depends(get_current_user)) -> None:
    conn = get_connection()
    try:
        repository.delete_card(conn, user_id, card_id)
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e
    finally:
        conn.close()


@router.patch("/columns/{column_id}", response_model=ColumnOut)
def rename_column(column_id: str, payload: ColumnRename, user_id: int = Depends(get_current_user)) -> ColumnOut:
    conn = get_connection()
    try:
        return repository.rename_column(conn, user_id, column_id, payload.title)
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e
    finally:
        conn.close()


@router.post("/cards/{card_id}/move", status_code=status.HTTP_204_NO_CONTENT)
def move_card(card_id: str, payload: CardMove, user_id: int = Depends(get_current_user)) -> None:
    conn = get_connection()
    try:
        repository.move_card(conn, user_id, card_id, payload.toColumnId, payload.toIndex)
    except NotFoundError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e)) from e
    finally:
        conn.close()
