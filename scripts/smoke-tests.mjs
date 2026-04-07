#!/usr/bin/env node

const args = process.argv.slice(2);
const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);

function getArgValue(flag, fallback = undefined) {
  const index = args.indexOf(flag);
  if (index === -1) {
    return fallback;
  }

  return args[index + 1] ?? fallback;
}

function hasFlag(flag) {
  return args.includes(flag);
}

function normalizeBaseUrl(rawUrl) {
  try {
    const parsed = new URL(rawUrl);
    return parsed.toString().replace(/\/+$/, "");
  } catch {
    return null;
  }
}

function usage() {
  console.error(
    "Usage: npm run smoke:deploy -- --url <deployment-url> [--timeout <ms>] [--session-cookie <cookie>] [--admin-session-cookie <cookie>] [--video-path <path>] [--verbose]",
  );
}

function ensure(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function formatStatus(status) {
  return `status ${status}`;
}

function isObject(value) {
  return typeof value === "object" && value !== null;
}

async function readJson(response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.toLowerCase().includes("application/json")) {
    return null;
  }

  try {
    return await response.json();
  } catch {
    return null;
  }
}

const urlArg = getArgValue("--url");
const timeoutArg = getArgValue("--timeout", "12000");
const sessionCookie = getArgValue("--session-cookie", "");
const adminSessionCookie = getArgValue("--admin-session-cookie", "");
const videoPath = getArgValue("--video-path", "");
const verbose = hasFlag("--verbose");

if (!urlArg) {
  usage();
  process.exit(1);
}

const baseUrl = normalizeBaseUrl(urlArg);

if (!baseUrl) {
  console.error(`[FAIL] Invalid URL: ${urlArg}`);
  process.exit(1);
}

const timeoutMs = Number.parseInt(timeoutArg, 10);

if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
  console.error(`[FAIL] Invalid timeout: ${timeoutArg}`);
  process.exit(1);
}

function resolveCookieHeader(scope) {
  if (scope === "session" && sessionCookie) {
    return sessionCookie;
  }

  if (scope === "admin" && adminSessionCookie) {
    return adminSessionCookie;
  }

  return "";
}

async function request(pathname, init = {}, scope = "none") {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const cookie = resolveCookieHeader(scope);

  try {
    const response = await fetch(`${baseUrl}${pathname}`, {
      redirect: "manual",
      signal: controller.signal,
      ...init,
      headers: {
        ...(cookie ? { Cookie: cookie } : {}),
        ...(init.headers ?? {}),
      },
    });

    return response;
  } finally {
    clearTimeout(timeout);
  }
}

function buildChecks() {
  const checks = [];
  const hasSession = Boolean(sessionCookie);
  const hasAdminSession = Boolean(adminSessionCookie);

  checks.push({
    name: "Public: root redirects to dashboard",
    run: async () => {
      const response = await request("/");
      const location = response.headers.get("location") ?? "";

      ensure(REDIRECT_STATUSES.has(response.status), `Expected redirect status, got ${response.status}`);
      ensure(location.startsWith("/dashboard"), `Expected redirect to /dashboard, got ${location || "<none>"}`);

      return `${formatStatus(response.status)} -> ${location}`;
    },
  });

  checks.push({
    name: "Public: login route behavior",
    run: async () => {
      const response = await request("/login", {}, hasSession ? "session" : "none");

      if (!hasSession) {
        ensure(response.status === 200, `Expected 200, got ${response.status}`);
        return formatStatus(response.status);
      }

      const location = response.headers.get("location") ?? "";
      ensure(REDIRECT_STATUSES.has(response.status), `Expected redirect status, got ${response.status}`);
      ensure(
        /^\/(dashboard|admin\/dashboard)/.test(location),
        `Expected redirect to /dashboard or /admin/dashboard, got ${location || "<none>"}`,
      );
      return `${formatStatus(response.status)} -> ${location}`;
    },
  });

  checks.push({
    name: "Public: signup route behavior",
    run: async () => {
      const response = await request("/signup", {}, hasSession ? "session" : "none");

      if (!hasSession) {
        ensure(response.status === 200, `Expected 200, got ${response.status}`);
        return formatStatus(response.status);
      }

      const location = response.headers.get("location") ?? "";
      ensure(REDIRECT_STATUSES.has(response.status), `Expected redirect status, got ${response.status}`);
      ensure(
        /^\/(dashboard|admin\/dashboard)/.test(location),
        `Expected redirect to /dashboard or /admin/dashboard, got ${location || "<none>"}`,
      );
      return `${formatStatus(response.status)} -> ${location}`;
    },
  });

  checks.push({
    name: "Public: auth callback negative flow (missing code)",
    run: async () => {
      const response = await request("/auth/callback?source=login");
      const location = response.headers.get("location") ?? "";

      ensure(REDIRECT_STATUSES.has(response.status), `Expected redirect status, got ${response.status}`);
      ensure(
        location.includes("/login") && location.includes("error=oauth_failed"),
        `Expected /login?error=oauth_failed redirect, got ${location || "<none>"}`,
      );

      return `${formatStatus(response.status)} -> ${location}`;
    },
  });

  checks.push({
    name: "Public: username check positive contract",
    run: async () => {
      const response = await request("/api/username/check?value=fitstarter");
      ensure(response.status === 200, `Expected 200, got ${response.status}`);

      const payload = await readJson(response);
      ensure(isObject(payload), "Expected JSON object payload");
      ensure(typeof payload.available === "boolean", "Missing boolean field: available");
      ensure(typeof payload.normalized === "string", "Missing string field: normalized");
      ensure(Array.isArray(payload.suggestions), "Missing array field: suggestions");

      return `${formatStatus(response.status)} with contract fields`;
    },
  });

  checks.push({
    name: "Public: username check negative value (missing)",
    run: async () => {
      const response = await request("/api/username/check");
      ensure(response.status === 400, `Expected 400, got ${response.status}`);

      const payload = await readJson(response);
      ensure(isObject(payload), "Expected JSON object payload");
      ensure(payload.reason === "empty", `Expected reason=empty, got ${String(payload.reason)}`);

      return formatStatus(response.status);
    },
  });

  checks.push({
    name: "Public: username check negative value (special chars)",
    run: async () => {
      const response = await request("/api/username/check?value=%40%40%40");
      ensure(response.status === 200, `Expected 200, got ${response.status}`);

      const payload = await readJson(response);
      ensure(isObject(payload), "Expected JSON object payload");
      ensure(typeof payload.normalized === "string", "Missing normalized field");
      ensure(Array.isArray(payload.suggestions), "Missing suggestions field");

      return `${formatStatus(response.status)} with normalized=${payload.normalized}`;
    },
  });

  checks.push({
    name: hasSession
      ? "Protected dashboard route with session"
      : "Protected dashboard route redirects without session",
    run: async () => {
      const response = await request("/dashboard", {}, hasSession ? "session" : "none");

      if (!hasSession) {
        const location = response.headers.get("location") ?? "";
        ensure(REDIRECT_STATUSES.has(response.status), `Expected redirect status, got ${response.status}`);
        ensure(
          /\/login|\/signup/.test(location),
          `Expected redirect to /login or /signup, got ${location || "<none>"}`,
        );
        return `${formatStatus(response.status)} -> ${location}`;
      }

      ensure(response.status >= 200 && response.status < 400, `Expected <400, got ${response.status}`);
      return formatStatus(response.status);
    },
  });

  if (!hasSession) {
    const unauthChecks = [
      {
        name: "Protected API: AI chat GET rejects unauthenticated",
        call: () => request("/api/ai/chat"),
        expected: [401, 403],
      },
      {
        name: "Protected API: AI chat POST rejects unauthenticated",
        call: () =>
          request(
            "/api/ai/chat",
            {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ messages: [{ role: "user", content: "ping" }] }),
            },
            "none",
          ),
        expected: [401, 403],
      },
      {
        name: "Protected API: analytics GET rejects unauthenticated",
        call: () => request("/api/analytics/logs"),
        expected: [401, 403],
      },
      {
        name: "Protected API: analytics POST rejects unauthenticated",
        call: () =>
          request(
            "/api/analytics/logs",
            {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ type: "weight", valueKg: 72 }),
            },
            "none",
          ),
        expected: [401, 403],
      },
      {
        name: "Protected API: workout catalog rejects unauthenticated",
        call: () => request("/api/workouts/catalog"),
        expected: [401, 403],
      },
      {
        name: "Protected API: video URL rejects unauthenticated",
        call: () =>
          request(
            "/api/workouts/video-url",
            {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ path: "workouts/videos/test.mp4" }),
            },
            "none",
          ),
        expected: [401, 403],
      },
      {
        name: "Protected API: checkout rejects unauthenticated",
        call: () =>
          request(
            "/api/subscription/checkout",
            {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({}),
            },
            "none",
          ),
        expected: [401, 403],
      },
      {
        name: "Protected API: verify rejects unauthenticated",
        call: () =>
          request(
            "/api/subscription/verify",
            {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({}),
            },
            "none",
          ),
        expected: [401, 403],
      },
      {
        name: "Protected API: referral rejects unauthenticated",
        call: () =>
          request(
            "/api/referral/redeem",
            {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ referralCode: "test" }),
            },
            "none",
          ),
        expected: [401, 403],
      },
      {
        name: "Admin API: upload rejects unauthenticated",
        call: () =>
          request(
            "/api/admin/workouts/upload-media",
            {
              method: "POST",
            },
            "none",
          ),
        expected: [401, 403],
      },
      {
        name: "Admin API: delete rejects unauthenticated",
        call: () =>
          request(
            "/api/admin/workouts/upload-media",
            {
              method: "DELETE",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ mediaType: "image", path: "workouts/images/demo.jpg" }),
            },
            "none",
          ),
        expected: [401, 403],
      },
    ];

    for (const item of unauthChecks) {
      checks.push({
        name: item.name,
        run: async () => {
          const response = await item.call();
          ensure(
            item.expected.includes(response.status),
            `Expected ${item.expected.join("/")}, got ${response.status}`,
          );
          return formatStatus(response.status);
        },
      });
    }

    return checks;
  }

  checks.push({
    name: "Authed API: AI chat GET contract",
    run: async () => {
      const response = await request("/api/ai/chat", {}, "session");
      ensure(response.status === 200, `Expected 200, got ${response.status}`);

      const payload = await readJson(response);
      ensure(isObject(payload), "Expected JSON object payload");
      ensure(payload.sessionId === null || typeof payload.sessionId === "string", "Invalid sessionId field");
      ensure(Array.isArray(payload.messages), "Expected messages array");

      return formatStatus(response.status);
    },
  });

  checks.push({
    name: "Authed API: AI chat negative payload",
    run: async () => {
      const response = await request(
        "/api/ai/chat",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ messages: [] }),
        },
        "session",
      );

      ensure(response.status === 400, `Expected 400, got ${response.status}`);
      return formatStatus(response.status);
    },
  });

  checks.push({
    name: "Authed API: AI chat positive payload",
    run: async () => {
      const response = await request(
        "/api/ai/chat",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ messages: [{ role: "user", content: "Smoke test hello" }] }),
        },
        "session",
      );

      ensure([200, 503].includes(response.status), `Expected 200 or 503, got ${response.status}`);

      const payload = await readJson(response);
      ensure(isObject(payload), "Expected JSON object payload");

      if (response.status === 200) {
        ensure(typeof payload.sessionId === "string", "Missing sessionId on success");
        ensure(typeof payload.reply === "string" && payload.reply.length > 0, "Missing reply on success");
      } else {
        ensure(typeof payload.error === "string", "Expected error field in 503 response");
      }

      return formatStatus(response.status);
    },
  });

  checks.push({
    name: "Authed API: analytics GET contract",
    run: async () => {
      const response = await request("/api/analytics/logs", {}, "session");
      ensure(response.status === 200, `Expected 200, got ${response.status}`);

      const payload = await readJson(response);
      ensure(isObject(payload), "Expected JSON object payload");
      ensure(Array.isArray(payload.weightLogs), "Missing weightLogs array");
      ensure(Array.isArray(payload.strengthData), "Missing strengthData array");
      ensure(Array.isArray(payload.measurementData), "Missing measurementData array");

      return formatStatus(response.status);
    },
  });

  checks.push({
    name: "Authed API: analytics negative payload",
    run: async () => {
      const response = await request(
        "/api/analytics/logs",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ type: "unsupported" }),
        },
        "session",
      );

      ensure(response.status === 400, `Expected 400, got ${response.status}`);
      return formatStatus(response.status);
    },
  });

  checks.push({
    name: "Authed API: workout catalog positive contract",
    run: async () => {
      const response = await request("/api/workouts/catalog", {}, "session");
      ensure(response.status === 200, `Expected 200, got ${response.status}`);

      const payload = await readJson(response);
      ensure(isObject(payload), "Expected JSON object payload");
      ensure(Array.isArray(payload.goals), "Missing goals array");
      ensure(Array.isArray(payload.bodyParts), "Missing bodyParts array");
      ensure(Array.isArray(payload.exercises), "Missing exercises array");

      return formatStatus(response.status);
    },
  });

  checks.push({
    name: "Authed API: workout catalog negative slug values",
    run: async () => {
      const response = await request(
        "/api/workouts/catalog?goalSlug=%40%40%40&bodyPartSlug=%3F%3F%3F&exerciseSlug=%21%21%21",
        {},
        "session",
      );
      ensure(response.status === 200, `Expected 200, got ${response.status}`);
      return formatStatus(response.status);
    },
  });

  checks.push({
    name: "Authed API: video URL negative payload",
    run: async () => {
      const response = await request(
        "/api/workouts/video-url",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ path: "../../escape.mp4" }),
        },
        "session",
      );
      ensure(response.status === 400, `Expected 400, got ${response.status}`);
      return formatStatus(response.status);
    },
  });

  if (videoPath) {
    checks.push({
      name: "Authed API: video URL positive payload",
      run: async () => {
        const response = await request(
          "/api/workouts/video-url",
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ path: videoPath }),
          },
          "session",
        );

        ensure([200, 500].includes(response.status), `Expected 200 or 500, got ${response.status}`);

        if (response.status === 200) {
          const payload = await readJson(response);
          ensure(isObject(payload), "Expected JSON object payload");
          ensure(typeof payload.url === "string" && payload.url.length > 0, "Missing signed URL field");
          ensure(typeof payload.expiresIn === "number", "Missing expiresIn field");
        }

        return formatStatus(response.status);
      },
    });
  }

  checks.push({
    name: "Authed API: checkout positive contract",
    run: async () => {
      const response = await request(
        "/api/subscription/checkout",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({}),
        },
        "session",
      );

      ensure([200, 502].includes(response.status), `Expected 200 or 502, got ${response.status}`);

      const payload = await readJson(response);
      ensure(isObject(payload), "Expected JSON object payload");

      if (response.status === 200) {
        ensure(payload.mode === "demo" || payload.mode === "live", "Expected mode=demo|live");
      } else {
        ensure(typeof payload.error === "string", "Expected error field in 502 response");
      }

      return formatStatus(response.status);
    },
  });

  checks.push({
    name: "Authed API: verify negative payload contract",
    run: async () => {
      const response = await request(
        "/api/subscription/verify",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({}),
        },
        "session",
      );

      ensure([200, 400].includes(response.status), `Expected 200 or 400, got ${response.status}`);

      const payload = await readJson(response);
      ensure(isObject(payload), "Expected JSON object payload");

      if (response.status === 200) {
        ensure(payload.mode === "demo", "Expected demo mode when keys are missing");
      } else {
        ensure(payload.verified === false, "Expected verified=false for invalid payload");
      }

      return formatStatus(response.status);
    },
  });

  checks.push({
    name: "Authed API: referral negative payload",
    run: async () => {
      const response = await request(
        "/api/referral/redeem",
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ referralCode: "" }),
        },
        "session",
      );

      ensure(response.status === 400, `Expected 400, got ${response.status}`);
      return formatStatus(response.status);
    },
  });

  checks.push({
    name: "Authed API: admin upload is restricted for non-admin session",
    run: async () => {
      const response = await request(
        "/api/admin/workouts/upload-media",
        { method: "POST" },
        "session",
      );
      ensure([401, 403].includes(response.status), `Expected 401/403, got ${response.status}`);
      return formatStatus(response.status);
    },
  });

  checks.push({
    name: "Authed API: admin delete is restricted for non-admin session",
    run: async () => {
      const response = await request(
        "/api/admin/workouts/upload-media",
        {
          method: "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ mediaType: "image", path: "workouts/images/demo.jpg" }),
        },
        "session",
      );
      ensure([401, 403].includes(response.status), `Expected 401/403, got ${response.status}`);
      return formatStatus(response.status);
    },
  });

  if (hasAdminSession) {
    checks.push({
      name: "Admin API: upload negative payload validation",
      run: async () => {
        const response = await request(
          "/api/admin/workouts/upload-media",
          {
            method: "POST",
          },
          "admin",
        );
        ensure(response.status === 400, `Expected 400, got ${response.status}`);
        return formatStatus(response.status);
      },
    });

    checks.push({
      name: "Admin API: delete negative payload validation",
      run: async () => {
        const response = await request(
          "/api/admin/workouts/upload-media",
          {
            method: "DELETE",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ mediaType: "unknown", path: "" }),
          },
          "admin",
        );
        ensure(response.status === 400, `Expected 400, got ${response.status}`);
        return formatStatus(response.status);
      },
    });
  }

  return checks;
}

async function runChecks() {
  const checks = buildChecks();
  const failures = [];

  console.log(`Running deploy smoke tests against ${baseUrl}`);
  console.log(`Timeout per request: ${timeoutMs}ms`);
  console.log(sessionCookie ? "Mode: authenticated deep checks" : "Mode: unauthenticated deep checks");

  if (adminSessionCookie) {
    console.log("Admin mode: enabled (admin negative validation checks)");
  }

  if (videoPath) {
    console.log(`Video path positive check: enabled (${videoPath})`);
  }

  console.log("");

  for (const check of checks) {
    try {
      const detail = await check.run();
      console.log(`[PASS] ${check.name} (${detail})`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`[FAIL] ${check.name} (${message})`);
      failures.push(check.name);
    }
  }

  if (verbose) {
    console.log("");
    console.log(`Completed ${checks.length} checks.`);
  }

  if (failures.length > 0) {
    console.log("");
    console.log(`Smoke tests failed: ${failures.length}/${checks.length}`);
    for (const failed of failures) {
      console.log(` - ${failed}`);
    }
    process.exit(1);
  }

  console.log("");
  console.log(`All smoke tests passed: ${checks.length}/${checks.length}`);
}

runChecks().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`[FAIL] Smoke runner crashed: ${message}`);
  process.exit(1);
});
