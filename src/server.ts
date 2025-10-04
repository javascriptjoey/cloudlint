import express from "express";
import rateLimit from "express-rate-limit";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { validateYaml, autoFixYaml } from "./backend/yaml";
import {
  suggest as sdkSuggest,
  applySuggestions as sdkApplySuggestions,
} from "./backend/sdk";
import { yamlToJson, jsonToYaml } from "./backend/yaml/convert";
import { unifiedDiff } from "./backend/diff";
import { schemaValidateYaml } from "./backend/yaml/schemaValidate";

export function createServer() {
  const app = express();

  // Security headers
  app.use((_req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("X-XSS-Protection", "1; mode=block");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader(
      "Permissions-Policy",
      "geolocation=(), microphone=(), camera=()"
    );
    next();
  });

  app.use(
    cors({
      origin: process.env.NODE_ENV === "production" ? false : true,
      credentials: false,
      maxAge: 86400, // 24 hours
    })
  );

  app.use(
    express.json({
      limit: "2mb",
      strict: true,
      type: "application/json",
    })
  );

  const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS || 60_000);
  const max = Number(process.env.RATE_LIMIT_MAX || 120);
  const limiter = rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Disable rate limiting in test environment to avoid hitting limits during E2E tests
  if (process.env.NODE_ENV !== "test") {
    app.use(limiter);
  }

  // Request logging middleware
  app.use((req, res, next) => {
    const start = Date.now();
    const originalSend = res.send;
    res.send = function (data) {
      const duration = Date.now() - start;
      if (process.env.NODE_ENV !== "test") {
        console.log(
          `${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`
        );
      }
      return originalSend.call(this, data);
    };
    next();
  });

  // Serve built frontend ONLY in production or when explicitly enabled
  // In development, Vite dev server handles the frontend
  if (
    process.env.NODE_ENV === "production" ||
    process.env.SERVE_STATIC === "1"
  ) {
    const __dirname_es = path.dirname(fileURLToPath(import.meta.url));
    const distDir = path.resolve(__dirname_es, "../dist");
    if (fs.existsSync(distDir)) {
      console.log("[server] serving static files from", distDir);
      app.use(express.static(distDir));
    } else {
      console.log(
        "[server] dist directory not found, skipping static file serving"
      );
    }
  } else {
    console.log(
      "[server] development mode - static file serving disabled (use Vite dev server)"
    );
  }

  function handleDownload(
    req: express.Request,
    res: express.Response,
    defaultName: string,
    mime: string
  ) {
    const download =
      req.query.download === "1" || req.query.download === "true";
    const asText = req.query.as === "text";
    const filename = (req.query.filename as string) || defaultName;
    if (download)
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${filename}"`
      );
    res.type(asText ? "text/plain" : mime);
  }

  app.post("/validate", async (req, res) => {
    try {
      const { yaml, options } = req.body || {};
      const result = await validateYaml(String(yaml ?? ""), options || {});
      handleDownload(req, res, "validate.json", "application/json");
      const payload = JSON.stringify(result, null, 2);
      if ((req.query.as as string) === "text") return res.send(payload);
      return res.json(result);
    } catch (e) {
      return res
        .status(400)
        .json({ ok: false, error: e instanceof Error ? e.message : String(e) });
    }
  });

  app.post("/autofix", async (req, res) => {
    try {
      const { yaml, options } = req.body || {};
      const out = await autoFixYaml(String(yaml ?? ""), options || {});
      // Default to JSON response; provide text/plain when as=text
      handleDownload(req, res, "autofix.json", "application/json");
      if ((req.query.as as string) === "text") return res.send(out.content);
      return res.json(out);
    } catch (e) {
      return res
        .status(400)
        .json({ error: e instanceof Error ? e.message : String(e) });
    }
  });

  app.post("/suggest", async (req, res) => {
    try {
      const { yaml, provider } = req.body || {};
      const out = await sdkSuggest(String(yaml ?? ""), provider);
      handleDownload(req, res, "suggest.json", "application/json");
      const payload = JSON.stringify(out, null, 2);
      if ((req.query.as as string) === "text") return res.send(payload);
      return res.json(out);
    } catch (e) {
      return res
        .status(400)
        .json({ error: e instanceof Error ? e.message : String(e) });
    }
  });

  app.post("/apply-suggestions", async (req, res) => {
    try {
      const { yaml, indexes, provider } = req.body || {};
      const out = await sdkApplySuggestions(
        String(yaml ?? ""),
        indexes || [],
        provider
      );
      handleDownload(req, res, "apply.json", "application/json");
      if ((req.query.as as string) === "text") return res.send(out.content);
      return res.json(out);
    } catch (e) {
      return res
        .status(400)
        .json({ error: e instanceof Error ? e.message : String(e) });
    }
  });

  app.post("/convert", async (req, res) => {
    try {
      const { yaml, json } = req.body || {};
      if (yaml && json)
        return res
          .status(400)
          .json({ error: "Provide either yaml or json, not both" });
      if (!yaml && !json)
        return res.status(400).json({ error: "Provide yaml or json" });
      if (yaml) {
        const out = yamlToJson(String(yaml));
        handleDownload(req, res, "convert.json", "application/json");
        if ((req.query.as as string) === "text") return res.send(out);
        return res.json({ json: out });
      } else {
        const out = jsonToYaml(String(json));
        handleDownload(req, res, "convert.json", "application/json");
        if ((req.query.as as string) === "text") return res.send(out);
        return res.json({ yaml: out });
      }
    } catch (e) {
      return res
        .status(400)
        .json({ error: e instanceof Error ? e.message : String(e) });
    }
  });

  app.post("/diff-preview", async (req, res) => {
    try {
      const { original, modified, indexes, provider, autofixOptions } =
        req.body || {};
      const before = String(original ?? "");
      let after: string = String(modified ?? "");
      if (!after) {
        if (Array.isArray(indexes)) {
          const out = await sdkApplySuggestions(before, indexes, provider);
          after = out.content;
        } else if (autofixOptions) {
          const out = await autoFixYaml(before, autofixOptions);
          after = out.content;
        } else {
          return res.status(400).json({
            error: "Provide modified, or indexes+provider, or autofixOptions",
          });
        }
      }
      const patch = unifiedDiff(before, after);
      handleDownload(req, res, "diff.json", "application/json");
      if ((req.query.as as string) === "text") return res.send(patch);
      return res.json({ diff: patch, before, after });
    } catch (e) {
      return res
        .status(400)
        .json({ error: e instanceof Error ? e.message : String(e) });
    }
  });

  app.post("/schema-validate", async (req, res) => {
    try {
      const { yaml, schema, schemaUrl } = req.body || {};
      let schemaObj = schema;
      if (!schemaObj && schemaUrl) {
        const r = await fetch(String(schemaUrl));
        if (!r.ok)
          return res
            .status(400)
            .json({ error: `Failed to fetch schema: ${r.status}` });
        schemaObj = await r.json();
      }
      if (!schemaObj)
        return res.status(400).json({ error: "Provide schema or schemaUrl" });
      const out = schemaValidateYaml(String(yaml ?? ""), schemaObj);
      handleDownload(req, res, "schema-validate.json", "application/json");
      const payload = JSON.stringify(out, null, 2);
      if ((req.query.as as string) === "text") return res.send(payload);
      return res.json(out);
    } catch (e) {
      return res
        .status(400)
        .json({ error: e instanceof Error ? e.message : String(e) });
    }
  });

  app.get("/health", (_req, res) => {
    res.status(200).type("text/plain").send("ok");
  });

  // Fallback to index.html for SPA routes when serving static
  if (
    process.env.SERVE_STATIC === "1" ||
    process.env.NODE_ENV === "production"
  ) {
    const __dirname_es = path.dirname(fileURLToPath(import.meta.url));
    const distDir = path.resolve(__dirname_es, "../dist");
    const indexHtml = path.join(distDir, "index.html");
    if (fs.existsSync(indexHtml)) {
      app.get("*", (_req, res) => {
        res.sendFile(indexHtml);
      });
    }
  }

  // Global error handler
  app.use(
    (
      err: Error,
      req: express.Request,
      res: express.Response,
      next: express.NextFunction
    ) => {
      console.error(`[ERROR] ${req.method} ${req.path}:`, err);
      const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
      res.status(statusCode).json({
        message: err.message,
        stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
      });
      next();
    }
  );

  return app;
}

if (import.meta.main) {
  const port = Number(process.env.PORT || 3001);
  const app = createServer();
  console.log("[server] starting...");
  console.log("[server] env:", {
    SERVE_STATIC: process.env.SERVE_STATIC,
    NODE_ENV: process.env.NODE_ENV,
    PORT: port,
  });
  const server = app.listen(port, () => {
    console.log(`[server] listening on http://localhost:${port}`);
  });
  server.on("error", (err) => {
    console.error("[server] listen error:", err);
    process.exitCode = 1;
  });
  process.on("uncaughtException", (err) => {
    console.error("[server] uncaughtException:", err);
    process.exitCode = 1;
  });
  process.on("unhandledRejection", (err) => {
    console.error("[server] unhandledRejection:", err);
    process.exitCode = 1;
  });
}
