import os
import secrets
from datetime import datetime
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import Session, SQLModel, select
from dotenv import load_dotenv

from database import init_db, get_session
from models import Box, BoxCreate, Comic, ComicCreate, PicklistItem, PicklistItemCreate, User
from schema import BatchScanPayload, ScanRequest
from auth import create_access_token, get_current_user, hash_password, verify_password

# Import our utility engine functions
from utils import (
    log_scan_diagnostic,
    fetch_live_market_value,
    fetch_official_series_run,
    query_comicvine_metadata,
    execute_hardcoded_failsafe,
    parse_five_digit_extension, 
    fetch_series_title_from_comic_db,
    fetch_cover_from_fandom_wiki
)

load_dotenv()

app = FastAPI(title="ComicCache API (Business Edition)", version="1.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def on_startup():
    init_db()

# --- SCAN RESOLVER PIPELINE ---

@app.post("/api/v1/scan/process-barcode")
async def process_comic_barcode(payload: ScanRequest, session: Session = Depends(get_session)):
    barcode_str = payload.barcode.strip()
    
    print("\n" + "═"*70)
    log_scan_diagnostic("Pipeline Start", f"Processing Commercial-Friendly 12+5 Split Scan Matrix: '{barcode_str}'")
    
    # Verify the target container node
    target_box = session.get(Box, payload.box_id)
    if not target_box:
        raise HTTPException(status_code=404, detail="Target storage box not found.")

    # -----------------------------------------------------------------
    # LAYER 1: LOCAL DATABASE CHECK (Deduplication Guard)
    # -----------------------------------------------------------------
    statement = select(Comic).where(Comic.barcode == barcode_str, Comic.box_id == payload.box_id)
    existing_book = session.exec(statement).first()

    if existing_book:
        log_scan_diagnostic("Deduplication Check", f"Match identified. Barcode already logged in Box {payload.box_id}")
        print("═"*70 + "\n")
        return {
            "status": "already_exists",
            "message": "This specific copy is already recorded in this box container map.",
            "data": {
                "title": existing_book.title,
                "issue_number": existing_book.issue_number,
                "publisher": existing_book.publisher,
                "estimated_value": existing_book.estimated_value
            }
        }

    # -----------------------------------------------------------------
    # LAYER 2: DECOMPOSE THE 17-DIGIT STRING (12 Root + 5 Formula Extension)
    # -----------------------------------------------------------------
    upc_root = barcode_str[:12]
    extension = barcode_str[12:17] if len(barcode_str) == 17 else ""
    
    # Parse our custom calculated metrics
    issue_number, variant_cover, printing = parse_five_digit_extension(extension)
    log_scan_diagnostic("Formula Parser", f"Decoded: Issue #{issue_number} | Cover: {variant_cover} | Printing: {printing}")

    cover_image_fallback = None
    
    # -----------------------------------------------------------------
    # LAYER 3: RESOLVE THE SERIES NAME & COVER IMAGE
    # -----------------------------------------------------------------
    # 🚀 Swap the retail trial lookup for our true, free comic database index lookup!
    series_title, publisher_name = await fetch_series_title_from_comic_db(barcode_str)
    cover_image_url = None
    
    # Keep your hardcoded local signature fallback overrides just in case 
    if not series_title and barcode_str.startswith("76194139344"):
        series_title = "DC X Sonic The Hedgehog: The Metal Legion"
        publisher_name = "DC Comics"
    elif not series_title and barcode_str.startswith("75960607631"):
        series_title = "Ultimate Spider-Man"
        publisher_name = "Marvel Comics"

    if not publisher_name:
        publisher_name = "Unknown Publisher"

    # 🕵️‍♂️ Run the Fandom Wiki Image Locator using our freshly discovered clean title strings!
    if series_title and issue_number:
        cover_image_url = await fetch_cover_from_fandom_wiki(
            series_title=series_title,
            issue_num=issue_number,
            publisher=publisher_name
        )

    # Final static placeholder generation fallback if all else fails
    if not cover_image_url:
        clean_url_title = series_title.replace(' ', '+').replace(':', '') if series_title else "Unknown"
        cover_image_url = f"https://via.placeholder.com/150x225?text={clean_url_title}+%23{issue_number}"

    if not series_title:
        series_title = "Unindexed Barcode Run"
        
    # -----------------------------------------------------------------
    # LAYER 4: CROSS REFERENCE THE GRAND COMICS DATABASE (GCD)
    # -----------------------------------------------------------------
    log_scan_diagnostic("GCD Engine", f"Validating checklist run on GCD for '{series_title}'...")
    official_run = fetch_official_series_run(series_title, publisher_name)
    
    if official_run and issue_number in official_run:
        log_scan_diagnostic("GCD Engine", f"🎯 Confirmed Issue #{issue_number} belongs to official series checklist run.")
    else:
        log_scan_diagnostic("GCD Engine", f"⚠️ Issue #{issue_number} absent from retrieved run checklist or GCD server unreachable.")

    # Generate pricing valuation from local mock algorithm engine
    market_value = await fetch_live_market_value(series_title, issue_number)
    if barcode_str.startswith("76194139344"):
        market_value = 4.99 # Lock our custom failsafe signature value precisely
        publisher_name = "DC Comics"

    # -----------------------------------------------------------------
    # LAYER 5: FINALIZE & SAVE THE COMPLETED ASSET DATA OBJECT
    # -----------------------------------------------------------------
    # Build complete title including variant cover formatting data string
    full_display_title = f"{series_title} Cover {variant_cover}" if variant_cover != "A" else series_title

    parsed_data = {
        "title": full_display_title,
        "issue_number": issue_number,
        "publisher": publisher_name,
        "cover_image": f"https://via.placeholder.com/150x225?text={series_title.replace(' ', '+')}+%23{issue_number}",
        "estimated_value": market_value
    }

    try:
        new_comic = Comic(
            barcode=barcode_str,
            box_id=payload.box_id,
            purchase_cost=1.00,
            last_price_check=datetime.utcnow(),
            **parsed_data
        )
        session.add(new_comic)
        session.commit()
        session.refresh(new_comic)
        
        log_scan_diagnostic("Pipeline End", f"Successfully Stored! Created Record ID: {new_comic.id}")
        print("═"*70 + "\n")
        
        return {
            "status": "success",
            "message": "Successfully parsed and filed into database cache context.",
            "data": new_comic
        }
    except Exception as e:
        session.rollback()
        log_scan_diagnostic("Database Crash", f"Transaction aborted: {e}", is_error=True)
        print("═"*70 + "\n")
        raise HTTPException(status_code=500, detail=f"Database commit error: {e}")


# --- legacy/MANUAL COMMIT ENDPOINT ---

@app.post("/api/v1/scan")
async def handle_incoming_scan(payload: ComicCreate, session: Session = Depends(get_session)):
    target_box = session.get(Box, payload.box_id)
    if not target_box:
        raise HTTPException(status_code=404, detail="Target storage box not found.")

    statement = select(Comic).where(Comic.barcode == payload.barcode, Comic.box_id == payload.box_id)
    if session.exec(statement).first():
        return {"status": "already_exists", "data": session.exec(statement).first()}

    market_value = payload.estimated_value
    if market_value == 0.0:
        market_value = await fetch_live_market_value(payload.title, payload.issue_number)

    cover_url = payload.cover_image or f"https://via.placeholder.com/150x225?text={payload.title.replace(' ', '+')}"

    db_comic = Comic(
        barcode=payload.barcode,
        title=payload.title,
        issue_number=payload.issue_number,
        publisher=payload.publisher,
        cover_image=cover_url,
        purchase_cost=payload.purchase_cost,
        estimated_value=market_value,
        last_price_check=datetime.utcnow(),
        box_id=payload.box_id
    )
    session.add(db_comic)
    session.commit()
    session.refresh(db_comic)
    return {"status": "success", "data": db_comic}


# --- BOX MANAGE ENDPOINTS ---

@app.post("/api/v1/boxes", response_model=Box)
def create_box(box: BoxCreate, session: Session = Depends(get_session)):
    db_box = Box.from_orm(box)
    session.add(db_box)
    session.commit()
    session.refresh(db_box)
    return db_box

@app.get("/api/v1/boxes", response_model=list[Box])
def read_boxes(session: Session = Depends(get_session)):
    return session.exec(select(Box)).all()


# --- BUSINESS VALUATION ENDPOINT ---

@app.get("/api/v1/boxes/{box_id}/valuation")
async def get_box_valuation(box_id: int, session: Session = Depends(get_session)):
    box = session.get(Box, box_id)
    if not box:
        raise HTTPException(status_code=404, detail="Box not found")
        
    statement = select(Comic).where(Comic.box_id == box_id)
    comics = session.exec(statement).all()
    
    total_books = len(comics)
    if total_books == 0:
        return {
            "box_name": box.name,
            "total_comics": 0,
            "financials": {"total_store_cost_cogs": 0.0, "total_estimated_retail_value": 0.0, "potential_profit": 0.0},
            "velocity": {"stale_books_90_days_plus": 0, "average_days_in_box": 0.0}
        }

    total_cost = sum(comic.purchase_cost for comic in comics)
    total_market_value = sum(comic.estimated_value for comic in comics)
    
    now = datetime.utcnow()
    stale_books_count = sum(1 for comic in comics if (now - comic.date_scanned).days > 90)
    avg_days = sum((now - comic.date_scanned).days for comic in comics) / total_books

    return {
        "box_id": box.id,
        "box_name": box.name,
        "location": box.location,
        "total_comics": total_books,
        "financials": {
            "total_store_cost_cogs": round(total_cost, 2),
            "total_estimated_retail_value": round(total_market_value, 2),
            "potential_profit": round(total_market_value - total_cost, 2)
        },
        "velocity": {
            "stale_books_90_days_plus": stale_books_count,
            "average_days_in_box": round(avg_days, 1)
        }
    }


# --- BOX CONTENTS ENDPOINT ---

@app.get("/api/v1/boxes/{box_id}/comics")
def get_box_comics(box_id: int, session: Session = Depends(get_session)):
    box = session.get(Box, box_id)
    if not box:
        raise HTTPException(status_code=404, detail="Box not found")
    statement = select(Comic).where(Comic.box_id == box_id)
    comics = session.exec(statement).all()
    return [
        {
            "id": c.id,
            "title": c.title,
            "issue_number": c.issue_number,
            "publisher": c.publisher,
            "cover_image": c.cover_image,
            "estimated_value": c.estimated_value,
            "barcode": c.barcode,
            "date_scanned": c.date_scanned.isoformat() if c.date_scanned else None,
        }
        for c in comics
    ]


# --- AUTH ENDPOINTS ---

class LoginRequest(SQLModel):
    username: str
    password: str

class RegisterRequest(SQLModel):
    username: str

class ChangePasswordRequest(SQLModel):
    current_password: str
    new_password: str

class ResetPasswordRequest(SQLModel):
    user_id: int


@app.post("/api/v1/auth/login")
def login(payload: LoginRequest, session: Session = Depends(get_session)):
    user = session.exec(select(User).where(User.username == payload.username)).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    if not user.is_active:
        raise HTTPException(status_code=401, detail="Account is disabled")
    token = create_access_token({"sub": user.id})
    result = {
        "access_token": token,
        "token_type": "bearer",
        "password_change_required": user.must_change_password,
        "user": {"id": user.id, "username": user.username, "email": user.email, "role": user.role, "must_change_password": user.must_change_password},
    }
    return result


@app.post("/api/v1/auth/register")
def register(payload: RegisterRequest, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    existing = session.exec(select(User).where(User.username == payload.username)).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken")
    temp_password = secrets.token_urlsafe(12)
    user = User(
        username=payload.username,
        email=f"{payload.username}@comiccache.local",
        password_hash=hash_password(temp_password),
        must_change_password=True,
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    print(f"📧 To {user.email}: Your temporary password is: {temp_password}")
    return {"id": user.id, "username": user.username, "email": user.email, "role": user.role}


@app.get("/api/v1/auth/me")
def me(current_user: User = Depends(get_current_user)):
    return {"id": current_user.id, "username": current_user.username, "email": current_user.email, "role": current_user.role, "must_change_password": current_user.must_change_password}


@app.get("/api/v1/auth/users")
def list_users(session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    users = session.exec(select(User).where(User.role != "admin")).all()
    return [{"id": u.id, "username": u.username, "email": u.email, "role": u.role, "must_change_password": u.must_change_password} for u in users]


@app.post("/api/v1/auth/change-password")
def change_password(payload: ChangePasswordRequest, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    if not verify_password(payload.current_password, current_user.password_hash):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    if len(payload.new_password) < 4:
        raise HTTPException(status_code=400, detail="New password must be at least 4 characters")
    current_user.password_hash = hash_password(payload.new_password)
    current_user.must_change_password = False
    session.add(current_user)
    session.commit()
    return {"message": "Password changed successfully"}


@app.post("/api/v1/auth/reset-password")
def reset_password(payload: ResetPasswordRequest, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    target = session.get(User, payload.user_id)
    if not target:
        raise HTTPException(status_code=404, detail="User not found")
    temp_password = secrets.token_urlsafe(12)
    target.password_hash = hash_password(temp_password)
    target.must_change_password = True
    session.add(target)
    session.commit()
    print(f"📧 To {target.email}: Your password has been reset. Temporary password: {temp_password}")
    return {"message": f"Password reset email sent to {target.email}"}


# --- PICKLIST ENDPOINTS ---

@app.get("/api/v1/picklist")
def read_picklist(session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    statement = select(PicklistItem).where(PicklistItem.user_id == current_user.id).order_by(PicklistItem.date_added.desc())
    return session.exec(statement).all()


@app.post("/api/v1/picklist", response_model=PicklistItem)
def create_picklist_item(item: PicklistItemCreate, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    db_item = PicklistItem(
        title=item.title,
        issue_number=item.issue_number,
        publisher=item.publisher,
        notes=item.notes,
        user_id=current_user.id,
    )
    session.add(db_item)
    session.commit()
    session.refresh(db_item)
    return db_item


@app.patch("/api/v1/picklist/{item_id}", response_model=PicklistItem)
def update_picklist_item(item_id: int, payload: dict, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    db_item = session.exec(select(PicklistItem).where(PicklistItem.id == item_id, PicklistItem.user_id == current_user.id)).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Picklist item not found")
    for key, value in payload.items():
        if hasattr(db_item, key):
            setattr(db_item, key, value)
    session.commit()
    session.refresh(db_item)
    return db_item


@app.delete("/api/v1/picklist/{item_id}")
def delete_picklist_item(item_id: int, session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    db_item = session.exec(select(PicklistItem).where(PicklistItem.id == item_id, PicklistItem.user_id == current_user.id)).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Picklist item not found")
    session.delete(db_item)
    session.commit()
    return {"status": "deleted"}


@app.delete("/api/v1/picklist")
def clear_picklist(session: Session = Depends(get_session), current_user: User = Depends(get_current_user)):
    statement = select(PicklistItem).where(PicklistItem.user_id == current_user.id)
    for item in session.exec(statement).all():
        session.delete(item)
    session.commit()
    return {"status": "cleared"}


# --- SEARCH ENGINE ENDPOINTS ---

@app.get("/api/v1/comics/search")
def search_comics(query: str, session: Session = Depends(get_session)):
    if not query or len(query.strip()) < 2:
        return []
        
    search_term = f"%{query.strip()}%"
    statement = select(Comic).where(
        (Comic.title.like(search_term)) |
        (Comic.writer.like(search_term)) |
        (Comic.penciler.like(search_term)) |
        (Comic.keywords.like(search_term)) |
        (Comic.publisher.like(search_term)) |
        (Comic.barcode == query.strip())
    )
    results = session.exec(statement).all()
    
    transformed_results = []
    for comic in results:
        transformed_results.append({
            "id": comic.id,
            "title": comic.title,
            "issue_number": comic.issue_number,
            "publisher": comic.publisher,
            "cover_image": comic.cover_image,
            "estimated_value": comic.estimated_value,
            "writer": comic.writer,
            "penciler": comic.penciler,
            "keywords": comic.keywords,
            "box_name": comic.box.name,
            "box_location": comic.box.location
        })
    return transformed_results


@app.post("/api/v1/scan/batch")
async def handle_batch_scan(payload: BatchScanPayload, session: Session = Depends(get_session)):
    target_box = session.get(Box, payload.box_id)
    if not target_box:
        raise HTTPException(status_code=404, detail="Target box not found.")

    processed_comics = []
    for barcode in payload.barcodes:
        statement = select(Comic).where(Comic.barcode == barcode, Comic.box_id == payload.box_id)
        if session.exec(statement).first():
            continue

        market_value = await fetch_live_market_value("Batch Discovered Comic", "1")
        db_comic = Comic(
            barcode=barcode,
            title="Batch Discovered Comic",
            issue_number="1",
            publisher="Unknown Publisher",
            estimated_value=market_value,
            box_id=payload.box_id
        )
        session.add(db_comic)
        processed_comics.append(db_comic)

    session.commit()
    return {"status": "success", "items_added": len(processed_comics)}    


@app.get("/api/v1/series/overview")
def get_series_overview(title: str, publisher: str, session: Session = Depends(get_session)):
    if not title:
        raise HTTPException(status_code=400, detail="Title parameter required")
        
    statement = select(Comic).where(Comic.title == title, Comic.publisher == publisher)
    owned_comics = session.exec(statement).all()
    owned_map = {c.issue_number: c for c in owned_comics}
    
    official_numbers = fetch_official_series_run(title, publisher)
    if not official_numbers:
        max_issue = 1
        for num_str in owned_map.keys():
            try:
                max_issue = max(max_issue, int(num_str))
            except ValueError: 
                pass
        official_numbers = [str(i) for i in range(1, max_issue + 1)]
            
    timeline_items = []
    for issue_str in official_numbers:
        if issue_str in owned_map:
            comic = owned_map[issue_str]
            timeline_items.append({
                "issue_number": issue_str,
                "status": "in_stock",
                "id": comic.id,
                "estimated_value": comic.estimated_value,
                "box_name": comic.box.name,
                "box_location": comic.box.location,
                "cover_image": comic.cover_image or "https://via.placeholder.com/130x180?text=No+Cover"
            })
        else:
            timeline_items.append({
                "issue_number": issue_str,
                "status": "missing",
                "id": f"missing-{issue_str}",
                "estimated_value": 0.00,
                "box_name": "Not In Vault",
                "box_location": None,
                "cover_image": "https://via.placeholder.com/130x180?text=Missing"
            })
            
    return {
        "series_title": title,
        "publisher": publisher,
        "total_owned": len(owned_comics),
        "total_missing": len(official_numbers) - len(owned_comics),
        "total_series_value": round(sum(c.estimated_value for c in owned_comics), 2),
        "timeline": timeline_items
    }