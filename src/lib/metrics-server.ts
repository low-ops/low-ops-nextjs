import http from "node:http";
import {
  getMetricsHost,
  getMetricsPort,
  getMetricsToken,
  isMetricsAuthRequired,
  isMetricsServerEnabled,
} from "@/lib/env";
import { getMetricsRegistry, initMetrics } from "@/lib/metrics";
import { logger } from "@/lib/logger";

const globalState = globalThis as typeof globalThis & {
  __metricsServer?: http.Server;
};

function isAuthorizedMetricsRequest(request: http.IncomingMessage) {
  if (!isMetricsAuthRequired()) {
    return true;
  }

  const token = getMetricsToken();
  if (!token) {
    return false;
  }

  const authorization = request.headers.authorization;
  if (!authorization?.startsWith("Bearer ")) {
    return false;
  }

  return authorization.slice("Bearer ".length) === token;
}

export function startMetricsServer() {
  if (globalState.__metricsServer) {
    return globalState.__metricsServer;
  }

  const port = getMetricsPort();
  if (!isMetricsServerEnabled() || port === null) {
    logger.info("Metrics server disabled");
    return null;
  }

  initMetrics();

  const server = http.createServer(async (request, response) => {
    if (request.url !== "/metrics") {
      response.statusCode = 404;
      response.end("Not Found");
      return;
    }

    if (!isAuthorizedMetricsRequest(request)) {
      response.statusCode = 401;
      response.end("Unauthorized");
      return;
    }

    try {
      const registry = getMetricsRegistry();
      const metrics = await registry.metrics();

      response.statusCode = 200;
      response.setHeader("Content-Type", registry.contentType);
      response.end(metrics);
    } catch (error) {
      logger.error("Failed to collect metrics", {
        error: error instanceof Error ? error.message : String(error),
      });
      response.statusCode = 500;
      response.end("Internal Server Error");
    }
  });

  const host = getMetricsHost();

  server.listen(port, host, () => {
    logger.info("Metrics server started", {
      host,
      port,
      path: "/metrics",
      authRequired: isMetricsAuthRequired(),
    });
  });

  globalState.__metricsServer = server;
  return server;
}

export function stopMetricsServer() {
  const server = globalState.__metricsServer;

  if (!server) {
    return Promise.resolve();
  }

  return new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      globalState.__metricsServer = undefined;
      resolve();
    });
  });
}
