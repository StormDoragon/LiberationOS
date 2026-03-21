export default function HomePage() {
  return (
    <main className="container">
      <h1>LiberationOS</h1>
      <p className="small">Enter a goal. Get execution.</p>
      <div className="grid grid-3" style={{ marginTop: 24 }}>
        <div className="card">
          <h2>Viral Content</h2>
          <p>Create hooks, scripts, and captions in batches.</p>
        </div>
        <div className="card">
          <h2>Affiliate Site</h2>
          <p>Generate topic clusters, briefs, and long-form drafts.</p>
        </div>
        <div className="card">
          <h2>Social Scheduler</h2>
          <p>Repurpose content across channels and assign publish times.</p>
        </div>
      </div>
      <a className="button" href="/projects" style={{ marginTop: 24 }}>Open dashboard</a>
    </main>
  );
}
