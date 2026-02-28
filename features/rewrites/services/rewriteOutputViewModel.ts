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

export function buildRewriteOutputViewModel(markdown: string): RewriteOutputViewModel {
  const sections = splitSections(markdown);
  const summaryBullets = toSummaryBullets(sections);

  const rationaleSections = sections.filter((section) =>
    section.title.toLowerCase().includes("rationale"),
  );

  const copySections = sections.filter((section) => {
    const lower = section.title.toLowerCase();
    return !lower.includes("summary") && !lower.includes("rationale");
  });

  return {
    summaryBullets,
    copySections,
    rationaleSections,
  };
}
