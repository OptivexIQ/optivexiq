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

function extractLabeledLine(markdown: string, label: string): string | null {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(
      `^\\s*(?:[-*]\\s+)?(?:\\*\\*)?${escapedLabel}(?:\\*\\*)?\\s*:\\s*(.+)$`,
      "gim",
    ),
    new RegExp(
      `^\\s*(?:[-*]\\s+)?(?:\\*\\*)?${escapedLabel}(?:\\*\\*)?\\s*-\\s*(.+)$`,
      "gim",
    ),
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(markdown);
    if (match?.[1]) {
      const value = match[1].trim();
      if (value.length > 0) {
        return value;
      }
    }
  }

  return null;
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

export function normalizeRationaleParagraph(raw: string): string {
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
      return lower.includes("rationale");
    })
    .map((section) => section.body)
    .join(" ")
    .trim();
  const rationaleParagraph = normalizeRationaleParagraph(rationaleRaw);
  const rationaleSections =
    rationaleParagraph.length > 0
      ? [{ title: "Rationale", body: rationaleParagraph }]
      : [];

  const copySections = sections
    .filter((section) => {
      const lower = section.title.toLowerCase();
      return (
        !lower.includes("summary") &&
        !lower.includes("rationale")
      );
    })
    .slice();

  const rewriteScopedText = sections
    .filter((section) => {
      const lower = section.title.toLowerCase();
      if (lower.includes("summary") || lower.includes("rationale")) {
        return false;
      }
      if (lower.includes("implementation") || lower.includes("checklist")) {
        return false;
      }
      if (lower.includes("strategy")) {
        return false;
      }
      return lower.includes("rewrite") || lower.includes("proposed");
    })
    .map((section) => section.body)
    .join("\n\n")
    .trim();

  const ctaExtractionSource =
    rewriteScopedText.length > 0 ? rewriteScopedText : normalize(markdown);
  const primaryCta = extractLabeledLine(ctaExtractionSource, "Primary CTA");
  const finalCta = extractLabeledLine(ctaExtractionSource, "Final CTA");
  const hasPrimaryCtaSection = copySections.some((section) =>
    section.title.toLowerCase().includes("primary cta"),
  );
  const hasFinalCtaSection = copySections.some((section) =>
    section.title.toLowerCase().includes("final cta"),
  );

  if (primaryCta && !hasPrimaryCtaSection) {
    copySections.push({ title: "Primary CTA", body: primaryCta });
  }
  if (finalCta && !hasFinalCtaSection) {
    copySections.push({ title: "Final CTA", body: finalCta });
  }

  return {
    summaryBullets,
    copySections,
    rationaleSections,
  };
}
