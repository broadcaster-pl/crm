#!/usr/bin/env python3
"""
StreamFlow MVP - Funkcje pomocnicze
Narzędzia do walidacji, formatowania i integracji
"""

import re
import hashlib
import json
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass
from enum import Enum


# ============= STAŁE =============

class EventStatus(str, Enum):
    NEW = "new"
    CONTACTED = "contacted"
    QUALIFIED = "qualified"
    OFFER_SENT = "offer_sent"
    WON = "won"
    LOST = "lost"


class LeadStatus(str, Enum):
    NEW = "new"
    ACTIVE = "active"
    OFFER_SENT = "offer_sent"
    NEGOTIATION = "negotiation"
    WON = "won"
    LOST = "lost"


PACKAGE_PRICES = {
    "basic": 990,
    "standard": 2490,
    "premium": 4990,
    "enterprise": 0
}

ADDITIONAL_SERVICES_PRICES = {
    "drone": 800,
    "commentator": 600,
    "graphics_custom": 400,
    "highlights": 500,
    "multistream": 300,
    "vod": 200,
    "led_screen": 1500,
    "sound_system": 800,
    "photographer": 700,
    "transcript": 350
}

HIGH_VALUE_CATEGORIES = ["OCR", "CrossFit", "Fitness", "E-sport", "MMA", "Siatkówka"]


# ============= WALIDACJA =============

def validate_email(email: str) -> bool:
    """Waliduje adres email"""
    if not email:
        return False
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


def validate_phone(phone: str) -> bool:
    """Waliduje numer telefonu"""
    if not phone:
        return False
    cleaned = re.sub(r'[\s\-\(\)]', '', phone)
    pattern = r'^(\+48)?[0-9]{9}$'
    return bool(re.match(pattern, cleaned))


def validate_nip(nip: str) -> bool:
    """Waliduje NIP"""
    if not nip:
        return False
    cleaned = re.sub(r'[\-]', '', nip)
    if len(cleaned) != 10 or not cleaned.isdigit():
        return False
    weights = [6, 5, 7, 2, 3, 4, 5, 6, 7]
    checksum = sum(int(cleaned[i]) * weights[i] for i in range(9)) % 11
    return checksum == int(cleaned[9])


def validate_date(date_str: str) -> bool:
    """Waliduje datę ISO"""
    try:
        datetime.strptime(date_str, '%Y-%m-%d')
        return True
    except (ValueError, TypeError):
        return False


def sanitize_string(text: str, max_length: int = 500) -> str:
    """Czyści tekst"""
    if not text:
        return ""
    cleaned = re.sub(r'[<>"\']', '', str(text))
    return cleaned[:max_length]


# ============= FORMATOWANIE =============

def format_price(amount: float, currency: str = "PLN") -> str:
    """Formatuje cenę"""
    return f"{amount:,.2f} {currency}".replace(",", " ").replace(".", ",")


def format_phone(phone: str) -> str:
    """Formatuje telefon"""
    cleaned = re.sub(r'[\s\-\(\)]', '', phone)
    if cleaned.startswith('+48'):
        cleaned = cleaned[3:]
    if len(cleaned) == 9:
        return f"+48 {cleaned[:3]} {cleaned[3:6]} {cleaned[6:]}"
    return phone


def format_date(date_str: str, output_format: str = "%d.%m.%Y") -> str:
    """Formatuje datę"""
    try:
        dt = datetime.strptime(date_str, '%Y-%m-%d')
        return dt.strftime(output_format)
    except (ValueError, TypeError):
        return date_str


def format_nip(nip: str) -> str:
    """Formatuje NIP"""
    cleaned = re.sub(r'[\-]', '', nip)
    if len(cleaned) == 10:
        return f"{cleaned[:3]}-{cleaned[3:6]}-{cleaned[6:8]}-{cleaned[8:]}"
    return nip


# ============= KALKULACJE =============

def calculate_potential_score(
    estimated_audience: int = 0,
    category: str = "",
    has_email: bool = False,
    has_phone: bool = False
) -> int:
    """Oblicza scoring potencjału (1-5)"""
    score = 3
    if estimated_audience > 5000:
        score += 2
    elif estimated_audience > 1000:
        score += 1
    if category in HIGH_VALUE_CATEGORIES:
        score += 1
    if has_email and has_phone:
        score += 1
    elif not has_email and not has_phone:
        score -= 1
    return max(1, min(5, score))


def calculate_offer_price(
    package: str,
    additional_services: List[str] = None,
    discount_percent: float = 0
) -> Dict[str, float]:
    """Oblicza cenę oferty"""
    if additional_services is None:
        additional_services = []
    
    base_price = PACKAGE_PRICES.get(package, 0)
    additional_total = sum(ADDITIONAL_SERVICES_PRICES.get(s, 0) for s in additional_services)
    subtotal = base_price + additional_total
    discount_amount = subtotal * (discount_percent / 100)
    net_total = subtotal - discount_amount
    vat_amount = net_total * 0.23
    gross_total = net_total + vat_amount
    
    return {
        "base_price": base_price,
        "additional_total": additional_total,
        "subtotal": subtotal,
        "discount": discount_amount,
        "net": net_total,
        "vat": vat_amount,
        "gross": round(gross_total, 2)
    }


def calculate_valid_until(days: int = 14) -> str:
    """Oblicza datę ważności"""
    return (datetime.now() + timedelta(days=days)).strftime('%Y-%m-%d')


# ============= GENEROWANIE ID =============

def generate_offer_number() -> str:
    """Generuje numer oferty"""
    now = datetime.now()
    random_part = hashlib.md5(str(now.timestamp()).encode()).hexdigest()[:4].upper()
    return f"OF/{now.year}/{now.month:02d}/{random_part}"


def generate_contract_number(prefix: str = "STREAM") -> str:
    """Generuje numer umowy"""
    now = datetime.now()
    random_part = hashlib.md5(str(now.timestamp()).encode()).hexdigest()[:6].upper()
    return f"{prefix}/{now.year}/{random_part}"


def generate_event_hash(name: str, date: str, location: str, organizer: str) -> str:
    """Generuje hash wydarzenia"""
    content = f"{name}{date}{location}{organizer}".lower()
    return hashlib.md5(content.encode()).hexdigest()


# ============= EKSPORT =============

def export_events_to_csv(events: List[Dict]) -> str:
    """Eksportuje wydarzenia do CSV"""
    if not events:
        return ""
    headers = ['id', 'name', 'organizer', 'date_start', 'location', 'city', 
               'category', 'source', 'potential_score', 'status']
    lines = [';'.join(headers)]
    for event in events:
        row = [str(event.get(h, '')) for h in headers]
        lines.append(';'.join(row))
    return '\n'.join(lines)


def export_leads_to_csv(leads: List[Dict]) -> str:
    """Eksportuje leady do CSV"""
    if not leads:
        return ""
    headers = ['id', 'company', 'contact_person', 'email', 'phone', 
               'status', 'value', 'package', 'created_at']
    lines = [';'.join(headers)]
    for lead in leads:
        row = [str(lead.get(h, '')) for h in headers]
        lines.append(';'.join(row))
    return '\n'.join(lines)


def export_to_json(data: Any, pretty: bool = True) -> str:
    """Eksportuje do JSON"""
    if pretty:
        return json.dumps(data, indent=2, ensure_ascii=False, default=str)
    return json.dumps(data, ensure_ascii=False, default=str)


# ============= STATYSTYKI =============

def calculate_conversion_rate(total_leads: int, won_leads: int) -> float:
    """Oblicza współczynnik konwersji"""
    if total_leads == 0:
        return 0.0
    return round((won_leads / total_leads) * 100, 2)


def calculate_pipeline_value(leads: List[Dict]) -> Dict[str, float]:
    """Oblicza wartość pipeline'u"""
    pipeline = {'new': 0.0, 'active': 0.0, 'offer_sent': 0.0, 
                'negotiation': 0.0, 'won': 0.0, 'lost': 0.0, 'total': 0.0}
    for lead in leads:
        status = lead.get('status', 'new')
        value = float(lead.get('value', 0))
        if status in pipeline:
            pipeline[status] += value
        pipeline['total'] += value
    return pipeline


# ============= WYSZUKIWANIE =============

def extract_emails_from_text(text: str) -> List[str]:
    """Wyciąga emaile z tekstu"""
    if not text:
        return []
    pattern = r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'
    return list(set(re.findall(pattern, text)))


def extract_phones_from_text(text: str) -> List[str]:
    """Wyciąga telefony z tekstu"""
    if not text:
        return []
    patterns = [r'\+48[\s\-]?\d{3}[\s\-]?\d{3}[\s\-]?\d{3}', r'\d{3}[\s\-]\d{3}[\s\-]\d{3}', r'\d{9}']
    phones = []
    for pattern in patterns:
        phones.extend(re.findall(pattern, text))
    return list(set(phones))


# ============= TESTY =============

if __name__ == "__main__":
    print("=== Testy utils.py ===\n")
    print(f"Email valid: {validate_email('test@example.com')}")
    print(f"Phone valid: {validate_phone('+48 500 000 000')}")
    print(f"NIP valid: {validate_nip('123-456-32-18')}")
    print(f"Price: {format_price(2490.00)}")
    print(f"Date: {format_date('2026-06-15')}")
    price = calculate_offer_price('standard', ['drone', 'highlights'], 10)
    print(f"Offer price: {format_price(price['gross'])} brutto")
    print(f"Offer number: {generate_offer_number()}")
    print("\n=== OK ===")
