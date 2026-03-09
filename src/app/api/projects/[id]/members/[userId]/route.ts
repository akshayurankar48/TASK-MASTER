import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { Project } from "@/lib/db/models";
import { requireProjectOwner } from "@/lib/api-utils";
import { handleApiError, badRequest } from "@/lib/errors";

type Params = { params: Promise<{ id: string; userId: string }> };

// Remove member from project
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id, userId } = await params;
    const { project } = await requireProjectOwner(request, id);

    if (project.owner.toString() === userId) {
      throw badRequest("Cannot remove the project owner");
    }

    project.members = project.members.filter(
      (m: { toString(): string }) => m.toString() !== userId
    );
    await project.save();

    const updated = await Project.findById(id)
      .populate("owner", "name email avatar")
      .populate("members", "name email avatar");

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
