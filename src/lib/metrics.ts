import client from "prom-client";

type MetricsStore = {
  registry?: client.Registry;
  initialized?: boolean;
};

const globalStore = globalThis as typeof globalThis & {
  __metricsStore?: MetricsStore;
};

function getStore() {
  if (!globalStore.__metricsStore) {
    globalStore.__metricsStore = {};
  }

  return globalStore.__metricsStore;
}

export function getMetricsRegistry() {
  const store = getStore();

  if (!store.registry) {
    store.registry = new client.Registry();
  }

  return store.registry;
}

export function initMetrics() {
  const store = getStore();

  if (store.initialized) {
    return getMetricsRegistry();
  }

  const registry = getMetricsRegistry();
  client.collectDefaultMetrics({ register: registry });
  store.initialized = true;

  return registry;
}

function getOrCreateCounter(
  name: string,
  help: string,
  labelNames: string[],
) {
  const registry = getMetricsRegistry();
  const existing = registry.getSingleMetric(name);

  if (existing) {
    return existing as client.Counter<string>;
  }

  return new client.Counter({
    name,
    help,
    labelNames,
    registers: [registry],
  });
}

function getOrCreateHistogram(
  name: string,
  help: string,
  labelNames: string[],
  buckets: number[],
) {
  const registry = getMetricsRegistry();
  const existing = registry.getSingleMetric(name);

  if (existing) {
    return existing as client.Histogram<string>;
  }

  return new client.Histogram({
    name,
    help,
    labelNames,
    buckets,
    registers: [registry],
  });
}

function getOrCreateGauge(name: string, help: string) {
  const registry = getMetricsRegistry();
  const existing = registry.getSingleMetric(name);

  if (existing) {
    return existing as client.Gauge<string>;
  }

  return new client.Gauge({
    name,
    help,
    registers: [registry],
  });
}

export function getHttpRequestsTotal() {
  return getOrCreateCounter(
    "http_requests_total",
    "Total number of HTTP requests",
    ["method", "path", "status"],
  );
}

export function getHttpRequestDurationSeconds() {
  return getOrCreateHistogram(
    "http_request_duration_seconds",
    "HTTP request duration in seconds",
    ["method", "path", "status"],
    [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  );
}

export function getHttpActiveRequests() {
  return getOrCreateGauge(
    "http_active_requests",
    "Number of active HTTP requests",
  );
}

export function getHttpErrorsTotal() {
  return getOrCreateCounter(
    "http_errors_total",
    "Total number of HTTP 5xx responses",
    ["method", "path"],
  );
}

export function getAvatarUploadsTotal() {
  return getOrCreateCounter(
    "avatar_uploads_total",
    "Total number of avatar uploads",
    ["status"],
  );
}

export function normalizePath(pathname: string) {
  if (pathname.startsWith("/api/auth")) {
    return "/api/auth/*";
  }

  if (pathname.startsWith("/api/admin/users")) {
    return "/api/admin/users";
  }

  if (pathname.startsWith("/api/user/avatar")) {
    return "/api/user/avatar";
  }

  if (pathname.startsWith("/admin/")) {
    return "/admin/*";
  }

  if (pathname.startsWith("/auth/")) {
    return "/auth/*";
  }

  return pathname;
}

export function recordHttpRequest(params: {
  method: string;
  pathname: string;
  status: number;
  durationSeconds: number;
}) {
  const path = normalizePath(params.pathname);
  const labels = {
    method: params.method,
    path,
    status: String(params.status),
  };

  getHttpRequestsTotal().inc(labels);
  getHttpRequestDurationSeconds().observe(labels, params.durationSeconds);

  if (params.status >= 500) {
    getHttpErrorsTotal().inc({
      method: params.method,
      path,
    });
  }
}
