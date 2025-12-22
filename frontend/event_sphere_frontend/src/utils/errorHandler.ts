/**
 * API error handling utility
 * Parse backend errors and convert to user-friendly messages
 * Implements constitutional requirement for User Experience Excellence
 */

export interface ApiError {
  success: false;
  message: string;
  errorCode?: string;
  details?: Record<string, string>;
}

/**
 * Parse error response from API
 * @param error Axios error or unknown error
 * @returns User-friendly error message
 */
export function parseApiError(error: unknown): string {
  // Handle Axios errors
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const axiosError = error as { response?: { data?: ApiError } };
    const apiError = axiosError.response?.data;

    if (apiError && typeof apiError === 'object' && 'message' in apiError) {
      return apiError.message || 'An error occurred';
    }

    // Handle HTTP status codes
    if ('status' in axiosError) {
      const status = (axiosError as { status?: number }).status;
      switch (status) {
        case 400:
          return 'Invalid request. Please check your input.';
        case 401:
          return 'Authentication required. Please log in.';
        case 403:
          return 'You do not have permission to perform this action.';
        case 404:
          return 'The requested resource was not found.';
        case 500:
          return 'Server error. Please try again later.';
        default:
          return 'An unexpected error occurred.';
      }
    }
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  // Handle Error objects
  if (error instanceof Error) {
    return error.message || 'An error occurred';
  }

  // Default message
  return 'An unexpected error occurred. Please try again.';
}

/**
 * Extract validation errors from API error response
 * @param error Axios error or unknown error
 * @returns Object with field names as keys and error messages as values
 */
export function getValidationErrors(error: unknown): Record<string, string> {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const axiosError = error as { response?: { data?: ApiError } };
    const apiError = axiosError.response?.data;

    if (apiError?.details && typeof apiError.details === 'object') {
      return apiError.details as Record<string, string>;
    }
  }

  return {};
}

/**
 * Check if error is a network error
 * @param error Error object
 * @returns True if network error, false otherwise
 */
export function isNetworkError(error: unknown): boolean {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: string }).message?.toLowerCase() || '';
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('connection')
    );
  }
  return false;
}

