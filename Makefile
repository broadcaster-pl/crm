# ╔═══════════════════════════════════════════════════════════════════════════╗
# ║                    StreamFlow MVP - Makefile                               ║
# ║                                                                            ║
# ║  Główne komendy:                                                          ║
# ║    make help      - Pokaż pomoc                                           ║
# ║    make install   - Zainstaluj zależności                                 ║
# ║    make test      - Uruchom testy                                         ║
# ║    make run       - Uruchom backend                                       ║
# ║    make docker-up - Uruchom w Docker                                      ║
# ║    make package   - Stwórz paczkę ZIP                                     ║
# ╚═══════════════════════════════════════════════════════════════════════════╝

.PHONY: help install test run stop clean docker-build docker-up docker-down docker-test \
        generate-docs lint format package publish dev frontend test-gui all check docker-frontend-up

# ============= KONFIGURACJA =============
PYTHON := $(shell if [ -x "$(CURDIR)/venv/bin/python3" ]; then echo "$(CURDIR)/venv/bin/python3"; elif [ -x "$(CURDIR)/backend/venv/bin/python3" ]; then echo "$(CURDIR)/backend/venv/bin/python3"; else echo python3; fi)
PIP := $(shell if [ -x "$(CURDIR)/venv/bin/pip3" ]; then echo "$(CURDIR)/venv/bin/pip3"; elif [ -x "$(CURDIR)/backend/venv/bin/pip3" ]; then echo "$(CURDIR)/backend/venv/bin/pip3"; else echo pip3; fi)
NPM := npm
DOCKER := docker
DOCKER_COMPOSE := docker compose
PROJECT_NAME := streamflow-mvp
VERSION := 1.0.0
IMAGE_NAME := streamflow
REGISTRY := ghcr.io/softreck

-include .env

API_HOST ?= 0.0.0.0
API_PORT ?= 8004

export API_HOST
export API_PORT
export DATABASE_PATH

# Kolory
BLUE := \033[34m
GREEN := \033[32m
YELLOW := \033[33m
RED := \033[31m
NC := \033[0m

# ============= POMOC =============
help: ## Pokaż tę pomoc
	@echo ""
	@echo "$(BLUE)╔═══════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║          StreamFlow MVP - Dostępne komendy                    ║$(NC)"
	@echo "$(BLUE)╚═══════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""

# ============= INSTALACJA =============
install: install-backend install-frontend install-templates ## Zainstaluj wszystkie zależności
	@echo "$(GREEN)✓ Wszystkie zależności zainstalowane$(NC)"

install-backend: ## Zainstaluj zależności Python
	@echo "$(BLUE)→ Instaluję zależności Python...$(NC)"
	cd backend && $(PIP) install -r requirements.txt
	@echo "$(GREEN)✓ Backend zainstalowany$(NC)"

install-frontend: ## Zainstaluj zależności React
	@echo "$(BLUE)→ Instaluję zależności React...$(NC)"
	@if [ -f frontend/package.json ]; then \
		cd frontend && $(NPM) install; \
	else \
		echo "Folder frontend wymaga inicjalizacji projektu React"; \
	fi
	@echo "$(GREEN)✓ Frontend gotowy$(NC)"

install-templates: ## Zainstaluj zależności generatora dokumentów
	@echo "$(BLUE)→ Instaluję zależności Node.js...$(NC)"
	cd templates && $(NPM) install
	@echo "$(GREEN)✓ Generator dokumentów gotowy$(NC)"

# ============= TESTOWANIE =============
test: test-backend test-templates ## Uruchom wszystkie testy
	@echo "$(GREEN)✓ Wszystkie testy zakończone$(NC)"

test-backend: ## Uruchom testy Python
	@echo "$(BLUE)→ Uruchamiam testy Python...$(NC)"
	cd backend && $(PYTHON) -m pytest -v --tb=short
	@echo "$(GREEN)✓ Testy Python zakończone$(NC)"

test-coverage: ## Uruchom testy z pokryciem kodu
	@echo "$(BLUE)→ Uruchamiam testy z coverage...$(NC)"
	cd backend && $(PYTHON) -m pytest -v --cov=. --cov-report=html --cov-report=term-missing
	@echo "$(GREEN)✓ Raport coverage w backend/htmlcov/$(NC)"

test-templates: ## Uruchom testy generatora dokumentów
	@echo "$(BLUE)→ Uruchamiam testy Node.js...$(NC)"
	cd templates && $(NPM) test
	@echo "$(GREEN)✓ Testy Node.js zakończone$(NC)"

test-watch: ## Uruchom testy w trybie watch
	cd backend && $(PYTHON) -m pytest --watch

# ============= URUCHOMIENIE =============
run: ## Uruchom backend (development)
	@echo "$(BLUE)→ Uruchamiam backend API...$(NC)"
	@echo "$(GREEN)API dostępne pod: http://localhost:$(API_PORT)$(NC)"
	@echo "$(GREEN)Swagger UI: http://localhost:$(API_PORT)/docs$(NC)"
	cd backend && $(PYTHON) -m uvicorn api:app --reload --host $(API_HOST) --port $(API_PORT)

stop: ## Zatrzymaj backend (local + Docker) i zwolnij port API
	@echo "$(BLUE)→ Zatrzymuję backend...$(NC)"
	@$(DOCKER_COMPOSE) stop api 2>/dev/null || true
	@$(DOCKER_COMPOSE) rm -f api 2>/dev/null || true
	@if command -v lsof >/dev/null 2>&1; then \
		PIDS=$$(lsof -ti tcp:$(API_PORT) 2>/dev/null); \
		if [ -n "$$PIDS" ]; then \
			echo "$(YELLOW)→ Ubijam proces(y) na porcie $(API_PORT): $$PIDS$(NC)"; \
			kill $$PIDS 2>/dev/null || true; \
		fi; \
	elif command -v fuser >/dev/null 2>&1; then \
		echo "$(YELLOW)→ Ubijam proces(y) na porcie $(API_PORT) przez fuser$(NC)"; \
		fuser -k $(API_PORT)/tcp 2>/dev/null || true; \
	else \
		echo "$(YELLOW)Brak lsof/fuser - nie mogę automatycznie zwolnić portu $(API_PORT)$(NC)"; \
	fi
	@echo "$(GREEN)✓ Zatrzymano$(NC)"

run-sync: ## Uruchom synchronizację wydarzeń
	@echo "$(BLUE)→ Synchronizuję wydarzenia...$(NC)"
	cd backend && $(PYTHON) aggregator.py --sync

run-stats: ## Pokaż statystyki
	cd backend && $(PYTHON) aggregator.py --stats

frontend: ## Uruchom frontend (wymaga create-react-app)
	@echo "$(BLUE)→ Uruchamiam frontend...$(NC)"
	cd frontend && $(NPM) run dev -- --host 0.0.0.0 --port 3000

test-gui: ## Uruchom testy GUI (Playwright)
	@echo "$(BLUE)→ Uruchamiam testy GUI (Playwright)...$(NC)"
	cd frontend && $(NPM) install
	cd frontend && npx playwright install
	cd frontend && $(NPM) run test:gui
	@echo "$(GREEN)✓ Testy GUI zakończone$(NC)"

dev: ## Uruchom backend + frontend (wymaga tmux lub screen)
	@echo "$(YELLOW)Uruchom w osobnych terminalach:$(NC)"
	@echo "  Terminal 1: make run"
	@echo "  Terminal 2: make frontend"

# ============= DOCKER =============
docker-build: ## Zbuduj obrazy Docker
	@echo "$(BLUE)→ Buduję obrazy Docker...$(NC)"
	$(DOCKER) build -t $(IMAGE_NAME):$(VERSION) -t $(IMAGE_NAME):latest .
	$(DOCKER) build -t $(IMAGE_NAME)-test:$(VERSION) -f Dockerfile.test .
	@echo "$(GREEN)✓ Obrazy zbudowane$(NC)"

docker-up: ## Uruchom w Docker (backend)
	@echo "$(BLUE)→ Uruchamiam kontenery...$(NC)"
	$(DOCKER_COMPOSE) up -d api
	@echo "$(GREEN)✓ Backend uruchomiony: http://localhost:$(API_PORT)$(NC)"

docker-frontend-up: ## Uruchom frontend (Docker Compose)
	@echo "$(BLUE)→ Uruchamiam frontend...$(NC)"
	$(DOCKER_COMPOSE) --profile frontend up -d frontend
	@echo "$(GREEN)✓ Frontend uruchomiony: http://localhost:3000$(NC)"

docker-down: ## Zatrzymaj kontenery Docker
	@echo "$(BLUE)→ Zatrzymuję kontenery...$(NC)"
	$(DOCKER_COMPOSE) down
	@echo "$(GREEN)✓ Kontenery zatrzymane$(NC)"

docker-test: ## Uruchom testy w Docker
	@echo "$(BLUE)→ Uruchamiam testy w Docker...$(NC)"
	$(DOCKER_COMPOSE) run --rm test
	@echo "$(GREEN)✓ Testy Docker zakończone$(NC)"

docker-logs: ## Pokaż logi kontenerów
	$(DOCKER_COMPOSE) logs -f

docker-shell: ## Otwórz shell w kontenerze
	$(DOCKER_COMPOSE) exec api /bin/bash

docker-clean: ## Usuń wszystkie obrazy projektu
	@echo "$(BLUE)→ Czyszczę obrazy Docker...$(NC)"
	$(DOCKER) rmi $(IMAGE_NAME):$(VERSION) $(IMAGE_NAME):latest $(IMAGE_NAME)-test:$(VERSION) 2>/dev/null || true
	$(DOCKER_COMPOSE) down -v --rmi all 2>/dev/null || true
	@echo "$(GREEN)✓ Obrazy usunięte$(NC)"

# ============= GENEROWANIE DOKUMENTÓW =============
generate-docs: ## Wygeneruj przykładowe dokumenty DOCX
	@echo "$(BLUE)→ Generuję dokumenty...$(NC)"
	cd templates && node document-generator.js
	@echo "$(GREEN)✓ Dokumenty wygenerowane w templates/$(NC)"

# ============= JAKOŚĆ KODU =============
lint: ## Sprawdź jakość kodu
	@echo "$(BLUE)→ Sprawdzam kod Python...$(NC)"
	cd backend && $(PYTHON) -m flake8 --max-line-length=120 --exclude=__pycache__,.pytest_cache *.py || true
	@echo "$(GREEN)✓ Linting zakończony$(NC)"

format: ## Sformatuj kod
	@echo "$(BLUE)→ Formatuję kod Python...$(NC)"
	cd backend && $(PYTHON) -m black --line-length=100 *.py || echo "$(YELLOW)Zainstaluj black: pip install black$(NC)"
	cd backend && $(PYTHON) -m isort *.py || echo "$(YELLOW)Zainstaluj isort: pip install isort$(NC)"
	@echo "$(GREEN)✓ Formatowanie zakończone$(NC)"

check: lint test ## Sprawdź kod i uruchom testy

# ============= PUBLIKACJA =============
package: clean ## Stwórz paczkę ZIP do dystrybucji
	@echo "$(BLUE)→ Tworzę paczkę $(PROJECT_NAME)-$(VERSION).zip...$(NC)"
	@mkdir -p dist
	zip -r dist/$(PROJECT_NAME)-$(VERSION).zip . \
		-x "*.git*" \
		-x "*node_modules*" \
		-x "*__pycache__*" \
		-x "*.pytest_cache*" \
		-x "*.pyc" \
		-x "*.db" \
		-x "*.sqlite*" \
		-x "dist/*" \
		-x "data/*" \
		-x "coverage/*" \
		-x "htmlcov/*" \
		-x ".env*" \
		-x "*.log"
	@echo "$(GREEN)✓ Paczka utworzona: dist/$(PROJECT_NAME)-$(VERSION).zip$(NC)"
	@ls -lh dist/$(PROJECT_NAME)-$(VERSION).zip

publish-docker: docker-build ## Opublikuj obraz Docker do registry
	@echo "$(BLUE)→ Publikuję obraz do $(REGISTRY)...$(NC)"
	$(DOCKER) tag $(IMAGE_NAME):$(VERSION) $(REGISTRY)/$(IMAGE_NAME):$(VERSION)
	$(DOCKER) tag $(IMAGE_NAME):latest $(REGISTRY)/$(IMAGE_NAME):latest
	$(DOCKER) push $(REGISTRY)/$(IMAGE_NAME):$(VERSION)
	$(DOCKER) push $(REGISTRY)/$(IMAGE_NAME):latest
	@echo "$(GREEN)✓ Obraz opublikowany$(NC)"

publish-github: package ## Opublikuj release na GitHub
	@echo "$(BLUE)→ Tworzę release GitHub...$(NC)"
	@if command -v gh &> /dev/null; then \
		gh release create v$(VERSION) dist/$(PROJECT_NAME)-$(VERSION).zip \
			--title "StreamFlow MVP v$(VERSION)" \
			--notes "Release $(VERSION)"; \
		echo "$(GREEN)✓ Release utworzony$(NC)"; \
	else \
		echo "$(YELLOW)Zainstaluj GitHub CLI: https://cli.github.com/$(NC)"; \
	fi

# ============= CZYSZCZENIE =============
clean: ## Wyczyść pliki tymczasowe
	@echo "$(BLUE)→ Czyszczę pliki tymczasowe...$(NC)"
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "node_modules" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "htmlcov" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "coverage" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete 2>/dev/null || true
	find . -type f -name "*.db" -delete 2>/dev/null || true
	find . -type f -name ".coverage" -delete 2>/dev/null || true
	rm -rf dist/ 2>/dev/null || true
	@echo "$(GREEN)✓ Wyczyszczono$(NC)"

clean-all: clean docker-clean ## Wyczyść wszystko (włącznie z Docker)
	@echo "$(GREEN)✓ Wszystko wyczyszczono$(NC)"

# ============= INICJALIZACJA =============
init: ## Inicjalizuj projekt (pierwszy raz)
	@echo "$(BLUE)→ Inicjalizuję projekt...$(NC)"
	@mkdir -p data output logs
	@cp -n .env.example .env 2>/dev/null || true
	$(MAKE) install
	$(MAKE) run-sync
	@echo "$(GREEN)✓ Projekt zainicjalizowany$(NC)"
	@echo ""
	@echo "$(YELLOW)Następne kroki:$(NC)"
	@echo "  1. make run     - Uruchom backend"
	@echo "  2. make test    - Uruchom testy"
	@echo "  3. make docker-up - Uruchom w Docker"

# ============= INFO =============
info: ## Pokaż informacje o projekcie
	@echo ""
	@echo "$(BLUE)╔═══════════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║                    StreamFlow MVP                              ║$(NC)"
	@echo "$(BLUE)╚═══════════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "  $(GREEN)Wersja:$(NC)       $(VERSION)"
	@echo "  $(GREEN)Projekt:$(NC)      $(PROJECT_NAME)"
	@echo "  $(GREEN)Registry:$(NC)     $(REGISTRY)"
	@echo ""
	@echo "  $(GREEN)Backend:$(NC)      http://localhost:$(API_PORT)"
	@echo "  $(GREEN)Swagger:$(NC)      http://localhost:$(API_PORT)/docs"
	@echo "  $(GREEN)Frontend:$(NC)     http://localhost:3000"
	@echo ""

# ============= WSZYSTKO =============
all: install test docker-build package ## Zbuduj wszystko
	@echo "$(GREEN)✓ Wszystko zbudowane pomyślnie!$(NC)"
