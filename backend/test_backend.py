#!/usr/bin/env python3
"""
StreamFlow MVP - Testy jednostkowe
Kompleksowe testy dla API, agregatora i bazy danych

Uruchomienie:
    pytest test_backend.py -v
    pytest test_backend.py -v --cov=. --cov-report=html
"""

import pytest
import asyncio
import tempfile
import os
import json
from datetime import datetime, timedelta
from unittest.mock import AsyncMock, MagicMock, patch

# Import modułów do testowania
from aggregator import (
    Event, Database, BaseScraper, RunmageddonScraper, 
    HyroxScraper, GoOutScraper, MTPScraper, EventAggregator
)


# ============= FIXTURES =============

@pytest.fixture
def temp_db():
    """Tworzy tymczasową bazę danych dla testów"""
    fd, path = tempfile.mkstemp(suffix='.db')
    os.close(fd)
    db = Database(path)
    yield db
    db.conn.close()
    os.unlink(path)


@pytest.fixture
def sample_event():
    """Przykładowe wydarzenie do testów"""
    return Event(
        name="Test Event 2026",
        organizer="Test Organizer Sp. z o.o.",
        organizer_email="test@example.com",
        organizer_phone="+48 500 000 000",
        date_start="2026-06-15",
        date_end="2026-06-16",
        location="Test Arena",
        city="Warszawa",
        country="PL",
        category="OCR",
        subcategory="Runmageddon",
        source="TestSource",
        source_url="https://example.com/event",
        potential_score=4,
        estimated_audience=3000
    )


@pytest.fixture
def aggregator(temp_db):
    """Agregator z tymczasową bazą danych"""
    agg = EventAggregator(temp_db)
    agg.register_default_scrapers()
    return agg


# ============= TESTY MODELU EVENT =============

class TestEventModel:
    """Testy modelu Event"""
    
    def test_event_creation(self):
        """Test tworzenia obiektu Event"""
        event = Event(name="Test", organizer="Org")
        assert event.name == "Test"
        assert event.organizer == "Org"
        assert event.status == "new"
        assert event.country == "PL"
    
    def test_event_default_values(self):
        """Test wartości domyślnych"""
        event = Event()
        assert event.id is None
        assert event.name == ""
        assert event.potential_score == 3
        assert event.estimated_audience == 0
        assert event.status == "new"
    
    def test_event_to_dict(self, sample_event):
        """Test konwersji do słownika"""
        data = sample_event.to_dict()
        assert isinstance(data, dict)
        assert data['name'] == "Test Event 2026"
        assert data['organizer'] == "Test Organizer Sp. z o.o."
        assert data['city'] == "Warszawa"
    
    def test_event_hash_calculation(self, sample_event):
        """Test generowania hash'a"""
        hash1 = sample_event.calculate_hash()
        assert isinstance(hash1, str)
        assert len(hash1) == 32  # MD5 hash length
        
        # Ten sam event powinien mieć ten sam hash
        hash2 = sample_event.calculate_hash()
        assert hash1 == hash2
    
    def test_event_hash_uniqueness(self):
        """Test unikalności hash'a dla różnych wydarzeń"""
        event1 = Event(name="Event 1", date_start="2026-01-01", location="A", organizer="X")
        event2 = Event(name="Event 2", date_start="2026-01-01", location="A", organizer="X")
        
        assert event1.calculate_hash() != event2.calculate_hash()
    
    def test_event_hash_same_content(self):
        """Test że identyczne dane dają ten sam hash"""
        event1 = Event(name="Event", date_start="2026-01-01", location="Warsaw", organizer="Org")
        event2 = Event(name="Event", date_start="2026-01-01", location="Warsaw", organizer="Org")
        
        assert event1.calculate_hash() == event2.calculate_hash()


# ============= TESTY BAZY DANYCH =============

class TestDatabase:
    """Testy warstwy bazy danych"""
    
    def test_database_initialization(self, temp_db):
        """Test inicjalizacji bazy danych"""
        assert temp_db.conn is not None
        
        # Sprawdź czy tabele istnieją
        cursor = temp_db.conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table'"
        )
        tables = [row[0] for row in cursor.fetchall()]
        
        assert 'events' in tables
        assert 'leads' in tables
    
    def test_save_new_event(self, temp_db, sample_event):
        """Test zapisywania nowego wydarzenia"""
        event_id = temp_db.save_event(sample_event)
        
        assert event_id is not None
        assert event_id > 0
    
    def test_save_duplicate_event(self, temp_db, sample_event):
        """Test że duplikaty nie są tworzone"""
        id1 = temp_db.save_event(sample_event)
        id2 = temp_db.save_event(sample_event)
        
        # Powinien zwrócić to samo ID (event już istnieje)
        assert id1 == id2
    
    def test_get_events_empty(self, temp_db):
        """Test pobierania z pustej bazy"""
        events = temp_db.get_events()
        assert events == []
    
    def test_get_events_with_data(self, temp_db, sample_event):
        """Test pobierania wydarzeń"""
        temp_db.save_event(sample_event)
        
        events = temp_db.get_events()
        assert len(events) == 1
        assert events[0]['name'] == sample_event.name
    
    def test_get_events_with_status_filter(self, temp_db, sample_event):
        """Test filtrowania po statusie"""
        temp_db.save_event(sample_event)
        
        # Nowe wydarzenia mają status 'new'
        new_events = temp_db.get_events(status='new')
        assert len(new_events) == 1
        
        # Brak wydarzeń ze statusem 'won'
        won_events = temp_db.get_events(status='won')
        assert len(won_events) == 0
    
    def test_get_events_with_limit(self, temp_db):
        """Test limitu wyników"""
        # Dodaj 5 wydarzeń
        for i in range(5):
            event = Event(
                name=f"Event {i}",
                date_start=f"2026-0{i+1}-01",
                location="Warsaw",
                organizer=f"Org {i}"
            )
            temp_db.save_event(event)
        
        # Pobierz tylko 3
        events = temp_db.get_events(limit=3)
        assert len(events) == 3
    
    def test_get_stats_empty(self, temp_db):
        """Test statystyk z pustej bazy"""
        stats = temp_db.get_stats()
        
        assert stats['total'] == 0
        assert stats.get('new') is None or stats['new'] == 0
    
    def test_get_stats_with_data(self, temp_db, sample_event):
        """Test statystyk z danymi"""
        temp_db.save_event(sample_event)
        
        stats = temp_db.get_stats()
        assert stats['total'] == 1
        assert stats['new'] == 1
    
    def test_events_ordered_by_date(self, temp_db):
        """Test sortowania po dacie"""
        event1 = Event(name="Later", date_start="2026-12-01", location="A", organizer="X")
        event2 = Event(name="Earlier", date_start="2026-01-01", location="B", organizer="Y")
        
        temp_db.save_event(event1)
        temp_db.save_event(event2)
        
        events = temp_db.get_events()
        assert events[0]['name'] == "Earlier"
        assert events[1]['name'] == "Later"


# ============= TESTY SCRAPERÓW =============

class TestScrapers:
    """Testy scraperów"""
    
    @pytest.mark.asyncio
    async def test_runmageddon_scraper(self):
        """Test scrapera Runmageddon"""
        scraper = RunmageddonScraper()
        
        async with scraper:
            events = await scraper.scrape()
        
        assert len(events) >= 1
        assert all(e.source == "Runmageddon.pl" for e in events)
        assert all(e.category == "OCR" for e in events)
        assert all(e.organizer_email for e in events)
    
    @pytest.mark.asyncio
    async def test_hyrox_scraper(self):
        """Test scrapera HYROX"""
        scraper = HyroxScraper()
        
        async with scraper:
            events = await scraper.scrape()
        
        assert len(events) >= 1
        assert all(e.source == "HYROX.com" for e in events)
        assert all(e.category == "Fitness" for e in events)
        assert all(e.potential_score == 5 for e in events)
    
    @pytest.mark.asyncio
    async def test_goout_scraper(self):
        """Test scrapera GoOut"""
        scraper = GoOutScraper()
        
        async with scraper:
            events = await scraper.scrape()
        
        assert len(events) >= 1
        assert all(e.source == "GoOut.net" for e in events)
        assert all(e.category == "Festiwal" for e in events)
    
    @pytest.mark.asyncio
    async def test_mtp_scraper(self):
        """Test scrapera MTP"""
        scraper = MTPScraper()
        
        async with scraper:
            events = await scraper.scrape()
        
        assert len(events) >= 1
        assert all(e.source == "MTP.pl" for e in events)
        assert all(e.category == "Targi" for e in events)
    
    @pytest.mark.asyncio
    async def test_scraper_session_management(self):
        """Test zarządzania sesją aiohttp"""
        scraper = RunmageddonScraper()
        
        assert scraper.session is None
        
        async with scraper:
            assert scraper.session is not None
        
        # Po wyjściu z context managera sesja powinna być zamknięta
        assert scraper.session.closed


# ============= TESTY AGREGATORA =============

class TestEventAggregator:
    """Testy głównego agregatora"""
    
    def test_register_scraper(self, temp_db):
        """Test rejestrowania scraperów"""
        agg = EventAggregator(temp_db)
        
        assert len(agg.scrapers) == 0
        
        agg.register_scraper(RunmageddonScraper())
        assert len(agg.scrapers) == 1
        
        agg.register_scraper(HyroxScraper())
        assert len(agg.scrapers) == 2
    
    def test_register_default_scrapers(self, temp_db):
        """Test rejestrowania domyślnych scraperów"""
        agg = EventAggregator(temp_db)
        agg.register_default_scrapers()
        
        assert len(agg.scrapers) == 4
        
        scraper_names = [s.name for s in agg.scrapers]
        assert "Runmageddon.pl" in scraper_names
        assert "HYROX.com" in scraper_names
        assert "GoOut.net" in scraper_names
        assert "MTP.pl" in scraper_names
    
    @pytest.mark.asyncio
    async def test_sync_all(self, aggregator):
        """Test synchronizacji wszystkich źródeł"""
        results = await aggregator.sync_all()
        
        assert 'total_found' in results
        assert 'sources_synced' in results
        assert results['sources_synced'] == 4
        assert results['total_found'] >= 8  # Min 2 eventy z każdego źródła
    
    @pytest.mark.asyncio
    async def test_sync_saves_to_database(self, aggregator):
        """Test że synchronizacja zapisuje do bazy"""
        stats_before = aggregator.db.get_stats()
        assert stats_before['total'] == 0
        
        await aggregator.sync_all()
        
        stats_after = aggregator.db.get_stats()
        assert stats_after['total'] > 0
    
    @pytest.mark.asyncio
    async def test_sync_no_duplicates(self, aggregator):
        """Test że wielokrotna sync nie tworzy duplikatów"""
        await aggregator.sync_all()
        count1 = aggregator.db.get_stats()['total']
        
        await aggregator.sync_all()
        count2 = aggregator.db.get_stats()['total']
        
        assert count1 == count2


# ============= TESTY INTEGRACYJNE =============

class TestIntegration:
    """Testy integracyjne end-to-end"""
    
    @pytest.mark.asyncio
    async def test_full_workflow(self, temp_db):
        """Test pełnego workflow: init -> sync -> query"""
        # 1. Inicjalizacja
        agg = EventAggregator(temp_db)
        agg.register_default_scrapers()
        
        # 2. Synchronizacja
        results = await agg.sync_all()
        assert results['total_found'] > 0
        
        # 3. Pobieranie wydarzeń
        events = temp_db.get_events()
        assert len(events) > 0
        
        # 4. Sprawdzenie struktury danych
        event = events[0]
        assert 'name' in event
        assert 'date_start' in event
        assert 'source' in event
        assert 'potential_score' in event
        
        # 5. Statystyki
        stats = temp_db.get_stats()
        assert stats['total'] == len(events)
    
    @pytest.mark.asyncio
    async def test_event_data_quality(self, temp_db):
        """Test jakości danych wydarzeń"""
        agg = EventAggregator(temp_db)
        agg.register_default_scrapers()
        await agg.sync_all()
        
        events = temp_db.get_events()
        
        for event in events:
            # Każde wydarzenie powinno mieć podstawowe dane
            assert event['name'], f"Brak nazwy: {event}"
            assert event['source'], f"Brak źródła: {event}"
            
            # Potential score w zakresie 1-5
            assert 1 <= event['potential_score'] <= 5
            
            # Status powinien być 'new' dla nowych
            assert event['status'] == 'new'


# ============= TESTY POMOCNICZE =============

class TestHelperFunctions:
    """Testy funkcji pomocniczych"""
    
    def test_event_hash_consistency(self):
        """Test spójności hashowania"""
        event = Event(
            name="Consistent Event",
            date_start="2026-05-15",
            location="Test Location",
            organizer="Test Org"
        )
        
        hashes = [event.calculate_hash() for _ in range(100)]
        assert len(set(hashes)) == 1  # Wszystkie hashe powinny być identyczne
    
    def test_database_connection_handling(self):
        """Test obsługi połączenia z bazą"""
        fd, path = tempfile.mkstemp(suffix='.db')
        os.close(fd)
        
        try:
            db = Database(path)
            assert db.conn is not None
            
            # Wykonaj operację
            db.save_event(Event(name="Test", organizer="Org", date_start="2026-01-01", location="A"))
            
            # Zamknij połączenie
            db.conn.close()
            
            # Ponowne otwarcie
            db2 = Database(path)
            events = db2.get_events()
            assert len(events) == 1
            
            db2.conn.close()
        finally:
            os.unlink(path)


# ============= TESTY WALIDACJI =============

class TestValidation:
    """Testy walidacji danych"""
    
    def test_event_with_empty_name(self, temp_db):
        """Test wydarzenia z pustą nazwą"""
        event = Event(name="", organizer="Org", date_start="2026-01-01", location="A")
        # Powinno się zapisać (baza nie ma constraint NOT NULL na name w praktyce)
        event_id = temp_db.save_event(event)
        assert event_id is not None
    
    def test_event_with_special_characters(self, temp_db):
        """Test wydarzenia ze znakami specjalnymi"""
        event = Event(
            name="Test <script>alert('xss')</script>",
            organizer="O'Reilly & Partners",
            date_start="2026-01-01",
            location="Kraków"
        )
        event_id = temp_db.save_event(event)
        assert event_id is not None
        
        events = temp_db.get_events()
        assert events[0]['name'] == "Test <script>alert('xss')</script>"
    
    def test_event_with_unicode(self, temp_db):
        """Test wydarzenia z Unicode"""
        event = Event(
            name="Bieg Czekoladowy 🏃‍♂️🍫",
            organizer="Organizator Sp. z o.o.",
            date_start="2026-01-01",
            location="Łódź"
        )
        event_id = temp_db.save_event(event)
        
        events = temp_db.get_events()
        assert "🏃" in events[0]['name']
        assert "Łódź" in events[0]['location']


# ============= TESTY WYDAJNOŚCIOWE =============

class TestPerformance:
    """Testy wydajnościowe"""
    
    def test_bulk_insert_performance(self, temp_db):
        """Test wydajności masowego wstawiania"""
        import time
        
        start = time.time()
        
        for i in range(100):
            event = Event(
                name=f"Performance Test Event {i}",
                date_start=f"2026-{(i % 12) + 1:02d}-01",
                location=f"Location {i}",
                organizer=f"Organizer {i}"
            )
            temp_db.save_event(event)
        
        elapsed = time.time() - start
        
        # 100 insertów powinno zająć mniej niż 5 sekund
        assert elapsed < 5.0, f"Bulk insert took {elapsed:.2f}s"
        
        events = temp_db.get_events(limit=200)
        assert len(events) == 100
    
    def test_query_performance(self, temp_db):
        """Test wydajności zapytań"""
        import time
        
        # Wstaw dane testowe
        for i in range(50):
            temp_db.save_event(Event(
                name=f"Event {i}",
                date_start=f"2026-{(i % 12) + 1:02d}-01",
                location="Warsaw",
                organizer=f"Org {i}"
            ))
        
        start = time.time()
        
        for _ in range(100):
            temp_db.get_events(limit=50)
            temp_db.get_stats()
        
        elapsed = time.time() - start
        
        # 200 zapytań powinno zająć mniej niż 2 sekundy
        assert elapsed < 2.0, f"Queries took {elapsed:.2f}s"


# ============= URUCHOMIENIE TESTÓW =============

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
