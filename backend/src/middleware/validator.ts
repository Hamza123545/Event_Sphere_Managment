import { body, param, ValidationChain, ValidationError } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Request validation middleware using express-validator
 * Implements constitutional requirement for Input Validation & Sanitization
 * All user input MUST be validated and sanitized before processing
 */

/**
 * Middleware to handle validation errors from express-validator
 */
export function validate(validations: ValidationChain[]) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Run all validations
    const results = await Promise.all(validations.map((validation) => validation.run(req)));

    // Check for errors
    const errors = results
      .filter((result) => result.array().length > 0)
      .flatMap((result) => result.array());

    if (errors.length > 0) {
      const validationErrors: Record<string, string> = {};
      errors.forEach((error: ValidationError) => {
        if (error.type === 'field') {
          validationErrors[error.path] = error.msg;
        }
      });

      logger.warn('Validation failed', {
        errors: validationErrors,
        path: req.path,
        method: req.method,
      });

      res.status(400).json({
        success: false,
        message: 'Validation error',
        errorCode: 'VALIDATION_ERROR',
        details: validationErrors,
      });
      return;
    }

    next();
  };
}

/**
 * Common validation rules
 */

// Email validation
export const validateEmail = body('email')
  .trim()
  .isEmail()
  .withMessage('Invalid email format')
  .normalizeEmail()
  .toLowerCase();

// Password validation (min 8 chars, uppercase, lowercase, number, special char)
export const validatePassword = body('password')
  .isLength({ min: 8 })
  .withMessage('Password must be at least 8 characters long')
  .matches(/[A-Z]/)
  .withMessage('Password must contain at least one uppercase letter')
  .matches(/[a-z]/)
  .withMessage('Password must contain at least one lowercase letter')
  .matches(/[0-9]/)
  .withMessage('Password must contain at least one number')
  .matches(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/)
  .withMessage('Password must contain at least one special character');

// ObjectId validation for MongoDB
export const validateObjectId = (field: string = 'id') =>
  param(field)
    .isMongoId()
    .withMessage(`Invalid ${field} format`);

// Optional ObjectId validation
export const validateOptionalObjectId = (field: string = 'id') =>
  param(field)
    .optional()
    .isMongoId()
    .withMessage(`Invalid ${field} format`);

// String validation with length constraints
export const validateString = (
  field: string,
  options: { min?: number; max?: number; required?: boolean } = {}
) => {
  const { min, max, required = true } = options;
  let validator = body(field).trim();

  if (required) {
    validator = validator.notEmpty().withMessage(`${field} is required`);
  } else {
    validator = validator.optional();
  }

  if (min !== undefined) {
    validator = validator.isLength({ min }).withMessage(`${field} must be at least ${min} characters`);
  }

  if (max !== undefined) {
    validator = validator.isLength({ max }).withMessage(`${field} must be at most ${max} characters`);
  }

  return validator;
};

// Enum validation
export const validateEnum = (field: string, allowedValues: string[]) =>
  body(field)
    .isIn(allowedValues)
    .withMessage(`${field} must be one of: ${allowedValues.join(', ')}`);

// Date validation
export const validateDate = (field: string, required: boolean = true) => {
  let validator = body(field);
  if (required) {
    validator = validator.notEmpty().withMessage(`${field} is required`);
  } else {
    validator = validator.optional();
  }
  return validator.isISO8601().withMessage(`${field} must be a valid date`);
};

// Number validation
export const validateNumber = (
  field: string,
  options: { min?: number; max?: number; required?: boolean } = {}
) => {
  const { min, max, required = true } = options;
  let validator = body(field);

  if (required) {
    validator = validator.notEmpty().withMessage(`${field} is required`);
  } else {
    validator = validator.optional();
  }

  validator = validator.isNumeric().withMessage(`${field} must be a number`);

  if (min !== undefined) {
    validator = validator.isInt({ min }).withMessage(`${field} must be at least ${min}`);
  }

  if (max !== undefined) {
    validator = validator.isInt({ max }).withMessage(`${field} must be at most ${max}`);
  }

  return validator;
};

// Array validation
export const validateArray = (field: string, required: boolean = true) => {
  let validator = body(field);
  if (required) {
    validator = validator.notEmpty().withMessage(`${field} is required`);
  } else {
    validator = validator.optional();
  }
  return validator.isArray().withMessage(`${field} must be an array`);
};

// Boolean validation
export const validateBoolean = (field: string, required: boolean = true) => {
  let validator = body(field);
  if (required) {
    validator = validator.notEmpty().withMessage(`${field} is required`);
  } else {
    validator = validator.optional();
  }
  return validator.isBoolean().withMessage(`${field} must be a boolean`);
};

