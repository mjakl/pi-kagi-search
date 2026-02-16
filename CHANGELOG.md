# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- Expanded the README "Why Pi Kagi Search" section to better explain why
  Kagi's high-quality results are valuable in day-to-day research.

## [1.0.0] - 2025-02-13

### Added
- Initial release
- `kagi_search` tool for web search using Kagi.com
- Session token management via:
  - `KAGI_SESSION_TOKEN` environment variable
  - `/kagi-login` interactive command
  - `~/.pi/kagi-search.json` config file
  - `~/.kagi_session_token` plain text file (fallback)
- Custom tool rendering with expanded view support
- Support for up to 50 search results per query
- Related search suggestions

### Changed
- Improved security by setting restrictive file permissions (0600) on the config file
- Added input validation for the search query and session token
- Updated documentation with the standard installation command
- Added repository field to `package.json` for better pi integration
