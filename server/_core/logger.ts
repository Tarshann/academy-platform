import { ENV } from "./env";

type LogArgs = Parameters<typeof console.log>;

function shouldLog() {
  return !ENV.isProduction;
}

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
