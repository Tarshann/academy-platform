type LogArgs = Parameters<typeof console.log>;

const shouldLog = () => import.meta.env.DEV;

export const logger = {
  info: (...args: LogArgs) => {
    if (shouldLog()) {
      console.log(...args);
    }
  },
  warn: (...args: LogArgs) => {
    if (shouldLog()) {
      console.warn(...args);
    }
  },
  error: (...args: LogArgs) => {
    console.error(...args);
  },
};
