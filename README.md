# Pi Kagi Search

**Kagi search tool for Pi agent. Uses your existing Kagi subscription via session token.**

## Why Pi Kagi Search

**Uses Existing Subscription** — If you have a Kagi subscription, you can use this extension without needing a separate API key. Just provide your session token.

**Web Search** — Search the web using Kagi's privacy-focused search engine with high-quality results.

## Install

### Option 1: Install via Pi

```bash
pi install git:github.com/mjakl/pi-kagi-search
```

### Option 2: Manual Installation

Clone this repository to your Pi extensions directory:

```bash
cd ~/.pi/agent/extensions
git clone https://github.com/mjakl/pi-kagi-search.git
cd pi-kagi-search
npm install
```

## Configuration

### Get Your Session Token

1. Log in to [Kagi](https://kagi.com)
2. Go to [Settings → User Details](https://kagi.com/settings/user_details)
3. Find your **Session Link** or visit [kagi.com/settings?p=token](https://kagi.com/settings?p=token)
4. Extract the `token` value from the URL

### Set the Token

**Option 1: Environment Variable (Recommended)**

```bash
export KAGI_SESSION_TOKEN="your-token-here"
```

Add to your shell profile (`~/.zshrc`, `~/.bashrc`) to persist.

**Option 2: Interactive Login**

```bash
pi
# Then use the command:
/kagi-login
```

**Option 3: Config File**

Create `~/.pi/kagi-search.json`:

```json
{
  "sessionToken": "your-token-here"
}
```

**Option 4: Plain Text File**

Create `~/.kagi_session_token` with just the token:

```bash
echo "your-token-here" > ~/.kagi_session_token
```

This is checked as the last fallback if other methods are not configured.

## Usage

### kagi_search

Search the web using Kagi.com.

```typescript
// Basic search
kagi_search({ query: "TypeScript best practices 2025" })

// With custom result count
kagi_search({ query: "rust async programming", limit: 20 })
```

**Parameters:**
- `query` (string, required) - Search query
- `limit` (number, optional) - Maximum results (default: 10, max: 50)

**Returns:**
- Structured search results with title, URL, and snippet for each result
- Related search suggestions

## Web Fetching

For fetching page contents, we recommend using a dedicated webfetch tool like [Ben Vargas' Firecrawl extension](https://github.com/benvargas/pi-firecrawl). The agent can also fall back to `curl` to retrieve content when needed.

## Commands

| Command | Description |
|---------|-------------|
| `/kagi-login` | Set your Kagi session token interactively |

## Security Note

Your session token provides access to your Kagi account. Keep it private and treat it like a password. The token can be stored in:

1. Environment variable (most secure for shell sessions)
2. `~/.pi/kagi-search.json` config file
3. `~/.kagi_session_token` plain text file (last fallback)

## Comparison to Kagi API

| Feature | Kagi API | This Extension |
|---------|----------|----------------|
| Requires API access | Yes (invite-only) | No |
| Uses existing subscription | No | Yes |
| Search | Yes | Yes |
| Rate limits | API limits | Account limits |

This extension is useful if you have a Kagi subscription but don't have API access yet.

## Related Projects

- [kagi-ken](https://github.com/czottmann/kagi-ken) - The Node.js library this extension is based on
- [kagi-ken-mcp](https://github.com/czottmann/kagi-ken-mcp) - MCP server for Claude
- [pi-web-access](https://github.com/nicobailon/pi-web-access) - Similar extension with Perplexity/Gemini support

## Author

Inspired by [kagi-ken](https://github.com/czottmann/kagi-ken) by Carlo Zottmann.

## License

MIT
