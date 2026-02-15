export function parseJsonStrict<T>(value: string) {
  try {
    return { data: JSON.parse(value) as T, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export function extractJsonObject(value: string) {
  const start = value.indexOf("{");
  const end = value.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    return "";
  }

  return value.slice(start, end + 1);
}
