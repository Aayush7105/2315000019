export type LogLevel = "debug" | "info" | "warn" | "error";
export type LogStack = "frontend" | "backend" | "logging" | "shared";
export type LogMetadata = Record<string, unknown>;

export interface LogEntryInput {
  level?: LogLevel;
  stack?: LogStack;
  service?: string;
  package?: string;
  message?: string;
  metadata?: LogMetadata;
  endpoint?: string;
}

export interface LogEntry {
  id: string;
  timestamp: string;
  level: LogLevel;
  stack: LogStack;
  service: string;
  package: string;
  message: string;
  metadata: LogMetadata;
}

export interface RequestLogDefaults extends LogEntryInput {
  startMessage?: string;
  successMessage?: string;
  errorMessage?: string;
}

export function logEvent(input: LogEntryInput): Promise<LogEntry>;
export function logDebug(input: LogEntryInput): Promise<LogEntry>;
export function logInfo(input: LogEntryInput): Promise<LogEntry>;
export function logWarn(input: LogEntryInput): Promise<LogEntry>;
export function logError(input: LogEntryInput): Promise<LogEntry>;

export function withRequestLogging<TArgs extends unknown[], TResponse extends Response>(
  handler: (request: Request, ...args: TArgs) => TResponse | Promise<TResponse>,
  defaults?: RequestLogDefaults,
): (request: Request, ...args: TArgs) => Promise<TResponse>;

export function withNodeHttpLogging<TRequest, TResponse>(
  handler: (request: TRequest, response: TResponse, requestId: string) => void | Promise<void>,
  defaults?: RequestLogDefaults,
): (request: TRequest, response: TResponse) => Promise<void>;

export function getBufferedLogs(): LogEntry[];
export function clearBufferedLogs(): void;
