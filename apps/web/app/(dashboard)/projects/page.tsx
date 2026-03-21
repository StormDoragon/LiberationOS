import { listProjects } from "@liberation-os/workflow-engine";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const projects = await listProjects();

  return (
    <main className="container">
      <h1>Projects</h1>
      <p className="small">Queued projects, workflow runs, and generated output.</p>
      <div className="grid" style={{ marginTop: 24 }}>
        {projects.length === 0 ? (
          <div className="card">
            <h2>No projects yet</h2>
            <p className="small">Create one from the home page to start the workflow queue.</p>
          </div>
        ) : null}
        {projects.map((project) => (
          <a key={project.id} className="card" href={`/projects/${project.id}`}>
            <h2>{project.title}</h2>
            <p className="small">Status: {project.status}</p>
            <p className="small">Workflow runs: {project.workflowCount}</p>
            <p className="small">Content items: {project.contentCount}</p>
          </a>
        ))}
      </div>
    </main>
  );
}
