import json
from datetime import datetime
from typing import List, Optional
from sqlmodel import Field, Relationship, SQLModel, UniqueConstraint

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


class Role(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str = Field(unique=True, index=True)
    display_name: str
    description: str = ""
    permissions: str = "{}"
    is_system: bool = Field(default=False)
    created_at: datetime = Field(default_factory=datetime.utcnow)

    def get_permissions(self) -> dict:
        return json.loads(self.permissions or "{}")

    def can(self, resource: str, action: str = "read") -> bool:
        perms = self.get_permissions()
        allowed = perms.get(resource, "none")
        if allowed == "admin":
            return True
        if action == "read" and allowed in ("read", "write"):
            return True
        if action == "write" and allowed == "write":
            return True
        return False


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True)
    email: str = Field(unique=True, index=True)
    password_hash: str
    role: str = Field(default="staff")
    role_id: int = Field(default=5, foreign_key="role.id")
    is_active: bool = Field(default=True)
    must_change_password: bool = Field(default=False)
    permission_overrides: Optional[str] = Field(default=None)
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


class CoverCache(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    series_title: str = Field(index=True)
    issue_number: str = Field(index=True)
    publisher: str = Field(default="")
    cover_url: Optional[str] = None
    source: Optional[str] = None
    status: str = Field(default="pending")
    hit_count: int = Field(default=1)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    __table_args__ = (
        UniqueConstraint("series_title", "issue_number", "publisher", name="uq_series_issue_publisher"),
    )