import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

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
  }),
  
  alerts: router({
    list: publicProcedure.query(async () => {
      return await db.getUnresolvedAlerts();
    }),
    
    resolve: protectedProcedure
      .input(z.object({ alertId: z.number() }))
      .mutation(async ({ input }) => {
        await db.resolveAlert(input.alertId);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;
