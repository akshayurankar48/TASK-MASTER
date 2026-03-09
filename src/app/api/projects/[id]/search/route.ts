import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { Task, Comment } from "@/lib/db/models";
import { requireProjectMember } from "@/lib/api-utils";
import { handleApiError, badRequest } from "@/lib/errors";

type Params = { params: Promise<{ id: string }> };

// Full-text search across tasks and comments in a project
export async function GET(request: NextRequest, { params }: Params) {
  try {
    await connectDB();
    const { id } = await params;
    await requireProjectMember(request, id);

    const q = request.nextUrl.searchParams.get("q");
    if (!q || q.length < 2) {
      throw badRequest("Search query must be at least 2 characters");
    }

    // Search tasks by text index
    const tasks = await Task.find({
      project: id,
      $text: { $search: q },
    })
      .select({ score: { $meta: "textScore" } })
      .sort({ score: { $meta: "textScore" } })
      .limit(20)
      .populate("assignees", "name email avatar")
      .populate("createdBy", "name email avatar");

    // Search comments in project tasks
    const projectTaskIds = await Task.find({ project: id }).select("_id");
    const taskIds = projectTaskIds.map((t) => t._id);

    const comments = await Comment.find({
      task: { $in: taskIds },
      $text: { $search: q },
    })
      .select({ score: { $meta: "textScore" } })
      .sort({ score: { $meta: "textScore" } })
      .limit(20)
      .populate("author", "name email avatar")
      .populate("task", "title");

    return NextResponse.json({
      success: true,
      data: {
        tasks,
        comments,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
