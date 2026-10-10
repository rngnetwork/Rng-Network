import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import axios, { AxiosError, AxiosHeaders, InternalAxiosRequestConfig } from 'axios';
import { HttpClient, refreshClient } from '../client';
import { ApiHttpError } from '../types';
import {
  DISCORD_SAFE_URL_REGEX,
  ComponentType,
  getDiscordAvatarUrl,
} from '../../../model';

describe('HttpClient Token Refresh Mutex & Error Handling', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('serializes 5 concurrent 401 responses into exactly 1 refresh call and retries all 5', async () => {
    localStorage.setItem('rng_access_token', 'expired_token_123');

    const refreshSpy = vi.spyOn(refreshClient, 'post').mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              data: {
                success: true,
                data: { accessToken: 'fresh_token_999' },
              },
              status: 200,
              statusText: 'OK',
              headers: {},
              config: { headers: new AxiosHeaders() },
            });
          }, 25);
        })
    );

    const customAxios = axios.create({
      baseURL: 'http://localhost:8080/api/v1',
    });

    customAxios.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      const authHeader = config.headers?.Authorization;
      if (authHeader === 'Bearer fresh_token_999') {
        return {
          data: {
            success: true,
            data: { url: config.url, retriedWith: authHeader },
          },
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        };
      }

      const err = new AxiosError(
        'Unauthorized',
        'ERR_BAD_REQUEST',
        config,
        {},
        {
          data: {
            type: 'https://rng.control/errors/unauthorized',
            title: 'Unauthorized',
            status: 401,
            detail: 'Access token expired',
          },
          status: 401,
          statusText: 'Unauthorized',
          headers: {},
          config,
        }
      );
      throw err;
    };

    const client = new HttpClient(customAxios);

    const results = await Promise.all([
      client.get<{ url: string; retriedWith: string }>('/servers/1'),
      client.get<{ url: string; retriedWith: string }>('/servers/2'),
      client.get<{ url: string; retriedWith: string }>('/servers/3'),
      client.get<{ url: string; retriedWith: string }>('/servers/4'),
      client.get<{ url: string; retriedWith: string }>('/servers/5'),
    ]);

    expect(refreshSpy).toHaveBeenCalledTimes(1);
    expect(refreshSpy).toHaveBeenCalledWith('/auth/refresh');
    expect(localStorage.getItem('rng_access_token')).toBe('fresh_token_999');

    expect(results).toHaveLength(5);
    results.forEach((res, index) => {
      expect(res.success).toBe(true);
      expect(res.data.url).toBe(`/servers/${index + 1}`);
      expect(res.data.retriedWith).toBe('Bearer fresh_token_999');
    });
  });

  it('prevents infinite refresh loops when a retried request (_retry = true) still returns 401', async () => {
    localStorage.setItem('rng_access_token', 'expired_token_123');

    const refreshSpy = vi.spyOn(refreshClient, 'post').mockResolvedValue({
      data: {
        success: true,
        data: { accessToken: 'still_unauthorized_token' },
      },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: { headers: new AxiosHeaders() },
    });

    const customAxios = axios.create({
      baseURL: 'http://localhost:8080/api/v1',
    });

    customAxios.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      throw new AxiosError(
        'Unauthorized',
        'ERR_BAD_REQUEST',
        config,
        {},
        {
          data: {
            type: 'about:blank',
            title: 'Unauthorized',
            status: 401,
            detail: 'Still unauthorized after refresh',
          },
          status: 401,
          statusText: 'Unauthorized',
          headers: {},
          config,
        }
      );
    };

    const client = new HttpClient(customAxios);

    await expect(client.get('/servers')).rejects.toBeInstanceOf(ApiHttpError);
    expect(refreshSpy).toHaveBeenCalledTimes(1);
  });

  it('dispatches rng:session-expired and clears stored tokens when refresh fails', async () => {
    localStorage.setItem('rng_access_token', 'expired_token_123');
    localStorage.setItem('accessToken', 'expired_token_123');

    vi.spyOn(refreshClient, 'post').mockRejectedValue(new Error('Refresh token revoked'));

    const sessionExpiredListener = vi.fn();
    window.addEventListener('rng:session-expired', sessionExpiredListener);

    const customAxios = axios.create({
      baseURL: 'http://localhost:8080/api/v1',
    });

    customAxios.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      throw new AxiosError(
        'Unauthorized',
        'ERR_BAD_REQUEST',
        config,
        {},
        {
          data: {
            type: 'about:blank',
            title: 'Unauthorized',
            status: 401,
            detail: 'Expired token',
          },
          status: 401,
          statusText: 'Unauthorized',
          headers: {},
          config,
        }
      );
    };

    const client = new HttpClient(customAxios);

    await expect(client.get('/users/me')).rejects.toThrow('Refresh token revoked');
    expect(sessionExpiredListener).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('rng_access_token')).toBeNull();
    expect(localStorage.getItem('accessToken')).toBeNull();

    window.removeEventListener('rng:session-expired', sessionExpiredListener);
  });

  it('parses RFC 7807 ProblemDetails on non-401 errors into ApiHttpError', async () => {
    const customAxios = axios.create({
      baseURL: 'http://localhost:8080/api/v1',
    });

    customAxios.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
      throw new AxiosError(
        'Forbidden',
        'ERR_BAD_REQUEST',
        config,
        {},
        {
          data: {
            type: 'https://rng.control/errors/forbidden',
            title: 'Ministry Clearance Violation',
            status: 403,
            detail: 'Ministers may only modify personnel within their assigned ministry.',
          },
          status: 403,
          statusText: 'Forbidden',
          headers: {},
          config,
        }
      );
    };

    const client = new HttpClient(customAxios);

    await expect(client.post('/whitelist', {})).rejects.toMatchObject({
      name: 'ApiHttpError',
      status: 403,
      message: 'Ministers may only modify personnel within their assigned ministry.',
      problemDetails: {
        title: 'Ministry Clearance Violation',
        status: 403,
      },
    });
  });

  it('validates DISCORD_SAFE_URL_REGEX, ComponentType enum, and getDiscordAvatarUrl', () => {
    expect(DISCORD_SAFE_URL_REGEX.test('https://discord.com/channels/1/2')).toBe(true);
    expect(DISCORD_SAFE_URL_REGEX.test('discord://-/channels/1/2')).toBe(true);
    expect(DISCORD_SAFE_URL_REGEX.test('javascript:alert(1)')).toBe(false);
    expect(DISCORD_SAFE_URL_REGEX.test('data:text/html,<script>alert(1)</script>')).toBe(false);

    expect(ComponentType.ACTION_ROW).toBe(1);
    expect(ComponentType.BUTTON).toBe(2);
    expect(ComponentType.STRING_SELECT).toBe(3);
    expect(ComponentType.SECTION).toBe(9);
    expect(ComponentType.TEXT_DISPLAY).toBe(10);
    expect(ComponentType.THUMBNAIL).toBe(11);
    expect(ComponentType.MEDIA_GALLERY).toBe(12);
    expect(ComponentType.SEPARATOR).toBe(14);
    expect(ComponentType.CONTAINER).toBe(17);

    expect(getDiscordAvatarUrl(null, null)).toBe('/assets/staff.png');
    expect(getDiscordAvatarUrl('12345', 'a_hash99')).toBe(
      'https://cdn.discordapp.com/avatars/12345/a_hash99.gif'
    );
    expect(getDiscordAvatarUrl('12345', 'static_hash')).toBe(
      'https://cdn.discordapp.com/avatars/12345/static_hash.png'
    );
  });
});
