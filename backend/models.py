from datetime import datetime
from typing import List, Optional
from sqlmodel import Field, Relationship, SQLModel

class BoxBase(SQLModel):
    name: str          # e.g., "Marvel Longbox A"
    location: str      # e.g., "Back Room - Shelf 2"

class Box(BoxBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    comics: List["Comic"] = Relationship(back_populates="box")

class BoxCreate(BoxBase):
    pass

class ComicBase(SQLModel):
    barcode: str = Field(index=True)
    title: str
    issue_number: str
    publisher: str
    cover_image: Optional[str] = None
    purchase_cost: float = Field(default=0.0)
    estimated_value: float = Field(default=0.0)
    
    # NEW METADATA FIELDS FOR ADVANCED SEARCH
    writer: Optional[str] = Field(default=None, index=True)
    penciler: Optional[str] = Field(default=None, index=True) # Illustrator
    keywords: Optional[str] = Field(default=None, index=True)  # e.g., "Venom, symbiote, first appearance"

class Comic(ComicBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    date_scanned: datetime = Field(default_factory=datetime.utcnow)
    last_price_check: Optional[datetime] = Field(default=None)
    
    box_id: int = Field(foreign_key="box.id")
    box: Box = Relationship(back_populates="comics")

class ComicCreate(ComicBase):
    box_id: int


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True)
    email: str = Field(unique=True, index=True)
    password_hash: str
    role: str = Field(default="staff")
    is_active: bool = Field(default=True)
    must_change_password: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)


class PicklistItemBase(SQLModel):
    title: str
    issue_number: str
    publisher: str
    notes: Optional[str] = None


class PicklistItem(PicklistItemBase, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    date_added: datetime = Field(default_factory=datetime.utcnow)
    status: str = Field(default="pending")
    user_id: int = Field(foreign_key="user.id")


class PicklistItemCreate(PicklistItemBase):
    pass