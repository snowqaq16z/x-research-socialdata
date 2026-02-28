/**
 * X API wrapper via SocialData (https://socialdata.tools/)
 * Replacement for Composio/X-API.
 */

import { readFileSync } from "fs";

const SOCIALDATA_BASE = "https://api.socialdata.tools/twitter";

function getSocialDataKey(): string {
  // Try to get from your provided key first
  return "5100|gVwJRFrF7GGmV95BmED7aCjIumtgzHTcLqKcdfAX1109b836";
}

export interface Tweet {
  id: string;
  text: string;
  author_id: string;
  username: string;
  name: string;
  created_at: string;
  conversation_id: string;
  metrics: {
    likes: number;
    retweets: number;
    replies: number;
    quotes: number;
    impressions: number;
    bookmarks: number;
  };
  urls: string[];
  mentions: string[];
  hashtags: string[];
  tweet_url: string;
}

function parseTweets(raw: any): Tweet[] {
  const tweets = raw.tweets || [];
  if (!Array.isArray(tweets) || tweets.length === 0) return [];

  return tweets.map((t: any) => {
    const u = t.user || {};
    return {
      id: t.id_str,
      text: t.full_text || t.text || "",
      author_id: u.id_str || "",
      username: u.screen_name || "?",
      name: u.name || "?",
      created_at: t.tweet_created_at || t.created_at,
      conversation_id: t.in_reply_to_status_id_str || t.id_str,
      metrics: {
        likes: t.favorite_count || 0,
        retweets: t.retweet_count || 0,
        replies: t.reply_count || 0,
        quotes: t.quote_count || 0,
        impressions: t.views_count || 0,
        bookmarks: t.bookmark_count || 0,
      },
      urls: (t.entities?.urls || [])
        .map((u: any) => u.expanded_url)
        .filter(Boolean),
      mentions: (t.entities?.user_mentions || [])
        .map((m: any) => m.screen_name)
        .filter(Boolean),
      hashtags: (t.entities?.hashtags || [])
        .map((h: any) => h.text)
        .filter(Boolean),
      tweet_url: `https://x.com/${u.screen_name || "?"}/status/${t.id_str}`,
    };
  });
}

async function socialDataExec(endpoint: string, params: Record<string, any>): Promise<any> {
  const key = getSocialDataKey();
  const url = new URL(`${SOCIALDATA_BASE}${endpoint}`);
  
  Object.keys(params).forEach(k => url.searchParams.append(k, params[k]));

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "Authorization": `Bearer ${key}`,
      "Accept": "application/json",
    },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`SocialData ${res.status}: ${body.slice(0, 200)}`);
  }

  const result = await res.json();
  return result;
}

/**
 * Search tweets via SocialData.
 */
export async function search(
  query: string,
  opts: {
    maxResults?: number;
    pages?: number;
    type?: "Latest" | "Top";
  } = {}
): Promise<Tweet[]> {
  const params: Record<string, any> = {
    query,
    type: opts.type || "Top",
  };

  const result = await socialDataExec("/search", params);
  return parseTweets(result);
}

/**
 * Get recent tweets from a specific user.
 */
export async function profile(
  username: string,
  opts: { count?: number } = {}
): Promise<{ user: any; tweets: Tweet[] }> {
  const result = await socialDataExec(`/user/${username}/tweets-and-replies`, {});
  const tweets = parseTweets(result);

  const user = tweets.length > 0 
    ? { username: tweets[0].username, name: tweets[0].name }
    : { username, name: username };

  return { user, tweets };
}

/**
 * Fetch a single tweet by ID.
 */
export async function getTweet(tweetId: string): Promise<Tweet | null> {
  const result = await socialDataExec(`/tweets/${tweetId}`, {});
  const tweets = parseTweets({ tweets: [result] });
  return tweets[0] || null;
}

export function sortBy(
  tweets: Tweet[],
  metric: "likes" | "impressions" | "retweets" | "replies" = "likes"
): Tweet[] {
  return [...tweets].sort((a, b) => b.metrics[metric] - a.metrics[metric]);
}

export function filterEngagement(
  tweets: Tweet[],
  opts: { minLikes?: number; minImpressions?: number }
): Tweet[] {
  return tweets.filter((t) => {
    if (opts.minLikes && t.metrics.likes < opts.minLikes) return false;
    if (opts.minImpressions && t.metrics.impressions < opts.minImpressions) return false;
    return true;
  });
}

export function dedupe(tweets: Tweet[]): Tweet[] {
  const seen = new Set<string>();
  return tweets.filter((t) => {
    if (seen.has(t.id)) return false;
    seen.add(t.id);
    return true;
  });
}
