import { body, param, ValidationChain, ValidationError } from 'express-validator';
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Request validation middleware using express-validator
 * Implements constitutional requirement for Input Validation & Sanitization (T229)
 * All user input MUST be validated and sanitized before processing
 * 
 * Note: express-validator automatically sanitizes inputs with .trim(), .escape(), etc.
 * This prevents XSS attacks by escaping HTML characters
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
  .matches(/[^a-zA-Z0-9]/)
  .withMessage('Password must contain at least one special character');

// New password validation (for reset password - uses 'newPassword' field)
export const validateNewPassword = body('newPassword')
  .isLength({ min: 8 })
  .withMessage('Password must be at least 8 characters long')
  .matches(/[A-Z]/)
  .withMessage('Password must contain at least one uppercase letter')
  .matches(/[a-z]/)
  .withMessage('Password must contain at least one lowercase letter')
  .matches(/[0-9]/)
  .withMessage('Password must contain at least one number')
  .matches(/[^a-zA-Z0-9]/)
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

// Floor plan validation
export const validateFloorPlanName = body('name')
  .trim()
  .isLength({ min: 3, max: 200 })
  .withMessage('Floor plan name must be between 3 and 200 characters');

export const validateFloorPlanDimensions = [
  body('dimensions.width')
    .isFloat({ min: 10, max: 1000 })
    .withMessage('Floor plan width must be between 10 and 1000 meters'),
  body('dimensions.height')
    .isFloat({ min: 10, max: 1000 })
    .withMessage('Floor plan height must be between 10 and 1000 meters'),
];

// Booth space validation
export const validateBoothIdentifier = body('identifier')
  .trim()
  .isLength({ min: 1, max: 50 })
  .withMessage('Booth identifier must be between 1 and 50 characters')
  .matches(/^[A-Za-z0-9\-_]+$/)
  .withMessage('Booth identifier can only contain letters, numbers, hyphens, and underscores');

export const validateBoothSize = [
  body('size.width')
    .isFloat({ min: 0.5, max: 100 })
    .withMessage('Booth width must be between 0.5 and 100 meters'),
  body('size.height')
    .isFloat({ min: 0.5, max: 100 })
    .withMessage('Booth height must be between 0.5 and 100 meters'),
];

export const validateBoothLocation = [
  body('location.x')
    .isFloat({ min: 0 })
    .withMessage('Booth x coordinate must be a positive number'),
  body('location.y')
    .isFloat({ min: 0 })
    .withMessage('Booth y coordinate must be a positive number'),
];

export const validateBoothPriceTier = body('priceTier')
  .optional()
  .isIn(['standard', 'premium', 'deluxe'])
  .withMessage('Price tier must be one of: standard, premium, deluxe');

// Message validation (T164)
export const validateMessageContent = body('content')
  .trim()
  .isLength({ min: 1, max: 5000 })
  .withMessage('Message content must be between 1 and 5000 characters');

export const validateMessageSubject = body('subject')
  .optional()
  .trim()
  .isLength({ max: 200 })
  .withMessage('Subject must be at most 200 characters');

export const validateMessageContext = body('context')
  .isIn(['general-inquiry', 'exhibitor-collaboration', 'support-request', 'organizer-communication'])
  .withMessage('Invalid message context');

export const validateRecipientId = body('recipientId')
  .notEmpty()
  .withMessage('Recipient ID is required')
  .isMongoId()
  .withMessage('Invalid recipient ID format');

export const validateRelatedExpoId = body('relatedExpoId')
  .optional()
  .isMongoId()
  .withMessage('Invalid related expo ID format');

// Feedback validation (T213)
export const validateFeedbackCategory = body('category')
  .isIn(['suggestion', 'bug-report', 'support-request'])
  .withMessage('Category must be one of: suggestion, bug-report, support-request');

export const validateFeedbackSubject = body('subject')
  .trim()
  .isLength({ min: 5, max: 200 })
  .withMessage('Subject must be between 5 and 200 characters');

export const validateFeedbackMessage = body('message')
  .trim()
  .isLength({ min: 10, max: 5000 })
  .withMessage('Message must be between 10 and 5000 characters');

export const validateFeedbackStatus = body('status')
  .optional()
  .isIn(['pending', 'reviewed', 'resolved', 'closed'])
  .withMessage('Status must be one of: pending, reviewed, resolved, closed');

