const mockProjects = [
  { id: "proj_1", title: "30 TikToks for anime motivation", status: "running" },
  { id: "proj_2", title: "Coffee affiliate site autopilot", status: "waiting_review" }
];

export default function ProjectsPage() {
  return (
    <main className="container">
      <h1>Projects</h1>
      <div className="grid" style={{ marginTop: 24 }}>
        {mockProjects.map((project) => (
          <a key={project.id} className="card" href={`/projects/${project.id}`}>
            <h2>{project.title}</h2>
            <p className="small">Status: {project.status}</p>
          </a>
        ))}
      </div>
    </main>
  );
}
