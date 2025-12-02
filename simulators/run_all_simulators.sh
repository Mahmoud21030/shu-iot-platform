#!/bin/bash
# Script to run multiple IoT device simulators for the SHU Smart Campus

# Configuration
PLATFORM_URL="${PLATFORM_URL:-http://localhost:3000}"
UPDATE_INTERVAL="${UPDATE_INTERVAL:-10}"

echo "=========================================="
echo "SHU IoT Platform - Device Simulator Suite"
echo "=========================================="
echo "Platform URL: $PLATFORM_URL"
echo "Update Interval: $UPDATE_INTERVAL seconds"
echo "=========================================="
echo ""

# Make the Python script executable
chmod +x device_simulator.py

# Function to start a simulator in the background
start_simulator() {
    local device_id=$1
    local name=$2
    local type=$3
    local location=$4
    
    echo "Starting: $name ($device_id)"
    python3 device_simulator.py \
        --url "$PLATFORM_URL" \
        --device-id "$device_id" \
        --name "$name" \
        --type "$type" \
        --location "$location" \
        --interval "$UPDATE_INTERVAL" &
    
    # Store the PID
    echo $! >> /tmp/iot_simulator_pids.txt
}

# Clean up any existing PID file
rm -f /tmp/iot_simulator_pids.txt

# Start Temperature Sensors
start_simulator "temp-001" "Temperature Sensor - Main Hall" "temperature" "Main Hall, Building A"
start_simulator "temp-002" "Temperature Sensor - Library" "temperature" "Library, 2nd Floor"
start_simulator "temp-003" "Temperature Sensor - Lab 1" "temperature" "Computer Lab 1, Building B"

# Start Humidity Sensors
start_simulator "humid-001" "Humidity Sensor - Main Hall" "humidity" "Main Hall, Building A"
start_simulator "humid-002" "Humidity Sensor - Library" "humidity" "Library, 2nd Floor"

# Start Occupancy Sensors
start_simulator "occup-001" "Occupancy Sensor - Lecture Room 101" "occupancy" "Lecture Room 101, Building A"
start_simulator "occup-002" "Occupancy Sensor - Cafeteria" "occupancy" "Cafeteria, Ground Floor"
start_simulator "occup-003" "Occupancy Sensor - Library" "occupancy" "Library, 2nd Floor"

# Start Smart Lighting
start_simulator "light-001" "Smart Light - Corridor A" "lighting" "Corridor A, Building A"
start_simulator "light-002" "Smart Light - Parking Lot" "lighting" "Parking Lot, East Side"

echo ""
echo "=========================================="
echo "All simulators started!"
echo "Press Ctrl+C to stop all simulators"
echo "=========================================="
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Stopping all simulators..."
    
    if [ -f /tmp/iot_simulator_pids.txt ]; then
        while read pid; do
            kill $pid 2>/dev/null
        done < /tmp/iot_simulator_pids.txt
        rm -f /tmp/iot_simulator_pids.txt
    fi
    
    echo "All simulators stopped."
    exit 0
}

# Trap Ctrl+C and call cleanup
trap cleanup INT TERM

# Wait for all background processes
wait
