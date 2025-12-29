/**
 * Logger utility for conditional logging based on environment
 * Only logs to console in development mode to avoid exposing sensitive data in production
 */

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

class Logger {
    private isDevelopment: boolean;

    constructor() {
        this.isDevelopment = process.env.NODE_ENV === 'development';
    }

    /**
     * Log general information (development only)
     */
    log(...args: any[]): void {
        if (this.isDevelopment) {
            console.log(...args);
        }
    }

    /**
     * Log informational messages (development only)
     */
    info(...args: any[]): void {
        if (this.isDevelopment) {
            console.info(...args);
        }
    }

    /**
     * Log debug information (development only)
     */
    debug(...args: any[]): void {
        if (this.isDevelopment) {
            console.debug(...args);
        }
    }

    /**
     * Log warnings (always logged)
     */
    warn(...args: any[]): void {
        console.warn(...args);
    }

    /**
     * Log errors (always logged)
     */
    error(...args: any[]): void {
        console.error(...args);
    }

    /**
     * Group logs together (development only)
     */
    group(label: string): void {
        if (this.isDevelopment) {
            console.group(label);
        }
    }

    /**
     * End log group (development only)
     */
    groupEnd(): void {
        if (this.isDevelopment) {
            console.groupEnd();
        }
    }

    /**
     * Log with timestamp (development only)
     */
    logWithTime(message: string, ...args: any[]): void {
        if (this.isDevelopment) {
            const timestamp = new Date().toISOString();
            console.log(`[${timestamp}] ${message}`, ...args);
        }
    }
}

// Export singleton instance
export const logger = new Logger();

// Export default for convenience
export default logger;
