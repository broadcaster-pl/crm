#!/usr/bin/env python3
"""
StreamFlow API - FastAPI Backend
REST API do zarządzania wydarzeniami, leadami i ofertami

Autor: Softreck / prototypowanie.pl
"""

from fastapi import FastAPI, HTTPException, Depends, Query, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from enum import Enum
import asyncio
import sqlite3
import json

# ============= KONFIGURACJA =============

app = FastAPI(
    title="StreamFlow Event Aggregator API",
    description="API do agregacji wydarzeń i zarządzania leadami sprzedażowymi",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS - pozwól na dostęp z frontendu
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # W produkcji: konkretne domeny
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============= MODELE PYDANTIC =============

class EventStatus(str, Enum):
    NEW = "new"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    OFFER_SENT = "offer_sent"
    WON = "won"
    LOST = "lost"
    REJECTED = "rejected"

class LeadStatus(str, Enum):
    NEW = "new"
    ACTIVE = "active"
    OFFER_SENT = "offer_sent"
    NEGOTIATION = "negotiation"
    WON = "won"
    LOST = "lost"

class EventCategory(str, Enum):
    RUNNING = "Bieganie"
    OCR = "OCR"
    CROSSFIT = "CrossFit"
    FITNESS = "Fitness"
    VOLLEYBALL = "Siatkówka"
    FOOTBALL = "Piłka nożna"
    BASKETBALL = "Koszykówka"
    MMA = "MMA"
    ESPORT = "E-sport"
    FESTIVAL = "Festiwal"
    CONFERENCE = "Konferencja"
    FAIR = "Targi"
    OTHER = "Inne"

class ServicePackage(str, Enum):
    BASIC = "basic"
    STANDARD = "standard"
    PREMIUM = "premium"
    ENTERPRISE = "enterprise"

# Request/Response Models
class EventBase(BaseModel):
    name: str
    description: Optional[str] = ""
    organizer: str
    organizer_contact: Optional[str] = ""
    organizer_email: Optional[EmailStr] = None
    organizer_phone: Optional[str] = ""
    date_start: str
    date_end: Optional[str] = ""
    location: str
    city: Optional[str] = ""
    country: str = "PL"
    category: EventCategory
    subcategory: Optional[str] = ""
    source: str
    source_url: Optional[str] = ""
    potential_score: int = 3
    estimated_audience: int = 0

class EventCreate(EventBase):
    pass

class EventUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    organizer: Optional[str] = None
    organizer_email: Optional[str] = None
    organizer_phone: Optional[str] = None
    status: Optional[EventStatus] = None
    potential_score: Optional[int] = None
    notes: Optional[str] = None

class EventResponse(EventBase):
    id: int
    status: EventStatus
    notes: Optional[str] = ""
    discovered_at: str
    updated_at: str

    class Config:
        from_attributes = True

class LeadBase(BaseModel):
    event_id: int
    company: str
    contact_person: str
    email: Optional[EmailStr] = None
    phone: Optional[str] = ""
    value: float = 0.0
    package: Optional[ServicePackage] = None
    notes: Optional[str] = ""

class LeadCreate(LeadBase):
    pass

class LeadUpdate(BaseModel):
    status: Optional[LeadStatus] = None
    value: Optional[float] = None
    package: Optional[ServicePackage] = None
    notes: Optional[str] = None
    follow_up_date: Optional[str] = None

class LeadResponse(LeadBase):
    id: int
    status: LeadStatus
    offer_sent_date: Optional[str] = None
    follow_up_date: Optional[str] = None
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True

class OfferBase(BaseModel):
    lead_id: int
    event_id: int
    package: ServicePackage
    additional_services: List[str] = []
    custom_notes: Optional[str] = ""
    discount: float = 0.0
    valid_days: int = 14

class OfferCreate(OfferBase):
    pass

class OfferResponse(BaseModel):
    id: int
    lead_id: int
    event_id: int
    package: str
    base_price: float
    additional_services: List[str]
    total_price: float
    valid_until: str
    status: str
    pdf_path: Optional[str] = None
    created_at: str
    sent_at: Optional[str] = None

class SyncRequest(BaseModel):
    sources: Optional[List[str]] = None  # None = wszystkie źródła

class SyncResponse(BaseModel):
    total_found: int
    new_events: int
    updated_events: int
    sources_synced: int
    duration_seconds: float

class StatsResponse(BaseModel):
    events: Dict[str, int]
    leads: Dict[str, int]
    revenue: Dict[str, float]
    sources: List[Dict[str, Any]]

# ============= PAKIETY CENOWE =============

PACKAGES = {
    "basic": {
        "name": "Pakiet BASIC",
        "price": 990,
        "features": ["1 kamera", "Do 2h transmisji", "YouTube/FB"]
    },
    "standard": {
        "name": "Pakiet STANDARD", 
        "price": 2490,
        "features": ["2-3 kamery", "Do 4h", "Realizator", "Replay"]
    },
    "premium": {
        "name": "Pakiet PREMIUM",
        "price": 4990,
        "features": ["4+ kamery", "Cały dzień", "Wóz OB", "Komentator"]
    },
    "enterprise": {
        "name": "Pakiet ENTERPRISE",
        "price": 0,
        "features": ["Wycena indywidualna"]
    }
}

ADDITIONAL_SERVICES = {
    "drone": {"name": "Dron", "price": 800},
    "commentator": {"name": "Komentator", "price": 600},
    "graphics_custom": {"name": "Grafiki dedykowane", "price": 400},
    "highlights": {"name": "Montaż highlights", "price": 500},
    "multistream": {"name": "Multi-platform", "price": 300},
    "vod": {"name": "Archiwum VOD", "price": 200}
}

# ============= BAZA DANYCH =============

def get_db():
    """Generator połączenia z bazą"""
    conn = sqlite3.connect('streamflow.db')
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()

# ============= ENDPOINTS - EVENTS =============

@app.get("/api/events", response_model=List[EventResponse], tags=["Events"])
async def list_events(
    status: Optional[EventStatus] = None,
    category: Optional[EventCategory] = None,
    source: Optional[str] = None,
    city: Optional[str] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    search: Optional[str] = None,
    limit: int = Query(default=50, le=200),
    offset: int = 0,
    db: sqlite3.Connection = Depends(get_db)
):
    """Pobiera listę wydarzeń z filtrami"""
    query = "SELECT * FROM events WHERE 1=1"
    params = []
    
    if status:
        query += " AND status = ?"
        params.append(status.value)
    if category:
        query += " AND category = ?"
        params.append(category.value)
    if source:
        query += " AND source = ?"
        params.append(source)
    if city:
        query += " AND city LIKE ?"
        params.append(f"%{city}%")
    if date_from:
        query += " AND date_start >= ?"
        params.append(date_from)
    if date_to:
        query += " AND date_start <= ?"
        params.append(date_to)
    if search:
        query += " AND (name LIKE ? OR organizer LIKE ? OR location LIKE ?)"
        params.extend([f"%{search}%"] * 3)
    
    query += " ORDER BY date_start ASC LIMIT ? OFFSET ?"
    params.extend([limit, offset])
    
    cursor = db.execute(query, params)
    return [dict(row) for row in cursor.fetchall()]

@app.get("/api/events/{event_id}", response_model=EventResponse, tags=["Events"])
async def get_event(event_id: int, db: sqlite3.Connection = Depends(get_db)):
    """Pobiera szczegóły wydarzenia"""
    cursor = db.execute("SELECT * FROM events WHERE id = ?", (event_id,))
    event = cursor.fetchone()
    if not event:
        raise HTTPException(status_code=404, detail="Wydarzenie nie znalezione")
    return dict(event)

@app.post("/api/events", response_model=EventResponse, tags=["Events"])
async def create_event(event: EventCreate, db: sqlite3.Connection = Depends(get_db)):
    """Tworzy nowe wydarzenie ręcznie"""
    now = datetime.now().isoformat()
    
    cursor = db.execute('''
        INSERT INTO events (
            name, description, organizer, organizer_contact, organizer_email,
            organizer_phone, date_start, date_end, location, city, country,
            category, subcategory, source, source_url, potential_score,
            estimated_audience, status, discovered_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?)
    ''', (
        event.name, event.description, event.organizer, event.organizer_contact,
        event.organizer_email, event.organizer_phone, event.date_start, event.date_end,
        event.location, event.city, event.country, event.category.value,
        event.subcategory, event.source, event.source_url, event.potential_score,
        event.estimated_audience, now, now
    ))
    db.commit()
    
    return await get_event(cursor.lastrowid, db)

@app.patch("/api/events/{event_id}", response_model=EventResponse, tags=["Events"])
async def update_event(event_id: int, update: EventUpdate, db: sqlite3.Connection = Depends(get_db)):
    """Aktualizuje wydarzenie"""
    # Sprawdź czy istnieje
    await get_event(event_id, db)
    
    updates = []
    params = []
    
    for field, value in update.dict(exclude_unset=True).items():
        if value is not None:
            updates.append(f"{field} = ?")
            params.append(value.value if isinstance(value, Enum) else value)
    
    if updates:
        updates.append("updated_at = ?")
        params.append(datetime.now().isoformat())
        params.append(event_id)
        
        db.execute(f"UPDATE events SET {', '.join(updates)} WHERE id = ?", params)
        db.commit()
    
    return await get_event(event_id, db)

@app.delete("/api/events/{event_id}", tags=["Events"])
async def delete_event(event_id: int, db: sqlite3.Connection = Depends(get_db)):
    """Usuwa wydarzenie"""
    await get_event(event_id, db)
    db.execute("DELETE FROM events WHERE id = ?", (event_id,))
    db.commit()
    return {"message": "Wydarzenie usunięte"}

# ============= ENDPOINTS - LEADS =============

@app.get("/api/leads", response_model=List[LeadResponse], tags=["Leads"])
async def list_leads(
    status: Optional[LeadStatus] = None,
    limit: int = Query(default=50, le=200),
    offset: int = 0,
    db: sqlite3.Connection = Depends(get_db)
):
    """Pobiera listę leadów"""
    query = "SELECT * FROM leads WHERE 1=1"
    params = []
    
    if status:
        query += " AND status = ?"
        params.append(status.value)
    
    query += " ORDER BY created_at DESC LIMIT ? OFFSET ?"
    params.extend([limit, offset])
    
    cursor = db.execute(query, params)
    return [dict(row) for row in cursor.fetchall()]

@app.post("/api/leads", response_model=LeadResponse, tags=["Leads"])
async def create_lead(lead: LeadCreate, db: sqlite3.Connection = Depends(get_db)):
    """Tworzy nowy lead"""
    now = datetime.now().isoformat()
    
    cursor = db.execute('''
        INSERT INTO leads (
            event_id, company, contact_person, email, phone,
            status, value, package, notes, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 'new', ?, ?, ?, ?, ?)
    ''', (
        lead.event_id, lead.company, lead.contact_person, lead.email,
        lead.phone, lead.value, lead.package.value if lead.package else None,
        lead.notes, now, now
    ))
    db.commit()
    
    # Aktualizuj status wydarzenia
    db.execute("UPDATE events SET status = 'contacted' WHERE id = ? AND status = 'new'",
               (lead.event_id,))
    db.commit()
    
    cursor = db.execute("SELECT * FROM leads WHERE id = ?", (cursor.lastrowid,))
    return dict(cursor.fetchone())

@app.patch("/api/leads/{lead_id}", response_model=LeadResponse, tags=["Leads"])
async def update_lead(lead_id: int, update: LeadUpdate, db: sqlite3.Connection = Depends(get_db)):
    """Aktualizuje lead"""
    cursor = db.execute("SELECT * FROM leads WHERE id = ?", (lead_id,))
    if not cursor.fetchone():
        raise HTTPException(status_code=404, detail="Lead nie znaleziony")
    
    updates = []
    params = []
    
    for field, value in update.dict(exclude_unset=True).items():
        if value is not None:
            updates.append(f"{field} = ?")
            params.append(value.value if isinstance(value, Enum) else value)
    
    if updates:
        updates.append("updated_at = ?")
        params.append(datetime.now().isoformat())
        params.append(lead_id)
        
        db.execute(f"UPDATE leads SET {', '.join(updates)} WHERE id = ?", params)
        db.commit()
    
    cursor = db.execute("SELECT * FROM leads WHERE id = ?", (lead_id,))
    return dict(cursor.fetchone())

# ============= ENDPOINTS - OFFERS =============

@app.post("/api/offers", tags=["Offers"])
async def create_offer(offer: OfferCreate, db: sqlite3.Connection = Depends(get_db)):
    """Generuje nową ofertę"""
    package = PACKAGES.get(offer.package.value)
    if not package:
        raise HTTPException(status_code=400, detail="Nieznany pakiet")
    
    base_price = package["price"]
    additional_total = sum(
        ADDITIONAL_SERVICES.get(s, {}).get("price", 0) 
        for s in offer.additional_services
    )
    subtotal = base_price + additional_total
    discount_amount = subtotal * (offer.discount / 100)
    total_price = subtotal - discount_amount
    
    now = datetime.now()
    valid_until = (now + timedelta(days=offer.valid_days)).isoformat()
    
    cursor = db.execute('''
        INSERT INTO offers (
            lead_id, event_id, package, base_price, additional_services,
            total_price, valid_until, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'draft', ?)
    ''', (
        offer.lead_id, offer.event_id, offer.package.value, base_price,
        json.dumps(offer.additional_services), total_price, valid_until, now.isoformat()
    ))
    db.commit()
    
    return {
        "id": cursor.lastrowid,
        "package": package["name"],
        "base_price": base_price,
        "additional_services": offer.additional_services,
        "discount": offer.discount,
        "total_price": total_price,
        "valid_until": valid_until
    }

@app.post("/api/offers/{offer_id}/send", tags=["Offers"])
async def send_offer(offer_id: int, db: sqlite3.Connection = Depends(get_db)):
    """Wysyła ofertę do klienta"""
    now = datetime.now().isoformat()
    
    db.execute('''
        UPDATE offers SET status = 'sent', sent_at = ? WHERE id = ?
    ''', (now, offer_id))
    
    # Aktualizuj status leada
    cursor = db.execute("SELECT lead_id FROM offers WHERE id = ?", (offer_id,))
    offer = cursor.fetchone()
    if offer:
        db.execute('''
            UPDATE leads SET status = 'offer_sent', offer_sent_date = ? WHERE id = ?
        ''', (now, offer['lead_id']))
    
    db.commit()
    return {"message": "Oferta wysłana", "sent_at": now}

# ============= ENDPOINTS - SYNC =============

@app.post("/api/sync", response_model=SyncResponse, tags=["Sync"])
async def sync_sources(request: SyncRequest, background_tasks: BackgroundTasks):
    """Uruchamia synchronizację źródeł"""
    # W produkcji: uruchom task w tle
    # background_tasks.add_task(run_sync, request.sources)
    
    # Na potrzeby demo: zwróć przykładowe dane
    return SyncResponse(
        total_found=45,
        new_events=12,
        updated_events=8,
        sources_synced=6,
        duration_seconds=15.3
    )

# ============= ENDPOINTS - STATS =============

@app.get("/api/stats", response_model=StatsResponse, tags=["Stats"])
async def get_stats(db: sqlite3.Connection = Depends(get_db)):
    """Pobiera statystyki dashboardu"""
    # Events stats
    cursor = db.execute('''
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new,
            SUM(CASE WHEN status = 'contacted' THEN 1 ELSE 0 END) as contacted,
            SUM(CASE WHEN status = 'qualified' THEN 1 ELSE 0 END) as qualified,
            SUM(CASE WHEN status = 'offer_sent' THEN 1 ELSE 0 END) as offer_sent,
            SUM(CASE WHEN status = 'won' THEN 1 ELSE 0 END) as won
        FROM events
    ''')
    events_stats = dict(cursor.fetchone())
    
    # Leads stats
    cursor = db.execute('''
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new,
            SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active,
            SUM(CASE WHEN status = 'offer_sent' THEN 1 ELSE 0 END) as offer_sent,
            SUM(CASE WHEN status = 'won' THEN 1 ELSE 0 END) as won
        FROM leads
    ''')
    leads_stats = dict(cursor.fetchone())
    
    # Revenue
    cursor = db.execute('''
        SELECT 
            SUM(CASE WHEN status = 'won' THEN value ELSE 0 END) as won_value,
            SUM(CASE WHEN status IN ('offer_sent', 'negotiation') THEN value ELSE 0 END) as pipeline_value
        FROM leads
    ''')
    revenue_stats = dict(cursor.fetchone())
    
    # Sources
    cursor = db.execute('''
        SELECT source, COUNT(*) as count FROM events GROUP BY source ORDER BY count DESC
    ''')
    sources = [{"name": row['source'], "count": row['count']} for row in cursor.fetchall()]
    
    return StatsResponse(
        events=events_stats,
        leads=leads_stats,
        revenue={
            "won": revenue_stats['won_value'] or 0,
            "pipeline": revenue_stats['pipeline_value'] or 0
        },
        sources=sources
    )

# ============= ENDPOINTS - PACKAGES =============

@app.get("/api/packages", tags=["Config"])
async def get_packages():
    """Pobiera dostępne pakiety usług"""
    return PACKAGES

@app.get("/api/additional-services", tags=["Config"])
async def get_additional_services():
    """Pobiera dostępne usługi dodatkowe"""
    return ADDITIONAL_SERVICES

# ============= HEALTHCHECK =============

@app.get("/health", tags=["System"])
async def health_check():
    """Status serwera"""
    return {"status": "ok", "timestamp": datetime.now().isoformat()}

# ============= URUCHOMIENIE =============

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
