import os
from sqlmodel import Session, SQLModel, create_engine

DB_PATH = os.getenv("DB_PATH")
if not DB_PATH:
    BASE_DIR = os.path.dirname(os.path.abspath(__file__))
    DB_PATH = os.path.join(BASE_DIR, "comiccache.db")
sqlite_url = f"sqlite:///{DB_PATH}"

engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})

SEED_ROLES = [
    {"name": "admin", "display_name": "Editor-in-Chief", "description": "Full system access", "permissions": '{"scan":"admin","comics":"admin","boxes":"admin","users":"admin","picklist":"admin","valuation":"admin","settings":"admin"}', "is_system": True},
    {"name": "owner", "display_name": "Publisher", "description": "Full operational access except user management", "permissions": '{"scan":"write","comics":"write","boxes":"write","users":"read","picklist":"write","valuation":"write","settings":"admin"}', "is_system": True},
    {"name": "cashier", "display_name": "Quartermaster", "description": "Scanning and pricing", "permissions": '{"scan":"write","comics":"read","boxes":"read","users":"none","picklist":"read","valuation":"read","settings":"none"}', "is_system": True},
    {"name": "sales", "display_name": "Promoter", "description": "Sales floor view and picklist", "permissions": '{"scan":"none","comics":"read","boxes":"read","users":"none","picklist":"write","valuation":"read","settings":"none"}', "is_system": True},
    {"name": "clerk", "display_name": "Page Turner", "description": "Inventory and scanning", "permissions": '{"scan":"write","comics":"write","boxes":"read","users":"none","picklist":"read","valuation":"read","settings":"none"}', "is_system": True},
]

def init_db():
    SQLModel.metadata.create_all(engine)

    # Migration: must_change_password
    try:
        with engine.connect() as conn:
            conn.execute(
                SQLModel.text(
                    "ALTER TABLE user ADD COLUMN must_change_password BOOLEAN NOT NULL DEFAULT 0"
                )
            )
            conn.commit()
    except Exception:
        pass

    # Migration: covercache table
    try:
        with engine.connect() as conn:
            conn.execute(
                SQLModel.text(
                    "CREATE TABLE IF NOT EXISTS covercache ("
                    "id INTEGER PRIMARY KEY AUTOINCREMENT, "
                    "series_title TEXT NOT NULL, "
                    "issue_number TEXT NOT NULL, "
                    "publisher TEXT NOT NULL DEFAULT '', "
                    "cover_url TEXT, "
                    "source TEXT, "
                    "status TEXT NOT NULL DEFAULT 'pending', "
                    "hit_count INTEGER NOT NULL DEFAULT 1, "
                    "updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, "
                    "UNIQUE(series_title, issue_number, publisher)"
                    ")"
                )
            )
            conn.commit()
    except Exception:
        pass

    # Migration: covercache hit_count
    try:
        with engine.connect() as conn:
            conn.execute(
                SQLModel.text(
                    "ALTER TABLE covercache ADD COLUMN hit_count INTEGER NOT NULL DEFAULT 1"
                )
            )
            conn.commit()
    except Exception:
        pass

    # Migration: role_id column on user
    try:
        with engine.connect() as conn:
            conn.execute(
                SQLModel.text(
                    "ALTER TABLE user ADD COLUMN role_id INTEGER NOT NULL DEFAULT 5"
                )
            )
            conn.commit()
    except Exception:
        pass

    # Migration: permission_overrides column on user
    try:
        with engine.connect() as conn:
            conn.execute(
                SQLModel.text(
                    "ALTER TABLE user ADD COLUMN permission_overrides TEXT"
                )
            )
            conn.commit()
    except Exception:
        pass

    # Seed roles (run inside a shared session to avoid import issues)
    with Session(engine) as session:
        from sqlmodel import select
        from models import Role, User
        for role_data in SEED_ROLES:
            existing = session.exec(
                select(Role).where(Role.name == role_data["name"])
            ).first()
            if not existing:
                role = Role(**role_data)
                session.add(role)
        session.commit()

        # Migrate existing users: set role_id based on current role string
        admin_role = session.exec(
            select(Role).where(Role.name == "admin")
        ).first()
        clerk_role = session.exec(
            select(Role).where(Role.name == "clerk")
        ).first()
        for user in session.exec(select(User)).all():
            if user.role == "admin" and admin_role:
                user.role_id = admin_role.id
            elif user.role == "staff" and clerk_role:
                user.role_id = clerk_role.id
        session.commit()

        # Seed admin user (idempotent — only creates if no admin exists)
        from auth import hash_password
        existing_admin = session.exec(
            select(User).where(User.role == "admin")
        ).first()
        if not existing_admin and admin_role:
            admin_username = os.getenv("ADMIN_USERNAME", "admin")
            admin_password = os.getenv("ADMIN_PASSWORD", "admin")
            admin_email = os.getenv("ADMIN_EMAIL", "admin@comiccache.local")
            admin_user = User(
                username=admin_username,
                email=admin_email,
                password_hash=hash_password(admin_password),
                role="admin",
                role_id=admin_role.id,
            )
            session.add(admin_user)
            session.commit()


def get_session():
    with Session(engine) as session:
        yield session