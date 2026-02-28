---
name: x-research-socialdata
description: X/Twitter research agent powered by SocialData API. Searches X for real-time perspectives, discussions, and expert opinions using your SocialData credits.
---

# X Research (SocialData Edition)

A modified version of x-research-skill that uses SocialData API for data fetching.

## Commands
- `search <query>`: Search top tweets
- `profile <username>`: Get user profile and latest tweets
- `list <list_id>`: Get tweets from a specific Twitter List
- `tweet <id>`: Get specific tweet details

## Config
Uses SocialData API key: `5100|gVw...b836` (configured in `lib/api.ts`).
