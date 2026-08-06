import { logger } from "@/lib/logger";
import { shutdownOtel } from "@/lib/otel";
import { stopMetricsServer } from "@/lib/metrics-server";

const globalState = globalThis as typeof globalThis & {
  __shutdownRegistered?: boolean;
};

export function registerShutdownHandlers() {
  if (globalState.__shutdownRegistered) {
    return;
  }

  const shutdown = async (signal: string) => {
    logger.info("Received shutdown signal", { signal });

    try {
      await stopMetricsServer();
      await shutdownOtel();
      logger.info("Graceful shutdown completed", { signal });
      process.exit(0);
    } catch (error) {
      logger.error("Graceful shutdown failed", {
        signal,
        error: error instanceof Error ? error.message : String(error),
      });
      process.exit(1);
    }
  };

  process.on("SIGTERM", () => {
    void shutdown("SIGTERM");
  });

  process.on("SIGINT", () => {
    void shutdown("SIGINT");
  });

  globalState.__shutdownRegistered = true;
}
