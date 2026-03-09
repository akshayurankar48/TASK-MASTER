import { NextRequest } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { Project } from "@/lib/db/models";
import { getAuthUser } from "@/lib/auth";
import { unauthorized, forbidden, notFound } from "@/lib/errors";
import { JwtPayload } from "@/types";

export async function requireAuth(request: NextRequest): Promise<JwtPayload> {
  const user = getAuthUser(request);
  if (!user) throw unauthorized();
  return user;
}

export async function requireProjectMember(
  request: NextRequest,
  projectId: string
) {
  await connectDB();
  const user = await requireAuth(request);

  const project = await Project.findById(projectId);
  if (!project) throw notFound("Project");

  const isMember =
    project.owner.toString() === user.userId ||
    project.members.some((m: { toString(): string }) => m.toString() === user.userId);

  if (!isMember) throw forbidden("You are not a member of this project");

  return { user, project };
}

export async function requireProjectOwner(
  request: NextRequest,
  projectId: string
) {
  await connectDB();
  const user = await requireAuth(request);

  const project = await Project.findById(projectId);
  if (!project) throw notFound("Project");

  if (project.owner.toString() !== user.userId) {
    throw forbidden("Only the project owner can perform this action");
  }

  return { user, project };
}
