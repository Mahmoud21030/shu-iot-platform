import { desc, eq, sql, gte, and } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { Device, DeviceAlert, InsertDevice, InsertDeviceAlert, InsertSensorReading, InsertUser, SensorReading, deviceAlerts, devices, sensorReadings, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// IoT Device Management Functions
export async function getAllDevices(): Promise<Device[]> {
  const db = await getDb();
  if (!db) return [];
  return await db.select().from(devices);
}

export async function getDeviceByDeviceId(deviceId: string): Promise<Device | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(devices).where(eq(devices.deviceId, deviceId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function upsertDevice(device: InsertDevice): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.insert(devices).values(device).onDuplicateKeyUpdate({
    set: {
      name: device.name,
      type: device.type,
      location: device.location,
      status: device.status,
      lastSeen: device.lastSeen,
    },
  });
}

export async function updateDeviceStatus(deviceId: string, status: "online" | "offline" | "error"): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.update(devices)
    .set({ status })
    .where(eq(devices.deviceId, deviceId));
}

export async function updateDeviceLastSeen(deviceId: string, lastSeen: Date): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.update(devices)
    .set({ lastSeen })
    .where(eq(devices.deviceId, deviceId));
}

export async function insertSensorReading(reading: InsertSensorReading): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.insert(sensorReadings).values(reading);
}

export async function getRecentReadings(deviceId: string, limit: number = 100): Promise<SensorReading[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select()
    .from(sensorReadings)
    .where(eq(sensorReadings.deviceId, deviceId))
    .orderBy(desc(sensorReadings.timestamp))
    .limit(limit);
}

export async function insertDeviceAlert(alert: InsertDeviceAlert): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.insert(deviceAlerts).values(alert);
}

export async function getUnresolvedAlerts(): Promise<DeviceAlert[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select()
    .from(deviceAlerts)
    .where(eq(deviceAlerts.resolved, 0))
    .orderBy(desc(deviceAlerts.createdAt));
}

export async function resolveAlert(alertId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  
  await db.update(deviceAlerts)
    .set({ resolved: 1, resolvedAt: new Date() })
    .where(eq(deviceAlerts.id, alertId));
}

// Historical Data and Analytics Functions
export async function getHistoricalReadings(deviceId: string, hours: number = 24): Promise<SensorReading[]> {
  const db = await getDb();
  if (!db) return [];
  
  const hoursAgo = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  return await db.select()
    .from(sensorReadings)
    .where(and(
      eq(sensorReadings.deviceId, deviceId),
      gte(sensorReadings.timestamp, hoursAgo)
    ))
    .orderBy(sensorReadings.timestamp);
}

export async function getAllReadings(hours: number = 24): Promise<SensorReading[]> {
  const db = await getDb();
  if (!db) return [];
  
  const hoursAgo = new Date(Date.now() - hours * 60 * 60 * 1000);
  
  return await db.select()
    .from(sensorReadings)
    .where(gte(sensorReadings.timestamp, hoursAgo))
    .orderBy(sensorReadings.timestamp);
}

export async function getDeviceStatistics(deviceId: string, hours: number = 24) {
  const readings = await getHistoricalReadings(deviceId, hours);
  
  if (readings.length === 0) {
    return {
      count: 0,
      average: 0,
      min: 0,
      max: 0,
      stdDev: 0,
      trend: 'stable' as const,
    };
  }
  
  // Convert string values to numbers
  const numericValues = readings
    .map(r => parseFloat(r.value))
    .filter(v => !isNaN(v));
  
  if (numericValues.length === 0) {
    return {
      count: readings.length,
      average: 0,
      min: 0,
      max: 0,
      stdDev: 0,
      trend: 'stable' as const,
    };
  }
  
  // Calculate statistics
  const sum = numericValues.reduce((a, b) => a + b, 0);
  const average = sum / numericValues.length;
  const min = Math.min(...numericValues);
  const max = Math.max(...numericValues);
  
  // Calculate standard deviation
  const squaredDiffs = numericValues.map(v => Math.pow(v - average, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / numericValues.length;
  const stdDev = Math.sqrt(variance);
  
  // Calculate trend (compare first half vs second half)
  const midpoint = Math.floor(numericValues.length / 2);
  const firstHalf = numericValues.slice(0, midpoint);
  const secondHalf = numericValues.slice(midpoint);
  
  const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  
  const trendDiff = secondAvg - firstAvg;
  const trendThreshold = stdDev * 0.5; // 50% of std dev
  
  let trend: 'increasing' | 'decreasing' | 'stable';
  if (trendDiff > trendThreshold) {
    trend = 'increasing';
  } else if (trendDiff < -trendThreshold) {
    trend = 'decreasing';
  } else {
    trend = 'stable';
  }
  
  return {
    count: numericValues.length,
    average: parseFloat(average.toFixed(2)),
    min: parseFloat(min.toFixed(2)),
    max: parseFloat(max.toFixed(2)),
    stdDev: parseFloat(stdDev.toFixed(2)),
    trend,
  };
}

export async function getAllAlerts(): Promise<DeviceAlert[]> {
  const db = await getDb();
  if (!db) return [];
  
  return await db.select()
    .from(deviceAlerts)
    .orderBy(desc(deviceAlerts.createdAt));
}

// CSV Export Functions
export function convertReadingsToCSV(readings: SensorReading[]): string {
  if (readings.length === 0) {
    return 'Device ID,Value,Unit,Timestamp\n';
  }
  
  const header = 'Device ID,Value,Unit,Timestamp\n';
  const rows = readings.map(r => {
    const timestamp = new Date(r.timestamp).toISOString();
    return `${r.deviceId},${r.value},${r.unit || ''},${timestamp}`;
  }).join('\n');
  
  return header + rows;
}

export function convertAlertsToCSV(alerts: DeviceAlert[]): string {
  if (alerts.length === 0) {
    return 'Alert ID,Device ID,Type,Message,Severity,Resolved,Created At,Resolved At\n';
  }
  
  const header = 'Alert ID,Device ID,Type,Message,Severity,Resolved,Created At,Resolved At\n';
  const rows = alerts.map(a => {
    const createdAt = new Date(a.createdAt).toISOString();
    const resolvedAt = a.resolvedAt ? new Date(a.resolvedAt).toISOString() : '';
    const message = `"${a.message.replace(/"/g, '""')}"`; // Escape quotes in CSV
    return `${a.id},${a.deviceId},${a.alertType},${message},${a.severity},${a.resolved ? 'Yes' : 'No'},${createdAt},${resolvedAt}`;
  }).join('\n');
  
  return header + rows;
}
