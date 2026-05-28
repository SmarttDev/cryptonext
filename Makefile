# Auto-detect compose runner: real docker first, then podman-compose.
ifeq ($(shell command -v docker 2>/dev/null),)
  ifeq ($(shell command -v podman-compose 2>/dev/null),)
    $(error Neither "docker" nor "podman-compose" found in PATH)
  endif
  COMPOSE := podman-compose
else
  COMPOSE := docker compose
endif

PROD_FILES := -f docker-compose.yml
DEV_FILES  := -f docker-compose.yml -f docker-compose.dev.yml

.PHONY: help up up-build dev dev-build stop down clean logs ps reset test test-watch

help:
	@echo "Compose runner: $(COMPOSE)"
	@echo ""
	@echo "Targets:"
	@echo "  make up         - start prod stack"
	@echo "  make up-build   - rebuild + start prod stack"
	@echo "  make dev        - start dev stack (hot reload)"
	@echo "  make dev-build  - rebuild + start dev stack"
	@echo "  make stop       - stop containers (keep volumes)"
	@echo "  make down       - stop + remove containers (keep named volumes)"
	@echo "  make clean      - down + remove named volumes (loses db data)"
	@echo "  make reset      - clean + dev-build (full nuke and rebuild)"
	@echo "  make logs       - tail logs"
	@echo "  make ps         - list containers"
	@echo "  make test       - run backend aggregation tests (requires postgres up)"
	@echo "  make test-watch - vitest watch mode"

up:
	$(COMPOSE) $(PROD_FILES) up

up-build:
	$(COMPOSE) $(PROD_FILES) up --build

dev:
	$(COMPOSE) $(DEV_FILES) up

dev-build:
	$(COMPOSE) $(DEV_FILES) up --build

# Workaround for podman-compose teardown bug: stop then force-rm.
stop:
	-$(COMPOSE) $(DEV_FILES) stop

down: stop
	-$(COMPOSE) $(DEV_FILES) rm -f

clean: down
	-$(COMPOSE) $(DEV_FILES) down -v --remove-orphans

reset: clean dev-build

logs:
	$(COMPOSE) $(DEV_FILES) logs -f

ps:
	$(COMPOSE) $(DEV_FILES) ps

# Tests run against the cryptonext_test database created by init-test-db.sql.
# Postgres must be up: `make dev` (or just postgres via compose).
TEST_DB_URL ?= postgres://cryptonext:cryptonext@localhost:5432/cryptonext_test
test:
	TEST_DATABASE_URL=$(TEST_DB_URL) pnpm --filter backend test

test-watch:
	TEST_DATABASE_URL=$(TEST_DB_URL) pnpm --filter backend test:watch
