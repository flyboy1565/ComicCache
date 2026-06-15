from sqlmodel import Session, SQLModel, create_engine
from datetime import datetime, timedelta
from database import engine
from models import Box, Comic, User
from auth import hash_password

def seed_database():
    # Clear and recreate tables
    SQLModel.metadata.drop_all(engine)
    SQLModel.metadata.create_all(engine)
    
    with Session(engine) as session:
        print("Seeding boxes...")
        box1 = Box(name="Marvel Longbox Alpha", location="Row 1, Shelf A")
        box2 = Box(name="DC Shortbox 1", location="Behind Front Counter")
        box3 = Box(name="Indie Bin (Image/Boom)", location="Floor Display Center")
        
        session.add_all([box1, box2, box3])
        session.commit() # Commit boxes first to generate IDs
        
        print("Seeding comics with rich creator metadata...")
        comics = [
            # Box 1: Marvel
            Comic(
                barcode="75960608456300111", title="The Amazing Spider-Man", issue_number="1",
                publisher="Marvel Comics", writer="Zen Wells", penciler="John Romita Jr.",
                keywords="Spider-Man, Peter Parker, Tombstone", purchase_cost=2.50, estimated_value=4.99,
                box_id=box1.id, date_scanned=datetime.utcnow() - timedelta(days=120)
            ),
            Comic(
                barcode="75960608456330011", title="The Amazing Spider-Man", issue_number="300",
                publisher="Marvel Comics", writer="David Michelinie", penciler="Todd McFarlane",
                keywords="First appearance Venom, Symbiote costume", purchase_cost=50.00, estimated_value=450.00,
                box_id=box1.id, date_scanned=datetime.utcnow() - timedelta(days=10)
            ),
            Comic(
                barcode="50960609456300111", title="Uncanny X-Men", issue_number="141",
                publisher="Marvel Comics", writer="Chris Claremont", penciler="John Byrne",
                keywords="Days of Future Past, Wolverine, Sentinels", purchase_cost=10.00, estimated_value=75.00,
                box_id=box1.id, date_scanned=datetime.utcnow() - timedelta(days=95)
            ),
            
            # Box 2: DC
            Comic(
                barcode="76194134185900111", title="Batman", issue_number="1",
                publisher="DC Comics", writer="Scott Snyder", penciler="Greg Capullo",
                keywords="Court of Owls, Gotham, Dick Grayson", purchase_cost=1.50, estimated_value=35.00,
                box_id=box2.id, date_scanned=datetime.utcnow() - timedelta(days=45)
            ),
            Comic(
                barcode="76194120646200111", title="Watchmen", issue_number="1",
                publisher="DC Comics", writer="Alan Moore", penciler="Dave Gibbons",
                keywords="Rorschach, Dr Manhattan, Ozymandias", purchase_cost=5.00, estimated_value=60.00,
                box_id=box2.id, date_scanned=datetime.utcnow() - timedelta(days=15)
            ),
            
            # Box 3: Indies
            Comic(
                barcode="978163215865951299", title="Saga", issue_number="1",
                publisher="Image Comics", writer="Brian K. Vaughan", penciler="Fiona Staples",
                keywords="Hazel, Marko, Alana, Sci-Fi Space Opera", purchase_cost=3.00, estimated_value=120.00,
                box_id=box3.id, date_scanned=datetime.utcnow() - timedelta(days=5)
            )
        ]
        
        session.add_all(comics)

        print("Seeding admin user...")
        admin = User(
            username="admin",
            email="admin@comiccache.local",
            password_hash=hash_password("admin"),
            role="admin",
        )
        session.add(admin)
        session.commit()
        print("Database successfully seeded with commercial testing profiles!")

if __name__ == "__main__":
    seed_database()