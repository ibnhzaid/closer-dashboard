import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { compactSubmission, windowDates } from "./lib/eod.mjs";

const root = path.dirname(fileURLToPath(import.meta.url));

const loadEnv = () => {
  const envPath = path.join(root, ".env");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    const value = trimmed.slice(eq + 1);
    if (process.env[key] === undefined) process.env[key] = value;
  }
};

loadEnv();

const PORT = Number(process.env.PORT || 8083);
const EOD_API_URL = process.env.EOD_API_URL || "https://eod.tijarahinstitute.com/api/submissions";
const EOD_API_KEY = process.env.EOD_API_KEY;
const EOD_WINDOW_DAYS = Number(process.env.EOD_WINDOW_DAYS || 30);
const CACHE_MS = 60_000;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
};

let cache = { expiresAt: 0, payload: null };

const json = (res, status, body) => {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-robots-tag": "noindex, nofollow, noarchive, nosnippet",
  });
  res.end(JSON.stringify(body));
};

const fetchSubmissions = async (from, to) => {
  if (!EOD_API_KEY) throw new Error("EOD_API_KEY is not set");
  const url = new URL(EOD_API_URL);
  url.searchParams.set("from_date", from);
  url.searchParams.set("to_date", to);
  const response = await fetch(url, { headers: { "X-API-Key": EOD_API_KEY } });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`EOD API ${response.status}: ${detail.slice(0, 200)}`);
  }
  return response.json();
};

const loadEod = async () => {
  if (cache.payload && Date.now() < cache.expiresAt) return cache.payload;
  const { from, to } = windowDates(EOD_WINDOW_DAYS);
  const data = await fetchSubmissions(from, to);
  const records = (data.submissions || []).map(compactSubmission);
  const payload = {
    from,
    to,
    count: records.length,
    records,
  };
  cache = { expiresAt: Date.now() + CACHE_MS, payload };
  return payload;
};

const serveStatic = (req, res, urlPath) => {
  const safe = path.normalize(urlPath).replace(/^(\.\.(\/|\\|$))+/, "");
  let filePath = path.join(root, safe === "/" ? "index.html" : safe);
  if (safe === "/coaching") filePath = path.join(root, "coaching.html");
  if (!filePath.startsWith(root)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }
  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    res.end("Not found");
    return;
  }
  const ext = path.extname(filePath);
  res.writeHead(200, {
    "content-type": MIME[ext] || "application/octet-stream",
    "cache-control": ext === ".html" ? "no-store" : "public, max-age=300",
    "x-robots-tag": "noindex, nofollow, noarchive, nosnippet",
  });
  fs.createReadStream(filePath).pipe(res);
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (req.method === "GET" && url.pathname === "/healthz") {
    json(res, 200, { ok: true });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/eod") {
    try {
      json(res, 200, await loadEod());
    } catch (error) {
      console.error("[closer-dashboard] EOD fetch failed:", error);
      json(res, 502, { error: "Could not load EOD submissions right now." });
    }
    return;
  }

  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405);
    res.end("Method not allowed");
    return;
  }

  serveStatic(req, res, url.pathname);
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`closer-dashboard listening on 127.0.0.1:${PORT}`);
});
