/**
 * Offline Device Checker
 * 
 * This script runs in the background and checks for devices that haven't
 * sent data in the last 1 minute, marking them as offline.
 * 
 * It runs every 30 seconds to ensure timely detection of offline devices.
 */

import * as db from "./db";

const CHECK_INTERVAL_MS = 30 * 1000; // 30 seconds
const OFFLINE_THRESHOLD_MS = 60 * 1000; // 1 minute

async function checkOfflineDevices() {
  try {
    const devices = await db.getAllDevices();
    const now = new Date();
    const offlineThreshold = new Date(now.getTime() - OFFLINE_THRESHOLD_MS);
    
    let offlineCount = 0;
    let onlineCount = 0;
    
    for (const device of devices) {
      // If device has never been seen or last seen more than 1 minute ago
      if (!device.lastSeen || new Date(device.lastSeen) < offlineThreshold) {
        if (device.status !== "offline") {
          await db.updateDeviceStatus(device.deviceId, "offline");
          
          // Create an offline alert
          await db.insertDeviceAlert({
            deviceId: device.deviceId,
            alertType: "offline",
            message: `Device ${device.name} has gone offline (no data for 1 minute)`,
            severity: "medium",
            resolved: 0,
          });
          
          offlineCount++;
          console.log(`[Offline Checker] Device ${device.deviceId} (${device.name}) marked as offline`);
        }
      } else {
        onlineCount++;
      }
    }
    
    if (offlineCount > 0) {
      console.log(`[Offline Checker] Marked ${offlineCount} device(s) as offline. ${onlineCount} device(s) remain online.`);
    }
  } catch (error) {
    console.error("[Offline Checker] Error checking offline devices:", error);
  }
}

// Run the checker immediately on startup
console.log("[Offline Checker] Starting offline device checker...");
console.log(`[Offline Checker] Checking every ${CHECK_INTERVAL_MS / 1000} seconds for devices offline > ${OFFLINE_THRESHOLD_MS / 1000} seconds`);

checkOfflineDevices();

// Then run it every 30 seconds
setInterval(checkOfflineDevices, CHECK_INTERVAL_MS);
