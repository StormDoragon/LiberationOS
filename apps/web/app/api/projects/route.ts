import { NextRequest, NextResponse } from "next/server";
import { createProject, getProjects } from "@liberation-os/workflow-engine";

export async function GET() {
  const projects = await getProjects();
  return NextResponse.json({ projects });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const project = await createProject(body);
  return NextResponse.json({ project }, { status: 201 });
}
