export type RewriteOutputSection = {
  title: string;
  body: string;
};

export type RewriteOutputViewModel = {
  summaryBullets: string[];
  copySections: RewriteOutputSection[];
  rationaleSections: RewriteOutputSection[];
};

function normalize(text: string) {
  return text.replace(/\r\n/g, "\n").trim();
}

function splitSections(markdown: string): RewriteOutputSection[] {
  const lines = normalize(markdown).split("\n");
  const sections: RewriteOutputSection[] = [];
  let currentTitle = "Rewritten Copy";
  let currentBody: string[] = [];

  const flush = () => {
    const body = currentBody.join("\n").trim();
    if (body.length > 0) {
      sections.push({ title: currentTitle, body });
    }
    currentBody = [];
  };

  for (const line of lines) {
    const headingMatch = line.match(/^#{1,6}\s+(.+)$/);
    const numberedHeadingMatch = line.match(/^\d+\)\s+(.+)$/);
    const title = headingMatch?.[1] ?? numberedHeadingMatch?.[1] ?? null;
    if (title) {
      flush();
      currentTitle = title.trim();
      continue;
    }
    currentBody.push(line);
  }
  flush();
  return sections;
}

function toSummaryBullets(sections: RewriteOutputSection[]): string[] {
  const summarySection = sections.find((section) =>
    section.title.toLowerCase().includes("summary"),
  );
  if (!summarySection) {
    return [];
  }

  const bullets = summarySection.body
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => /^[-*]\s+/.test(line))
    .map((line) => line.replace(/^[-*]\s+/, "").trim())
    .filter((line) => line.length > 0);

  if (bullets.length > 0) {
    return bullets.slice(0, 3);
  }

  return summarySection.body
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .slice(0, 3);
}

function toPlainTextInline(value: string): string {
  return value
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`{1,3}(.*?)`{1,3}/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function toPlainTextBlock(value: string): string {
  return value
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`{1,3}(.*?)`{1,3}/g, "$1")
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1")
    .split("\n")
    .map((line) =>
      line
        .replace(/^\s*[-*]\s+/, "")
        .replace(/^\s*\d+\.\s+/, "")
        .trimEnd(),
    )
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function normalizeRationaleParagraph(raw: string): string {
  const text = toPlainTextInline(raw)
    .replace(/(?:^|\s)[-*]\s+/g, " ")
    .replace(/(?:^|\s)\d+[.)]\s+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length === 0) {
    return "";
  }

  const splitSentences = text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
  const sentences = splitSentences.length > 0 ? splitSentences : [text];
  const clampedSentences = sentences.slice(0, Math.min(4, sentences.length));
  const built = clampedSentences.join(" ").trim();

  const words = built.split(" ").filter(Boolean);
  if (words.length <= 110) {
    return built;
  }

  const truncated = words.slice(0, 110).join(" ").trim();
  return /[.!?]$/.test(truncated) ? truncated : `${truncated}.`;
}

export function buildRewriteOutputViewModel(markdown: string): RewriteOutputViewModel {
  const sections = splitSections(markdown);
  const summaryBullets = toSummaryBullets(sections);

  const rationaleRaw = sections
    .filter((section) => {
      const lower = section.title.toLowerCase();
      return lower.includes("rationale") || lower.includes("reasoning");
    })
    .map((section) => section.body)
    .join(" ")
    .trim();
  const rationaleParagraph = normalizeRationaleParagraph(rationaleRaw);
  const rationaleSections =
    rationaleParagraph.length > 0
      ? [{ title: "Rationale", body: rationaleParagraph }]
      : [];

  const copySections = sections.filter((section) => {
    const lower = section.title.toLowerCase();
    return (
      !lower.includes("summary") &&
      !lower.includes("rationale") &&
      !lower.includes("reasoning")
    );
  });

  return {
    summaryBullets,
    copySections,
    rationaleSections,
  };
}
