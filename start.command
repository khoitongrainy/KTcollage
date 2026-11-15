#!/usr/bin/env bash
cd "$(dirname "$0")"
echo "Starting CollageStudio..."
python3 -m http.server 8080 &
SERVER_PID=$!
sleep 1
open "http://localhost:8080"
echo "CollageStudio is running at http://localhost:8080"
echo "Press Ctrl+C to stop the server."
wait $SERVER_PID
