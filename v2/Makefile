.PHONY: help install dev-install run test lint format clean
.PHONY: backend-install backend-dev-install backend-run backend-test backend-lint backend-format backend-clean
.PHONY: worker-install worker-dev-install worker-browsers worker-run worker-test worker-lint worker-format worker-clean
.PHONY: frontend-install frontend-run frontend-build frontend-lint frontend-clean
.PHONY: prod-build prod-up prod-down prod-logs prod-deploy

# Colors for output
CYAN := \033[36m
RESET := \033[0m

help:  ## Show this help message
	@echo "Linkwarden v2 - Makefile Commands"
	@echo ""
	@echo "$(CYAN)General Commands:$(RESET)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | grep -v "backend-\|worker-\|frontend-" | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(CYAN)%-20s$(RESET) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(CYAN)Backend Commands:$(RESET)"
	@grep -E '^backend-[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(CYAN)%-20s$(RESET) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(CYAN)Worker Commands:$(RESET)"
	@grep -E '^worker-[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(CYAN)%-20s$(RESET) %s\n", $$1, $$2}'

# ============================================================================
# General Commands (shortcuts)
# ============================================================================

setup-env:  ## Generate service environment files from root .env
	@./scripts/generate_env.sh

install: setup-env backend-install worker-install frontend-install  ## Install all dependencies

dev-install: setup-env backend-dev-install worker-dev-install  ## Install all dev dependencies

run:  ## Run backend, worker, and frontend together
	@trap 'kill 0' EXIT; \
	(cd backend && uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 2>&1 | sed 's/^/\x1b[36m[backend]\x1b[0m  /') & \
	(cd worker && uv run python -m worker.main 2>&1 | sed 's/^/\x1b[33m[worker]\x1b[0m   /') & \
	(cd frontend && npm run dev 2>&1 | sed 's/^/\x1b[35m[frontend]\x1b[0m /') & \
	wait

test: backend-test worker-test  ## Run all tests

lint: backend-lint worker-lint  ## Run all linters

format: backend-format worker-format  ## Format all code

clean: backend-clean worker-clean  ## Clean all cache files

migrate:  ## Run database migrations
	cd backend && uv run python -m app.migrate

# ============================================================================
# Backend Commands
# ============================================================================

backend-install:  ## Install backend dependencies
	cd backend && uv sync

backend-dev-install:  ## Install backend dev dependencies
	cd backend && uv sync --all-extras

backend-run:  ## Run backend development server
	cd backend && uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

backend-test:  ## Run backend tests
	cd backend && uv run pytest

backend-migrate:  ## Run database migrations
	cd backend && uv run python -m app.migrate

backend-lint:  ## Run backend linter
	cd backend && uv run ruff check .

backend-format:  ## Format backend code
	cd backend && uv run ruff format .

backend-clean:  ## Clean backend cache files
	cd backend && find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	cd backend && find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	cd backend && find . -type d -name ".ruff_cache" -exec rm -rf {} + 2>/dev/null || true
	cd backend && find . -type f -name "*.pyc" -delete
	cd backend && rm -rf .venv

# ============================================================================
# Worker Commands
# ============================================================================

READABILITY_VERSION ?= latest
READABILITY_URL = https://cdn.jsdelivr.net/npm/@mozilla/readability@$(READABILITY_VERSION)/Readability.min.js

worker-update-readability:  ## Update Readability.js to latest version
	@mkdir -p worker/worker/scripts
	curl -sL "$(READABILITY_URL)" -o worker/worker/scripts/Readability.min.js
	@echo "Downloaded Readability.js ($(READABILITY_VERSION))"

worker-install:  ## Install worker dependencies
	cd worker && uv sync
	@mkdir -p worker/worker/scripts
	curl -sL "$(READABILITY_URL)" -o worker/worker/scripts/Readability.min.js
	@echo "Downloaded Readability.js v$(READABILITY_VERSION)"

worker-dev-install:  ## Install worker dev dependencies
	cd worker && uv sync --all-extras
	@mkdir -p worker/worker/scripts
	curl -sL "$(READABILITY_URL)" -o worker/worker/scripts/Readability.min.js
	@echo "Downloaded Readability.js v$(READABILITY_VERSION)"

worker-browsers:  ## Install Playwright browsers
	cd worker && uv run playwright install chromium

worker-run:  ## Run worker process
	cd worker && uv run python -m worker.main

worker-test:  ## Run worker tests
	cd worker && uv run pytest

worker-lint:  ## Run worker linter
	cd worker && uv run ruff check .

worker-format:  ## Format worker code
	cd worker && uv run ruff format .

worker-clean:  ## Clean worker cache files
	cd worker && find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	cd worker && find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	cd worker && find . -type d -name ".ruff_cache" -exec rm -rf {} + 2>/dev/null || true
	cd worker && find . -type f -name "*.pyc" -delete
	cd worker && rm -rf .venv

# ============================================================================
# Frontend Commands
# ============================================================================

frontend-install:  ## Install frontend dependencies
	cd frontend && npm install

frontend-run:  ## Run frontend development server
	cd frontend && npm run dev

frontend-build:  ## Build frontend for production
	cd frontend && npm run build

frontend-lint:  ## Run frontend linter
	cd frontend && npm run lint

frontend-clean:  ## Clean frontend build artifacts
	cd frontend && rm -rf node_modules dist .vite

# ============================================================================
# Production Commands
# ============================================================================

prod-build:  ## Build production Docker image
	docker compose -f docker-compose.prod.yml build

prod-up:  ## Start production containers
	docker compose -f docker-compose.prod.yml up -d

prod-down:  ## Stop production containers
	docker compose -f docker-compose.prod.yml down

prod-logs:  ## View production logs
	docker compose -f docker-compose.prod.yml logs -f

prod-deploy:  ## Full production deployment (build + start)
	./deploy.sh --build
