#!/bin/bash

echo "🔍 Checking for processes on port 5001..."

# Find and kill any process using port 5001
PID=$(lsof -ti:5001)

if [ -n "$PID" ]; then
    echo "⚠️  Found process $PID on port 5001. Killing it..."
    kill -9 $PID
    sleep 1
    echo "✅ Port 5001 is now free"
else
    echo "✅ Port 5001 is already free"
fi

echo "🚀 Starting Flask backend..."
python3 app.py
