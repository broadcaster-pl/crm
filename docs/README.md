# StreamFlow MVP - Platforma Agregacji Wydarzeń i Zarządzania Współpracą

## 📋 Spis treści

1. [Opis projektu](#opis-projektu)
2. [Architektura MVP](#architektura-mvp)
3. [Funkcjonalności](#funkcjonalności)
4. [Modele współpracy](#modele-współpracy)
5. [Pakiety usług](#pakiety-usług)
6. [Proces od planu do realizacji](#proces-od-planu-do-realizacji)
7. [Instalacja i uruchomienie](#instalacja-i-uruchomienie)
8. [API Reference](#api-reference)
9. [Roadmapa rozwoju](#roadmapa-rozwoju)

---

## 🎯 Opis projektu

**StreamFlow** to platforma MVP do automatycznej agregacji wydarzeń sportowych i kulturalnych z wielu źródeł, zarządzania kontaktami z organizatorami oraz obsługi całego procesu sprzedażowego usług streamingowych.

### Problem

- Organizatorzy wydarzeń nie wiedzą o dostępnych usługach streamingowych
- Firmy streamingowe nie mają efektywnego sposobu na monitorowanie nadchodzących wydarzeń
- Proces od pierwszego kontaktu do realizacji jest rozproszony i nieefektywny

### Rozwiązanie

StreamFlow automatyzuje:
- **Wykrywanie wydarzeń** - agregacja z 10+ źródeł (kalendarze federacji, platformy rejestracji, RSS)
- **Pozyskiwanie kontaktów** - automatyczne wyszukiwanie danych organizatorów
- **Pipeline sprzedażowy** - CRM dedykowany dla branży eventowej
- **Generowanie ofert** - szablony dokumentów i umów
- **Planowanie realizacji** - kalendarz i rezerwacja zasobów

---

## 🏗️ Architektura MVP

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React)                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │Dashboard │ │ Events   │ │  Leads   │ │ Offers   │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND API (FastAPI)                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐           │
│  │ Events   │ │ Leads    │ │ Offers   │ │  Stats   │           │
│  │  CRUD    │ │  CRUD    │ │ Generate │ │ Reports  │           │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘           │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   SQLite DB  │     │  Scrapers    │     │  Document    │
│   (Events,   │     │  (Datasport, │     │  Generator   │
│   Leads,     │     │  Runmageddon,│     │  (docx,      │
│   Offers)    │     │  RSS, Alerts)│     │  pdf)        │
└──────────────┘     └──────────────┘     └──────────────┘
```

### Struktura plików

```
event-aggregator-mvp/
├── frontend/
│   └── EventAggregatorDashboard.jsx   # Dashboard React
├── backend/
│   ├── aggregator.py                   # Scrapery i agregacja
│   └── api.py                          # REST API FastAPI
├── templates/
│   └── document-generator.js           # Generator ofert/umów
├── docs/
│   └── README.md                       # Ta dokumentacja
└── contracts/
    └── (generowane umowy)
```

---

## ⚡ Funkcjonalności

### 1. Agregacja wydarzeń

| Źródło | Typ | Częstotliwość | Status |
|--------|-----|---------------|--------|
| Datasport.pl | Scraper | Co 6h | ✅ Aktywne |
| KalendarzBiegowy.pl | RSS | Co 6h | ✅ Aktywne |
| Runmageddon.pl | Scraper | Co 24h | ✅ Aktywne |
| HYROX.com | Scraper | Co 24h | ✅ Aktywne |
| MTP.pl (targi) | Scraper | Co 24h | ✅ Aktywne |
| GoOut.net | Scraper | Co 12h | 🔄 W budowie |
| Google Alerts | RSS | Real-time | ✅ Aktywne |
| PZPN.pl | Scraper | Co 24h | 📋 Planowane |
| PZKosz.pl | Scraper | Co 24h | 📋 Planowane |

### 2. Zarządzanie leadami (CRM)

**Pipeline sprzedażowy:**

```
Nowe → Skontaktowane → Kwalifikowane → Oferta wysłana → Negocjacje → Wygrane/Przegrane
```

**Funkcje:**
- Automatyczne tworzenie leada z wykrytego wydarzenia
- Scoring potencjału (1-5 gwiazdek)
- Przypomnienia o follow-upach
- Historia kontaktów
- Tagowanie i kategoryzacja

### 3. Generator ofert i umów

**Typy dokumentów:**
- Oferta handlowa (DOCX/PDF)
- Umowa o świadczenie usług
- Protokół odbioru
- Faktura proforma

**Personalizacja:**
- Automatyczne wypełnianie danymi klienta
- Wybór pakietu i usług dodatkowych
- Kalkulacja cen z rabatem
- Branding (logo, kolory)

### 4. Kalendarz i rezerwacje

- Widok miesiąca/tygodnia z wydarzeniami
- Rezerwacja sprzętu i zespołu
- Konflikty terminów
- Eksport do Google Calendar/iCal

---

## 🤝 Modele współpracy

### Model 1: Jednorazowe zlecenie

**Dla:** Organizatorzy pojedynczych wydarzeń

**Proces:**
1. Organizator kontaktuje się lub jest kontaktowany
2. Wycena na podstawie brief'u
3. Podpisanie umowy jednorazowej
4. Realizacja → Rozliczenie

**Zalety:** Prostota, niski próg wejścia
**Wady:** Brak przewidywalności przychodów

---

### Model 2: Pakiet eventów (abonament)

**Dla:** Serie zawodów, ligi regionalne, cykliczne konferencje

**Warianty:**

| Pakiet | Eventy/rok | Cena/event | Rabat | Suma |
|--------|------------|------------|-------|------|
| Bronze | 3-5 | -10% | 10% | od 8 000 PLN |
| Silver | 6-10 | -15% | 15% | od 18 000 PLN |
| Gold | 11-20 | -20% | 20% | od 35 000 PLN |
| Platinum | 20+ | -25% | 25% | Indywidualnie |

**Zalety:** Przewidywalność, niższe koszty dla klienta, relacja długoterminowa
**Proces:** Umowa ramowa → Harmonogram eventów → Realizacje → Rozliczenie kwartalne

---

### Model 3: Partnerstwo (Revenue Share)

**Dla:** Federacje sportowe, duże organizacje eventowe

**Struktura:**
- StreamFlow zapewnia infrastrukturę i produkcję
- Partner zapewnia prawa i dostęp
- Podział przychodów: 60/40 lub 70/30 (na korzyść partnera)

**Źródła przychodów:**
- Pay-per-view
- Sponsoring transmisji
- Reklamy w streamie
- VOD i archiwum

**Przykład:**
```
Federacja XYZ - 20 wydarzeń/rok
Średnia widownia: 5 000 osób
PPV: 9,99 PLN/event
Przychód roczny: ~1 000 000 PLN
Podział: 700 000 PLN (partner) / 300 000 PLN (StreamFlow)
```

---

### Model 4: White-label / SaaS

**Dla:** Agencje eventowe, centra konferencyjne, obiekty sportowe

**Oferta:**
- Platforma streamingowa z brandingiem klienta
- Panel zarządzania
- Integracje API
- Wsparcie techniczne

**Cennik:**
- Setup: 5 000 - 15 000 PLN
- Miesięczny abonament: 500 - 2 000 PLN
- Streaming: od 200 PLN/h (ponad limit)

---

### Model 5: Marketplace (przyszłość)

**Koncept:**
- Platforma łącząca organizatorów z dostawcami usług streamingowych
- Prowizja od transakcji: 10-15%
- Rating i recenzje
- System rezerwacji online

---

## 💰 Pakiety usług

### BASIC - 990 PLN netto

```
✓ 1 kamera statyczna HD
✓ Do 2 godzin transmisji
✓ Streaming YouTube lub Facebook
✓ Podstawowe nakładki graficzne
✓ Backup nagrania
```
**Rekomendowane dla:** Małe wydarzenia lokalne, treningi

---

### STANDARD - 2 490 PLN netto

```
✓ 2-3 kamery HD/4K
✓ Do 4 godzin transmisji  
✓ Realizator wizji na żywo
✓ Profesjonalne grafiki i animacje
✓ Replay i slow-motion
✓ Backup nagrania
✓ Raport po wydarzeniu
```
**Rekomendowane dla:** Zawody regionalne, turnieje, konferencje

---

### PREMIUM - 4 990 PLN netto

```
✓ 4+ kamery z operatorami
✓ Cały dzień transmisji (do 10h)
✓ Wóz transmisyjny OB
✓ LiveU bonding 4G/5G
✓ Komentator/prowadzący
✓ Studio graficzne
✓ Post-produkcja highlights
✓ Multi-platform streaming
```
**Rekomendowane dla:** Duże wydarzenia, mistrzostwa, gale

---

### ENTERPRISE - Wycena indywidualna

```
✓ Nieograniczona liczba kamer
✓ Wielodniowa transmisja
✓ Dedykowany zespół
✓ Własna infrastruktura
✓ Transmisja satelitarna
✓ SLA z gwarancją 99.9%
✓ Wsparcie 24/7
```
**Rekomendowane dla:** Ligi profesjonalne, stałe współprace

---

### Usługi dodatkowe

| Usługa | Cena | Jednostka |
|--------|------|-----------|
| Dron z operatorem | 800 PLN | dzień |
| Komentator sportowy | 600 PLN | dzień |
| Dedykowane grafiki | 400 PLN | komplet |
| Montaż highlights | 500 PLN | do 5 min |
| Multi-platform streaming | 300 PLN | platforma |
| Archiwum VOD 30 dni | 200 PLN | wydarzenie |
| Ekran LED mobilny | 1 500 PLN | dzień |
| Nagłośnienie | 800 PLN | dzień |
| Fotograf | 700 PLN | dzień |
| Transkrypcja/napisy | 350 PLN | godzina |

---

## 📅 Proces od planu do realizacji

### Faza 1: Pozyskanie (1-2 dni)

```
1. Wykrycie wydarzenia przez agregator
2. Automatyczny scoring potencjału
3. Wyszukanie danych kontaktowych
4. Pierwszy kontakt (email/telefon)
5. Utworzenie leada w CRM
```

### Faza 2: Kwalifikacja (2-5 dni)

```
1. Zebranie wymagań (brief)
2. Wizja lokalna (opcjonalnie)
3. Analiza wykonalności technicznej
4. Wstępna wycena
5. Prezentacja portfolio
```

### Faza 3: Ofertowanie (1-3 dni)

```
1. Przygotowanie oferty w generatorze
2. Personalizacja pakietu
3. Wysyłka oferty
4. Follow-up
5. Negocjacje (jeśli potrzebne)
```

### Faza 4: Kontrakt (1-2 dni)

```
1. Akceptacja oferty
2. Generowanie umowy
3. Podpisanie (elektroniczne lub papierowe)
4. Faktura zaliczkowa (50%)
5. Rezerwacja w kalendarzu
```

### Faza 5: Pre-produkcja (7-14 dni przed)

```
1. Zebranie materiałów graficznych od klienta
2. Przygotowanie grafik i animacji
3. Test techniczny (jeśli złożony projekt)
4. Briefing zespołu
5. Sprawdzenie sprzętu
```

### Faza 6: Realizacja (dzień wydarzenia)

```
1. Przyjazd 2h przed startem
2. Setup sprzętu
3. Testy połączenia i obrazu
4. Transmisja na żywo
5. Monitoring i troubleshooting
6. Teardown
```

### Faza 7: Post-produkcja (1-3 dni po)

```
1. Backup i archiwizacja nagrań
2. Montaż highlights (jeśli w pakiecie)
3. Raport z transmisji (statystyki)
4. Dostarczenie materiałów klientowi
5. Faktura końcowa (50%)
```

### Faza 8: Follow-up (7-14 dni po)

```
1. Ankieta satysfakcji
2. Prośba o referencje/testimonial
3. Propozycja kolejnej współpracy
4. Dodanie do bazy stałych klientów
```

---

## 🚀 Instalacja i uruchomienie

### Wymagania

- Python 3.10+
- Node.js 18+
- SQLite 3

### Backend

```bash
cd backend

# Instalacja zależności
pip install fastapi uvicorn aiohttp beautifulsoup4 feedparser pydantic

# Inicjalizacja bazy danych
python aggregator.py --init-db

# Uruchomienie API
uvicorn api:app --reload --host 0.0.0.0 --port ${API_PORT}
```

### Frontend

```bash
cd frontend

# Instalacja zależności
npm install react lucide-react

# Uruchomienie (w trybie dev)
npm run dev
```

### Generator dokumentów

```bash
cd templates

# Instalacja
npm install docx

# Generowanie przykładowych dokumentów
node document-generator.js
```

---

## 📡 API Reference

### Events

| Endpoint | Metoda | Opis |
|----------|--------|------|
| `/api/events` | GET | Lista wydarzeń |
| `/api/events/{id}` | GET | Szczegóły wydarzenia |
| `/api/events` | POST | Nowe wydarzenie |
| `/api/events/{id}` | PATCH | Aktualizacja |
| `/api/events/{id}` | DELETE | Usunięcie |

### Leads

| Endpoint | Metoda | Opis |
|----------|--------|------|
| `/api/leads` | GET | Lista leadów |
| `/api/leads` | POST | Nowy lead |
| `/api/leads/{id}` | PATCH | Aktualizacja |

### Offers

| Endpoint | Metoda | Opis |
|----------|--------|------|
| `/api/offers` | POST | Generuj ofertę |
| `/api/offers/{id}/send` | POST | Wyślij ofertę |

### Sync

| Endpoint | Metoda | Opis |
|----------|--------|------|
| `/api/sync` | POST | Synchronizuj źródła |
| `/api/stats` | GET | Statystyki |

Pełna dokumentacja API: `http://localhost:${API_PORT}/docs`

---

## 🗺️ Roadmapa rozwoju

### Q1 2026 - MVP

- [x] Agregacja z 5 źródeł
- [x] CRM podstawowy
- [x] Generator ofert
- [ ] Integracja z Gmail
- [ ] Powiadomienia email

### Q2 2026 - Growth

- [ ] Agregacja z 15+ źródeł
- [ ] Automatyczne wyszukiwanie kontaktów
- [ ] Integracja z fakturowni.pl
- [ ] Aplikacja mobilna (React Native)
- [ ] Dashboard analityczny

### Q3 2026 - Scale

- [ ] Marketplace (beta)
- [ ] API dla partnerów
- [ ] White-label
- [ ] Integracja z CRM (HubSpot, Pipedrive)
- [ ] Automatyzacja marketingu

### Q4 2026 - Enterprise

- [ ] Multi-tenant
- [ ] SSO/SAML
- [ ] Zaawansowany reporting
- [ ] AI scoring leadów
- [ ] Predictive analytics

---

## 📞 Kontakt

**StreamFlow by Softreck / prototypowanie.pl**

- Email: kontakt@streamflow.pl
- Tel: +48 xxx xxx xxx
- Web: https://prototypowanie.pl

---

*Dokumentacja wersja 1.0 | Ostatnia aktualizacja: Grudzień 2025*
