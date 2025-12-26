# 🚀 StreamFlow MVP - Instrukcja Instalacji

## Wymagania wstępne

### System operacyjny
- Linux (Ubuntu 20.04+, Debian 11+)
- macOS 12+
- Windows 10/11 z WSL2

### Oprogramowanie
- **Python** 3.10 lub nowszy
- **Node.js** 18 lub nowszy
- **npm** 9 lub nowszy
- **Git** (opcjonalnie)

---

## 📦 Krok 1: Rozpakowanie projektu

```bash
# Przejdź do katalogu projektu
cd crm

# Sprawdź strukturę
ls -la
```

Powinieneś zobaczyć:
```
backend/
frontend/
templates/
docs/
STRUCTURE.md
INSTALL.md
```

---

## 🐍 Krok 2: Instalacja backendu (Python)

### 2.1 Utwórz środowisko wirtualne (zalecane)

```bash
cd backend

# Utwórz venv
python3 -m venv venv

# Aktywuj venv
source venv/bin/activate  # Linux/macOS
# lub
.\venv\Scripts\activate   # Windows
```

### 2.2 Zainstaluj zależności

```bash
pip install --upgrade pip

# Wymagane pakiety
pip install fastapi uvicorn pydantic aiohttp beautifulsoup4

# Opcjonalne (do pełnej funkcjonalności scraperów)
pip install feedparser lxml
```

### 2.3 Zainicjalizuj bazę danych

```bash
python aggregator.py --init-db
```

### 2.4 Uruchom pierwszą synchronizację

```bash
python aggregator.py --sync
```

Powinieneś zobaczyć:
```
Synchronizacja...
Zarejestrowano: Runmageddon.pl
Zarejestrowano: HYROX.com
Zarejestrowano: GoOut.net
Zarejestrowano: MTP.pl
Runmageddon.pl: 3 wydarzeń
HYROX.com: 3 wydarzeń
GoOut.net: 2 wydarzeń
MTP.pl: 2 wydarzeń
Znaleziono: 10 wydarzeń z 4 źródeł
```

### 2.5 Uruchom API

```bash
uvicorn api:app --reload --host 0.0.0.0 --port ${API_PORT}
```

API dostępne pod:
- **Swagger UI**: http://localhost:${API_PORT}/docs
- **ReDoc**: http://localhost:${API_PORT}/redoc
- **Health check**: http://localhost:${API_PORT}/health

### 2.6 Testuj endpointy

```bash
# Pobierz wydarzenia
curl http://localhost:${API_PORT}/api/events

# Pobierz statystyki
curl http://localhost:${API_PORT}/api/stats

# Pobierz pakiety
curl http://localhost:${API_PORT}/api/packages
```

---

## 📄 Krok 3: Generator dokumentów (Node.js)

### 3.1 Zainstaluj zależności

```bash
cd ../templates

npm install
# lub jeśli package.json nie istnieje:
npm install docx
```

### 3.2 Wygeneruj przykładowe dokumenty

```bash
node document-generator.js
```

Powinieneś zobaczyć:
```
Wygenerowano: oferta_runmageddon.docx
Wygenerowano: umowa_runmageddon.docx
```

### 3.3 Otwórz dokumenty

Wygenerowane pliki `.docx` możesz otworzyć w:
- Microsoft Word
- LibreOffice Writer
- Google Docs
- OnlyOffice

---

## ⚛️ Krok 4: Frontend (React)

### Opcja A: Integracja z istniejącym projektem React

```bash
# Skopiuj komponent do swojego projektu
cp frontend/EventAggregatorDashboard.jsx /twoj-projekt/src/components/

# Zainstaluj wymagane pakiety w swoim projekcie
cd /twoj-projekt
npm install lucide-react
```

W swoim `App.jsx`:
```jsx
import EventAggregatorDashboard from './components/EventAggregatorDashboard';

function App() {
  return <EventAggregatorDashboard />;
}
```

### Opcja B: Nowy projekt React

```bash
# Utwórz nowy projekt
npx create-react-app streamflow-frontend
cd streamflow-frontend

# Zainstaluj zależności
npm install lucide-react

# Zainstaluj Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

Skonfiguruj `tailwind.config.js`:
```javascript
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: { extend: {} },
  plugins: [],
}
```

Dodaj do `src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

Skopiuj i użyj komponentu:
```bash
cp ../streamflow-mvp/frontend/EventAggregatorDashboard.jsx src/
```

```jsx
// src/App.js
import EventAggregatorDashboard from './EventAggregatorDashboard';

function App() {
  return <EventAggregatorDashboard />;
}

export default App;
```

Uruchom:
```bash
npm start
```

---

## 🔗 Krok 5: Integracja Frontend ↔ Backend

Aby frontend komunikował się z API, dodaj konfigurację proxy lub zmień URL-e w komponencie.

### Opcja A: Proxy w package.json (development)

```json
{
  "proxy": "http://localhost:${API_PORT}"
}
```

### Opcja B: Zmienne środowiskowe

Utwórz `.env`:
```
REACT_APP_API_URL=http://localhost:${API_PORT}/api
```

W komponencie użyj:
```jsx
const API_URL = process.env.REACT_APP_API_URL || '/api';
```

---

## ✅ Weryfikacja instalacji

### Backend
```bash
# Sprawdź health
curl http://localhost:${API_PORT}/health
# Oczekiwana odpowiedź: {"status":"ok","timestamp":"..."}

# Sprawdź wydarzenia
curl http://localhost:${API_PORT}/api/events | python -m json.tool | head -20
```

### Generator dokumentów
```bash
# Sprawdź czy pliki istnieją
ls -la templates/*.docx
# Oczekiwane: oferta_runmageddon.docx, umowa_runmageddon.docx
```

### Frontend
```bash
# Po uruchomieniu npm start
# Otwórz http://localhost:3000
# Powinieneś zobaczyć dashboard StreamFlow
```

---

## 🐛 Rozwiązywanie problemów

### Problem: `ModuleNotFoundError: No module named 'fastapi'`
```bash
pip install fastapi uvicorn
```

### Problem: `Error: Cannot find module 'docx'`
```bash
cd templates && npm install docx
```

### Problem: Port ${API_PORT} zajęty
```bash
# Znajdź proces
lsof -i :${API_PORT}
# lub użyj innego portu
uvicorn api:app --port 8001
```

### Problem: CORS errors w przeglądarce
Backend już ma skonfigurowane CORS (`allow_origins=["*"]`), ale dla produkcji zmień na konkretne domeny w `api.py`.

### Problem: Brak danych w bazie
```bash
cd backend
python aggregator.py --sync
python aggregator.py --stats
```

---

## 📚 Dalsze kroki

1. **Dodaj własne źródła** - rozszerz `aggregator.py` o nowe scrapery
2. **Skonfiguruj email** - dodaj SMTP do wysyłki ofert
3. **Wdróż na serwer** - Docker, Heroku, VPS
4. **Dodaj autoryzację** - JWT, OAuth2

---

## 📞 Wsparcie

- **Dokumentacja**: `/docs/README.md`
- **Struktura projektu**: `/STRUCTURE.md`
- **Kontakt**: kontakt@prototypowanie.pl

---

*Instrukcja instalacji v1.0 | StreamFlow MVP | Grudzień 2025*
