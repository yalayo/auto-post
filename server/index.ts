import { getAssetFromKV } from "@cloudflare/kv-asset-handler";
// Shared imports
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { postScheduler } from "./services/scheduler";

// --- Development: Node.js with Express ---
async function runNodeServer() {
  const express = await import("express");
  const app = express.default();

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // Logging middleware
  app.use((req, res, next) => {
    const start = Date.now();
    const path = req.path;
    let capturedJsonResponse: Record<string, any> | undefined;

    const originalResJson = res.json;
    res.json = function (bodyJson, ...args) {
      capturedJsonResponse = bodyJson;
      return originalResJson.apply(res, [bodyJson, ...args]);
    };

    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
        if (capturedJsonResponse) {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        }
        if (logLine.length > 80) logLine = logLine.slice(0, 79) + "…";
        log(logLine);
      }
    });

    next();
  });

  const server = await registerRoutes(app);

  app.use((err: any, _req: any, res: any, _next: any) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });

  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = parseInt(process.env.PORT || "5000", 10);
  server.listen(
    { port, host: "0.0.0.0", reusePort: true },
    () => {
      log(`serving on port ${port}`);
      postScheduler.start();
    }
  );

  process.on("SIGINT", () => {
    log("Shutting down gracefully...");
    postScheduler.stop();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    log("Shutting down gracefully...");
    postScheduler.stop();
    process.exit(0);
  });
}

// --- Production: Cloudflare Worker ---
const worker = {
  async fetch(request: Request, env: any) {
    const url = new URL(request.url);
    console.log("from the worker: " + url)
    // Proxy API calls
    if (url.pathname.startsWith("/api/")) {
      const backendUrl = new URL(request.url);
      backendUrl.hostname = "my-backend.example.com"; // your backend
      backendUrl.protocol = "https:";
      return fetch(new Request(backendUrl, request));
    }

    // Static assets & SPA fallback
    try {
      return await getAssetFromKV(
        { request, waitUntil: ctx.waitUntil.bind(ctx) },
        { ASSET_NAMESPACE: env.__STATIC_CONTENT }
      );
    } catch (e) {
      // fallback to index.html for SPAs
      return getAssetFromKV(
        {
          request: new Request(`${url.origin}/index.html`, request),
          waitUntil: ctx.waitUntil.bind(ctx),
        },
        { ASSET_NAMESPACE: env.__STATIC_CONTENT }
      );
    }
  },
};

// --- Top-level export (always here) ---
export default worker;

// --- Runtime detection for dev ---
if (typeof process !== "undefined" && process.release?.name === "node") {
  runNodeServer();
}