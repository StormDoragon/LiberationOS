export interface WordPressCredentials {
  siteUrl: string;             // e.g. "https://myblog.com"
  username: string;
  applicationPassword: string; // WP Application Password (no spaces)
}

export interface WordPressPublishInput {
  title: string;
  content: string;
  status?: "draft" | "publish";
  categories?: number[];
  tags?: number[];
  featuredMediaId?: number;
}

export interface WordPressPublishResult {
  provider: "wordpress";
  externalId: string;
  url: string;
  status: string;
}

/**
 * Create a post via the WordPress REST API.
 * Requires an Application Password generated at /wp-admin/profile.php.
 */
export async function publishToWordPress(
  input: WordPressPublishInput,
  credentials: WordPressCredentials,
): Promise<WordPressPublishResult> {
  const { siteUrl, username, applicationPassword } = credentials;
  const base64Auth = btoa(`${username}:${applicationPassword}`);

  const res = await fetch(`${siteUrl.replace(/\/$/, "")}/wp-json/wp/v2/posts`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${base64Auth}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: input.title,
      content: input.content,
      status: input.status ?? "draft",
      categories: input.categories ?? [],
      tags: input.tags ?? [],
      featured_media: input.featuredMediaId ?? 0,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`WordPress API error ${res.status}: ${err}`);
  }

  const post = (await res.json()) as { id: number; link: string; status: string };

  return {
    provider: "wordpress",
    externalId: String(post.id),
    url: post.link,
    status: post.status,
  };
}
