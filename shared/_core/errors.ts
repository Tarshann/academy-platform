/**
 * Base HTTP error class with status code.
 * Throw this from route handlers to send specific HTTP errors.
 */
export class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public details?: unknown
  ) {
    super(message);
    this.name = "HttpError";
  }
}

// Convenience constructors
export const BadRequestError = (msg: string, details?: unknown) => 
  new HttpError(400, msg, "BAD_REQUEST", details);

export const UnauthorizedError = (msg: string = "Unauthorized") => 
  new HttpError(401, msg, "UNAUTHORIZED");

export const ForbiddenError = (msg: string = "Forbidden") => 
  new HttpError(403, msg, "FORBIDDEN");

export const NotFoundError = (msg: string = "Not found") => 
  new HttpError(404, msg, "NOT_FOUND");

export const ConflictError = (msg: string, details?: unknown) => 
  new HttpError(409, msg, "CONFLICT", details);

export const InternalServerError = (msg: string = "Internal server error", details?: unknown) => 
  new HttpError(500, msg, "INTERNAL_SERVER_ERROR", details);

/**
 * Domain-specific error classes
 */
export class ValidationError extends HttpError {
  constructor(message: string, public fields?: Record<string, string>) {
    super(400, message, "VALIDATION_ERROR", fields);
    this.name = "ValidationError";
  }
}

export class CapacityExceededError extends HttpError {
  constructor(maxCapacity: number, currentCount: number) {
    super(
      409,
      `Capacity exceeded. Maximum: ${maxCapacity}, Current: ${currentCount}`,
      "CAPACITY_EXCEEDED",
      { maxCapacity, currentCount }
    );
    this.name = "CapacityExceededError";
  }
}

export class DuplicateRegistrationError extends HttpError {
  constructor() {
    super(409, "You are already registered for this session", "DUPLICATE_REGISTRATION");
    this.name = "DuplicateRegistrationError";
  }
}

/**
 * Error codes enum for consistent error messaging
 */
export enum ErrorCode {
  // General
  BAD_REQUEST = "BAD_REQUEST",
  UNAUTHORIZED = "UNAUTHORIZED",
  FORBIDDEN = "FORBIDDEN",
  NOT_FOUND = "NOT_FOUND",
  CONFLICT = "CONFLICT",
  INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR",
  
  // Validation
  VALIDATION_ERROR = "VALIDATION_ERROR",
  
  // Registration
  CAPACITY_EXCEEDED = "CAPACITY_EXCEEDED",
  DUPLICATE_REGISTRATION = "DUPLICATE_REGISTRATION",
  
  // Payment
  PAYMENT_FAILED = "PAYMENT_FAILED",
  PAYMENT_ALREADY_PROCESSED = "PAYMENT_ALREADY_PROCESSED",
  
  // Database
  DATABASE_ERROR = "DATABASE_ERROR",
  RECORD_NOT_FOUND = "RECORD_NOT_FOUND",
}
