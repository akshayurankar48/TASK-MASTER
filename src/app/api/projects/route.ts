import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connect";
import { Project } from "@/lib/db/models";
import { requireAuth } from "@/lib/api-utils";
import { createProjectSchema } from "@/lib/validations";
import { handleApiError } from "@/lib/errors";

// Create project
export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const user = await requireAuth(request);

    const body = await request.json();
    const data = createProjectSchema.parse(body);

    const project = await Project.create({
      ...data,
      owner: user.userId,
      members: [user.userId],
    });

    return NextResponse.json(
      { success: true, data: project },
      { status: 201 }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

// List user's projects
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const user = await requireAuth(request);

    const projects = await Project.find({
      $or: [{ owner: user.userId }, { members: user.userId }],
    })
      .populate("owner", "name email avatar")
      .populate("members", "name email avatar")
      .sort({ updatedAt: -1 });

    return NextResponse.json({ success: true, data: projects });
  } catch (error) {
    return handleApiError(error);
  }
}
