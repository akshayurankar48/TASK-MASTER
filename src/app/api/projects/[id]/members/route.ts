import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { Project, User } from "@/lib/db/models";
import { requireProjectOwner } from "@/lib/api-utils";
import { addMemberSchema } from "@/lib/validations";
import { handleApiError, notFound, conflict } from "@/lib/errors";

type Params = { params: Promise<{ id: string }> };

// Add member to project
export async function POST(request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    await requireProjectOwner(request, id);

    const body = await request.json();
    const { email } = addMemberSchema.parse(body);

    const userToAdd = await User.findOne({ email });
    if (!userToAdd) throw notFound("User with this email");

    const project = await Project.findById(id);
    if (!project) throw notFound("Project");

    const alreadyMember = project.members.some(
      (m: { toString(): string }) => m.toString() === userToAdd._id.toString()
    );
    if (alreadyMember) throw conflict("User is already a member");

    project.members.push(userToAdd._id);
    await project.save();

    const updated = await Project.findById(id)
      .populate("owner", "name email avatar")
      .populate("members", "name email avatar");

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}
