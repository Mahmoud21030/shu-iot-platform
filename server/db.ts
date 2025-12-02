import { desc, eq } from "drizzle-orm";
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
