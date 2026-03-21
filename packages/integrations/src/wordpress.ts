export interface WordPressPublishInput {
  title: string;
  content: string;
  status?: "draft" | "publish";
}

export async function publishToWordPress(input: WordPressPublishInput) {
  return {
    provider: "wordpress",
    externalId: `wp_${Date.now()}`,
    status: input.status ?? "draft"
  };
}
