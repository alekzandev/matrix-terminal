# Matrix Terminal Services Management
# ==================================

# Project configuration
PROJECT_NAME := ConvAnalytics
PROJECT_ROOT := $(shell pwd | grep -o '.*/ConvAnalytics' 2>/dev/null || echo "$(HOME)/projects/ConvAnalytics")
LOGS_DIR := $(PROJECT_ROOT)/logs
BACKEND_DIR := $(PROJECT_ROOT)/src/backend/go/cmd
FRONTEND_DIR := $(PROJECT_ROOT)/src/frontend
PYTHON_DIR := $(PROJECT_ROOT)/src/backend/python

# Colors for terminal output (Matrix-style)
GREEN := \033[32m
RED := \033[31m
YELLOW := \033[33m
CYAN := \033[36m
RESET := \033[0m

# Default target
.DEFAULT_GOAL := help

# Help target - Matrix Terminal style
help:
	@echo "$(GREEN)╔══════════════════════════════════════════╗$(RESET)"
	@echo "$(GREEN)║         Matrix Terminal Services         ║$(RESET)"
	@echo "$(GREEN)║           Delfos Referee v1.0            ║$(RESET)"
	@echo "$(GREEN)╚══════════════════════════════════════════╝$(RESET)"
	@echo ""
	@echo "$(CYAN)Available targets:$(RESET)"
	@echo "  $(YELLOW)setup$(RESET)           - Initialize project environment"
	@echo "  $(YELLOW)up$(RESET)              - Start all services (backend + frontend)"
	@echo "  $(YELLOW)up-backend$(RESET)      - Start Go API backend service"
	@echo "  $(YELLOW)up-frontend$(RESET)     - Start Lit frontend service"
	@echo "  $(YELLOW)up-python$(RESET)       - Start Python AI/NLP service"
	@echo "  $(YELLOW)down$(RESET)            - Stop all services"
	@echo "  $(YELLOW)down-backend$(RESET)    - Stop backend service"
	@echo "  $(YELLOW)down-frontend$(RESET)   - Stop frontend service"
	@echo "  $(YELLOW)down-python$(RESET)     - Stop Python service"
	@echo "  $(YELLOW)status$(RESET)          - Check services status"
	@echo "  $(YELLOW)logs$(RESET)            - Show live logs"
	@echo "  $(YELLOW)logs-backend$(RESET)    - Show backend logs"
	@echo "  $(YELLOW)logs-frontend$(RESET)   - Show frontend logs"
	@echo "  $(YELLOW)clean$(RESET)           - Clean logs and temporary files"
	@echo "  $(YELLOW)test$(RESET)            - Run integration tests"
	@echo ""

# Verify project structure and create necessary directories
setup:
	@echo "$(GREEN)🚀 Setting up Matrix Terminal environment...$(RESET)"
	@if [ ! -d "$(PROJECT_ROOT)" ]; then \
        echo "$(RED)❌ Error: ConvAnalytics project root not found at $(PROJECT_ROOT)$(RESET)"; \
        exit 1; \
    fi
	@echo "$(GREEN)✅ Project root verified: $(PROJECT_ROOT)$(RESET)"
    
	@if [ ! -d "$(LOGS_DIR)" ]; then \
        echo "$(YELLOW)📁 Creating logs directory...$(RESET)"; \
        mkdir -p "$(LOGS_DIR)"; \
    fi
	@echo "$(GREEN)✅ Logs directory ready: $(LOGS_DIR)$(RESET)"
    
	@if [ ! -d "$(BACKEND_DIR)" ]; then \
        echo "$(RED)❌ Error: Backend directory not found at $(BACKEND_DIR)$(RESET)"; \
        exit 1; \
    fi
	@echo "$(GREEN)✅ Backend directory verified$(RESET)"
    
	@if [ ! -d "$(FRONTEND_DIR)" ]; then \
        echo "$(RED)❌ Error: Frontend directory not found at $(FRONTEND_DIR)$(RESET)"; \
        exit 1; \
    fi
	@echo "$(GREEN)✅ Frontend directory verified$(RESET)"
    
	@if [ ! -d "$(PYTHON_DIR)" ]; then \
        echo "$(YELLOW)📁 Creating Python AI/NLP directory...$(RESET)"; \
        mkdir -p "$(PYTHON_DIR)"; \
    fi
	@echo "$(GREEN)✅ Python directory ready$(RESET)"
    
	@echo "$(GREEN)🎯 Matrix Terminal environment ready!$(RESET)"

# Start all services
up: setup
	@echo "$(GREEN)🚀 Starting Matrix Terminal services...$(RESET)"
	@$(MAKE) up-backend
	@sleep 2
	@$(MAKE) up-frontend
# 	@$(MAKE) up-python
	@echo "$(GREEN)✅ All Matrix Terminal services started!$(RESET)"
	@echo "$(CYAN)🌐 Frontend: http://localhost:3000$(RESET)"
	@echo "$(CYAN)🔧 Backend:  http://localhost:8080$(RESET)"
# 	@echo "$(CYAN)🤖 Python:   http://localhost:8000$(RESET)"

# Start Go backend service
up-backend: setup
	@echo "$(GREEN)📡 Starting Go API backend...$(RESET)"
	@if pgrep -f "go run main.go" > /dev/null; then \
        echo "$(YELLOW)⚠️  Backend already running$(RESET)"; \
    else \
        cd "$(BACKEND_DIR)" && \
        nohup go run main.go >> "$(LOGS_DIR)/backend.log" 2>&1 & \
        echo $$! > "$(LOGS_DIR)/backend.pid"; \
        echo "$(GREEN)✅ Backend started (PID: $$(cat $(LOGS_DIR)/backend.pid))$(RESET)"; \
    fi

# Start Lit frontend service
up-frontend: setup
	@echo "$(GREEN)🖥️  Starting Lit frontend...$(RESET)"
	@if pgrep -f "npm run dev" > /dev/null; then \
        echo "$(YELLOW)⚠️  Frontend already running$(RESET)"; \
    else \
        cd "$(FRONTEND_DIR)" && \
        nohup npm run dev >> "$(LOGS_DIR)/frontend.log" 2>&1 & \
        echo $$! > "$(LOGS_DIR)/frontend.pid"; \
        echo "$(GREEN)✅ Frontend started (PID: $$(cat $(LOGS_DIR)/frontend.pid))$(RESET)"; \
    fi

# Start Python AI/NLP service
up-python: setup
	@echo "$(GREEN)🤖 Starting Python AI/NLP service...$(RESET)"
	@if [ -f "$(PYTHON_DIR)/main.py" ]; then \
        if pgrep -f "python.*main.py" > /dev/null; then \
            echo "$(YELLOW)⚠️  Python service already running$(RESET)"; \
        else \
            cd "$(PYTHON_DIR)" && \
            nohup python main.py > "$(LOGS_DIR)/python.log" 2>&1 & \
            echo $$! > "$(LOGS_DIR)/python.pid"; \
            echo "$(GREEN)✅ Python service started (PID: $$(cat $(LOGS_DIR)/python.pid))$(RESET)"; \
        fi; \
    else \
        echo "$(YELLOW)⚠️  Python service not implemented yet$(RESET)"; \
    fi

# Stop all services
down:
	@echo "$(RED)🛑 Stopping Matrix Terminal services...$(RESET)"
	@$(MAKE) down-backend
	@$(MAKE) down-frontend
# 	@$(MAKE) down-python
	@echo "$(GREEN)✅ All services stopped$(RESET)"

# Stop backend service
down-backend:
	@echo "$(RED)📡 Stopping backend...$(RESET)"
	@if [ -f "$(LOGS_DIR)/backend.pid" ]; then \
        if kill -0 $$(cat "$(LOGS_DIR)/backend.pid") 2>/dev/null; then \
            kill $$(cat "$(LOGS_DIR)/backend.pid"); \
            kill $(shell lsof -i tcp:8080 -t); \
            rm -f "$(LOGS_DIR)/backend.pid"; \
            echo "$(GREEN)✅ Backend stopped$(RESET)"; \
        else \
            rm -f "$(LOGS_DIR)/backend.pid"; \
            echo "$(YELLOW)⚠️  Backend was not running$(RESET)"; \
        fi; \
    else \
        echo "$(YELLOW)⚠️  Backend PID file not found$(RESET)"; \
    fi
	@pkill -f "go run main.go" 2>/dev/null || true

# Stop frontend service
down-frontend:
	@echo "$(RED)🖥️  Stopping frontend...$(RESET)"
	@if [ -f "$(LOGS_DIR)/frontend.pid" ]; then \
        if kill -0 $$(cat "$(LOGS_DIR)/frontend.pid") 2>/dev/null; then \
            kill $$(cat "$(LOGS_DIR)/frontend.pid"); \
            rm -f "$(LOGS_DIR)/frontend.pid"; \
            echo "$(GREEN)✅ Frontend stopped$(RESET)"; \
        else \
            rm -f "$(LOGS_DIR)/frontend.pid"; \
            echo "$(YELLOW)⚠️  Frontend was not running$(RESET)"; \
        fi; \
    else \
        echo "$(YELLOW)⚠️  Frontend PID file not found$(RESET)"; \
    fi
	@pkill -f "npm run dev" 2>/dev/null || true

# Stop Python service
down-python:
	@echo "$(RED)🤖 Stopping Python service...$(RESET)"
	@if [ -f "$(LOGS_DIR)/python.pid" ]; then \
        if kill -0 $$(cat "$(LOGS_DIR)/python.pid") 2>/dev/null; then \
            kill $$(cat "$(LOGS_DIR)/python.pid"); \
            rm -f "$(LOGS_DIR)/python.pid"; \
            echo "$(GREEN)✅ Python service stopped$(RESET)"; \
        else \
            rm -f "$(LOGS_DIR)/python.pid"; \
            echo "$(YELLOW)⚠️  Python service was not running$(RESET)"; \
        fi; \
    else \
        echo "$(YELLOW)⚠️  Python service PID file not found$(RESET)"; \
    fi
	@pkill -f "python.*main.py" 2>/dev/null || true

# Check services status
status: setup
	@echo "$(CYAN)📊 Matrix Terminal Status$(RESET)"
	@echo "$(CYAN)========================$(RESET)"
	@echo "$(CYAN)Project: $(PROJECT_ROOT)$(RESET)"
	@echo ""
    
	@echo "$(YELLOW)📡 Backend (Go):$(RESET)"
	@if [ -f "$(LOGS_DIR)/backend.pid" ] && kill -0 $$(cat "$(LOGS_DIR)/backend.pid") 2>/dev/null; then \
        echo "   $(GREEN)✅ Running (PID: $$(cat $(LOGS_DIR)/backend.pid))$(RESET)"; \
        curl -s http://localhost:8080/winner/count > /dev/null && \
        echo "   $(GREEN)🔗 API: Responding$(RESET)" || \
        echo "   $(RED)🔗 API: Not responding$(RESET)"; \
    else \
        echo "   $(RED)❌ Not running$(RESET)"; \
    fi
    
	@echo "$(YELLOW)🖥️  Frontend (Lit):$(RESET)"
	@if [ -f "$(LOGS_DIR)/frontend.pid" ] && kill -0 $$(cat "$(LOGS_DIR)/frontend.pid") 2>/dev/null; then \
        echo "   $(GREEN)✅ Running (PID: $$(cat $(LOGS_DIR)/frontend.pid))$(RESET)"; \
        curl -s http://localhost:3000 > /dev/null && \
        echo "   $(GREEN)🌐 Web: Accessible$(RESET)" || \
        echo "   $(RED)🌐 Web: Not accessible$(RESET)"; \
    else \
        echo "   $(RED)❌ Not running$(RESET)"; \
    fi
    
	@echo "$(YELLOW)🤖 Python (AI/NLP):$(RESET)"
	@if [ -f "$(LOGS_DIR)/python.pid" ] && kill -0 $$(cat "$(LOGS_DIR)/python.pid") 2>/dev/null; then \
        echo "   $(GREEN)✅ Running (PID: $$(cat $(LOGS_DIR)/python.pid))$(RESET)"; \
    else \
        echo "   $(RED)❌ Not running$(RESET)"; \
    fi

# Show live logs for all services
logs:
	@echo "$(CYAN)📄 Matrix Terminal Live Logs$(RESET)"
	@echo "$(CYAN)=============================$(RESET)"
	@if [ -f "$(LOGS_DIR)/backend.log" ] || [ -f "$(LOGS_DIR)/frontend.log" ] || [ -f "$(LOGS_DIR)/python.log" ]; then \
        tail -f "$(LOGS_DIR)"/*.log 2>/dev/null; \
    else \
        echo "$(YELLOW)⚠️  No log files found$(RESET)"; \
    fi

# Show backend logs
logs-backend:
	@if [ -f "$(LOGS_DIR)/backend.log" ]; then \
        echo "$(CYAN)📡 Backend Logs:$(RESET)"; \
        tail -f "$(LOGS_DIR)/backend.log"; \
    else \
        echo "$(YELLOW)⚠️  Backend log file not found$(RESET)"; \
    fi

# Show frontend logs
logs-frontend:
	@if [ -f "$(LOGS_DIR)/frontend.log" ]; then \
        echo "$(CYAN)🖥️  Frontend Logs:$(RESET)"; \
        tail -f "$(LOGS_DIR)/frontend.log"; \
    else \
        echo "$(YELLOW)⚠️  Frontend log file not found$(RESET)"; \
    fi

# Clean logs and temporary files
clean:
	@echo "$(YELLOW)🧹 Cleaning Matrix Terminal files...$(RESET)"
	@rm -f "$(LOGS_DIR)"/*.log
	@rm -f "$(LOGS_DIR)"/*.pid
	@rm -rf "$(FRONTEND_DIR)/dist"
	@rm -rf "$(FRONTEND_DIR)/node_modules/.vite"
	@echo "$(GREEN)✅ Cleanup completed$(RESET)"
	@rm -rf "$(BACKEND_DIR)/data"
	@echo "$(GREEN)✅ Sessions data cleaned$(RESET)"

# Run integration tests
test: setup
	@echo "$(CYAN)🧪 Running Matrix Terminal tests...$(RESET)"
	@if [ -f "tests/integration/test-api-integration.sh" ]; then \
        chmod +x tests/integration/test-api-integration.sh; \
        ./tests/integration/test-api-integration.sh; \
    else \
        echo "$(YELLOW)⚠️  Integration tests not found$(RESET)"; \
    fi
	@if [ -f "$(FRONTEND_DIR)/package.json" ]; then \
        cd "$(FRONTEND_DIR)" && npm test 2>/dev/null || echo "$(YELLOW)⚠️  Frontend tests not configured$(RESET)"; \
    fi

# Development shortcuts
dev: up
restart: down up
rebuild: clean setup up

# Install dependencies
install:
	@echo "$(GREEN)📦 Installing Matrix Terminal dependencies...$(RESET)"
	@if [ -f "$(FRONTEND_DIR)/package.json" ]; then \
        cd "$(FRONTEND_DIR)" && npm install; \
        echo "$(GREEN)✅ Frontend dependencies installed$(RESET)"; \
    fi
	@if [ -f "$(PYTHON_DIR)/requirements.txt" ]; then \
        cd "$(PYTHON_DIR)" && pip install -r requirements.txt; \
        echo "$(GREEN)✅ Python dependencies installed$(RESET)"; \
    fi
	@echo "$(GREEN)✅ Go dependencies will be downloaded on first run$(RESET)"

# Deploy to production (EC2)
deploy:
	@echo "$(GREEN)🚀 Deploying Matrix Terminal to production...$(RESET)"
	@if [ -f "$(FRONTEND_DIR)/package.json" ]; then \
        cd "$(FRONTEND_DIR)" && npm run build; \
        echo "$(GREEN)✅ Frontend built for production$(RESET)"; \
    fi
	@echo "$(CYAN)📡 Ready for EC2 deployment$(RESET)"

.PHONY: help setup up up-backend up-frontend up-python down down-backend down-frontend down-python status logs logs-backend logs-frontend clean test dev restart rebuild install deploy