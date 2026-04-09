export interface HttpResponse<T> {
  ok: boolean;
  status: number;
  data: T;
}

/**
 * HttpClient — SRP: only responsible for making HTTP requests.
 *
 * Accepts a `getBase` function so the API base URL is read dynamically
 * from localStorage on every request — changes made in Settings tab
 * take effect immediately without rebuilding the client.
 */
export class HttpClient {
  constructor(private readonly getBase: () => string) {}

  async request<T>(method: string, path: string, body?: unknown): Promise<HttpResponse<T>> {
    const opts: RequestInit = {
      method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (body !== undefined) opts.body = JSON.stringify(body);

    try {
      const res = await fetch(this.getBase() + path, opts);
      const data: T = await res.json().catch(() => ({}) as T);
      return { ok: res.ok, status: res.status, data };
    } catch {
      return { ok: false, status: 0, data: {} as T };
    }
  }
}
