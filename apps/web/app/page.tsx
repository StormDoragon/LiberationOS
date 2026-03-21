import { NewGoalForm } from "../components/new-goal-form";
import { getProjects } from "@liberation-os/workflow-engine";

export default async function HomePage() {
  const projects = await getProjects().catch(() => []);

  return (
    <main className="container stack">
      <section className="hero">
        <h1 style={{ fontSize: 42, marginBottom: 8 }}>LiberationOS</h1>
        <p className="muted" style={{ maxWidth: 700 }}>
          Enter a goal. Get execution. This Phase 3 scaffold adds Prisma-backed projects, workflow runs,
          step tracking, persisted content drafts, and a real project detail view.
        </p>
      </section>

      <div className="grid grid-2">
        <NewGoalForm />
        <div className="card stack">
          <h2 style={{ margin: 0 }}>What this repo now does</h2>
          <div className="stack small">
            <span>• Creates projects in PostgreSQL through Prisma</span>
            <span>• Builds a workflow plan from the user goal</span>
            <span>• Runs a multi-step agent pipeline</span>
            <span>• Saves workflow runs, steps, and generated drafts</span>
          </div>
          <a className="button" href="/projects">Open project dashboard</a>
        </div>
      </div>

      <div className="card stack">
        <div className="row">
          <h2 style={{ margin: 0 }}>Recent projects</h2>
          <a className="small" href="/projects">View all</a>
        </div>
        {projects.length === 0 ? (
          <p className="small">No projects yet. Create the first one and wake the engine.</p>
        ) : (
          <div className="grid">
            {projects.map((project) => (
              <a key={project.id} className="card" href={`/projects/${project.id}`}>
                <div className="row">
                  <strong>{project.title}</strong>
                  <span className="badge">{project.status}</span>
                </div>
                <p className="small">{project.goal}</p>
                <p className="small">Runs: {project.runs.length} • Drafts: {project.content.length}</p>
              </a>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
