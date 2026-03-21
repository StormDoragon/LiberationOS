"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Connection {
  id: string;
  provider: string;
  createdAt: string;
}

interface Props {
  workspaceId: string;
  connectedProviders: string[];
  existingConnections: Connection[];
}

// ---------------------------------------------------------------------------
// Provider catalogue
// ---------------------------------------------------------------------------
interface ProviderDef {
  id: string;
  label: string;
  description: string;
  icon: string;
  fields: FieldDef[];
}

interface FieldDef {
  key: string;
  label: string;
  type: "text" | "password" | "url";
  placeholder: string;
}

const PROVIDERS: ProviderDef[] = [
  {
    id: "twitter",
    label: "Twitter / X",
    description: "Post directly to Twitter/X via API v2.",
    icon: "𝕏",
    fields: [
      { key: "apiKey", label: "API Key", type: "password", placeholder: "Consumer key" },
      { key: "apiSecret", label: "API Secret", type: "password", placeholder: "Consumer secret" },
      { key: "accessToken", label: "Access Token", type: "password", placeholder: "OAuth access token" },
      { key: "accessTokenSecret", label: "Access Token Secret", type: "password", placeholder: "OAuth access token secret" },
    ],
  },
  {
    id: "instagram",
    label: "Instagram",
    description: "Publish images and reels via Meta Graph API.",
    icon: "📸",
    fields: [
      { key: "accessToken", label: "Page Access Token", type: "password", placeholder: "Long-lived token" },
      { key: "instagramAccountId", label: "Instagram Account ID", type: "text", placeholder: "ig_user_id" },
    ],
  },
  {
    id: "mailchimp",
    label: "Mailchimp",
    description: "Create and send email campaigns to your audience.",
    icon: "✉️",
    fields: [
      { key: "apiKey", label: "API Key", type: "password", placeholder: "xxxx-us1" },
      { key: "listId", label: "Audience ID", type: "text", placeholder: "List / Audience ID" },
      { key: "fromName", label: "From Name", type: "text", placeholder: "Your Brand" },
      { key: "replyTo", label: "Reply-to Email", type: "text", placeholder: "hello@example.com" },
    ],
  },
  {
    id: "convertkit",
    label: "ConvertKit",
    description: "Send broadcasts to your ConvertKit subscribers.",
    icon: "📬",
    fields: [
      { key: "apiKey", label: "API Key", type: "password", placeholder: "ck_live_..." },
      { key: "apiSecret", label: "API Secret", type: "password", placeholder: "API secret" },
    ],
  },
  {
    id: "shopify",
    label: "Shopify",
    description: "Create product listings from generated content.",
    icon: "🛍️",
    fields: [
      { key: "shopDomain", label: "Shop Domain", type: "text", placeholder: "my-store.myshopify.com" },
      { key: "accessToken", label: "Admin API Token", type: "password", placeholder: "shpat_..." },
    ],
  },
  {
    id: "wordpress",
    label: "WordPress",
    description: "Publish posts via the WordPress REST API.",
    icon: "🌐",
    fields: [
      { key: "siteUrl", label: "Site URL", type: "url", placeholder: "https://myblog.com" },
      { key: "username", label: "Username", type: "text", placeholder: "admin" },
      { key: "applicationPassword", label: "Application Password", type: "password", placeholder: "xxxx xxxx xxxx xxxx" },
    ],
  },
  {
    id: "buffer",
    label: "Buffer",
    description: "Schedule posts to multiple social channels via Buffer.",
    icon: "📅",
    fields: [
      { key: "accessToken", label: "Access Token", type: "password", placeholder: "Buffer OAuth token" },
      { key: "profileIds", label: "Profile IDs (comma-separated)", type: "text", placeholder: "profile_id_1,profile_id_2" },
    ],
  },
];

// ---------------------------------------------------------------------------
// Provider card
// ---------------------------------------------------------------------------
function ProviderCard({
  provider,
  workspaceId,
  connection,
  onUpdate,
}: {
  provider: ProviderDef;
  workspaceId: string;
  connection?: Connection;
  onUpdate: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [fields, setFields] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConnect(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      // Convert comma-separated profileIds to array for Buffer
      const credentials: Record<string, unknown> = { ...fields };
      if (provider.id === "buffer" && typeof credentials.profileIds === "string") {
        credentials.profileIds = credentials.profileIds
          .split(",")
          .map((s: string) => s.trim())
          .filter(Boolean);
      }

      const res = await fetch("/api/integrations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, provider: provider.id, credentials }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Failed to save");
      }

      setExpanded(false);
      setFields({});
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDisconnect() {
    if (!connection) return;
    setRemoving(true);
    setError(null);
    try {
      const res = await fetch(`/api/integrations/${connection.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to remove");
      onUpdate();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className="card stack" style={{ gap: 12 }}>
      <div className="row">
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 24 }}>{provider.icon}</span>
          <div>
            <strong>{provider.label}</strong>
            <p className="small" style={{ margin: 0 }}>{provider.description}</p>
          </div>
        </div>
        <div className="row" style={{ gap: 8, flexShrink: 0 }}>
          {connection ? (
            <>
              <span className="badge" data-status="completed">Connected</span>
              <button
                className="button"
                style={{ fontSize: 12, padding: "4px 10px" }}
                onClick={() => { setExpanded(!expanded); }}
              >
                Update
              </button>
              <button
                className="button"
                style={{ fontSize: 12, padding: "4px 10px", borderColor: "#f87171", color: "#991b1b" }}
                onClick={handleDisconnect}
                disabled={removing}
              >
                {removing ? "Removing..." : "Disconnect"}
              </button>
            </>
          ) : (
            <button
              className="button primary"
              style={{ fontSize: 12, padding: "4px 12px" }}
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? "Cancel" : "Connect"}
            </button>
          )}
        </div>
      </div>

      {connection && !expanded && (
        <p className="small" style={{ margin: 0, color: "#64748b" }}>
          Connected {new Date(connection.createdAt).toLocaleDateString()}
        </p>
      )}

      {expanded && (
        <form onSubmit={handleConnect} className="stack" style={{ gap: 10 }}>
          {provider.fields.map((field) => (
            <div key={field.key} className="stack" style={{ gap: 4 }}>
              <label className="small" style={{ fontWeight: 500 }}>{field.label}</label>
              <input
                type={field.type}
                placeholder={field.placeholder}
                value={fields[field.key] ?? ""}
                onChange={(e) =>
                  setFields((prev) => ({ ...prev, [field.key]: e.target.value }))
                }
                required
              />
            </div>
          ))}
          {error && <p className="small" style={{ color: "#dc2626" }}>{error}</p>}
          <div>
            <button className="button primary" type="submit" disabled={saving}>
              {saving ? "Saving..." : connection ? "Update credentials" : "Save & connect"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main client component
// ---------------------------------------------------------------------------
export function IntegrationsClient({
  workspaceId,
  connectedProviders: initialConnected,
  existingConnections: initialConnections,
}: Props) {
  const [connections, setConnections] = useState<Connection[]>(initialConnections);
  const router = useRouter();

  function findConnection(providerId: string) {
    return connections.find((c) => c.provider === providerId);
  }

  function handleUpdate() {
    // Refresh server component data + optimistically refetch connections list
    router.refresh();
    fetch(`/api/integrations?workspaceId=${workspaceId}`)
      .then((r) => r.json())
      .then((data: { connections: Connection[] }) => setConnections(data.connections))
      .catch(() => null);
  }

  const connectedCount = connections.length;

  return (
    <div className="stack">
      <div className="row">
        <p className="small">
          {connectedCount === 0
            ? "No integrations connected yet."
            : `${connectedCount} integration${connectedCount !== 1 ? "s" : ""} connected.`}
        </p>
        <p className="small" style={{ textAlign: "right", maxWidth: 340 }}>
          Credentials are stored in your local PostgreSQL database. In production,
          encrypt them at rest with a KMS key.
        </p>
      </div>

      <div className="grid">
        {PROVIDERS.map((provider) => (
          <ProviderCard
            key={provider.id}
            provider={provider}
            workspaceId={workspaceId}
            connection={findConnection(provider.id)}
            onUpdate={handleUpdate}
          />
        ))}
      </div>
    </div>
  );
}
