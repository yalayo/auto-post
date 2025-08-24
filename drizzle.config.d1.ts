import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "sqlite", // D1 uses SQLite
  driver: "d1-http", // Cloudflare D1 driver
});