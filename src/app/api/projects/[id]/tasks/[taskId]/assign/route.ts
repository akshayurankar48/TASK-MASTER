import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { Task } from "@/lib/db/models";
import { requireProjectMember } from "@/lib/api-utils";
import { assignTaskSchema } from "@/lib/validations";
import { handleApiError, notFound } from "@/lib/errors";

type Params = { params: Promise<{ id: string; taskId: string }> };

// Assign users to task
export async function POST(request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id, taskId } = await params;
    await requireProjectMember(request, id);

    const body = await request.json();
    const { userIds } = assignTaskSchema.parse(body);

    const task = await Task.findOneAndUpdate(
      { _id: taskId, project: id },
      { $addToSet: { assignees: { $each: userIds } } },
      { new: true, runValidators: true }
    )
      .populate("assignees", "name email avatar")
      .populate("createdBy", "name email avatar");

    if (!task) throw notFound("Task");

    return NextResponse.json({ success: true, data: task });
  } catch (error) {
    return handleApiError(error);
  }
}

// Unassign users from task
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id, taskId } = await params;
    await requireProjectMember(request, id);

    const body = await request.json();
    const { userIds } = assignTaskSchema.parse(body);

    const task = await Task.findOneAndUpdate(
      { _id: taskId, project: id },
      { $pull: { assignees: { $in: userIds } } },
      { new: true, runValidators: true }
    )
      .populate("assignees", "name email avatar")
      .populate("createdBy", "name email avatar");

    if (!task) throw notFound("Task");

    return NextResponse.json({ success: true, data: task });
  } catch (error) {
    return handleApiError(error);
  }
}
