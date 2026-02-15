export function buildUserInitials(displayName: string | null | undefined) {
  if (!displayName) {
    return "";
  }

  const name = displayName.split("@")[0] ?? "";
  const parts = name.split(/[._\s-]+/).filter(Boolean);
  const letters = parts.map((part) => part[0]?.toUpperCase()).filter(Boolean);
  const initialChars =
    letters.length >= 2
      ? letters.slice(0, 2)
      : [name[0]?.toUpperCase(), name[1]?.toUpperCase()].filter(Boolean);

  return initialChars.join("");
}
