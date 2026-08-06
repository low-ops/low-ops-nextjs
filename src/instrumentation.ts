export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") {
    return;
  }

  const { runMigrations } = await import("@/lib/migrate");
  const { startMetricsServer } = await import("@/lib/metrics-server");
  const { initOtel } = await import("@/lib/otel");
  const { registerShutdownHandlers } = await import("@/lib/shutdown");
  const { logger } = await import("@/lib/logger");

  if (process.env.RUN_MIGRATIONS !== "false") {
    try {
      await runMigrations();
    } catch (error) {
      logger.error("Database migration failed", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  startMetricsServer();
  await initOtel();
  registerShutdownHandlers();
}
