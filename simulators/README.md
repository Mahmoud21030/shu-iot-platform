# IoT Device Simulators

This directory contains Python-based simulators for various IoT devices in the SHU Smart Campus project.

## Overview

The simulators generate realistic sensor data and communicate with the IoT platform via HTTP API endpoints. They simulate the following device types:

- **Temperature Sensors**: Monitor ambient temperature (15-35°C)
- **Humidity Sensors**: Monitor relative humidity (30-80%)
- **Occupancy Sensors**: Count people in rooms (0-100)
- **Smart Lighting**: Control and monitor lighting status and brightness

## Prerequisites

- Python 3.6 or higher
- `requests` library (install with `pip3 install requests`)

## Running Individual Simulators

To run a single device simulator:

```bash
python3 device_simulator.py \
  --url http://localhost:3000 \
  --device-id temp-001 \
  --name "Temperature Sensor - Main Hall" \
  --type temperature \
  --location "Main Hall, Building A" \
  --interval 10
```

### Parameters

- `--url`: Base URL of the IoT platform (required)
- `--device-id`: Unique device identifier (required)
- `--name`: Human-readable device name (required)
- `--type`: Device type - one of: `temperature`, `humidity`, `occupancy`, `lighting` (required)
- `--location`: Physical location of the device (required)
- `--interval`: Update interval in seconds (default: 10)

## Running Multiple Simulators

To start all simulators at once, use the batch script:

```bash
./run_all_simulators.sh
```

This will start 10 simulated devices:
- 3 Temperature sensors
- 2 Humidity sensors
- 3 Occupancy sensors
- 2 Smart lights

### Environment Variables

You can customize the batch script behavior with environment variables:

```bash
PLATFORM_URL=http://your-platform-url:3000 UPDATE_INTERVAL=15 ./run_all_simulators.sh
```

- `PLATFORM_URL`: Platform URL (default: http://localhost:3000)
- `UPDATE_INTERVAL`: Update interval in seconds (default: 10)

## Stopping Simulators

Press `Ctrl+C` to stop all running simulators. The script will gracefully shut down all processes and update device status to "offline".

## Device Behavior

### Temperature Sensor
- Generates readings between 15-35°C
- Simulates daily temperature variation (peaks at 2 PM)
- Triggers alerts when temperature exceeds 30°C or drops below 15°C

### Humidity Sensor
- Generates readings between 30-80%
- Triggers alerts when humidity exceeds 70% or drops below 30%

### Occupancy Sensor
- Generates readings between 0-100 people
- Higher occupancy during working hours (8 AM - 6 PM)
- Lower occupancy during off-hours

### Smart Lighting
- Reports on/off status and brightness (0-100%)
- Automatically turns on during daytime (7 AM - 10 PM)
- Turns off during nighttime

## Deployment on Cloud Infrastructure

### AWS Deployment

1. Launch an EC2 instance (Ubuntu 20.04 or later)
2. Install Python 3 and required packages:
   ```bash
   sudo apt update
   sudo apt install python3 python3-pip
   pip3 install requests
   ```
3. Copy the simulator files to the instance
4. Update the `PLATFORM_URL` to point to your deployed platform
5. Run the simulators using the batch script or as systemd services

### Azure Deployment

1. Create a Virtual Machine (Ubuntu 20.04 or later)
2. Install Python 3 and required packages:
   ```bash
   sudo apt update
   sudo apt install python3 python3-pip
   pip3 install requests
   ```
3. Copy the simulator files to the VM
4. Update the `PLATFORM_URL` to point to your deployed platform
5. Run the simulators using the batch script or as systemd services

### Docker Deployment

You can also containerize the simulators using Docker for easier deployment:

```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY device_simulator.py .

RUN pip install requests

ENTRYPOINT ["python3", "device_simulator.py"]
```

Build and run:
```bash
docker build -t iot-simulator .
docker run iot-simulator --url http://platform-url:3000 --device-id temp-001 --name "Temp Sensor" --type temperature --location "Building A"
```

## Troubleshooting

### Connection Errors

If you see connection errors, verify:
1. The platform URL is correct and accessible
2. The platform is running
3. Firewall rules allow HTTP traffic

### Registration Failures

If device registration fails:
1. Check that the platform database is running
2. Verify the API endpoints are accessible
3. Check platform logs for errors

## API Endpoints Used

The simulators interact with the following API endpoints:

- `POST /api/trpc/devices.register` - Register a new device
- `POST /api/trpc/readings.submit` - Submit sensor readings
- `POST /api/trpc/devices.updateStatus` - Update device status
