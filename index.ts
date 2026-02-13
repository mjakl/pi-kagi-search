import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { Text } from "@mariozechner/pi-tui";
import { Type } from "@sinclair/typebox";
import * as cheerio from "cheerio";
import type { AnyNode } from "domhandler";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

// Configuration
const CONFIG_FILE = path.join(os.homedir(), ".pi", "kagi-search.json");
const USER_AGENT = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Safari/605.1.15";

// Types
interface KagiConfig {
  sessionToken?: string;
}

interface SearchResult {
  t: number;
  url?: string;
  title?: string;
  snippet?: string;
  list?: string[];
}

// Token management
function loadConfig(): KagiConfig {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      return JSON.parse(fs.readFileSync(CONFIG_FILE, "utf-8"));
    }
  } catch (e) {
    // Ignore errors
  }
  return {};
}

function saveConfig(config: KagiConfig): void {
  const dir = path.dirname(CONFIG_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
}

function getToken(): string | undefined {
  // 1. Check environment variable
  const envToken = process.env.KAGI_SESSION_TOKEN;
  if (envToken) return envToken;
  
  // 2. Check JSON config file
  const configToken = loadConfig().sessionToken;
  if (configToken) return configToken;
  
  // 3. Check plain text file as last fallback
  const plainTextFile = path.join(os.homedir(), ".kagi_session_token");
  try {
    if (fs.existsSync(plainTextFile)) {
      return fs.readFileSync(plainTextFile, "utf-8").trim();
    }
  } catch (e) {
    // Ignore errors
  }
  
  return undefined;
}

function setToken(token: string): void {
  saveConfig({ sessionToken: token });
}

// Kagi Search API
async function kagiSearch(
  query: string, 
  token: string, 
  limit: number = 10,
  signal?: AbortSignal
): Promise<{ data: SearchResult[] }> {
  const response = await fetch(
    `https://kagi.com/html/search?q=${encodeURIComponent(query)}`,
    {
      headers: {
        "User-Agent": USER_AGENT,
        "Cookie": `kagi_session=${token}`,
      },
      signal,
    }
  );

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error("Invalid or expired session token");
    }
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const html = await response.text();
  const results = parseSearchResults(html, limit);
  return { data: results };
}

function parseSearchResults(html: string, limit: number): SearchResult[] {
  const $ = cheerio.load(html);
  const results: SearchResult[] = [];
  let resultCount = 0;

  $(".search-result").each((_, element) => {
    if (resultCount >= limit) return false;
    const result = extractSearchResult($, element);
    if (result) {
      results.push(result);
      resultCount++;
    }
  });

  if (resultCount < limit) {
    $(".sr-group .__srgi").each((_, element) => {
      if (resultCount >= limit) return false;
      const result = extractGroupedResult($, element);
      if (result) {
        results.push(result);
        resultCount++;
      }
    });
  }

  const relatedSearches = extractRelatedSearches($);
  if (relatedSearches.length > 0) {
    results.push({
      t: 1,
      list: relatedSearches,
    });
  }

  return results;
}

function extractSearchResult($: cheerio.CheerioAPI, element: AnyNode): SearchResult | null {
  try {
    const $element = $(element);
    const titleLink = $element.find(".__sri_title_link").first();
    const title = titleLink.text().trim();
    const url = titleLink.attr("href");
    const snippet = $element.find(".__sri-desc").text().trim();

    if (!title || !url) return null;

    return { t: 0, url, title, snippet: snippet || "" };
  } catch {
    return null;
  }
}

function extractGroupedResult($: cheerio.CheerioAPI, element: AnyNode): SearchResult | null {
  try {
    const $element = $(element);
    const titleLink = $element.find(".__srgi-title a").first();
    const title = titleLink.text().trim();
    const url = titleLink.attr("href");
    const snippet = $element.find(".__sri-desc").text().trim();

    if (!title || !url) return null;

    return { t: 0, url, title, snippet: snippet || "" };
  } catch {
    return null;
  }
}

function extractRelatedSearches($: cheerio.CheerioAPI): string[] {
  const related: string[] = [];
  try {
    $(".related-searches a span").each((_, element) => {
      const term = $(element).text().trim();
      if (term) related.push(term);
    });
  } catch {
    // Return empty array if parsing fails
  }
  return related;
}

// Format search results for display
function formatSearchResults(results: SearchResult[]): string {
  const webResults = results.filter(r => r.t === 0);
  const relatedSearches = results.find(r => r.t === 1)?.list || [];

  let output = "";

  if (webResults.length > 0) {
    output += "## Search Results\n\n";
    for (let i = 0; i < webResults.length; i++) {
      const r = webResults[i];
      output += `### ${i + 1}. ${r.title}\n`;
      output += `**URL:** ${r.url}\n`;
      if (r.snippet) {
        output += `${r.snippet}\n`;
      }
      output += "\n";
    }
  }

  if (relatedSearches.length > 0) {
    output += "## Related Searches\n\n";
    output += relatedSearches.map(s => `- ${s}`).join("\n");
    output += "\n";
  }

  return output.trim();
}

// Main extension
export default function (pi: ExtensionAPI) {
  // Register kagi_search tool
  pi.registerTool({
    name: "kagi_search",
    label: "Kagi Search",
    description: "Search the web using Kagi.com. Returns structured search results with titles, URLs, and snippets. Requires a Kagi session token (set via KAGI_SESSION_TOKEN env var or /kagi-login command).",
    parameters: Type.Object({
      query: Type.String({ description: "Search query" }),
      limit: Type.Optional(Type.Number({ 
        description: "Maximum number of results (default: 10, max: 50)",
        minimum: 1,
        maximum: 50 
      })),
    }),

    async execute(_toolCallId, params, signal, onUpdate, _ctx) {
      const token = getToken();
      if (!token) {
        return {
          content: [{ 
            type: "text", 
            text: "Error: No Kagi session token configured. Set KAGI_SESSION_TOKEN environment variable or use /kagi-login command." 
          }],
          details: { error: "No session token" },
          isError: true,
        };
      }

      const limit = Math.min(params.limit ?? 10, 50);

      onUpdate?.({
        content: [{ type: "text", text: `Searching Kagi for "${params.query}"...` }],
      });

      try {
        const { data } = await kagiSearch(params.query, token, limit, signal);
        
        const webResults = data.filter(r => r.t === 0);
        const output = formatSearchResults(data);

        return {
          content: [{ type: "text", text: output }],
          details: {
            query: params.query,
            resultCount: webResults.length,
            hasRelated: data.some(r => r.t === 1),
          },
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        const isAbort = err instanceof Error && err.name === "AbortError";
        
        if (isAbort) {
          return {
            content: [{ type: "text", text: "Search cancelled." }],
            details: { cancelled: true },
          };
        }

        return {
          content: [{ type: "text", text: `Error: ${message}` }],
          details: { error: message },
          isError: true,
        };
      }
    },

    renderCall(args, theme) {
      const query = args.query as string;
      const display = query.length > 50 ? query.slice(0, 47) + "..." : query;
      return new Text(
        theme.fg("toolTitle", theme.bold("kagi_search ")) + 
        theme.fg("accent", `"${display}"`),
        0, 0
      );
    },

    renderResult(result, { expanded, isPartial }, theme) {
      const details = result.details as { 
        resultCount?: number; 
        hasRelated?: boolean;
        error?: string;
        cancelled?: boolean;
      };

      if (isPartial) {
        return new Text(theme.fg("accent", "Searching..."), 0, 0);
      }

      if (details?.cancelled) {
        return new Text(theme.fg("muted", "Cancelled"), 0, 0);
      }

      if (details?.error || result.isError) {
        return new Text(theme.fg("error", `Error: ${details?.error || "Unknown error"}`), 0, 0);
      }

      let statusLine = theme.fg("success", `${details?.resultCount ?? 0} results`);
      if (details?.hasRelated) {
        statusLine += theme.fg("muted", " (with related searches)");
      }

      if (!expanded) {
        return new Text(statusLine, 0, 0);
      }

      const textContent = result.content.find(c => c.type === "text")?.text || "";
      const preview = textContent.length > 300 ? textContent.slice(0, 300) + "..." : textContent;
      
      return new Text(statusLine + "\n" + theme.fg("dim", preview), 0, 0);
    },
  });

  // Register /kagi-login command
  pi.registerCommand("kagi-login", {
    description: "Set Kagi session token for authentication",
    handler: async (_args, ctx) => {
      const currentToken = getToken();
      
      const token = await ctx.ui.input(
        "Enter your Kagi session token:",
        currentToken ? "Current token set (enter new to change)" : "Get token from kagi.com/settings?p=token"
      );

      if (!token) {
        ctx.ui.notify("Login cancelled", "warning");
        return;
      }

      setToken(token);
      ctx.ui.notify("Kagi session token saved", "success");
    },
  });
}
