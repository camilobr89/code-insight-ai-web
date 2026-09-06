import { TestBed } from '@angular/core/testing';
import { AppConfigService } from '../../../src/app/services/app-config.service';
import { environment } from '../../../src/environments/environment';

describe('AppConfigService', () => {
  let service: AppConfigService;
  let fetchSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AppConfigService);
    fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('defaults to the environment apiUrl before load()', () => {
    expect(service.apiUrl).toBe(environment.apiUrl);
  });

  it('uses config.json apiUrl when the fetch succeeds', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ apiUrl: 'https://example.com' }),
    });

    await service.load();

    expect(service.apiUrl).toBe('https://example.com');
    expect(fetchSpy).toHaveBeenCalledWith('config.json', { cache: 'no-store' });
  });

  it('accepts an empty string apiUrl (same-origin relative calls)', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ apiUrl: '' }),
    });

    await service.load();

    expect(service.apiUrl).toBe('');
  });

  it('keeps the environment default when the response is not ok', async () => {
    fetchSpy.mockResolvedValue({ ok: false });

    await service.load();

    expect(service.apiUrl).toBe(environment.apiUrl);
  });

  it('keeps the environment default when apiUrl is missing from the response', async () => {
    fetchSpy.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({}),
    });

    await service.load();

    expect(service.apiUrl).toBe(environment.apiUrl);
  });

  it('keeps the environment default and logs a warning when fetch throws', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const error = new Error('network error');
    fetchSpy.mockRejectedValue(error);

    await service.load();

    expect(service.apiUrl).toBe(environment.apiUrl);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('config.json'), error);
    warnSpy.mockRestore();
  });
});
