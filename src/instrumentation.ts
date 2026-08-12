import "@/lib/aws-compat";

export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const { runMigrations } = await import("@/lib/migrate");
  const { startMetricsServer } = await import("@/lib/metrics-server");
  const { initOtel } = await import("@/lib/otel");
  const { registerShutdownHandlers } = await import("@/lib/shutdown");
  const { isAuthSecretDerived, isMetricsServerEnabled, isProductionRuntime, validateRuntimeEnv } =
    await import("@/lib/env");
  const { logger } = await import("@/lib/logger");

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
      process.exit(1);
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
      process.exit(1);
    }
  }

  startMetricsServer();
  await initOtel();
  registerShutdownHandlers();
}
