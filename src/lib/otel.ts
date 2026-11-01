import { getOtelConfig } from "@/lib/env";
import { logger } from "@/lib/logger";

const globalState = globalThis as typeof globalThis & {
  __otelSdk?: { shutdown: () => Promise<void> };
};

export async function initOtel() {
  if (globalState.__otelSdk) {
    return;
  }

  const otelConfig = getOtelConfig();

  if (!otelConfig) {
    return;
  }

  const [
    { NodeSDK },
    { OTLPTraceExporter },
    { getNodeAutoInstrumentations },
    { resourceFromAttributes },
    { ATTR_SERVICE_NAME },
  ] = await Promise.all([
    import("@opentelemetry/sdk-node"),
    import("@opentelemetry/exporter-trace-otlp-http"),
    import("@opentelemetry/auto-instrumentations-node"),
    import("@opentelemetry/resources"),
    import("@opentelemetry/semantic-conventions"),
  ]);

  const sdk = new NodeSDK({
    resource: resourceFromAttributes({
      [ATTR_SERVICE_NAME]: otelConfig.serviceName,
    }),
    traceExporter: new OTLPTraceExporter({
      url: `${otelConfig.endpoint}/v1/traces`,
    }),
    instrumentations: [getNodeAutoInstrumentations()],
  });

  sdk.start();
  globalState.__otelSdk = sdk;

  logger.info("OpenTelemetry initialized", {
    endpoint: otelConfig.endpoint,
    serviceName: otelConfig.serviceName,
  });
}

export async function shutdownOtel() {
  if (!globalState.__otelSdk) {
    return;
  }

  await globalState.__otelSdk.shutdown();
  globalState.__otelSdk = undefined;
}
