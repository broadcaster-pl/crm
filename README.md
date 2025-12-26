# 🎬 StreamFlow MVP

[![Python](https://img.shields.io/badge/Python-3.12-blue.svg)](https://python.org)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.104-green.svg)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg)](https://reactjs.org)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED.svg)](https://docker.com)
[![Tests](https://img.shields.io/badge/Tests-83%20passed-success.svg)](#-testy)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Platforma do automatycznej agregacji wydarzeń sportowych i kulturalnych z systemem CRM dla usług streamingowych.**

---

## ✨ Funkcjonalności

- 🔍 **Agregacja wydarzeń** - automatyczne zbieranie z wielu źródeł (Runmageddon, HYROX, MTP, GoOut)
- 📊 **Dashboard** - React dashboard z widokami wydarzeń, leadów, ofert, kalendarza i analityki
- 💼 **CRM Pipeline** - zarządzanie kontaktami i lejkiem sprzedażowym
- 📄 **Generator dokumentów** - automatyczne tworzenie ofert i umów DOCX
- 🔌 **REST API** - FastAPI z pełnym CRUD i dokumentacją Swagger
- 🐳 **Docker** - gotowe obrazy do wdrożenia

---

## 🚀 Szybki start

### Opcja 1: Lokalne uruchomienie

```bash
# Klonuj/rozpakuj projekt
cd crm

# Zainstaluj zależności
make install

# Uruchom testy
make test

# Uruchom backend
make run
```

### Opcja 2: Docker

```bash
# Zbuduj i uruchom
make docker-build
make docker-up

# API dostępne pod: http://localhost:8000
# Swagger UI: http://localhost:8000/docs
```

### Opcja 3: Docker Compose

```bash
docker compose up -d
```

---

## 📁 Struktura projektu

```
streamflow-mvp/
├── backend/           # Python FastAPI + Scrapery
│   ├── api.py         # REST API
│   ├── aggregator.py  # Agregator wydarzeń
│   ├── utils.py       # Funkcje pomocnicze
│   └── test_*.py      # Testy (83 testów)
├── frontend/          # React Dashboard
│   └── EventAggregatorDashboard.jsx
├── templates/         # Generator dokumentów
│   ├── document-generator.js
│   └── *.docx         # Przykładowe dokumenty
├── docs/              # Dokumentacja
│   ├── README.md      # Główna dokumentacja
│   ├── STRUCTURE.md   # Struktura projektu
│   └── INSTALL.md     # Instrukcja instalacji
├── Dockerfile         # Obraz produkcyjny
├── docker-compose.yml # Orchestracja
└── Makefile           # Komendy automatyzacji
```

---

## 🧪 Testy

```bash
# Wszystkie testy
make test

# Z pokryciem kodu
make test-coverage

# Testy w Docker
make docker-test
```

| Moduł | Testy | Status |
|-------|-------|--------|
| Backend | 35 | ✅ |
| Utils | 48 | ✅ |
| **Razem** | **83** | ✅ |

---

## 📖 Dokumentacja

- [📋 Struktura projektu](docs/STRUCTURE.md)
- [🔧 Instrukcja instalacji](docs/INSTALL.md)
- [📚 Dokumentacja API](docs/README.md)
- [🌐 Swagger UI](http://localhost:8000/docs) (po uruchomieniu)

---

## 🛠️ Komendy Make

```bash
make help           # Pokaż wszystkie komendy
make install        # Zainstaluj zależności
make test           # Uruchom testy
make run            # Uruchom backend
make docker-up      # Uruchom w Docker
make docker-test    # Testy w Docker
make package        # Stwórz paczkę ZIP
make clean          # Wyczyść pliki tymczasowe
```

---

## 💰 Pakiety usług

| Pakiet | Cena | Zawartość |
|--------|------|-----------|
| **BASIC** | 990 PLN | 1 kamera, 2h, YouTube/FB |
| **STANDARD** | 2 490 PLN | 2-3 kamery, 4h, replay |
| **PREMIUM** | 4 990 PLN | 4+ kamery, OB van, komentator |
| **ENTERPRISE** | Indywidualnie | Pełna produkcja |

---

## 🤝 Modele współpracy

1. **Jednorazowe zlecenie** - pojedyncze wydarzenia
2. **Pakiet eventów** - abonament z rabatami 10-25%
3. **Revenue Share** - partnerstwo 60/40 lub 70/30
4. **White-label** - platforma z brandingiem klienta
5. **Marketplace** - łączenie organizatorów z dostawcami

---

## 📝 Licencja

MIT License - [Softreck](https://softreck.com) / [prototypowanie.pl](https://prototypowanie.pl)

---

## 📞 Kontakt

- 🌐 [prototypowanie.pl](https://prototypowanie.pl)
- 📧 kontakt@prototypowanie.pl
