/**
 * Shopify Admin REST API adapter.
 *
 * Credentials must be an "Admin API access token" (not legacy private-app
 * password).  The shop domain should be the myshopify subdomain, e.g.
 * "my-store.myshopify.com".
 */
export interface ShopifyCredentials {
  shopDomain: string;   // e.g. "my-store.myshopify.com"
  accessToken: string;  // X-Shopify-Access-Token header value
}

export interface ShopifyProductInput {
  title: string;
  bodyHtml: string;         // product description HTML
  vendor?: string;
  productType?: string;
  tags?: string[];
  status?: "active" | "draft" | "archived";
  images?: string[];        // public image URLs to attach
  variants?: ShopifyVariantInput[];
}

export interface ShopifyVariantInput {
  title?: string;
  price: string;            // e.g. "19.99"
  sku?: string;
  inventoryQuantity?: number;
}

export interface ShopifyProductResult {
  provider: "shopify";
  externalId: string;       // product.id
  handle: string;
  adminUrl: string;
  storefrontUrl: string;
}

/**
 * Create a product in a Shopify store.
 */
export async function createShopifyProduct(
  input: ShopifyProductInput,
  credentials: ShopifyCredentials,
): Promise<ShopifyProductResult> {
  const { shopDomain, accessToken } = credentials;
  const url = `https://${shopDomain}/admin/api/2024-01/products.json`;

  const variants = input.variants?.length
    ? input.variants
    : [{ price: "0.00" }];

  const images = input.images?.map((src) => ({ src })) ?? [];

  const body = {
    product: {
      title: input.title,
      body_html: input.bodyHtml,
      vendor: input.vendor ?? "",
      product_type: input.productType ?? "",
      tags: (input.tags ?? []).join(", "),
      status: input.status ?? "draft",
      images,
      variants,
    },
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "X-Shopify-Access-Token": accessToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Shopify create product error ${res.status}: ${err}`);
  }

  const data = (await res.json()) as {
    product: { id: number; handle: string };
  };

  const product = data.product;

  return {
    provider: "shopify",
    externalId: String(product.id),
    handle: product.handle,
    adminUrl: `https://${shopDomain}/admin/products/${product.id}`,
    storefrontUrl: `https://${shopDomain}/products/${product.handle}`,
  };
}

/**
 * Update an existing Shopify product (e.g. after a content revision).
 */
export async function updateShopifyProduct(
  productId: string,
  updates: Partial<ShopifyProductInput>,
  credentials: ShopifyCredentials,
): Promise<ShopifyProductResult> {
  const { shopDomain, accessToken } = credentials;
  const url = `https://${shopDomain}/admin/api/2024-01/products/${productId}.json`;

  const payload: Record<string, unknown> = { id: productId };
  if (updates.title) payload.title = updates.title;
  if (updates.bodyHtml) payload.body_html = updates.bodyHtml;
  if (updates.status) payload.status = updates.status;
  if (updates.tags) payload.tags = updates.tags.join(", ");
  if (updates.images) payload.images = updates.images.map((src) => ({ src }));

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      "X-Shopify-Access-Token": accessToken,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ product: payload }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Shopify update product error ${res.status}: ${err}`);
  }

  const responseData = (await res.json()) as {
    product: { id: number; handle: string };
  };

  return {
    provider: "shopify",
    externalId: String(responseData.product.id),
    handle: responseData.product.handle,
    adminUrl: `https://${shopDomain}/admin/products/${responseData.product.id}`,
    storefrontUrl: `https://${shopDomain}/products/${responseData.product.handle}`,
  };
}
