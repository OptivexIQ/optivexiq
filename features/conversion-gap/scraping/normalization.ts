export function normalizeText(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

export function truncateText(value: string, maxLength: number) {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, Math.max(0, maxLength - 3)).trim()}...`;
}
