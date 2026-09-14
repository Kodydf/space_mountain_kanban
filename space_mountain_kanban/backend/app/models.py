from pydantic import BaseModel


class ColumnOut(BaseModel):
    id: str
    title: str


class CardOut(BaseModel):
    id: str
    title: str
    details: str
    dueDate: str | None
    columnId: str


class BoardOut(BaseModel):
    columns: list[ColumnOut]
    cards: list[CardOut]


class CardCreate(BaseModel):
    columnId: str
    title: str
    details: str = ""
    dueDate: str | None = None


class CardUpdate(BaseModel):
    title: str | None = None
    details: str | None = None
    dueDate: str | None = None


class ColumnRename(BaseModel):
    title: str


class CardMove(BaseModel):
    toColumnId: str
    toIndex: int
