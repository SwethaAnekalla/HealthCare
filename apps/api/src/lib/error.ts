export class AppError extends Error {
  constructor(
    public code: string,
    public message: string,
    public statusCode: number = 400,
    public details?: Record<string, any>,
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errors = {
  UNAUTHORIZED: () => new AppError('UNAUTHORIZED', 'Unauthorized access', 401),
  FORBIDDEN: () => new AppError('FORBIDDEN', 'Access denied', 403),
  NOT_FOUND: (resource: string) =>
    new AppError('NOT_FOUND', `${resource} not found`, 404),
  VALIDATION_ERROR: (message: string, details?: Record<string, any>) =>
    new AppError('VALIDATION_ERROR', message, 400, details),
  CONFLICT: (message: string) => new AppError('CONFLICT', message, 409),
  INTERNAL_SERVER_ERROR: () =>
    new AppError('INTERNAL_SERVER_ERROR', 'An unexpected error occurred', 500),
  SLOT_NOT_AVAILABLE: () =>
    new AppError('SLOT_NOT_AVAILABLE', 'Selected slot is no longer available', 409),
  APPOINTMENT_ALREADY_EXISTS: () =>
    new AppError(
      'APPOINTMENT_ALREADY_EXISTS',
      'You already have an appointment for this time slot',
      409,
    ),
  INVALID_CREDENTIALS: () =>
    new AppError('INVALID_CREDENTIALS', 'Invalid email or password', 401),
  EMAIL_ALREADY_EXISTS: () =>
    new AppError('EMAIL_ALREADY_EXISTS', 'Email already registered', 409),
  PHONE_ALREADY_EXISTS: () =>
    new AppError('PHONE_ALREADY_EXISTS', 'Phone number already registered', 409),
  INVALID_TOKEN: () => new AppError('INVALID_TOKEN', 'Invalid or expired token', 401),
  REFUND_NOT_FOUND: () => new AppError('REFUND_NOT_FOUND', 'Refund not found', 404),
};
