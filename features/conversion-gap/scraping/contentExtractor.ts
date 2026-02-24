import {
  normalizeText,
  truncateText,
} from "@/features/conversion-gap/scraping/normalization";
import { sanitizeScrapedText } from "@/features/conversion-gap/scraping/contentSecuritySanitizer";

function stripTags(html: string) {
  return normalizeText(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, " ")
      .replace(/<template[\s\S]*?<\/template>/gi, " ")
      .replace(/<iframe[\s\S]*?<\/iframe>/gi, " ")
      .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
      .replace(/<head[\s\S]*?<\/head>/gi, " ")
      .replace(/<meta[^>]*>/gi, " ")
      .replace(/<link[^>]*>/gi, " ")
      .replace(/<!--([\s\S]*?)-->/g, " ")
      .replace(/<[^>]*>/g, " ")
      .replace(/&nbsp;/gi, " ")
      .replace(/&amp;/gi, "&")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/gi, "'")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">"),
  );
}

function extractFirstTagText(html: string, tag: string) {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const match = html.match(regex);
  if (!match) {
    return "";
  }

  return normalizeText(stripTags(match[1]));
}

function extractTables(html: string) {
  const matches = html.match(/<table[\s\S]*?<\/table>/gi) ?? [];
  const tables = matches
    .map((table) => stripTags(table))
    .filter((text) => text.length > 0);

  const pricingTables = tables.filter((text) =>
    /(\$|pricing|plan|month|year|per\s+seat|per\s+user)/i.test(text),
  );

  return (pricingTables.length > 0 ? pricingTables : tables).join("\n");
}

function extractFaqBlocks(html: string) {
  const blocks: string[] = [];
  const faqContainers = html.match(
    /<(section|div|ul|ol)[^>]*(faq|frequently-asked)[^>]*>[\s\S]*?<\/\1>/gi,
  );

  if (faqContainers) {
    faqContainers.forEach((container) => {
      const text = stripTags(container);
      if (text.length > 0) {
        blocks.push(text);
      }
    });
  }

  const headingMatches = html.match(/<h[2-4][^>]*>\s*FAQ\s*<\/h[2-4]>/gi) ?? [];
  if (headingMatches.length > 0) {
    blocks.push("FAQ section present");
  }

  return blocks
    .map((block) => normalizeText(block))
    .filter(
      (block, index, self) => block.length > 0 && self.indexOf(block) === index,
    );
}

export function extractContent(html: string, sourceUrl = "unknown") {
  const headline = sanitizeScrapedText({
    value: extractFirstTagText(html, "h1"),
    sourceUrl,
    field: "headline",
    maxLength: 600,
  });
  const subheadline = sanitizeScrapedText({
    value: extractFirstTagText(html, "h2"),
    sourceUrl,
    field: "subheadline",
    maxLength: 600,
  });
  const pricingTableText = sanitizeScrapedText({
    value: extractTables(html),
    sourceUrl,
    field: "pricing_table_text",
    maxLength: 2000,
  });
  const faqBlocks = extractFaqBlocks(html);
  const rawText = sanitizeScrapedText({
    value: stripTags(html),
    sourceUrl,
    field: "raw_text",
    maxLength: 4000,
  });

  return {
    headline,
    subheadline,
    pricingTableText,
    faqBlocks: faqBlocks.map((block) =>
      sanitizeScrapedText({
        value: block,
        sourceUrl,
        field: "faq_block",
        maxLength: 800,
      }),
    ),
    rawText,
  };
}
