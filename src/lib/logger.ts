type LogLevel = "debug" | "info" | "warn" | "error";

type LogFields = Record<string, unknown>;

function writeLog(level: LogLevel, message: string, fields: LogFields = {}) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(fields.trace_id ? { trace_id: fields.trace_id } : {}),
    ...(fields.span_id ? { span_id: fields.span_id } : {}),
    ...Object.fromEntries(
      Object.entries(fields).filter(
        ([key]) => key !== "trace_id" && key !== "span_id",
      ),
    ),
  };

  const line = JSON.stringify(entry);

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.log(line);
}

export const logger = {
  debug(message: string, fields?: LogFields) {
    writeLog("debug", message, fields);
  },
  info(message: string, fields?: LogFields) {
    writeLog("info", message, fields);
  },
  warn(message: string, fields?: LogFields) {
    writeLog("warn", message, fields);
  },
  error(message: string, fields?: LogFields) {
    writeLog("error", message, fields);
  },
};
