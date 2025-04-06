import winston from 'winston';

const { format, transports } = winston;
const { combine, timestamp, label, printf, colorize } = format;

/**
 * Custom log format that includes timestamp, level, module name, and message
 */
const logFormat = printf(({ level, message, label, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${label}] ${level}: ${message}`;
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  return msg;
});

/**
 * Creates a logger instance for a specific module
 * @param moduleName Name of the module for log identification
 * @returns Winston logger instance
 */
export function createLogger(moduleName: string) {
  return winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: combine(
      label({ label: moduleName }),
      timestamp(),
      colorize(),
      logFormat
    ),
    transports: [
      new transports.Console({
        handleExceptions: true
      }),
      new transports.File({
        filename: 'error.log',
        level: 'error',
        handleExceptions: true
      }),
      new transports.File({
        filename: 'combined.log'
      })
    ],
    exitOnError: false
  });
}

// Export a default logger for general use
export default createLogger('xii-core-db'); 