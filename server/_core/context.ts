import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
// Full auth removal: return a default admin user so protected routes work without OAuth.
export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  // Create a default admin user to bypass authentication checks
  const user: User = {
    id: 0,
    openId: "dev",
    name: "Dev User",
    email: "dev@example.com",
    loginMethod: "none",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  } as unknown as User;

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
