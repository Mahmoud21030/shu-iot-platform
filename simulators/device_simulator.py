#!/usr/bin/env python3
"""
IoT Device Simulator for SHU Smart Campus
This script simulates various IoT devices and sends data to the IoT platform via HTTP API.
"""

import requests
import time
import random
import json
import argparse
from datetime import datetime
from typing import Dict, Any

class DeviceSimulator:
    def __init__(self, base_url: str, device_id: str, device_name: str, device_type: str, location: str):
        self.base_url = base_url
        self.device_id = device_id
        self.device_name = device_name
        self.device_type = device_type
        self.location = location
        self.is_running = False
        
    def register_device(self) -> bool:
        url = f"{self.base_url}/api/trpc/devices.register?batch=1"
        payload = {
            "0": {
                "json": {
                    "deviceId": self.device_id,
                    "name": self.device_name,
                    "type": self.device_type,
                    "location": self.location
                }
            }
        }
        try:
            response = requests.post(url, json=payload, headers={
                "Content-Type": "application/json"
            })
            if response.status_code == 200:
                print(f"✓ Device {self.device_id} registered successfully")
                return True
            else:
                print(f"✗ Failed to register device: {response.status_code} - {response.text}")
                return False
        except Exception as e:
            print(f"✗ Error registering device: {e}")
            return False

    def send_reading(self, value: str, unit: str = None) -> bool:
        """Send a sensor reading to the IoT platform"""
        url = f"{self.base_url}/api/trpc/readings.submit?batch=1"
        payload = {
            "0": {
                "json": {
                    "deviceId": self.device_id,
                    "value": value,
                    "unit": unit
                }
            }
        }

        
        try:
            response = requests.post(url, json=payload)
            if response.status_code == 200:
                timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
                print(f"[{timestamp}] {self.device_name}: {value}{unit if unit else ''}")
                return True
            else:
                print(f"✗ Failed to send reading: {response.status_code}")
                return False
        except Exception as e:
            print(f"✗ Error sending reading: {e}")
            return False
    
    def update_status(self, status: str) -> bool:
        """Update device status"""
        url = f"{self.base_url}/api/trpc/devices.updateStatus?batch=1"
        payload = {
            "0": {
                "json": {
                    "deviceId": self.device_id,
                    "status": status
                }
            }
        }

        
        try:
            response = requests.post(url, json=payload)
            return response.status_code == 200
        except Exception as e:
            print(f"✗ Error updating status: {e}")
            return False
    
    def generate_temperature_reading(self) -> tuple:
        """Generate realistic temperature reading (15-35°C)"""
        # Simulate daily temperature variation
        hour = datetime.now().hour
        base_temp = 20 + 5 * (1 - abs(hour - 14) / 14)  # Peak at 2 PM
        temp = base_temp + random.uniform(-2, 2)
        return (f"{temp:.1f}", "°C")
    
    def generate_humidity_reading(self) -> tuple:
        """Generate realistic humidity reading (30-80%)"""
        humidity = random.uniform(35, 75)
        return (f"{humidity:.1f}", "%")
    
    def generate_occupancy_reading(self) -> tuple:
        """Generate occupancy reading (0-100 people)"""
        hour = datetime.now().hour
        if 8 <= hour <= 18:  # Working hours
            occupancy = random.randint(20, 100)
        else:
            occupancy = random.randint(0, 20)
        return (str(occupancy), "people")
    
    def generate_lighting_reading(self) -> tuple:
        """Generate lighting status (on/off) and brightness (0-100%)"""
        hour = datetime.now().hour
        if 7 <= hour <= 22:
            status = "on"
            brightness = random.randint(50, 100)
        else:
            status = "off"
            brightness = 0
        return (f"{status},{brightness}", "%")
    
    def run(self, interval: int = 10):
        """Run the simulator continuously"""
        print(f"\n{'='*60}")
        print(f"Starting {self.device_type} simulator: {self.device_name}")
        print(f"Device ID: {self.device_id}")
        print(f"Location: {self.location}")
        print(f"Update interval: {interval} seconds")
        print(f"{'='*60}\n")
        
        # Register device
        if not self.register_device():
            print("Failed to register device. Exiting...")
            return
        
        # Update status to online
        self.update_status("online")
        
        self.is_running = True
        
        try:
            while self.is_running:
                # Generate and send reading based on device type
                if self.device_type == "temperature":
                    value, unit = self.generate_temperature_reading()
                elif self.device_type == "humidity":
                    value, unit = self.generate_humidity_reading()
                elif self.device_type == "occupancy":
                    value, unit = self.generate_occupancy_reading()
                elif self.device_type == "lighting":
                    value, unit = self.generate_lighting_reading()
                else:
                    print(f"Unknown device type: {self.device_type}")
                    break
                
                self.send_reading(value, unit)
                time.sleep(interval)
                
        except KeyboardInterrupt:
            print("\n\nShutting down simulator...")
            self.update_status("offline")
            self.is_running = False
        except Exception as e:
            print(f"\n✗ Error in simulator: {e}")
            self.update_status("error")
            self.is_running = False

def main():
    parser = argparse.ArgumentParser(description="IoT Device Simulator for SHU Smart Campus")
    parser.add_argument("--url", required=True, help="Base URL of the IoT platform (e.g., http://localhost:3000)")
    parser.add_argument("--device-id", required=True, help="Unique device identifier")
    parser.add_argument("--name", required=True, help="Device name")
    parser.add_argument("--type", required=True, choices=["temperature", "humidity", "occupancy", "lighting"], 
                        help="Device type")
    parser.add_argument("--location", required=True, help="Device location")
    parser.add_argument("--interval", type=int, default=10, help="Update interval in seconds (default: 10)")
    
    args = parser.parse_args()
    
    simulator = DeviceSimulator(
        base_url=args.url,
        device_id=args.device_id,
        device_name=args.name,
        device_type=args.type,
        location=args.location
    )
    
    simulator.run(interval=args.interval)

if __name__ == "__main__":
    main()
