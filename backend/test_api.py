#!/usr/bin/env python3
"""
StreamFlow MVP - Testy API
Testy endpointów REST API z użyciem TestClient

Uruchomienie:
    pytest test_api.py -v
"""

import pytest
import tempfile
import os
import sqlite3
from datetime import datetime, timedelta

from fastapi.testclient import TestClient


# ============= FIXTURES =============

@pytest.fixture
def temp_db_path():
    """Tworzy ścieżkę do tymczasowej bazy danych"""
    fd, path = tempfile.mkstemp(suffix='.db')
    os.close(fd)
    yield path
    if os.path.exists(path):
        os.unlink(path)


@pytest.fixture
def init_test_db(temp_db_path):
    """Inicjalizuje testową bazę danych"""
    conn = sqlite3.connect(temp_db_path)
    conn.executescript('''
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
        CREATE TABLE IF NOT EXISTS offers (
            id INTEGER PRIMARY KEY AUTOINCREMENT, lead_id INTEGER, event_id INTEGER,
            package TEXT, base_price REAL, additional_services TEXT, total_price REAL,
            valid_until TEXT, status TEXT DEFAULT 'draft', pdf_path TEXT,
            created_at TEXT, sent_at TEXT
        );
    ''')
    
    # Dodaj przykładowe dane
    now = datetime.now().isoformat()
    conn.execute('''
        INSERT INTO events (hash, name, description, organizer, organizer_email, 
            date_start, location, city, category, source, potential_score, 
            estimated_audience, status, discovered_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', ('hash1', 'Test Event 1', 'Description', 'Test Org', 'test@example.com',
          '2026-06-15', 'Warsaw Arena', 'Warszawa', 'OCR', 'TestSource', 5, 5000,
          'new', now, now))
    
    conn.execute('''
        INSERT INTO events (hash, name, organizer, date_start, location, city, 
            category, source, potential_score, status, discovered_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', ('hash2', 'Test Event 2', 'Another Org', '2026-07-20', 'Krakow Stadium',
          'Kraków', 'Fitness', 'AnotherSource', 4, 'contacted', now, now))
    
    conn.execute('''
        INSERT INTO leads (event_id, company, contact_person, email, phone, 
            status, value, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (1, 'Test Company', 'Jan Kowalski', 'jan@testcompany.pl', '+48500000000',
          'new', 2490.0, now, now))
    
    conn.commit()
    conn.close()
    
    return temp_db_path


@pytest.fixture
def client(init_test_db, monkeypatch):
    """Tworzy TestClient z mockowaną bazą danych"""
    # Patch database path w api.py
    monkeypatch.setenv('DATABASE_PATH', init_test_db)
    
    # Import api po ustawieniu zmiennej środowiskowej
    import importlib
    import api
    importlib.reload(api)
    
    # Monkey-patch get_db
    def get_test_db():
        conn = sqlite3.connect(init_test_db)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
        finally:
            conn.close()
    
    api.get_db = get_test_db
    
    return TestClient(api.app)


# ============= TESTY HEALTH CHECK =============

class TestHealthCheck:
    """Testy endpointu health check"""
    
    def test_health_check(self, client):
        """Test podstawowego health checka"""
        response = client.get("/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert "timestamp" in data


# ============= TESTY EVENTS API =============

class TestEventsAPI:
    """Testy endpointów /api/events"""
    
    def test_list_events(self, client):
        """Test pobierania listy wydarzeń"""
        response = client.get("/api/events")
        
        assert response.status_code == 200
        events = response.json()
        assert isinstance(events, list)
        assert len(events) >= 2
    
    def test_list_events_with_limit(self, client):
        """Test limitu wyników"""
        response = client.get("/api/events?limit=1")
        
        assert response.status_code == 200
        events = response.json()
        assert len(events) == 1
    
    def test_list_events_with_status_filter(self, client):
        """Test filtrowania po statusie"""
        response = client.get("/api/events?status=new")
        
        assert response.status_code == 200
        events = response.json()
        assert all(e['status'] == 'new' for e in events)
    
    def test_list_events_with_category_filter(self, client):
        """Test filtrowania po kategorii"""
        response = client.get("/api/events?category=OCR")
        
        assert response.status_code == 200
        events = response.json()
        assert all(e['category'] == 'OCR' for e in events)
    
    def test_list_events_with_search(self, client):
        """Test wyszukiwania"""
        response = client.get("/api/events?search=Warsaw")
        
        assert response.status_code == 200
        events = response.json()
        # Powinno znaleźć event z Warsaw Arena
        assert len(events) >= 1
    
    def test_get_event_by_id(self, client):
        """Test pobierania pojedynczego wydarzenia"""
        response = client.get("/api/events/1")
        
        assert response.status_code == 200
        event = response.json()
        assert event['id'] == 1
        assert event['name'] == 'Test Event 1'
    
    def test_get_event_not_found(self, client):
        """Test gdy wydarzenie nie istnieje"""
        response = client.get("/api/events/9999")
        
        assert response.status_code == 404
        assert "nie znalezione" in response.json()['detail'].lower()
    
    def test_create_event(self, client):
        """Test tworzenia nowego wydarzenia"""
        new_event = {
            "name": "New Test Event",
            "organizer": "New Organizer",
            "date_start": "2026-08-10",
            "location": "Gdańsk",
            "category": "Bieganie",
            "source": "API",
            "country": "PL"
        }
        
        response = client.post("/api/events", json=new_event)
        
        assert response.status_code == 200
        created = response.json()
        assert created['name'] == "New Test Event"
        assert created['status'] == 'new'
    
    def test_update_event(self, client):
        """Test aktualizacji wydarzenia"""
        update_data = {
            "status": "contacted",
            "notes": "Skontaktowano telefonicznie"
        }
        
        response = client.patch("/api/events/1", json=update_data)
        
        assert response.status_code == 200
        updated = response.json()
        assert updated['status'] == 'contacted'
        assert updated['notes'] == "Skontaktowano telefonicznie"
    
    def test_delete_event(self, client):
        """Test usuwania wydarzenia"""
        # Najpierw utwórz nowe wydarzenie
        new_event = {
            "name": "To Delete",
            "organizer": "Temp Org",
            "date_start": "2026-09-01",
            "location": "Temp",
            "category": "Inne",
            "source": "API",
            "country": "PL"
        }
        create_response = client.post("/api/events", json=new_event)
        event_id = create_response.json()['id']
        
        # Usuń wydarzenie
        response = client.delete(f"/api/events/{event_id}")
        
        assert response.status_code == 200
        assert "usunięte" in response.json()['message'].lower()
        
        # Sprawdź że nie istnieje
        get_response = client.get(f"/api/events/{event_id}")
        assert get_response.status_code == 404


# ============= TESTY LEADS API =============

class TestLeadsAPI:
    """Testy endpointów /api/leads"""
    
    def test_list_leads(self, client):
        """Test pobierania listy leadów"""
        response = client.get("/api/leads")
        
        assert response.status_code == 200
        leads = response.json()
        assert isinstance(leads, list)
        assert len(leads) >= 1
    
    def test_list_leads_with_status_filter(self, client):
        """Test filtrowania leadów po statusie"""
        response = client.get("/api/leads?status=new")
        
        assert response.status_code == 200
        leads = response.json()
        assert all(l['status'] == 'new' for l in leads)
    
    def test_create_lead(self, client):
        """Test tworzenia nowego leada"""
        new_lead = {
            "event_id": 1,
            "company": "New Company",
            "contact_person": "Anna Nowak",
            "email": "anna@newcompany.pl",
            "phone": "+48600000000",
            "value": 4990.0,
            "package": "premium"
        }
        
        response = client.post("/api/leads", json=new_lead)
        
        assert response.status_code == 200
        created = response.json()
        assert created['company'] == "New Company"
        assert created['status'] == 'new'
    
    def test_update_lead(self, client):
        """Test aktualizacji leada"""
        update_data = {
            "status": "offer_sent",
            "value": 3500.0
        }
        
        response = client.patch("/api/leads/1", json=update_data)
        
        assert response.status_code == 200
        updated = response.json()
        assert updated['status'] == 'offer_sent'
        assert updated['value'] == 3500.0
    
    def test_update_lead_not_found(self, client):
        """Test aktualizacji nieistniejącego leada"""
        response = client.patch("/api/leads/9999", json={"status": "won"})
        
        assert response.status_code == 404


# ============= TESTY OFFERS API =============

class TestOffersAPI:
    """Testy endpointów /api/offers"""
    
    def test_create_offer(self, client):
        """Test tworzenia oferty"""
        offer_data = {
            "lead_id": 1,
            "event_id": 1,
            "package": "standard",
            "additional_services": ["drone", "highlights"],
            "discount": 10,
            "valid_days": 14
        }
        
        response = client.post("/api/offers", json=offer_data)
        
        assert response.status_code == 200
        offer = response.json()
        assert offer['package'] == "Pakiet STANDARD"
        assert offer['base_price'] == 2490
        assert 'total_price' in offer
        assert 'valid_until' in offer
    
    def test_create_offer_with_invalid_package(self, client):
        """Test tworzenia oferty z nieprawidłowym pakietem"""
        offer_data = {
            "lead_id": 1,
            "event_id": 1,
            "package": "nonexistent",
            "additional_services": []
        }
        
        response = client.post("/api/offers", json=offer_data)
        
        # Powinno zwrócić błąd walidacji
        assert response.status_code == 422


# ============= TESTY STATS API =============

class TestStatsAPI:
    """Testy endpointu /api/stats"""
    
    def test_get_stats(self, client):
        """Test pobierania statystyk"""
        response = client.get("/api/stats")
        
        assert response.status_code == 200
        stats = response.json()
        
        assert 'events' in stats
        assert 'leads' in stats
        assert 'revenue' in stats
        assert 'sources' in stats
        
        assert stats['events']['total'] >= 2
        assert stats['leads']['total'] >= 1


# ============= TESTY PACKAGES API =============

class TestPackagesAPI:
    """Testy endpointów konfiguracyjnych"""
    
    def test_get_packages(self, client):
        """Test pobierania pakietów usług"""
        response = client.get("/api/packages")
        
        assert response.status_code == 200
        packages = response.json()
        
        assert 'basic' in packages
        assert 'standard' in packages
        assert 'premium' in packages
        assert 'enterprise' in packages
        
        assert packages['basic']['price'] == 990
        assert packages['standard']['price'] == 2490
        assert packages['premium']['price'] == 4990
    
    def test_get_additional_services(self, client):
        """Test pobierania usług dodatkowych"""
        response = client.get("/api/additional-services")
        
        assert response.status_code == 200
        services = response.json()
        
        assert 'drone' in services
        assert 'commentator' in services
        assert 'highlights' in services
        
        assert services['drone']['price'] == 800
        assert services['commentator']['price'] == 600


# ============= TESTY SYNC API =============

class TestSyncAPI:
    """Testy endpointu /api/sync"""
    
    def test_sync_sources(self, client):
        """Test synchronizacji źródeł"""
        response = client.post("/api/sync", json={})
        
        assert response.status_code == 200
        result = response.json()
        
        assert 'total_found' in result
        assert 'sources_synced' in result
        assert 'duration_seconds' in result


# ============= TESTY WALIDACJI =============

class TestValidation:
    """Testy walidacji danych wejściowych"""
    
    def test_create_event_missing_required_fields(self, client):
        """Test tworzenia wydarzenia bez wymaganych pól"""
        incomplete_event = {
            "name": "Incomplete Event"
            # Brak: organizer, date_start, location, category, source
        }
        
        response = client.post("/api/events", json=incomplete_event)
        
        # FastAPI powinno zwrócić 422 Unprocessable Entity
        assert response.status_code == 422
    
    def test_create_lead_invalid_email(self, client):
        """Test tworzenia leada z nieprawidłowym emailem"""
        invalid_lead = {
            "event_id": 1,
            "company": "Test",
            "contact_person": "Test",
            "email": "not-an-email",  # Nieprawidłowy email
            "value": 1000
        }
        
        response = client.post("/api/leads", json=invalid_lead)
        
        # Pydantic powinien odrzucić nieprawidłowy email
        assert response.status_code == 422
    
    def test_list_events_invalid_limit(self, client):
        """Test z nieprawidłowym limitem"""
        response = client.get("/api/events?limit=500")  # Max to 200
        
        # Powinno zwrócić błąd walidacji
        assert response.status_code == 422


# ============= TESTY EDGE CASES =============

class TestEdgeCases:
    """Testy przypadków brzegowych"""
    
    def test_empty_search_results(self, client):
        """Test pustych wyników wyszukiwania"""
        response = client.get("/api/events?search=NonExistentEvent123456")
        
        assert response.status_code == 200
        events = response.json()
        assert events == []
    
    def test_pagination_offset(self, client):
        """Test paginacji z offsetem"""
        response1 = client.get("/api/events?limit=1&offset=0")
        response2 = client.get("/api/events?limit=1&offset=1")
        
        assert response1.status_code == 200
        assert response2.status_code == 200
        
        event1 = response1.json()[0]
        event2 = response2.json()[0]
        
        assert event1['id'] != event2['id']
    
    def test_special_characters_in_search(self, client):
        """Test znaków specjalnych w wyszukiwaniu"""
        response = client.get("/api/events?search=test%20%26%20event")
        
        assert response.status_code == 200


# ============= URUCHOMIENIE TESTÓW =============

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
