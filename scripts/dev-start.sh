#!/bin/bash

# ConvAnalytics Development Start Script
# This script starts all development servers

echo "🚀 Starting ConvAnalytics Matrix Terminal Development Environment"
echo "================================================================="

# Check if required tools are installed
check_tool() {
    if ! command -v $1 &> /dev/null; then
        echo "❌ $1 is not installed. Please install it first."
        exit 1
    fi
}

echo "🔍 Checking prerequisites..."
check_tool node
check_tool npm
check_tool go
check_tool python3

# Function to run command in background and track PID
run_service() {
    local name=$1
    local command=$2
    local dir=$3
    
    echo "🔧 Starting $name..."
    cd "$dir"
    $command &
    local pid=$!
    echo "   → $name started with PID $pid"
    echo $pid >> /tmp/convanalytics_pids.txt
    cd - > /dev/null
}

# Clean up any existing PIDs file
rm -f /tmp/convanalytics_pids.txt

# Start backend services
echo ""
echo "🗄️  Starting Backend Services..."

# Start Go WebSocket server (if exists)
if [ -d "src/backend/go" ]; then
    echo "   Starting Go WebSocket server..."
    run_service "Go Server" "go run cmd/server/main.go" "src/backend/go"
else
    echo "   ⚠️  Go backend not found (will use mock data)"
fi

# Start Python AI service (if exists)
if [ -d "src/backend/python" ]; then
    echo "   Starting Python AI service..."
    run_service "Python AI" "python3 -m app.main" "src/backend/python"
else
    echo "   ⚠️  Python backend not found (will use simulated responses)"
fi

# Start frontend development server
echo ""
echo "🌐 Starting Frontend Development Server..."
cd src/frontend

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "   Installing frontend dependencies..."
    npm install
fi

echo "   Starting Vite development server..."
run_service "Frontend" "npm run dev" "src/frontend"

# Wait a moment for services to start
sleep 3

echo ""
echo "✅ All services started!"
echo "================================================================="
echo "🌐 Frontend:     http://localhost:3000"
echo "🔌 WebSocket:    ws://localhost:8080 (if Go server running)"
echo "🤖 Python API:  http://localhost:8000 (if Python server running)"
echo "================================================================="
echo ""
echo "📝 To stop all services, run: ./scripts/dev-stop.sh"
echo "📊 To view logs, check the terminal output above"
echo ""
echo "🎯 Open http://localhost:3000 in your browser to start using the Matrix Terminal!"

# Keep script running and show PIDs
echo ""
echo "Running services (PIDs stored in /tmp/convanalytics_pids.txt):"
if [ -f /tmp/convanalytics_pids.txt ]; then
    while read pid; do
        if ps -p $pid > /dev/null; then
            echo "   PID $pid: $(ps -p $pid -o comm=)"
        fi
    done < /tmp/convanalytics_pids.txt
fi

echo ""
echo "Press Ctrl+C to stop all services..."

# Wait for interrupt
wait
