import { notFound } from "next/navigation";
import { getProjectById } from "@liberation-os/workflow-engine";
import { RunButton } from "./run-button";
import { ContentActions, BulkActions } from "./content-actions";

export const dynamic = "force-dynamic";

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const { id } = await params;
  const project = await getProjectById(id);

  if (!project) notFound();

  const latestRun = project.runs[0];

  return (
    <main className="container stack">
      <div className="row">
        <div>
          <h1 style={{ marginBottom: 4 }}>{project.title}</h1>
          <p className="small">{project.goal}</p>
        </div>
        <RunButton projectId={project.id} />
      </div>

      <div className="grid grid-2">
        <div className="card stack">
          <div className="row">
            <h2 style={{ margin: 0 }}>Project</h2>
            <span className="badge" data-status={project.status}>{project.status}</span>
          </div>
          <p className="small">Workspace: {project.workspace.name}</p>
          <p className="small">Goal type: {project.goalType}</p>
          <p className="small">Created: {new Date(project.createdAt).toLocaleString()}</p>
        </div>

        <div className="card stack">
          <h2 style={{ margin: 0 }}>Latest run</h2>
          {latestRun ? (
            <>
              <p className="small">Workflow: {latestRun.workflowName}</p>
              <p className="small">Status: {latestRun.status}</p>
              <p className="small">Steps: {latestRun.steps.length}</p>
            </>
          ) : (
            <p className="small">No workflow run yet.</p>
          )}
        </div>
      </div>

      <div className="card stack">
        <h2 style={{ margin: 0 }}>Workflow timeline</h2>
        {!latestRun ? (
          <p className="small">Run the project to populate real steps.</p>
        ) : (
          latestRun.steps.map((step) => (
            <div key={step.id} className="row">
              <div>
                <strong>{step.key}</strong>
                <div className="small">{step.agentName}</div>
              </div>
              <span className="badge" data-status={step.status}>{step.status}</span>
            </div>
          ))
        )}
      </div>

      <div className="card stack">
        <div className="row">
          <h2 style={{ margin: 0 }}>Generated drafts ({project.content.length})</h2>
        </div>
        {project.content.length > 0 && (
          <BulkActions
            projectId={project.id}
            draftCount={project.content.filter((c) => c.status === "draft").length}
            approvedCount={project.content.filter((c) => c.status === "approved").length}
          />
        )}
        {project.content.length === 0 ? (
          <p className="small">No drafts yet. After the workflow runs, generated content will appear here.</p>
        ) : (
          project.content.map((item) => (
            <div key={item.id} className="card stack">
              <div className="row">
                <strong>{item.title ?? item.type}</strong>
                <ContentActions contentId={item.id} status={item.status} workspaceId={project.workspaceId} />
              </div>
              <p className="small">Platform: {item.platform ?? "n/a"}</p>
              <pre className="code">{item.body}</pre>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
