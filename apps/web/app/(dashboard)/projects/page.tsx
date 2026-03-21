import { getProjects } from "@liberation-os/workflow-engine";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await getProjects();

  return (
    <main className="container stack">
      <div className="row">
        <div>
          <h1 style={{ marginBottom: 4 }}>Projects</h1>
          <p className="small">Database-backed goals, workflow runs, and saved drafts.</p>
        </div>
        <Link className="button" href="/">New goal</Link>
      </div>

      <div className="grid">
        {projects.map((project) => {
          const latestRun = project.runs[0];
          return (
            <Link key={project.id} className="card stack" href={`/projects/${project.id}`}>
              <div className="row">
                <strong>{project.title}</strong>
                <span className="badge" data-status={project.status}>{project.status}</span>
              </div>
              <p className="small">{project.goal}</p>
              <div className="row small">
                <span>Workflow: {latestRun?.workflowName ?? "Not run yet"}</span>
                <span>Drafts: {project.content.length}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
