import { notFound } from "next/navigation";
import { getProjectSnapshot } from "@liberation-os/workflow-engine";
import { ProjectStatusPanel } from "../../../../components/project-status";

export const dynamic = "force-dynamic";

interface ProjectPageProps {
  params: Promise<{ id: string }>;
}

export default async function ProjectDetailPage({ params }: ProjectPageProps) {
  const { id } = await params;
  const project = await getProjectSnapshot(id);

  if (!project) {
    notFound();
  }

  return (
    <main className="container">
      <ProjectStatusPanel initialProject={project} />
    </main>
  );
}
