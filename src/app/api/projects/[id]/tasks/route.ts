import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { Task } from "@/lib/db/models";
import { requireProjectMember, requireAuth } from "@/lib/api-utils";
import { createTaskSchema, taskQuerySchema } from "@/lib/validations";
import { handleApiError } from "@/lib/errors";
 

type Params = { params: Promise<{ id: string }> };

// Create task
export async function POST(request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    await requireProjectMember(request, id);
    const user = await requireAuth(request);

    const body = await request.json();
    const data = createTaskSchema.parse(body);

    const task = await Task.create({
      ...data,
      project: id,
      createdBy: user.userId,
      dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
    });

    const populated = await Task.findById(task._id)
      .populate("assignees", "name email avatar")
      .populate("createdBy", "name email avatar");

    return NextResponse.json(
      { success: true, data: populated },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

// List tasks with filtering and cursor pagination
export async function GET(request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    await requireProjectMember(request, id);

    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const { status, assignee, cursor, limit } =
      taskQuerySchema.parse(searchParams);

    const filter: Record<string, any> = { project: id };

    if (status) filter.status = status;
    if (assignee) filter.assignees = assignee;

    // Cursor-based pagination: fetch tasks older than the cursor
    if (cursor) {
      filter.createdAt = { $lt: new Date(cursor) };
    }

    const tasks = await Task.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .populate("assignees", "name email avatar")
      .populate("createdBy", "name email avatar");

    const hasMore = tasks.length > limit;
    const data = hasMore ? tasks.slice(0, limit) : tasks;
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
