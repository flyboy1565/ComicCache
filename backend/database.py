from sqlmodel import Session, SQLModel, create_engine

sqlite_file_name = "comiccache.db"
sqlite_url = f"sqlite:///{sqlite_file_name}"

engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})

def init_db():
    SQLModel.metadata.create_all(engine)
    try:
        with engine.connect() as conn:
            conn.execute(
                SQLModel.text(
                    "ALTER TABLE user ADD COLUMN must_change_password BOOLEAN NOT NULL DEFAULT 0"
                )
            )
            conn.commit()
    except Exception:
        pass  # column already exists

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

def get_session():
    with Session(engine) as session:
        yield session