import { NewGoalForm } from "../components/new-goal-form";
import { getProjects } from "@liberation-os/workflow-engine";

export default async function HomePage() {
  const projects = await getProjects().catch(() => []);

  return (
    <main className="container stack">
      <section className="hero">
        <h1 style={{ fontSize: 42, marginBottom: 8 }}>Enter a goal. Get execution.</h1>
        <p className="muted" style={{ maxWidth: 700 }}>
          Describe what you want to build—viral content, an affiliate site, a social campaign—and
          LiberationOS plans, generates, and schedules everything automatically.
        </p>
      </section>

      <div className="grid grid-2">
        <NewGoalForm />
        <div className="card stack">
          <h2 style={{ margin: 0 }}>How it works</h2>
          <div className="stack small">
            <span>1. Describe your goal in plain English</span>
            <span>2. AI interprets and builds a workflow plan</span>
            <span>3. Agent pipeline generates content step-by-step</span>
            <span>4. Review, approve, and publish your drafts</span>
          </div>
          <a className="button primary" href="/projects">Open project dashboard &rarr;</a>
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
                  <span className="badge" data-status={project.status}>{project.status}</span>
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
