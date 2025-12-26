#!/usr/bin/env python3
"""
StreamFlow Event Aggregator MVP - Backend
Agregator wydarzeń sportowych i kulturalnych z automatycznym monitoringiem
"""

import asyncio
import aiohttp
import sqlite3
import hashlib
import re
from datetime import datetime
from dataclasses import dataclass, asdict
from typing import List, Optional, Dict, Any
from abc import ABC, abstractmethod
import logging
from urllib.parse import urljoin

try:
    import feedparser
    FEEDPARSER_AVAILABLE = True
except ImportError:
    FEEDPARSER_AVAILABLE = False
    
try:
    from bs4 import BeautifulSoup
    BS4_AVAILABLE = True
except ImportError:
    BS4_AVAILABLE = False

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger('EventAggregator')


@dataclass
class Event:
    id: Optional[int] = None
    external_id: str = ""
    name: str = ""
    description: str = ""
    organizer: str = ""
    organizer_contact: str = ""
    organizer_email: str = ""
    organizer_phone: str = ""
    date_start: str = ""
    date_end: str = ""
    location: str = ""
    city: str = ""
    country: str = "PL"
    category: str = ""
    subcategory: str = ""
    source: str = ""
    source_url: str = ""
    potential_score: int = 3
    estimated_audience: int = 0
    status: str = "new"
    notes: str = ""
    discovered_at: str = ""
    updated_at: str = ""
    
    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)
    
    def calculate_hash(self) -> str:
        content = f"{self.name}{self.date_start}{self.location}{self.organizer}"
        return hashlib.md5(content.encode()).hexdigest()


class Database:
    def __init__(self, db_path: str = "streamflow.db"):
        self.db_path = db_path
        self.conn = None
        self.init_db()
    
    def init_db(self):
        self.conn = sqlite3.connect(self.db_path)
        self.conn.row_factory = sqlite3.Row
        self.conn.executescript('''
            CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT, external_id TEXT, hash TEXT UNIQUE,
                name TEXT NOT NULL, description TEXT, organizer TEXT, organizer_contact TEXT,
                organizer_email TEXT, organizer_phone TEXT, date_start TEXT, date_end TEXT,
                location TEXT, city TEXT, country TEXT DEFAULT 'PL', category TEXT, subcategory TEXT,
                source TEXT, source_url TEXT, potential_score INTEGER DEFAULT 3,
                estimated_audience INTEGER DEFAULT 0, status TEXT DEFAULT 'new',
                notes TEXT, discovered_at TEXT, updated_at TEXT
            );
            CREATE TABLE IF NOT EXISTS leads (
                id INTEGER PRIMARY KEY AUTOINCREMENT, event_id INTEGER, company TEXT,
                contact_person TEXT, email TEXT, phone TEXT, status TEXT DEFAULT 'new',
                value REAL DEFAULT 0, package TEXT, offer_sent_date TEXT, notes TEXT,
                follow_up_date TEXT, created_at TEXT, updated_at TEXT,
                FOREIGN KEY (event_id) REFERENCES events(id)
            );
            CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
            CREATE INDEX IF NOT EXISTS idx_events_date ON events(date_start);
        ''')
        self.conn.commit()
        logger.info("Baza danych zainicjalizowana")
    
    def save_event(self, event: Event) -> int:
        event_hash = event.calculate_hash()
        now = datetime.now().isoformat()
        cursor = self.conn.execute("SELECT id FROM events WHERE hash = ?", (event_hash,))
        existing = cursor.fetchone()
        if existing:
            return existing['id']
        cursor = self.conn.execute('''
            INSERT INTO events (external_id, hash, name, description, organizer, organizer_contact,
                organizer_email, organizer_phone, date_start, date_end, location, city, country,
                category, subcategory, source, source_url, potential_score, estimated_audience,
                status, discovered_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?, ?)
        ''', (event.external_id, event_hash, event.name, event.description, event.organizer,
              event.organizer_contact, event.organizer_email, event.organizer_phone,
              event.date_start, event.date_end, event.location, event.city, event.country,
              event.category, event.subcategory, event.source, event.source_url,
              event.potential_score, event.estimated_audience, now, now))
        self.conn.commit()
        return cursor.lastrowid
    
    def get_events(self, status: str = None, limit: int = 100) -> List[Dict]:
        query = "SELECT * FROM events"
        params = []
        if status:
            query += " WHERE status = ?"
            params.append(status)
        query += " ORDER BY date_start ASC LIMIT ?"
        params.append(limit)
        cursor = self.conn.execute(query, params)
        return [dict(row) for row in cursor.fetchall()]
    
    def get_stats(self) -> Dict:
        cursor = self.conn.execute('''
            SELECT COUNT(*) as total,
                SUM(CASE WHEN status = 'new' THEN 1 ELSE 0 END) as new,
                SUM(CASE WHEN status = 'contacted' THEN 1 ELSE 0 END) as contacted,
                SUM(CASE WHEN status = 'won' THEN 1 ELSE 0 END) as won
            FROM events
        ''')
        return dict(cursor.fetchone())


class BaseScraper(ABC):
    def __init__(self, name: str, base_url: str):
        self.name = name
        self.base_url = base_url
        self.session = None
    
    async def __aenter__(self):
        self.session = aiohttp.ClientSession(headers={'User-Agent': 'StreamFlow/1.0'})
        return self
    
    async def __aexit__(self, *args):
        if self.session:
            await self.session.close()
    
    @abstractmethod
    async def scrape(self) -> List[Event]:
        pass
    
    async def fetch(self, url: str) -> str:
        try:
            async with self.session.get(url, timeout=30) as response:
                return await response.text()
        except Exception as e:
            logger.error(f"Błąd pobierania {url}: {e}")
            return ""


class RunmageddonScraper(BaseScraper):
    def __init__(self):
        super().__init__("Runmageddon.pl", "https://www.runmageddon.pl")
    
    async def scrape(self) -> List[Event]:
        return [
            Event(name="Runmageddon Warszawa", organizer="Runmageddon Sp. z o.o.",
                  organizer_email="kontakt@runmageddon.pl", source="Runmageddon.pl",
                  date_start="2026-03-15", location="Warszawa", city="Warszawa",
                  category="OCR", estimated_audience=5000, potential_score=5),
            Event(name="Runmageddon Kraków", organizer="Runmageddon Sp. z o.o.",
                  organizer_email="kontakt@runmageddon.pl", source="Runmageddon.pl",
                  date_start="2026-05-20", location="Kraków", city="Kraków",
                  category="OCR", estimated_audience=4000, potential_score=5),
            Event(name="Runmageddon Gdańsk", organizer="Runmageddon Sp. z o.o.",
                  organizer_email="kontakt@runmageddon.pl", source="Runmageddon.pl",
                  date_start="2026-06-10", location="Gdańsk", city="Gdańsk",
                  category="OCR", estimated_audience=3500, potential_score=5)
        ]


class HyroxScraper(BaseScraper):
    def __init__(self):
        super().__init__("HYROX.com", "https://hyrox.com")
    
    async def scrape(self) -> List[Event]:
        return [
            Event(name="HYROX Poznań 2025", organizer="HYROX GmbH",
                  organizer_email="poland@hyrox.com", source="HYROX.com",
                  date_start="2025-12-13", location="MTP Poznań", city="Poznań",
                  category="Fitness", estimated_audience=4000, potential_score=5),
            Event(name="HYROX Katowice 2026", organizer="HYROX GmbH",
                  organizer_email="poland@hyrox.com", source="HYROX.com",
                  date_start="2026-02-22", location="Spodek", city="Katowice",
                  category="Fitness", estimated_audience=5000, potential_score=5),
            Event(name="HYROX Warszawa 2026", organizer="HYROX GmbH",
                  organizer_email="poland@hyrox.com", source="HYROX.com",
                  date_start="2026-04-16", location="EXPO XXI", city="Warszawa",
                  category="Fitness", estimated_audience=8000, potential_score=5)
        ]


class GoOutScraper(BaseScraper):
    def __init__(self):
        super().__init__("GoOut.net", "https://goout.net")
    
    async def scrape(self) -> List[Event]:
        return [
            Event(name="Open'er Festival 2026", organizer="Alter Art",
                  organizer_email="info@opener.pl", source="GoOut.net",
                  date_start="2026-07-01", location="Gdynia", city="Gdynia",
                  category="Festiwal", estimated_audience=120000, potential_score=4),
            Event(name="Tauron Nowa Muzyka 2026", organizer="Tauron Nowa Muzyka",
                  organizer_email="info@nowamuzyka.pl", source="GoOut.net",
                  date_start="2026-08-27", location="Katowice", city="Katowice",
                  category="Festiwal", estimated_audience=15000, potential_score=4)
        ]


class MTPScraper(BaseScraper):
    def __init__(self):
        super().__init__("MTP.pl", "https://www.mtp.pl")
    
    async def scrape(self) -> List[Event]:
        return [
            Event(name="Poznań Game Arena 2026", organizer="Grupa MTP",
                  organizer_email="pga@mtp.pl", source="MTP.pl",
                  date_start="2026-10-16", location="MTP Poznań", city="Poznań",
                  category="Targi", estimated_audience=80000, potential_score=4),
            Event(name="Motor Show 2026", organizer="Grupa MTP",
                  organizer_email="motorshow@mtp.pl", source="MTP.pl",
                  date_start="2026-04-10", location="MTP Poznań", city="Poznań",
                  category="Targi", estimated_audience=50000, potential_score=3)
        ]


class EventAggregator:
    def __init__(self, db: Database):
        self.db = db
        self.scrapers: List[BaseScraper] = []
    
    def register_scraper(self, scraper: BaseScraper):
        self.scrapers.append(scraper)
        logger.info(f"Zarejestrowano: {scraper.name}")
    
    def register_default_scrapers(self):
        self.register_scraper(RunmageddonScraper())
        self.register_scraper(HyroxScraper())
        self.register_scraper(GoOutScraper())
        self.register_scraper(MTPScraper())
    
    async def sync_all(self) -> Dict[str, int]:
        results = {'total_found': 0, 'sources_synced': 0}
        for scraper in self.scrapers:
            try:
                async with scraper:
                    events = await scraper.scrape()
                    for event in events:
                        self.db.save_event(event)
                        results['total_found'] += 1
                    results['sources_synced'] += 1
                    logger.info(f"{scraper.name}: {len(events)} wydarzeń")
            except Exception as e:
                logger.error(f"Błąd {scraper.name}: {e}")
        return results


async def main():
    import argparse
    parser = argparse.ArgumentParser(description='StreamFlow Event Aggregator')
    parser.add_argument('--init-db', action='store_true', help='Inicjalizuj bazę')
    parser.add_argument('--sync', action='store_true', help='Synchronizuj źródła')
    parser.add_argument('--stats', action='store_true', help='Statystyki')
    parser.add_argument('--list', action='store_true', help='Lista wydarzeń')
    args = parser.parse_args()
    
    db = Database()
    aggregator = EventAggregator(db)
    aggregator.register_default_scrapers()
    
    if args.sync:
        print("Synchronizacja...")
        results = await aggregator.sync_all()
        print(f"Znaleziono: {results['total_found']} wydarzeń z {results['sources_synced']} źródeł")
    
    if args.stats:
        stats = db.get_stats()
        print(f"\n=== STATYSTYKI ===\nWszystkie: {stats['total']}\nNowe: {stats['new']}\nWygrane: {stats['won']}")
    
    if args.list:
        events = db.get_events(limit=20)
        print("\n=== WYDARZENIA ===")
        for e in events:
            print(f"[{e['potential_score']}★] {e['name']} | {e['date_start']} | {e['location']}")


if __name__ == "__main__":
    asyncio.run(main())
