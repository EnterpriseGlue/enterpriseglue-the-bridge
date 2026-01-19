import { describe, it, expect } from 'vitest';
import { parseApiError, getUiErrorMessage, getErrorMessageFromResponse } from '@src/shared/api/apiErrorUtils';
import { ApiError } from '@src/shared/api/client';

describe('apiErrorUtils', () => {
  describe('parseApiError', () => {
    it('parses ApiError with JSON payload containing error field', () => {
      const error = new ApiError(400, 'Bad Request', JSON.stringify({ error: 'Invalid input', field: 'email' }));
      const parsed = parseApiError(error);
      expect(parsed.message).toBe('Invalid input');
      expect(parsed.field).toBe('email');
      expect(parsed.status).toBe(400);
      expect(parsed.payload).toEqual({ error: 'Invalid input', field: 'email' });
    });

    it('parses ApiError with JSON payload containing message field', () => {
      const error = new ApiError(400, 'Bad Request', JSON.stringify({ message: 'Validation failed', hint: 'Check your input' }));
      const parsed = parseApiError(error);
      expect(parsed.message).toBe('Validation failed');
      expect(parsed.hint).toBe('Check your input');
      expect(parsed.status).toBe(400);
    });

    it('prioritizes error field over message field', () => {
      const error = new ApiError(400, 'Bad Request', JSON.stringify({ error: 'Error message', message: 'Message field' }));
      const parsed = parseApiError(error);
      expect(parsed.message).toBe('Error message');
    });

    it('parses ApiError with hint field', () => {
      const error = new ApiError(400, 'Bad Request', JSON.stringify({ error: 'Invalid', hint: 'Try again' }));
      const parsed = parseApiError(error);
      expect(parsed.hint).toBe('Try again');
    });

    it('parses ApiError with field field', () => {
      const error = new ApiError(400, 'Bad Request', JSON.stringify({ error: 'Invalid', field: 'username' }));
      const parsed = parseApiError(error);
      expect(parsed.field).toBe('username');
    });

    it('parses ApiError with plain text message', () => {
      const error = new ApiError(404, 'Not Found', 'Resource not found');
      const parsed = parseApiError(error);
      expect(parsed.message).toBe('Resource not found');
      expect(parsed.status).toBe(404);
    });

    it('falls back to HTTP status when no message available', () => {
      const error = new ApiError(403, 'Forbidden', '');
      const parsed = parseApiError(error);
      expect(parsed.message).toBe('HTTP 403');
    });

    it('handles empty string error field', () => {
      const error = new ApiError(400, 'Bad Request', JSON.stringify({ error: '   ', message: 'Valid message' }));
      const parsed = parseApiError(error);
      expect(parsed.message).toBe('Valid message');
    });

    it('handles empty string message field', () => {
      const error = new ApiError(400, 'Bad Request', JSON.stringify({ message: '   ' }));
      const parsed = parseApiError(error);
      // The implementation uses the raw error.message when parsed fields are empty after trim
      expect(parsed.message).toBe(JSON.stringify({ message: '   ' }));
    });

    it('handles non-JSON ApiError message', () => {
      const error = new ApiError(500, 'Server Error', 'Plain text error');
      const parsed = parseApiError(error);
      expect(parsed.message).toBe('Plain text error');
      expect(parsed.payload).toBeUndefined();
    });

    it('handles malformed JSON in ApiError', () => {
      const error = new ApiError(400, 'Bad Request', '{invalid json}');
      const parsed = parseApiError(error);
      expect(parsed.message).toBe('{invalid json}');
      expect(parsed.payload).toBeUndefined();
    });

    it('parses generic Error with message', () => {
      const error = new Error('Something went wrong');
      const parsed = parseApiError(error);
      expect(parsed.message).toBe('Something went wrong');
      expect(parsed.status).toBeUndefined();
    });

    it('parses generic Error with empty message', () => {
      const error = new Error('');
      const parsed = parseApiError(error, 'Fallback message');
      expect(parsed.message).toBe('Fallback message');
    });

    it('uses fallback for unknown error types', () => {
      const parsed = parseApiError({ unknown: 'error' }, 'Default message');
      expect(parsed.message).toBe('Default message');
    });

    it('uses fallback for null error', () => {
      const parsed = parseApiError(null, 'Null error');
      expect(parsed.message).toBe('Null error');
    });

    it('uses fallback for undefined error', () => {
      const parsed = parseApiError(undefined, 'Undefined error');
      expect(parsed.message).toBe('Undefined error');
    });

    it('uses default fallback message when not provided', () => {
      const parsed = parseApiError({ unknown: 'error' });
      expect(parsed.message).toBe('Request failed');
    });

    it('handles ApiError with non-string hint', () => {
      const error = new ApiError(400, 'Bad Request', JSON.stringify({ error: 'Invalid', hint: 123 }));
      const parsed = parseApiError(error);
      expect(parsed.hint).toBeUndefined();
    });

    it('handles ApiError with non-string field', () => {
      const error = new ApiError(400, 'Bad Request', JSON.stringify({ error: 'Invalid', field: 123 }));
      const parsed = parseApiError(error);
      expect(parsed.field).toBeUndefined();
    });
  });

  describe('getUiErrorMessage', () => {
    it('extracts message from ApiError with JSON error', () => {
      const error = new ApiError(500, 'Server Error', JSON.stringify({ error: 'Database connection failed' }));
      const message = getUiErrorMessage(error);
      expect(message).toBe('Database connection failed');
    });

    it('extracts message from ApiError with JSON message', () => {
      const error = new ApiError(400, 'Bad Request', JSON.stringify({ message: 'Validation error' }));
      const message = getUiErrorMessage(error);
      expect(message).toBe('Validation error');
    });

    it('extracts message from generic Error', () => {
      const error = new Error('Network error');
      const message = getUiErrorMessage(error);
      expect(message).toBe('Network error');
    });

    it('uses fallback for unknown error', () => {
      const message = getUiErrorMessage({ unknown: 'error' }, 'Custom fallback');
      expect(message).toBe('Custom fallback');
    });

    it('uses default fallback when not provided', () => {
      const message = getUiErrorMessage(null);
      expect(message).toBe('Request failed');
    });
  });

  describe('getErrorMessageFromResponse', () => {
    it('extracts JSON error message from application/json response', async () => {
      const response = new Response(JSON.stringify({ error: 'Not authorized' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      });
      const message = await getErrorMessageFromResponse(response);
      expect(message).toBe('Not authorized');
    });

    it('extracts JSON message field from application/json response', async () => {
      const response = new Response(JSON.stringify({ message: 'Invalid token' }), {
        status: 401,
        headers: { 'content-type': 'application/json' },
      });
      const message = await getErrorMessageFromResponse(response);
      expect(message).toBe('Invalid token');
    });

    it('returns service unavailable message for 500 error', async () => {
      const response = new Response('Internal Error', { status: 500 });
      const message = await getErrorMessageFromResponse(response);
      expect(message).toContain('temporarily unavailable');
      expect(message).toContain('backend and database');
    });

    it('returns service unavailable message for 502 error', async () => {
      const response = new Response('Bad Gateway', { status: 502 });
      const message = await getErrorMessageFromResponse(response);
      expect(message).toContain('temporarily unavailable');
    });

    it('returns service unavailable message for 503 error', async () => {
      const response = new Response('Service Unavailable', { status: 503 });
      const message = await getErrorMessageFromResponse(response);
      expect(message).toContain('temporarily unavailable');
    });

    it('returns plain text for non-JSON responses', async () => {
      const response = new Response('Error text', { status: 400 });
      const message = await getErrorMessageFromResponse(response);
      expect(message).toBe('Error text');
    });

    it('parses JSON even without application/json content-type', async () => {
      const response = new Response(JSON.stringify({ error: 'Parsed anyway' }), {
        status: 400,
        headers: { 'content-type': 'text/plain' },
      });
      const message = await getErrorMessageFromResponse(response);
      expect(message).toBe('Parsed anyway');
    });

    it('handles empty response body', async () => {
      const response = new Response('', { status: 404, statusText: 'Not Found' });
      const message = await getErrorMessageFromResponse(response);
      expect(message).toBe('HTTP 404: Not Found');
    });

    it('handles response with no statusText', async () => {
      const response = new Response('', { status: 404 });
      const message = await getErrorMessageFromResponse(response);
      expect(message).toBe('HTTP 404: Error');
    });

    it('handles malformed JSON in response', async () => {
      const response = new Response('{invalid json}', { status: 400 });
      const message = await getErrorMessageFromResponse(response);
      expect(message).toBe('{invalid json}');
    });

    it('handles response.text() throwing error', async () => {
      const response = new Response(null, { status: 400, statusText: 'Bad Request' });
      Object.defineProperty(response, 'text', {
        value: () => Promise.reject(new Error('Cannot read body')),
      });
      const message = await getErrorMessageFromResponse(response);
      expect(message).toBe('HTTP 400: Bad Request');
    });

    it('handles JSON with empty error and message fields', async () => {
      const response = new Response(JSON.stringify({ error: '', message: '' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
      const message = await getErrorMessageFromResponse(response);
      // When JSON fields are empty, it falls back to the raw body text
      expect(message).toBe(JSON.stringify({ error: '', message: '' }));
    });

    it('handles content-type with charset', async () => {
      const response = new Response(JSON.stringify({ error: 'Charset test' }), {
        status: 400,
        headers: { 'content-type': 'application/json; charset=utf-8' },
      });
      const message = await getErrorMessageFromResponse(response);
      expect(message).toBe('Charset test');
    });

    it('handles missing content-type header', async () => {
      const response = new Response(JSON.stringify({ error: 'No content type' }), {
        status: 400,
      });
      const message = await getErrorMessageFromResponse(response);
      expect(message).toBe('No content type');
    });
  });
});
