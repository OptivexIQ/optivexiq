export async function scrapePage(url: string) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "user-agent":
          "Mozilla/5.0 (compatible; OptivexIQBot/1.0; +https://optivexiq.com/bot)",
        accept: "text/html,application/xhtml+xml",
      },
    });

    if (!response.ok) {
      throw new Error(
        `scrape_http_error:${response.status}:${response.statusText || "request_failed"}:${url}`,
      );
    }

    return await response.text();
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error(`scrape_timeout:${url}`);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
