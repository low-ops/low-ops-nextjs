import http from "node:http";
import { getMetricsPort } from "@/lib/env";
import { getMetricsRegistry, initMetrics } from "@/lib/metrics";
import { logger } from "@/lib/logger";

const globalState = globalThis as typeof globalThis & {
  __metricsServer?: http.Server;
};

export function startMetricsServer() {
  if (globalState.__metricsServer) {
    return globalState.__metricsServer;
  }

  initMetrics();

  const server = http.createServer(async (request, response) => {
    if (request.url !== "/metrics") {
      response.statusCode = 404;
      response.end("Not Found");
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

  const port = getMetricsPort();

  server.listen(port, "0.0.0.0", () => {
    logger.info("Metrics server started", { port, path: "/metrics" });
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
