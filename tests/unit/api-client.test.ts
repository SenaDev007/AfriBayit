// Unit tests for the api-client module (CDC §3.1.2).
// Tests the pure helpers: ApiError, setAccessToken/getAccessToken,
// and the API helper object shapes.

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  setAccessToken,
  getAccessToken,
  ApiError,
  api,
  authApi,
  propertiesApi,
  escrowApi,
  rebeccaApi,
  apiGet,
  apiPost,
  apiPatch,
  apiDelete,
  apiPut,
} from '@/lib/api-client';

describe('ApiError', () => {
  it('creates an error with message + statusCode', () => {
    const err = new ApiError('Not found', 404);
    expect(err.message).toBe('Not found');
    expect(err.statusCode).toBe(404);
    expect(err.name).toBe('ApiError');
    expect(err instanceof Error).toBe(true);
  });

  it('creates an error with data payload', () => {
    const err = new ApiError('Validation failed', 400, { field: 'email' });
    expect(err.data).toEqual({ field: 'email' });
    expect(err.statusCode).toBe(400);
  });

  it('creates an error without data payload', () => {
    const err = new ApiError('Server error', 500);
    expect(err.data).toBeUndefined();
  });
});

describe('setAccessToken / getAccessToken', () => {
  beforeEach(() => {
    localStorage.clear();
    setAccessToken(null);
  });

  it('stores a token in localStorage and returns it', () => {
    setAccessToken('my-jwt-token');
    expect(localStorage.getItem('afribayit_access_token')).toBe('my-jwt-token');
    expect(getAccessToken()).toBe('my-jwt-token');
  });

  it('removes the token from localStorage when set to null', () => {
    setAccessToken('my-jwt-token');
    expect(getAccessToken()).toBe('my-jwt-token');
    setAccessToken(null);
    expect(localStorage.getItem('afribayit_access_token')).toBeNull();
    expect(getAccessToken()).toBeNull();
  });

  it('uses the in-memory cache on subsequent calls', () => {
    setAccessToken('cached-token');
    const spy = vi.spyOn(localStorage, 'getItem');
    getAccessToken();
    getAccessToken();
    getAccessToken();
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('recovers from localStorage if in-memory is null but localStorage has a token', () => {
    setAccessToken(null);
    localStorage.setItem('afribayit_access_token', 'external-token');
    const token = getAccessToken();
    expect(token).toBe('external-token');
  });
});

describe('api convenience methods', () => {
  it('has get, post, patch, put, delete, upload, downloadBlob', () => {
    expect(typeof api.get).toBe('function');
    expect(typeof api.post).toBe('function');
    expect(typeof api.patch).toBe('function');
    expect(typeof api.put).toBe('function');
    expect(typeof api.delete).toBe('function');
    expect(typeof api.upload).toBe('function');
    expect(typeof api.downloadBlob).toBe('function');
  });
});

describe('authApi helpers (CDC §4.1)', () => {
  it('has all required auth methods', () => {
    expect(typeof authApi.login).toBe('function');
    expect(typeof authApi.login2FA).toBe('function');
    expect(typeof authApi.register).toBe('function');
    expect(typeof authApi.me).toBe('function');
    expect(typeof authApi.setup2FA).toBe('function');
    expect(typeof authApi.enable2FA).toBe('function');
    expect(typeof authApi.disable2FA).toBe('function');
    expect(typeof authApi.sendOTP).toBe('function');
    expect(typeof authApi.verifyOTP).toBe('function');
    expect(typeof authApi.resetPassword).toBe('function');
    expect(typeof authApi.logout).toBe('function');
  });
});

describe('propertiesApi helpers (CDC §5.1)', () => {
  it('has list, featured, get, create, update, delete', () => {
    expect(typeof propertiesApi.list).toBe('function');
    expect(typeof propertiesApi.featured).toBe('function');
    expect(typeof propertiesApi.get).toBe('function');
    expect(typeof propertiesApi.create).toBe('function');
    expect(typeof propertiesApi.update).toBe('function');
    expect(typeof propertiesApi.delete).toBe('function');
  });
});

describe('escrowApi helpers (CDC §7B)', () => {
  it('has fund, release, dispute, ledger', () => {
    expect(typeof escrowApi.fund).toBe('function');
    expect(typeof escrowApi.release).toBe('function');
    expect(typeof escrowApi.dispute).toBe('function');
    expect(typeof escrowApi.ledger).toBe('function');
  });
});

describe('rebeccaApi helpers (CDC §8.2)', () => {
  it('has chat, agent, functions, analyzeDocument', () => {
    expect(typeof rebeccaApi.chat).toBe('function');
    expect(typeof rebeccaApi.agent).toBe('function');
    expect(typeof rebeccaApi.functions).toBe('function');
    expect(typeof rebeccaApi.analyzeDocument).toBe('function');
  });
});

describe('legacy compatibility exports', () => {
  it('apiGet, apiPost, apiPatch, apiDelete, apiPut are functions', () => {
    expect(typeof apiGet).toBe('function');
    expect(typeof apiPost).toBe('function');
    expect(typeof apiPatch).toBe('function');
    expect(typeof apiDelete).toBe('function');
    expect(typeof apiPut).toBe('function');
  });
});
