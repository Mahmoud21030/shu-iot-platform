-- SHU IoT Platform Database Setup
-- Run this file to create all required tables manually

-- Create database (if it doesn't exist)
CREATE DATABASE IF NOT EXISTS iot_platform;

-- Use the database
USE iot_platform;

-- Drop existing tables (if they exist) to start fresh
DROP TABLE IF EXISTS deviceAlerts;
DROP TABLE IF EXISTS sensorReadings;
DROP TABLE IF EXISTS devices;
DROP TABLE IF EXISTS users;

-- Create users table
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  openId VARCHAR(64) NOT NULL UNIQUE,
  name TEXT,
  email VARCHAR(320),
  loginMethod VARCHAR(64),
  role ENUM('user', 'admin') DEFAULT 'user' NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  lastSignedIn TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create devices table
CREATE TABLE devices (
  id INT AUTO_INCREMENT PRIMARY KEY,
  deviceId VARCHAR(64) NOT NULL UNIQUE,
  name VARCHAR(255) NOT NULL,
  type ENUM('temperature', 'humidity', 'occupancy', 'lighting') NOT NULL,
  location VARCHAR(255) NOT NULL,
  status ENUM('online', 'offline', 'error') DEFAULT 'offline',
  lastSeen TIMESTAMP NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_deviceId (deviceId),
  INDEX idx_status (status),
  INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create sensorReadings table
CREATE TABLE sensorReadings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  deviceId VARCHAR(64) NOT NULL,
  value VARCHAR(255) NOT NULL,
  unit VARCHAR(50),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX idx_deviceId (deviceId),
  INDEX idx_timestamp (timestamp),
  INDEX idx_device_time (deviceId, timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create deviceAlerts table
CREATE TABLE deviceAlerts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  deviceId VARCHAR(64) NOT NULL,
  alertType ENUM('threshold', 'offline', 'error') NOT NULL,
  message TEXT NOT NULL,
  severity ENUM('low', 'medium', 'high', 'critical') NOT NULL,
  resolved INT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  resolvedAt TIMESTAMP NULL,
  resolvedBy VARCHAR(64),
  INDEX idx_deviceId (deviceId),
  INDEX idx_resolved (resolved),
  INDEX idx_severity (severity),
  INDEX idx_created (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Verify tables were created
SHOW TABLES;

-- Show table structures
DESCRIBE users;
DESCRIBE devices;
DESCRIBE sensorReadings;
DESCRIBE deviceAlerts;

-- Success message
SELECT 'Database setup completed successfully!' AS Status;
