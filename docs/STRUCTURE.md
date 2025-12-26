# 📁 StreamFlow MVP - Struktura Projektu

## Przegląd

StreamFlow to platforma MVP do automatycznej agregacji wydarzeń sportowych i kulturalnych, zarządzania kontaktami z organizatorami oraz obsługi procesu sprzedażowego usług streamingowych.

---

## 🗂️ Struktura katalogów

```
streamflow-mvp/
│
├── 📄 STRUCTURE.md              # Ten plik - dokumentacja struktury
├── 📄 INSTALL.md                # Instrukcja instalacji
│
├── 📁 backend/                  # Kod backendowy Python
│   ├── api.py                   # REST API (FastAPI)
│   ├── aggregator.py            # Scrapery i agregacja wydarzeń
│   ├── utils.py                 # Funkcje pomocnicze
│   ├── requirements.txt         # Zależności Python
│   ├── pytest.ini               # Konfiguracja testów
│   ├── test_backend.py          # Testy agregatora i bazy
│   ├── test_api.py              # Testy API
│   └── test_utils.py            # Testy funkcji pomocniczych
│
├── 📁 frontend/                 # Kod frontendowy React
│   ├── EventAggregatorDashboard.jsx      # Główny komponent
│   └── EventAggregatorDashboard.test.jsx # Testy React
│
├── 📁 templates/                # Szablony dokumentów
│   ├── document-generator.js    # Generator ofert i umów
│   ├── document-generator.test.js # Testy generatora
│   ├── package.json             # Zależności Node.js
│   ├── oferta_runmageddon.docx  # Przykładowa oferta
│   └── umowa_runmageddon.docx   # Przykładowa umowa
│
└── 📁 docs/                     # Dokumentacja
    └── README.md                # Główna dokumentacja projektu
```

---

## 🧪 Testy

### Backend (Python)
- **83 testy jednostkowe** w 3 plikach testowych
- Pokrycie: Model Event, Database, Scrapery, Agregator, Utils

```bash
cd backend
pip install -r requirements.txt
pytest -v
```

### Frontend (React)
- Testy komponentów z React Testing Library
- Pokrycie: Nawigacja, Widoki, Interakcje

```bash
cd frontend
npm install @testing-library/react jest
npm test
```

### Generator dokumentów (Node.js)
- Testy jednostkowe z Jest
- Pokrycie: Konfiguracja, Generowanie, Kalkulacje

```bash
cd templates
npm install
npm test
```

---

## 📄 Szczegółowy opis plików

### Backend (`/backend/`)

#### `api.py` (581 linii)
REST API zbudowane na FastAPI z pełnym CRUD dla wydarzeń, leadów i ofert.

**Główne endpointy:**
| Endpoint | Metoda | Opis |
|----------|--------|------|
| `/api/events` | GET | Lista wydarzeń z filtrami |
| `/api/events/{id}` | GET/PATCH/DELETE | Operacje na wydarzeniu |
| `/api/events` | POST | Dodaj wydarzenie |
| `/api/leads` | GET/POST | Lista i tworzenie leadów |
| `/api/leads/{id}` | PATCH | Aktualizacja leada |
| `/api/offers` | POST | Generowanie oferty |
| `/api/offers/{id}/send` | POST | Wysyłka oferty |
| `/api/sync` | POST | Synchronizacja źródeł |
| `/api/stats` | GET | Statystyki dashboardu |
| `/api/packages` | GET | Dostępne pakiety usług |
| `/health` | GET | Health check |

**Modele danych:**
- `Event` - wydarzenie z pełnymi metadanymi
- `Lead` - lead sprzedażowy
- `Offer` - wygenerowana oferta
- `EventStatus`, `LeadStatus` - statusy workflow

**Zależności:**
```
fastapi, uvicorn, pydantic, sqlite3
```

---

#### `aggregator.py` (308 linii)
System agregacji wydarzeń z wielu źródeł z automatycznym scrapingiem.

**Klasy scraperów:**
| Klasa | Źródło | Kategoria |
|-------|--------|-----------|
| `RunmageddonScraper` | runmageddon.pl | OCR |
| `HyroxScraper` | hyrox.com | Fitness |
| `GoOutScraper` | goout.net | Festiwale |
| `MTPScraper` | mtp.pl | Targi |

**Główne klasy:**
- `Event` - dataclass modelu wydarzenia
- `Database` - warstwa SQLite z auto-migracją
- `BaseScraper` - abstrakcyjna klasa bazowa scraperów
- `EventAggregator` - orkiestrator synchronizacji

**CLI:**
```bash
python aggregator.py --init-db   # Inicjalizacja bazy
python aggregator.py --sync      # Synchronizacja wszystkich źródeł
python aggregator.py --stats     # Wyświetl statystyki
python aggregator.py --list      # Lista wydarzeń
```

**Zależności:**
```
aiohttp, beautifulsoup4, feedparser (opcjonalne)
```

---

### Frontend (`/frontend/`)

#### `EventAggregatorDashboard.jsx` (1198 linii)
Kompletny dashboard React z Tailwind CSS.

**Widoki (zakładki):**
| Widok | Komponent | Funkcja |
|-------|-----------|---------|
| Dashboard | `DashboardView` | Przegląd KPI, quick actions, pipeline |
| Events | `EventsView` | Lista wydarzeń, filtry, wyszukiwanie |
| Leads | `LeadsView` | Kanban board pipeline'u sprzedażowego |
| Offers | `OffersView` | Pakiety usług, historia ofert |
| Calendar | `CalendarView` | Kalendarz miesięczny z wydarzeniami |
| Analytics | `AnalyticsView` | Wykresy, lejek konwersji |

**Komponenty pomocnicze:**
- `StatCard` - karta statystyki
- `QuickAction` - przycisk szybkiej akcji
- `EventRow` - wiersz wydarzenia
- `LeadCard` - karta leada w kanban
- `StatusBadge` - badge statusu
- `NewLeadModal` - modal tworzenia leada
- `OfferModal` - modal generowania oferty

**Dane przykładowe:**
- `mockEvents` - 8 przykładowych wydarzeń
- `mockLeads` - 6 przykładowych leadów
- `servicePackages` - 3 pakiety (Basic, Standard, Premium)
- `aggregationSources` - 8 źródeł danych
- `pipelineStages` - 5 etapów pipeline'u

**Zależności:**
```
react, lucide-react, tailwindcss
```

---

### Szablony (`/templates/`)

#### `document-generator.js` (708 linii)
Generator profesjonalnych dokumentów DOCX.

**Funkcje eksportowane:**
| Funkcja | Opis | Output |
|---------|------|--------|
| `generateOffer(data)` | Generuje ofertę handlową | Document |
| `generateContract(data)` | Generuje umowę o świadczenie usług | Document |

**Konfiguracja pakietów (`SERVICE_PACKAGES`):**
```javascript
{
  basic: { name: 'Pakiet BASIC', price: 990, features: [...] },
  standard: { name: 'Pakiet STANDARD', price: 2490, features: [...] },
  premium: { name: 'Pakiet PREMIUM', price: 4990, features: [...] },
  enterprise: { name: 'Pakiet ENTERPRISE', price: 0, features: [...] }
}
```

**Usługi dodatkowe (`ADDITIONAL_SERVICES`):**
- `drone` - Dron z operatorem (800 PLN)
- `commentator` - Komentator (600 PLN)
- `graphics_custom` - Dedykowane grafiki (400 PLN)
- `highlights` - Montaż highlights (500 PLN)
- `multistream` - Multi-platform (300 PLN)
- `vod` - Archiwum VOD (200 PLN)
- `led_screen` - Ekran LED (1500 PLN)
- `sound_system` - Nagłośnienie (800 PLN)
- `photographer` - Fotograf (700 PLN)
- `transcript` - Transkrypcja (350 PLN/h)

**Zależności:**
```
docx (npm)
```

---

#### `oferta_runmageddon.docx`
Wygenerowana przykładowa oferta dla Runmageddon zawierająca:
- Nagłówek z logo StreamFlow
- Dane klienta
- Informacje o wydarzeniu
- Wybrany pakiet z listą features
- Usługi dodatkowe
- Kalkulacja cenowa (netto, VAT, brutto)
- Warunki oferty i termin ważności
- Stopka z danymi kontaktowymi

---

#### `umowa_runmageddon.docx`
Wygenerowana przykładowa umowa zawierająca:
- §1 Strony umowy (Wykonawca i Zamawiający)
- §2 Przedmiot umowy (szczegóły wydarzenia)
- §3 Wynagrodzenie (cena, zaliczka, terminy)
- §4 Obowiązki stron
- §5 Postanowienia końcowe
- Miejsce na podpisy

---

### Dokumentacja (`/docs/`)

#### `README.md` (523 linie)
Główna dokumentacja projektu zawierająca:

1. **Opis projektu** - problem, rozwiązanie
2. **Architektura MVP** - diagram, struktura
3. **Funkcjonalności** - agregacja, CRM, generator
4. **Modele współpracy** - 5 modeli biznesowych
5. **Pakiety usług** - cennik i zakres
6. **Proces od planu do realizacji** - 8 faz
7. **Instalacja i uruchomienie** - krok po kroku
8. **API Reference** - tabela endpointów
9. **Roadmapa rozwoju** - Q1-Q4 2026

---

## 🔧 Wymagania systemowe

### Backend
- Python 3.10+
- SQLite 3
- Pakiety: `fastapi`, `uvicorn`, `aiohttp`, `beautifulsoup4`, `pydantic`

### Frontend
- Node.js 18+
- React 18+
- Tailwind CSS 3+
- Lucide React (ikony)

### Generator dokumentów
- Node.js 18+
- Pakiet: `docx`

---

## 📊 Statystyki projektu

| Metryka | Wartość |
|---------|---------|
| Łączna liczba linii kodu | ~3 300 |
| Pliki źródłowe | 5 |
| Wygenerowane dokumenty | 2 |
| Endpointy API | 14 |
| Komponenty React | 15+ |
| Źródła agregacji | 4 (rozszerzalne) |
| Pakiety usług | 4 |
| Modele współpracy | 5 |

---

## 🚀 Szybki start

```bash
# 1. Rozpakuj archiwum
unzip streamflow-mvp.zip
cd streamflow-mvp

# 2. Backend
cd backend
pip install fastapi uvicorn aiohttp beautifulsoup4 pydantic
python aggregator.py --sync
uvicorn api:app --reload --port ${API_PORT}

# 3. Generator dokumentów
cd ../templates
npm install docx
node document-generator.js

# 4. Frontend (wymaga projektu React)
# Skopiuj EventAggregatorDashboard.jsx do swojego projektu React
```

---

## 📝 Licencja

MIT License - Softreck / prototypowanie.pl

---

*Dokumentacja wygenerowana: Grudzień 2025*
