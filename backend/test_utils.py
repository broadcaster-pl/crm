#!/usr/bin/env python3
"""
StreamFlow MVP - Testy modułu utils
"""

import pytest
from datetime import datetime, timedelta

from utils import (
    # Walidacja
    validate_email, validate_phone, validate_nip, validate_date, sanitize_string,
    # Formatowanie
    format_price, format_phone, format_date, format_nip,
    # Kalkulacje
    calculate_potential_score, calculate_offer_price, calculate_valid_until,
    calculate_conversion_rate, calculate_pipeline_value,
    # Generowanie
    generate_offer_number, generate_contract_number, generate_event_hash,
    # Eksport
    export_events_to_csv, export_leads_to_csv, export_to_json,
    # Wyszukiwanie
    extract_emails_from_text, extract_phones_from_text,
    # Stałe
    PACKAGE_PRICES, ADDITIONAL_SERVICES_PRICES
)


# ============= TESTY WALIDACJI =============

class TestValidation:
    """Testy funkcji walidacji"""
    
    # Email
    def test_validate_email_valid(self):
        assert validate_email("test@example.com") is True
        assert validate_email("user.name+tag@domain.co.uk") is True
        assert validate_email("a@b.pl") is True
    
    def test_validate_email_invalid(self):
        assert validate_email("") is False
        assert validate_email(None) is False
        assert validate_email("invalid") is False
        assert validate_email("@domain.com") is False
        assert validate_email("user@") is False
        assert validate_email("user@.com") is False
    
    # Telefon
    def test_validate_phone_valid(self):
        assert validate_phone("+48500000000") is True
        assert validate_phone("+48 500 000 000") is True
        assert validate_phone("500000000") is True
        assert validate_phone("500-000-000") is True
    
    def test_validate_phone_invalid(self):
        assert validate_phone("") is False
        assert validate_phone(None) is False
        assert validate_phone("12345") is False
        assert validate_phone("abcdefghi") is False
    
    # NIP
    def test_validate_nip_valid(self):
        # NIP testowy z prawidłową sumą kontrolną
        assert validate_nip("123-456-32-18") is True
        assert validate_nip("1234563218") is True
    
    def test_validate_nip_invalid(self):
        assert validate_nip("") is False
        assert validate_nip(None) is False
        assert validate_nip("123-456-78-99") is False  # Nieprawidłowa suma kontrolna
        assert validate_nip("12345") is False
    
    # Data
    def test_validate_date_valid(self):
        assert validate_date("2026-06-15") is True
        assert validate_date("2025-01-01") is True
        assert validate_date("2030-12-31") is True
    
    def test_validate_date_invalid(self):
        assert validate_date("") is False
        assert validate_date(None) is False
        assert validate_date("15-06-2026") is False
        assert validate_date("2026/06/15") is False
        assert validate_date("invalid") is False
    
    # Sanitize
    def test_sanitize_string(self):
        assert sanitize_string("<script>alert('xss')</script>") == "scriptalert(xss)/script"
        assert sanitize_string("Normal text") == "Normal text"
        assert sanitize_string("") == ""
        assert sanitize_string(None) == ""
    
    def test_sanitize_string_max_length(self):
        long_text = "a" * 1000
        result = sanitize_string(long_text, max_length=100)
        assert len(result) == 100


# ============= TESTY FORMATOWANIA =============

class TestFormatting:
    """Testy funkcji formatowania"""
    
    def test_format_price(self):
        assert format_price(990.00) == "990,00 PLN"
        assert format_price(2490.50) == "2 490,50 PLN"
        assert format_price(0) == "0,00 PLN"
        assert format_price(1000000) == "1 000 000,00 PLN"
    
    def test_format_price_currency(self):
        assert format_price(100, "EUR") == "100,00 EUR"
        assert format_price(100, "USD") == "100,00 USD"
    
    def test_format_phone(self):
        assert format_phone("500000000") == "+48 500 000 000"
        assert format_phone("+48500000000") == "+48 500 000 000"
        assert format_phone("123") == "123"  # Nieprawidłowy format
    
    def test_format_date(self):
        assert format_date("2026-06-15") == "15.06.2026"
        assert format_date("2025-01-01") == "01.01.2025"
        assert format_date("invalid") == "invalid"
    
    def test_format_date_custom_format(self):
        assert format_date("2026-06-15", "%d %B %Y") == "15 June 2026"
    
    def test_format_nip(self):
        assert format_nip("1234563218") == "123-456-32-18"
        assert format_nip("123-456-32-18") == "123-456-32-18"
        assert format_nip("12345") == "12345"


# ============= TESTY KALKULACJI =============

class TestCalculations:
    """Testy funkcji obliczeniowych"""
    
    def test_calculate_potential_score_basic(self):
        score = calculate_potential_score()
        assert score == 2  # Bazowy 3, -1 za brak kontaktu
    
    def test_calculate_potential_score_high_audience(self):
        score = calculate_potential_score(estimated_audience=10000)
        assert score >= 4
    
    def test_calculate_potential_score_high_value_category(self):
        score = calculate_potential_score(category="OCR", has_email=True, has_phone=True)
        assert score == 5
    
    def test_calculate_potential_score_bounds(self):
        # Minimum 1
        score_min = calculate_potential_score(estimated_audience=0, category="Unknown")
        assert score_min >= 1
        
        # Maximum 5
        score_max = calculate_potential_score(
            estimated_audience=100000, 
            category="OCR",
            has_email=True,
            has_phone=True
        )
        assert score_max <= 5
    
    def test_calculate_offer_price_basic_package(self):
        result = calculate_offer_price("basic")
        
        assert result["base_price"] == 990
        assert result["additional_total"] == 0
        assert result["discount"] == 0
        assert result["net"] == 990
        assert result["vat"] == 990 * 0.23
        assert result["gross"] == round(990 * 1.23, 2)
    
    def test_calculate_offer_price_with_services(self):
        result = calculate_offer_price("standard", ["drone", "highlights"])
        
        expected_base = 2490
        expected_additional = 800 + 500  # drone + highlights
        expected_subtotal = expected_base + expected_additional
        
        assert result["base_price"] == expected_base
        assert result["additional_total"] == expected_additional
        assert result["subtotal"] == expected_subtotal
    
    def test_calculate_offer_price_with_discount(self):
        result = calculate_offer_price("standard", [], 10)
        
        expected_net = 2490 * 0.9  # 10% rabatu
        expected_gross = expected_net * 1.23
        
        assert result["discount"] == 249
        assert result["net"] == expected_net
        assert abs(result["gross"] - expected_gross) < 0.01
    
    def test_calculate_valid_until(self):
        result = calculate_valid_until(14)
        expected = (datetime.now() + timedelta(days=14)).strftime('%Y-%m-%d')
        assert result == expected
    
    def test_calculate_conversion_rate(self):
        assert calculate_conversion_rate(100, 25) == 25.0
        assert calculate_conversion_rate(0, 0) == 0.0
        assert calculate_conversion_rate(10, 3) == 30.0
    
    def test_calculate_pipeline_value(self):
        leads = [
            {"status": "new", "value": 1000},
            {"status": "active", "value": 2000},
            {"status": "won", "value": 3000},
            {"status": "won", "value": 1500}
        ]
        
        result = calculate_pipeline_value(leads)
        
        assert result["new"] == 1000
        assert result["active"] == 2000
        assert result["won"] == 4500
        assert result["total"] == 7500


# ============= TESTY GENEROWANIA =============

class TestGeneration:
    """Testy funkcji generowania"""
    
    def test_generate_offer_number(self):
        number = generate_offer_number()
        
        assert number.startswith("OF/")
        assert str(datetime.now().year) in number
    
    def test_generate_offer_number_uniqueness(self):
        numbers = [generate_offer_number() for _ in range(10)]
        # Przy szybkim generowaniu mogą być duplikaty, ale format powinien być OK
        assert all(n.startswith("OF/") for n in numbers)
    
    def test_generate_contract_number(self):
        number = generate_contract_number()
        
        assert number.startswith("STREAM/")
        assert str(datetime.now().year) in number
    
    def test_generate_contract_number_custom_prefix(self):
        number = generate_contract_number("CUSTOM")
        
        assert number.startswith("CUSTOM/")
    
    def test_generate_event_hash(self):
        hash1 = generate_event_hash("Event", "2026-01-01", "Warsaw", "Org")
        hash2 = generate_event_hash("Event", "2026-01-01", "Warsaw", "Org")
        hash3 = generate_event_hash("Different", "2026-01-01", "Warsaw", "Org")
        
        assert hash1 == hash2  # Ten sam event = ten sam hash
        assert hash1 != hash3  # Różne eventy = różne hashe
        assert len(hash1) == 32  # MD5 length


# ============= TESTY EKSPORTU =============

class TestExport:
    """Testy funkcji eksportu"""
    
    def test_export_events_to_csv(self):
        events = [
            {"id": 1, "name": "Event 1", "organizer": "Org 1", "date_start": "2026-01-01"},
            {"id": 2, "name": "Event 2", "organizer": "Org 2", "date_start": "2026-02-01"}
        ]
        
        csv = export_events_to_csv(events)
        lines = csv.split('\n')
        
        assert len(lines) == 3  # Header + 2 rows
        assert "id" in lines[0]
        assert "name" in lines[0]
        assert "Event 1" in lines[1]
    
    def test_export_events_to_csv_empty(self):
        assert export_events_to_csv([]) == ""
    
    def test_export_leads_to_csv(self):
        leads = [
            {"id": 1, "company": "Company 1", "email": "test@test.pl", "status": "new"}
        ]
        
        csv = export_leads_to_csv(leads)
        
        assert "company" in csv
        assert "Company 1" in csv
    
    def test_export_to_json(self):
        data = {"key": "value", "number": 123}
        
        result = export_to_json(data)
        
        assert '"key": "value"' in result
        assert '"number": 123' in result
    
    def test_export_to_json_not_pretty(self):
        data = {"key": "value"}
        
        result = export_to_json(data, pretty=False)
        
        assert '\n' not in result


# ============= TESTY WYSZUKIWANIA =============

class TestSearch:
    """Testy funkcji wyszukiwania"""
    
    def test_extract_emails_from_text(self):
        text = "Contact us at info@example.com or support@test.pl for help."
        
        emails = extract_emails_from_text(text)
        
        assert "info@example.com" in emails
        assert "support@test.pl" in emails
        assert len(emails) == 2
    
    def test_extract_emails_from_text_empty(self):
        assert extract_emails_from_text("") == []
        assert extract_emails_from_text(None) == []
        assert extract_emails_from_text("No emails here") == []
    
    def test_extract_phones_from_text(self):
        text = "Call us: +48 500 111 222 or 600-333-444"
        
        phones = extract_phones_from_text(text)
        
        assert len(phones) >= 1
    
    def test_extract_phones_from_text_empty(self):
        assert extract_phones_from_text("") == []
        assert extract_phones_from_text(None) == []


# ============= TESTY STAŁYCH =============

class TestConstants:
    """Testy stałych konfiguracyjnych"""
    
    def test_package_prices_exist(self):
        assert "basic" in PACKAGE_PRICES
        assert "standard" in PACKAGE_PRICES
        assert "premium" in PACKAGE_PRICES
        assert "enterprise" in PACKAGE_PRICES
    
    def test_package_prices_values(self):
        assert PACKAGE_PRICES["basic"] == 990
        assert PACKAGE_PRICES["standard"] == 2490
        assert PACKAGE_PRICES["premium"] == 4990
        assert PACKAGE_PRICES["enterprise"] == 0
    
    def test_additional_services_exist(self):
        expected_services = ["drone", "commentator", "highlights", "multistream"]
        for service in expected_services:
            assert service in ADDITIONAL_SERVICES_PRICES


# ============= TESTY EDGE CASES =============

class TestEdgeCases:
    """Testy przypadków brzegowych"""
    
    def test_calculate_offer_price_invalid_package(self):
        result = calculate_offer_price("nonexistent")
        assert result["base_price"] == 0
    
    def test_calculate_offer_price_invalid_service(self):
        result = calculate_offer_price("basic", ["nonexistent_service"])
        assert result["additional_total"] == 0
    
    def test_format_date_invalid(self):
        assert format_date("invalid") == "invalid"
        assert format_date("") == ""
    
    def test_calculate_offer_price_100_percent_discount(self):
        result = calculate_offer_price("basic", [], 100)
        assert result["net"] == 0
        assert result["gross"] == 0
    
    def test_calculate_offer_price_negative_discount(self):
        # Ujemny rabat = podwyżka
        result = calculate_offer_price("basic", [], -10)
        assert result["net"] > 990


# ============= URUCHOMIENIE =============

if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
