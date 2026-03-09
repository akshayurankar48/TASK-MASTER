import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { Task, Comment } from "@/lib/db/models";
import { requireProjectMember } from "@/lib/api-utils";
import { updateTaskSchema } from "@/lib/validations";
import { handleApiError, notFound } from "@/lib/errors";
import { broadcastToProject } from "@/lib/socket";

type Params = { params: Promise<{ id: string; taskId: string }> };

// Get task details
export async function GET(request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id, taskId } = await params;
    await requireProjectMember(request, id);

    const task = await Task.findOne({ _id: taskId, project: id })
      .populate("assignees", "name email avatar")
      .populate("createdBy", "name email avatar");

    if (!task) throw notFound("Task");

    return NextResponse.json({ success: true, data: task });
  } catch (error) {
    return handleApiError(error);
  }
}

// Update task
export async function PUT(request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id, taskId } = await params;
    await requireProjectMember(request, id);

    const body = await request.json();
    const data = updateTaskSchema.parse(body);

    const updateData: Record<string, unknown> = { ...data };
    if (data.dueDate) {
      updateData.dueDate = new Date(data.dueDate);
    } else if (data.dueDate === null) {
      updateData.$unset = { dueDate: 1 };
      delete updateData.dueDate;
    }

    const task = await Task.findOneAndUpdate(
      { _id: taskId, project: id },
      updateData,
      { new: true, runValidators: true }
    )
      .populate("assignees", "name email avatar")
      .populate("createdBy", "name email avatar");

    if (!task) throw notFound("Task");

    broadcastToProject(id, "task:updated", task);

    return NextResponse.json({ success: true, data: task });
  } catch (error) {
    return handleApiError(error);
  }
}

// Delete task
export async function DELETE(request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id, taskId } = await params;
    await requireProjectMember(request, id);

    const task = await Task.findOneAndDelete({ _id: taskId, project: id });
    if (!task) throw notFound("Task");

    // Delete all comments for this task
    await Comment.deleteMany({ task: taskId });

    broadcastToProject(id, "task:deleted", { taskId });

    return NextResponse.json({ success: true, data: { deleted: true } });
  } catch (error) {
    return handleApiError(error);
  }
}
