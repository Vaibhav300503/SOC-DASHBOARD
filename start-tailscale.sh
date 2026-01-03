#!/bin/bash

echo "========================================"
echo "   SOC Dashboard - Tailscale Setup"
echo "========================================"
echo

echo "🔧 Starting Backend Server (Port 3002)..."
cd backend && npm start &
BACKEND_PID=$!

echo
echo "⏳ Waiting for backend to start..."
sleep 5

echo
echo "🎨 Starting Frontend Server (Port 3000)..."
cd .. && npm run dev &
FRONTEND_PID=$!

echo
echo "========================================"
echo "✅ SOC Dashboard Started Successfully!"
echo "========================================"
echo
echo "🌐 Access URLs:"
echo "   Local Frontend:     http://localhost:3000"
echo "   Tailscale Frontend: http://100.100.83.123:3000"
echo
echo "   Local Backend:      http://localhost:3002"
echo "   Tailscale Backend:  http://100.100.83.123:3002"
echo
echo "📡 API Endpoints:"
echo "   Health Check:       http://100.100.83.123:3002/health"
echo "   Test API:          http://100.100.83.123:3002/api/test"
echo "   Database Test:     http://100.100.83.123:3002/api/test/db"
echo
echo "🔗 WebSocket:"
echo "   Tailscale Stream:  ws://100.100.83.123:3002/ws/tailscale"
echo
echo "Press Ctrl+C to stop all services..."

# Wait for interrupt
trap 'echo "Stopping services..."; kill $BACKEND_PID $FRONTEND_PID; exit' INT
wait