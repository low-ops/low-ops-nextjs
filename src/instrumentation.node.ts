import { runMigrations } from "@/lib/migrate";
import { startMetricsServer } from "@/lib/metrics-server";
import { initOtel } from "@/lib/otel";
import { registerShutdownHandlers } from "@/lib/shutdown";
import {
  isAuthSecretDerived,
  isMetricsServerEnabled,
  isProductionRuntime,
  validateRuntimeEnv,
} from "@/lib/env";
import { logger } from "@/lib/logger";

function exitOnProductionFailure(): never {
  process.exit(1);
}

export async function startNodeRuntime() {
  try {
    validateRuntimeEnv();
    logger.info("Runtime environment validated", {
      authSecretSource: isAuthSecretDerived() ? "platform-derived" : "configured",
      metricsEnabled: isMetricsServerEnabled(),
    });
  } catch (error) {
    logger.error("Missing or invalid runtime environment variables", {
      error: error instanceof Error ? error.message : String(error),
    });

    if (isProductionRuntime()) {
      exitOnProductionFailure();
    }
  }

  try {
    await runMigrations();
  } catch (error) {
    logger.error("Database migration failed", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      postgresHost: process.env.POSTGRES_HOST,
      postgresDatabase: process.env.POSTGRES_DATABASE,
    });

    if (isProductionRuntime()) {
      exitOnProductionFailure();
    }
  }

  startMetricsServer();
  await initOtel();
  registerShutdownHandlers();
}
