import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { Project, Task, Comment } from "@/lib/db/models";
import { requireProjectMember, requireProjectOwner } from "@/lib/api-utils";
import { updateProjectSchema } from "@/lib/validations";
import { handleApiError } from "@/lib/errors";

type Params = { params: Promise<{ id: string }> };

// Get project details
export async function GET(request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    await requireProjectMember(request, id);

    const project = await Project.findById(id)
      .populate("owner", "name email avatar")
      .populate("members", "name email avatar");

    return NextResponse.json({ success: true, data: project });
  } catch (error) {
    return handleApiError(error);
  }
}

// Update project
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    await requireProjectOwner(request, id);

    const body = await request.json();
    const data = updateProjectSchema.parse(body);

    const project = await Project.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    })
      .populate("owner", "name email avatar")
      .populate("members", "name email avatar");

    return NextResponse.json({ success: true, data: project });
  } catch (error) {
    return handleApiError(error);
  }
}

// Delete project (owner only)
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    await requireProjectOwner(request, id);

    // Delete all tasks and comments in the project
    const tasks = await Task.find({ project: id }).select("_id");
    const taskIds = tasks.map((t) => t._id);

    await Comment.deleteMany({ task: { $in: taskIds } });
    await Task.deleteMany({ project: id });
    await Project.findByIdAndDelete(id);

    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error) {
    return handleApiError(error);
  }
}
