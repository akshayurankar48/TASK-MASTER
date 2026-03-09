import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { Comment, Task } from "@/lib/db/models";
import { requireAuth } from "@/lib/api-utils";
import { createCommentSchema, commentQuerySchema } from "@/lib/validations";
import { handleApiError, notFound, forbidden } from "@/lib/errors";
import { Project } from "@/lib/db/models";

type Params = { params: Promise<{ taskId: string }> };

// Add comment to task
export async function POST(request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const user = await requireAuth(request);
    const { taskId } = await params;

    // Verify task exists and user is a project member
    const task = await Task.findById(taskId);
    if (!task) throw notFound("Task");

    const project = await Project.findById(task.project);
    if (!project) throw notFound("Project");

    const isMember =
      project.owner.toString() === user.userId ||
      project.members.some((m: { toString(): string }) => m.toString() === user.userId);
    if (!isMember) throw forbidden("You are not a member of this project");

    const body = await request.json();
    const data = createCommentSchema.parse(body);

    const comment = await Comment.create({
      ...data,
      task: taskId,
      author: user.userId,
    });

    const populated = await Comment.findById(comment._id).populate(
      "author",
      "name email avatar"
    );

    return NextResponse.json(
      { success: true, data: populated },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

// List comments for a task (cursor paginated)
export async function GET(request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const user = await requireAuth(request);
    const { taskId } = await params;

    const task = await Task.findById(taskId);
    if (!task) throw notFound("Task");

    const project = await Project.findById(task.project);
    if (!project) throw notFound("Project");

    const isMember =
      project.owner.toString() === user.userId ||
      project.members.some((m: { toString(): string }) => m.toString() === user.userId);
    if (!isMember) throw forbidden("You are not a member of this project");

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const { cursor, limit } = commentQuerySchema.parse(searchParams);

    const filter: Record<string, unknown> = { task: taskId };
    if (cursor) {
      filter.createdAt = { $gt: new Date(cursor) };
    }

    const comments = await Comment.find(filter)
      .sort({ createdAt: 1 })
      .limit(limit + 1)
      .populate("author", "name email avatar");

    const hasMore = comments.length > limit;
    const data = hasMore ? comments.slice(0, limit) : comments;
    const nextCursor = hasMore
      ? data[data.length - 1].createdAt.toISOString()
      : null;

    return NextResponse.json({
      success: true,
      data,
      pagination: { nextCursor, hasMore },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
