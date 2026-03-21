import { getDefaultWorkspace } from "@liberation-os/workflow-engine";
import { db } from "@liberation-os/db";
import { IntegrationsClient } from "./integrations-client";

export const dynamic = "force-dynamic";

export default async function IntegrationsPage() {
  const workspace = await getDefaultWorkspace();

  const connections = await db.integrationConnection.findMany({
    where: { workspaceId: workspace.id },
    orderBy: { createdAt: "asc" },
  });

  const connectedProviders = new Set(connections.map((c) => c.provider));

  const connectedList = connections.map((c) => ({
    id: c.id,
    provider: c.provider,
    createdAt: c.createdAt.toISOString(),
  }));

  return (
    <main className="container stack">
      <div>
        <h1 style={{ marginBottom: 4 }}>Integrations</h1>
        <p className="small">
          Connect your publishing platforms. Credentials are stored in your
          local database and never sent to a third party.
        </p>
      </div>

      <IntegrationsClient
        workspaceId={workspace.id}
        connectedProviders={Array.from(connectedProviders)}
        existingConnections={connectedList}
      />
    </main>
  );
}
