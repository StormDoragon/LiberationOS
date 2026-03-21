interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const { id } = await params;

  return (
    <main className="container">
      <h1>Project {id}</h1>
      <div className="card" style={{ marginTop: 24 }}>
        <h2>Workflow timeline</h2>
        <ul>
          <li>Goal interpreted</li>
          <li>Workflow planned</li>
          <li>Generation running</li>
          <li>Waiting for approval</li>
        </ul>
      </div>
    </main>
  );
}
