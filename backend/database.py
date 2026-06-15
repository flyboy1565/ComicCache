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

def get_session():
    with Session(engine) as session:
        yield session