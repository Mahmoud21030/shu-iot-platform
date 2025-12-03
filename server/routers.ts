import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

export const appRouter = router({

  devices: router({
    list: publicProcedure.query(async () => {
      return await db.getAllDevices();
    }),
    
    get: publicProcedure
      .input(z.object({ deviceId: z.string() }))
      .query(async ({ input }) => {
        return await db.getDeviceByDeviceId(input.deviceId);
      }),
    
    register: publicProcedure
      .input(z.object({
        deviceId: z.string(),
        name: z.string(),
        type: z.enum(["temperature", "humidity", "occupancy", "lighting"]),
        location: z.string(),
      }))
      .mutation(async ({ input }) => {
        await db.upsertDevice({
          deviceId: input.deviceId,
          name: input.name,
          type: input.type,
          location: input.location,
          status: "online",
          lastSeen: new Date(),
        });
        return { success: true };
      }),
    
    updateStatus: publicProcedure
      .input(z.object({
        deviceId: z.string(),
        status: z.enum(["online", "offline", "error"]),
      }))
      .mutation(async ({ input }) => {
        await db.updateDeviceStatus(input.deviceId, input.status);
        return { success: true };
      }),
  }),
  
  readings: router({
    submit: publicProcedure
      .input(z.object({
        deviceId: z.string(),
        value: z.string(),
        unit: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.insertSensorReading({
          deviceId: input.deviceId,
          value: input.value,
          unit: input.unit,
          timestamp: new Date(),
        });
        
        // Update device lastSeen and set status to online
        await db.updateDeviceLastSeen(input.deviceId, new Date());
        await db.updateDeviceStatus(input.deviceId, "online");
        
        // Check for threshold violations and create alerts
        const device = await db.getDeviceByDeviceId(input.deviceId);
        if (device) {
          const numValue = parseFloat(input.value);
          let shouldAlert = false;
          let alertMessage = "";
          let severity: "low" | "medium" | "high" | "critical" = "medium";
          
          if (device.type === "temperature" && !isNaN(numValue)) {
            if (numValue > 30) {
              shouldAlert = true;
              alertMessage = `Temperature too high: ${numValue}°C`;
              severity = numValue > 35 ? "critical" : "high";
            } else if (numValue < 15) {
              shouldAlert = true;
              alertMessage = `Temperature too low: ${numValue}°C`;
              severity = "medium";
            }
          } else if (device.type === "humidity" && !isNaN(numValue)) {
            if (numValue > 70) {
              shouldAlert = true;
              alertMessage = `Humidity too high: ${numValue}%`;
              severity = "high";
            } else if (numValue < 30) {
              shouldAlert = true;
              alertMessage = `Humidity too low: ${numValue}%`;
              severity = "medium";
            }
          }
          
          if (shouldAlert) {
            await db.insertDeviceAlert({
              deviceId: input.deviceId,
              alertType: "threshold",
              message: alertMessage,
              severity,
              resolved: 0,
            });
          }
        }
        
        return { success: true };
      }),
    
    getRecent: publicProcedure
      .input(z.object({
        deviceId: z.string(),
        limit: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return await db.getRecentReadings(input.deviceId, input.limit);
      }),
    
    getHistorical: publicProcedure
      .input(z.object({
        deviceId: z.string(),
        hours: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return await db.getHistoricalReadings(input.deviceId, input.hours || 24);
      }),
    
    getStatistics: publicProcedure
      .input(z.object({
        deviceId: z.string(),
        hours: z.number().optional(),
      }))
      .query(async ({ input }) => {
        return await db.getReadingStatistics(input.deviceId, input.hours || 24);
      }),
    
    exportCSV: publicProcedure
      .input(z.object({
        deviceId: z.string().optional(),
        hours: z.number().optional(),
      }))
      .query(async ({ input }) => {
        const readings = input.deviceId
          ? await db.getHistoricalReadings(input.deviceId, input.hours || 24)
          : await db.getAllReadings(input.hours || 24);
        
        // Generate CSV
        const headers = ['Device ID', 'Timestamp', 'Value', 'Unit'];
        const rows = readings.map(r => [
          r.deviceId,
          new Date(r.timestamp).toISOString(),
          r.value,
          r.unit || ''
        ]);
        
        const csv = [
          headers.join(','),
          ...rows.map(row => row.join(','))
        ].join('\n');
        
        const filename = input.deviceId
          ? `readings_${input.deviceId}_${new Date().toISOString().split('T')[0]}.csv`
          : `readings_all_${new Date().toISOString().split('T')[0]}.csv`;
        
        return { csv, filename };
      }),
  }),
  
  alerts: router({
    list: publicProcedure.query(async () => {
      return await db.getUnresolvedAlerts();
    }),
    
    resolve: publicProcedure
      .input(z.object({ alertId: z.number() }))
      .mutation(async ({ input }) => {
        await db.resolveAlert(input.alertId);
        return { success: true };
      }),
    
    exportCSV: publicProcedure
      .query(async () => {
        const alerts = await db.getUnresolvedAlerts();
        
        // Generate CSV
        const headers = ['Alert ID', 'Device ID', 'Type', 'Message', 'Severity', 'Created At'];
        const rows = alerts.map(a => [
          a.id.toString(),
          a.deviceId,
          a.alertType,
          a.message,
          a.severity,
          new Date(a.createdAt).toISOString()
        ]);
        
        const csv = [
          headers.join(','),
          ...rows.map(row => row.join(','))
        ].join('\n');
        
        const filename = `alerts_${new Date().toISOString().split('T')[0]}.csv`;
        
        return { csv, filename };
      }),
  }),
  
  // System maintenance endpoint to check for offline devices
  system_maintenance: router({
    checkOfflineDevices: publicProcedure.mutation(async () => {
      // Get all devices
      const devices = await db.getAllDevices();
      const now = new Date();
      const oneMinuteAgo = new Date(now.getTime() - 60 * 1000); // 1 minute ago
      
      let offlineCount = 0;
      
      for (const device of devices) {
        // If device has never been seen or last seen more than 1 minute ago
        if (!device.lastSeen || new Date(device.lastSeen) < oneMinuteAgo) {
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
          }
        }
      }
      
      return { 
        success: true, 
        offlineCount,
        message: `Checked ${devices.length} devices, marked ${offlineCount} as offline`
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;
