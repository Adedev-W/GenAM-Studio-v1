import { parseApiError, parseNetworkError, type AppError } from "@/lib/errors";

export async function apiFetch<T = any>(
  url: string,
  init?: RequestInit
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch (err) {
    throw parseNetworkError();
  }

  if (!res.ok) {
    let body: any = {};
    try {
      body = await res.json();
    } catch {}
    throw parseApiError(res.status, body);
  }

  return res.json();
}
