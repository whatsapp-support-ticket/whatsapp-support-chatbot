type JsonRecord = Record<string, unknown>;

export async function readJsonResponse<T>(response: Response, fallbackMessage: string): Promise<T> {
  const json = (await response.json()) as JsonRecord;

  if (!response.ok) {
    throw new Error(typeof json.error === 'string' ? json.error : fallbackMessage);
  }

  return json as T;
}
