.PHONY: help install dev-install run test lint format clean
.PHONY: backend-install backend-dev-install backend-run backend-test backend-lint backend-format backend-clean

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

# ============================================================================
# General Commands (shortcuts)
# ============================================================================

install: backend-install  ## Install all dependencies

dev-install: backend-dev-install  ## Install all dev dependencies

run: backend-run  ## Run all services (currently just backend)

test: backend-test  ## Run all tests

lint: backend-lint  ## Run all linters

format: backend-format  ## Format all code

clean: backend-clean  ## Clean all cache files

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
# Worker Commands (To be implemented)
# ============================================================================

# worker-install:  ## Install worker dependencies
# 	cd worker && uv sync

# ============================================================================
# Frontend Commands (To be implemented)
# ============================================================================

# frontend-install:  ## Install frontend dependencies
# 	cd frontend && npm install
