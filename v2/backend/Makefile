.PHONY: help install dev-install run test lint format clean sync

help:  ## Show this help message
	@echo "Linkwarden Backend - Makefile Commands"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'

sync:  ## Sync dependencies with uv
	uv sync

install:  ## Install dependencies (alias for sync)
	uv sync

dev-install:  ## Install development dependencies
	uv sync --all-extras

run:  ## Run the development server
	uv run uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

test:  ## Run tests
	uv run pytest

lint:  ## Run linter
	uv run ruff check .

format:  ## Format code
	uv run ruff format .

clean:  ## Clean up cache files
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".ruff_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type f -name "*.pyc" -delete
	rm -rf .venv
