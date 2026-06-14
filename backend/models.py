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