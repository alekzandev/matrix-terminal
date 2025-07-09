#!/bin/bash

# ConvAnalytics Development Stop Script
# This script stops all development servers

echo "🛑 Stopping ConvAnalytics Development Environment"
echo "================================================="

# Function to stop service by PID
stop_service() {
    local pid=$1
    if ps -p $pid > /dev/null 2>&1; then
        echo "   Stopping PID $pid..."
        kill $pid
        sleep 1
        
        # Force kill if still running
        if ps -p $pid > /dev/null 2>&1; then
            echo "   Force stopping PID $pid..."
            kill -9 $pid
        fi
    fi
}

# Stop services from PID file
if [ -f /tmp/convanalytics_pids.txt ]; then
    echo "🔍 Found running services, stopping them..."
    
    while read pid; do
        if [ ! -z "$pid" ]; then
            stop_service $pid
        fi
    done < /tmp/convanalytics_pids.txt
    
    # Clean up PID file
    rm -f /tmp/convanalytics_pids.txt
    echo "   ✅ PID file cleaned up"
else
    echo "⚠️  No PID file found"
fi

# Also try to stop by process name as backup
echo ""
echo "🧹 Cleaning up any remaining processes..."

# Stop Node.js processes (Vite dev server)
pkill -f "vite" 2>/dev/null && echo "   Stopped Vite processes"

# Stop Go processes
pkill -f "go run cmd/server/main.go" 2>/dev/null && echo "   Stopped Go server processes"

# Stop Python processes
pkill -f "python.*app.main" 2>/dev/null && echo "   Stopped Python AI processes"

echo ""
echo "✅ All ConvAnalytics services stopped!"
echo "================================================="
